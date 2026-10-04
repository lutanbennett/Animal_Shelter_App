// translate(): the one seam between "a pending row needs text" and "something
// that can write it". Everything else in the translation worker — polling,
// write-back, failure handling, the cron — is in worker/translations.mjs and
// knows nothing about which engine ran. To swap Workers AI for a local Ollama
// box, set TRANSLATE_ENGINE=ollama (and OLLAMA_URL); no other code changes
// (docs/decisions/2026-10-04-translations-worker.md).
//
// An engine is `{ id, model(env), available(env), translate(env, request) }`:
//
//   request  = { text, from: "en"|"th", to: "en"|"th", tier: "reviewed"|"machine" }
//   returns  = the translated string (cleaned, but not yet checked — see
//              checkOutput, which the caller always applies).
//
// `tier` is the review path from translatable_fields (migration 0057):
//   reviewed — a manager checks it, and it is read by the public: translate it
//              naturally, keep names (breed names, people, places) as written.
//   machine  — shown to staff labelled, never reviewed: translate literally,
//              and keep drug names, doses, units and dates exactly as written.

const LANG_NAME = { en: "English", th: "Thai" };

export const PROMPTS = {
  reviewed:
    "You translate text written by an animal shelter into {to}. The text is read by the public, so translate it naturally and warmly, " +
    "the way a fluent {to} speaker would write it, not word for word. Keep names of animals, people, places and breeds as written " +
    "(breed names stay in their usual form). Do not add, remove or soften facts. Reply with the translation only: " +
    "no preface, no notes, no quotation marks around it.",
  machine:
    "You translate internal veterinary and shelter staff notes into {to}. Translate literally and plainly. " +
    "Keep drug names, doses, units, numbers and dates exactly as written (use the digits 0-9, never spelled-out or Thai numerals). " +
    "Do not interpret, summarise or add anything. Reply with the translation only: no preface, no notes, no quotation marks around it.",
};

export function systemPrompt(tier, to) {
  return (PROMPTS[tier] ?? PROMPTS.machine).replaceAll("{to}", LANG_NAME[to]);
}

// ---------------------------------------------------------------------------
// Engines
// ---------------------------------------------------------------------------

const DEFAULT_WORKERS_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const M2M100_MODEL = "@cf/meta/m2m100-1.2b";

/** Chat models answer as `{ response }` or, on newer ones, OpenAI-shaped `choices`. */
function chatText(result) {
  if (typeof result === "string") return result;
  if (typeof result?.response === "string") return result.response;
  const content = result?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

/** A prompted open-weight chat model on Workers AI. The model is a var, so the bake-off is a config change. */
const workersAi = {
  id: "workers-ai",
  model: (env) => env.TRANSLATE_MODEL || DEFAULT_WORKERS_AI_MODEL,
  available: (env) => typeof env.AI?.run === "function",
  async translate(env, { text, to, tier }) {
    const result = await env.AI.run(this.model(env), {
      messages: [
        { role: "system", content: systemPrompt(tier, to) },
        { role: "user", content: text },
      ],
      max_tokens: 1500,
      temperature: 0,
    });
    return chatText(result);
  },
};

/**
 * M2M100, Meta's dedicated translation model on Workers AI. It takes no
 * prompt, so the tier makes no difference to it; it is here so the two
 * candidate approaches can be put in front of the managers side by side.
 * Translated a line at a time: it has a short input window and bios have
 * paragraphs.
 */
const m2m100 = {
  id: "workers-ai-m2m100",
  model: () => M2M100_MODEL,
  available: (env) => typeof env.AI?.run === "function",
  async translate(env, { text, from, to }) {
    const lines = text.split("\n");
    const out = [];
    for (const line of lines) {
      if (!line.trim()) {
        out.push("");
        continue;
      }
      const result = await env.AI.run(M2M100_MODEL, { text: line, source_lang: from, target_lang: to });
      out.push(typeof result?.translated_text === "string" ? result.translated_text : "");
    }
    return out.join("\n");
  },
};

/** A local Ollama box (OLLAMA_URL, e.g. over a tunnel), same prompts as Workers AI. */
const ollama = {
  id: "ollama",
  model: (env) => env.TRANSLATE_MODEL || "qwen2.5:14b",
  available: (env) => Boolean(env.OLLAMA_URL),
  async translate(env, { text, to, tier }, fetchImpl = fetch) {
    const response = await fetchImpl(`${env.OLLAMA_URL.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model(env),
        stream: false,
        options: { temperature: 0 },
        messages: [
          { role: "system", content: systemPrompt(tier, to) },
          { role: "user", content: text },
        ],
      }),
    });
    if (!response.ok) throw new Error(`ollama answered ${response.status}`);
    return (await response.json())?.message?.content ?? "";
  },
};

export const ENGINES = { [workersAi.id]: workersAi, [m2m100.id]: m2m100, [ollama.id]: ollama };

/**
 * The engine this environment is set to use, or `{ reason }` when there is
 * none to use — an environment without the AI binding must do nothing, not
 * crash its cron.
 */
export function pickEngine(env) {
  const id = env.TRANSLATE_ENGINE || workersAi.id;
  const engine = ENGINES[id];
  if (!engine) return { reason: `TRANSLATE_ENGINE "${id}" is not one of ${Object.keys(ENGINES).join(", ")}` };
  if (!engine.available(env)) {
    return { reason: id === "ollama" ? "OLLAMA_URL is not set" : "no AI binding in this environment" };
  }
  return {
    engine,
    // What lands in translations.engine: the engine and the model, so a draft
    // says which candidate wrote it and a bake-off can be read back from the table.
    label: `${engine.id}:${engine.model(env)}`,
  };
}

// ---------------------------------------------------------------------------
// Checking what came back
// ---------------------------------------------------------------------------

const THAI = /[฀-๿]/g;
const LATIN = /[A-Za-z]/g;
const count = (s, re) => (s.match(re) ?? []).length;

/** The model answered, but not with a usable translation: that row's problem, not the engine's. */
export class OutputRejected extends Error {}

/** Models wrap answers: a code fence, "Translation:", quotes. None of it is the translation. */
export function cleanOutput(raw) {
  let out = String(raw ?? "").trim();
  out = out.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
  out = out.replace(/^(here(?:'s| is) the (?:\w+ )?translation[^:\n]*|translation|แปล)\s*:\s*/i, "").trim();
  const quoted = /^(["“”«])([\s\S]*)(["“”»])$/.exec(out);
  // Only unwrap quotes the source did not have to begin with.
  if (quoted && !/["“”«»]/.test(quoted[2])) out = quoted[2].trim();
  return out;
}

/**
 * Throws, with a reason fit for a log line, when `out` is not a usable
 * translation of `source`. This is the whole of what code can judge: that
 * there is text, that it is in the target script, that it is not the source
 * handed back, and — for notes read as clinical — that every number
 * survived. Whether it READS well is for a Thai speaker.
 */
export function checkOutput(source, out, { to, tier }) {
  if (!out) throw new OutputRejected("the model returned nothing");
  if (out.trim() === source.trim()) throw new OutputRejected("the model returned the source unchanged");
  if (out.length > source.length * 6 + 200) throw new OutputRejected("the output is far longer than the source");
  if (out.length * 8 < source.length) throw new OutputRejected("the output is far shorter than the source");

  const thai = count(out, THAI);
  const latin = count(out, LATIN);
  if (to === "th" && count(source, LATIN) + count(source, THAI) >= 3) {
    // A Thai sentence carrying an English drug name still has plenty of Thai.
    if (thai === 0 || thai / (thai + latin) < 0.3) throw new OutputRejected("the output is not in Thai");
  }
  if (to === "en" && thai / Math.max(1, thai + latin) > 0.1) throw new OutputRejected("the output is not in English");

  if (tier === "machine") {
    // Whole numbers, not substrings: "2" must not be satisfied by the "2" in "12".
    const numbers = (s) => s.match(/\d+(?:[.,]\d+)?/g) ?? [];
    const present = new Set(numbers(out));
    for (const n of numbers(source)) {
      if (!present.has(n)) throw new OutputRejected(`the number ${n} is missing from the output`);
    }
  }
  return out;
}

/** The one entry point the worker calls: translate, clean, check. */
export async function translate(env, picked, request, fetchImpl = fetch) {
  const raw = await picked.engine.translate(env, request, fetchImpl);
  return checkOutput(request.text, cleanOutput(raw), request);
}
