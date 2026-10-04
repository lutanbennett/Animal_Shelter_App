#!/usr/bin/env node
/**
 * Checks the machine-translation cron (worker/translations.mjs and
 * worker/translate-engines.mjs) against an in-memory stand-in for Supabase
 * REST and a stub AI binding. Nothing leaves the machine, and it says nothing
 * about whether the Thai READS well — that needs a Thai speaker.
 *
 *   node scripts/check-translate-worker.mjs
 *
 * What it pins down, because each is the kind of bug that matters:
 *   - a drafted row is `draft`, never `approved`, and carries the engine label;
 *   - a row a person wrote or the source changed under the worker is untouched;
 *   - a row the model keeps failing on stops being retried after three goes,
 *     backs off between them, and gets a fresh three if its source is edited;
 *   - an engine that throws stops the run after one row, not the whole batch;
 *   - the batch size and the reviewed-tier daily cap are respected;
 *   - the tier picks the prompt, clinical notes keep their numbers, and output
 *     in the wrong language or unchanged is refused;
 *   - an environment with no AI binding / key does nothing and does not throw;
 *   - swapping the engine to Ollama changes nothing else.
 */
import { runTranslations, fingerprint, MAX_ATTEMPTS } from "../worker/translations.mjs";
import { cleanOutput, checkOutput, pickEngine, systemPrompt, OutputRejected } from "../worker/translate-engines.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};

const T0 = Date.parse("2026-10-04T10:00:00Z");
const MIN = 60_000;

/** The slice of PostgREST the worker uses, over an array of rows. */
function fakeSupabase({ fields, rows }) {
  const calls = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(input);
    const table = url.pathname.split("/").pop();
    const q = url.searchParams;
    const method = init.method ?? "GET";
    calls.push({ method, table, body: init.body ? JSON.parse(init.body) : null });
    const eq = (col, want) => (r) => String(r[col]) === want.replace(/^eq\./, "");
    const matches = (r) => {
      for (const [k, v] of q) {
        if (v.startsWith("eq.") && !eq(k, v)(r)) return false;
        if (v.startsWith("neq.") && String(r[k]) === v.slice(4)) return false;
        if (v.startsWith("gte.") && !(r[k] >= v.slice(4))) return false;
      }
      return true;
    };
    const json = (body) => new Response(JSON.stringify(body), { status: 200 });
    if (table === "translatable_fields") return json(fields);
    if (method === "GET") {
      let out = rows.filter(matches);
      if (q.get("order") === "updated_at.asc") out = [...out].sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      return json(out.slice(0, Number(q.get("limit") ?? 1000)));
    }
    const hit = rows.filter(matches);
    for (const r of hit) Object.assign(r, JSON.parse(init.body));
    return json(hit);
  };
  return { fetchImpl, calls };
}

const FIELDS = [
  { table_name: "residents", column_name: "bio", tier: "reviewed" },
  { table_name: "vet_visits", column_name: "notes", tier: "machine" },
];
let seq = 0;
const row = (over = {}) => ({
  id: `row-${++seq}`,
  table_name: "residents",
  column_name: "bio",
  source_lang: "en",
  target_lang: "th",
  source_text: `Mali loves long walks and sleeping in the sun ${seq}.`,
  text: null,
  status: "pending",
  engine: null,
  updated_at: new Date(T0 - 60 * MIN).toISOString(),
  ...over,
});
const THAI_REPLY = "มะลิชอบเดินเล่นนานๆ และนอนอาบแดด";
const baseEnv = (ai, extra = {}) => ({
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  AI: { run: ai },
  ...extra,
});
const quiet = { log: () => {} };
const run = (env, db, now = T0) => runTranslations(env, { fetchImpl: db.fetchImpl, now, ...quiet });
const thaiAi = () => async () => ({ response: THAI_REPLY });

// ── drafting ────────────────────────────────────────────────────────────────
{
  const rows = [row()];
  const db = fakeSupabase({ fields: FIELDS, rows });
  const seen = [];
  const s = await run(baseEnv(async (model, input) => (seen.push({ model, input }), { response: THAI_REPLY })), db);
  check("a pending row becomes a draft with the Thai text", rows[0].status === "draft" && rows[0].text === THAI_REPLY && s.drafted === 1);
  check("the engine label names the engine and model", rows[0].engine === "workers-ai:@cf/meta/llama-3.3-70b-instruct-fp8-fast", rows[0].engine);
  check("nothing it wrote is approved", db.calls.every((c) => c.body?.status === undefined || c.body.status === "draft"));
  check("the reviewed-tier prompt asks for natural Thai", /naturally/.test(seen[0].input.messages[0].content) && /Thai/.test(seen[0].input.messages[0].content));
}

// ── tier changes the prompt, and clinical numbers must survive ──────────────
{
  check("machine tier prompt is literal and keeps doses", /literally/.test(systemPrompt("machine", "th")) && /doses/.test(systemPrompt("machine", "th")));
  const src = "Amoxicillin 2 ml every 12 h for 7 days";
  let rejected = null;
  try {
    checkOutput(src, "อะม็อกซีซิลลิน สองมิลลิลิตร ทุก 12 ชั่วโมง เป็นเวลา 7 วัน", { to: "th", tier: "machine" });
  } catch (e) {
    rejected = e;
  }
  check("a clinical note that lost its dose is refused", rejected instanceof OutputRejected && /number 2/.test(rejected.message), String(rejected));
  check(
    "a clinical note that kept every number passes",
    checkOutput(src, "Amoxicillin 2 ml ทุก 12 ชั่วโมง เป็นเวลา 7 วัน", { to: "th", tier: "machine" }).includes("2 ml"),
  );
}

// ── output checks ───────────────────────────────────────────────────────────
{
  const refuses = (src, out, to) => {
    try {
      checkOutput(src, out, { to, tier: "reviewed" });
      return false;
    } catch (e) {
      return e instanceof OutputRejected;
    }
  };
  check("English handed back for Thai is refused", refuses("Mali is shy.", "Mali is very shy indeed.", "th"));
  check("the source handed back is refused", refuses("Mali is shy.", "Mali is shy.", "th"));
  check("Thai handed back for English is refused", refuses("มะลิขี้อาย", "มะลิขี้อายมากๆ", "en"));
  check("empty is refused", refuses("Mali is shy.", "", "th"));
  check(
    "wrappers are stripped",
    cleanOutput('Here is the translation:\n"มะลิขี้อาย"') === "มะลิขี้อาย" && cleanOutput("```\nabc\n```") === "abc",
  );
}

// ── a person got there first ────────────────────────────────────────────────
{
  const rows = [row()];
  const db = fakeSupabase({ fields: FIELDS, rows });
  // The manager approves while the model is still thinking.
  const ai = async () => {
    Object.assign(rows[0], { status: "approved", text: "human text", engine: "human", updated_at: new Date(T0).toISOString() });
    return { response: THAI_REPLY };
  };
  const s = await run(baseEnv(ai), db);
  check("a row approved mid-run is not overwritten", rows[0].text === "human text" && rows[0].engine === "human" && s.drafted === 0 && s.skipped === 1);

  const rows2 = [row()];
  const db2 = fakeSupabase({ fields: FIELDS, rows: rows2 });
  const ai2 = async () => {
    rows2[0].updated_at = new Date(T0 + 1).toISOString(); // the source was edited: the 0056 trigger bumps updated_at
    return { response: THAI_REPLY };
  };
  await run(baseEnv(ai2), db2);
  check("a row whose source changed mid-run stays pending", rows2[0].status === "pending" && rows2[0].text === null);
}

// ── failures do not spin ────────────────────────────────────────────────────
{
  const rows = [row()];
  const db = fakeSupabase({ fields: FIELDS, rows });
  let calls = 0;
  const english = async () => (calls++, { response: "Mali is still shy." });
  let now = T0;
  await run(baseEnv(english), db, now);
  check("a bad answer is counted against the row", rows[0].engine.startsWith("mt-retry:1:") && rows[0].status === "pending");
  await run(baseEnv(english), db, now + 10 * MIN);
  check("the next run backs off (30 min) and does not retry", calls === 1);
  now = T0 + 31 * MIN;
  await run(baseEnv(english), db, now);
  check("after the back-off it retries once", calls === 2 && rows[0].engine.startsWith("mt-retry:2:"));
  await run(baseEnv(english), db, now + 60 * MIN);
  check("and waits longer (3 h) the second time", calls === 2);
  now += 181 * MIN;
  await run(baseEnv(english), db, now);
  check(`it gives up after ${MAX_ATTEMPTS} attempts`, calls === 3 && rows[0].engine.startsWith("mt-retry:3:"));
  await run(baseEnv(english), db, now + 24 * 60 * MIN);
  check("a day later it is still left alone", calls === 3 && rows[0].status === "pending");

  // Staff edit the source: the fingerprint changes and it gets a fresh go.
  rows[0].source_text = "Mali is not shy any more.";
  rows[0].updated_at = new Date(now + 25 * 60 * MIN).toISOString();
  const good = async () => (calls++, { response: THAI_REPLY });
  await run(baseEnv(good), db, now + 26 * 60 * MIN);
  check("editing the source resets the count and drafts it", rows[0].status === "draft" && calls === 4);
  check("fingerprint differs by text", (await fingerprint("a")) !== (await fingerprint("b")));
}

// ── an engine that throws stops the run ─────────────────────────────────────
{
  const rows = [row(), row(), row()];
  const db = fakeSupabase({ fields: FIELDS, rows });
  let calls = 0;
  const s = await run(baseEnv(async () => (calls++, Promise.reject(new Error("quota exhausted"))), { TRANSLATE_BATCH: "3" }), db);
  check("an engine error stops the run after one row", calls === 1 && s.failed === 1 && /engine error/.test(s.note));
  check("only that row was charged an attempt", rows.filter((r) => r.engine).length === 1);
}

// ── limits ──────────────────────────────────────────────────────────────────
{
  const rows = [row(), row(), row(), row()];
  const db = fakeSupabase({ fields: FIELDS, rows });
  await run(baseEnv(thaiAi()), db);
  check("the default batch is 2 rows a run", rows.filter((r) => r.status === "draft").length === 2);

  const rows2 = [row(), row(), row(), row()];
  const db2 = fakeSupabase({ fields: FIELDS, rows: rows2 });
  await run(baseEnv(thaiAi(), { TRANSLATE_BATCH: "10" }), db2);
  check("TRANSLATE_BATCH is honoured", rows2.filter((r) => r.status === "draft").length === 4);

  // Two reviewed drafts already handed over today; cap of 3 leaves room for one.
  const recent = (min) => row({ status: "draft", text: "x", engine: "workers-ai:m", updated_at: new Date(T0 - min * MIN).toISOString() });
  const rows3 = [recent(30), recent(90), row(), row(), row({ table_name: "vet_visits", column_name: "notes", source_text: "Weight 4.2 kg" })];
  const db3 = fakeSupabase({ fields: FIELDS, rows: rows3 });
  await run(baseEnv(async () => ({ response: "น้ำหนัก 4.2 กก." }), { TRANSLATE_BATCH: "10", TRANSLATE_REVIEWED_DAILY: "3" }), db3);
  const drafted = rows3.slice(2).filter((r) => r.status === "draft");
  check(
    "the reviewed tier stops at its daily cap but the machine tier does not",
    drafted.length === 2 && rows3[4].status === "draft" && rows3.slice(2, 4).filter((r) => r.status === "draft").length === 1,
    JSON.stringify(rows3.map((r) => r.status)),
  );

  const rows4 = [row()];
  const db4 = fakeSupabase({ fields: FIELDS, rows: rows4 });
  const old = row({ status: "draft", text: "x", engine: "workers-ai:m", updated_at: new Date(T0 - 25 * 60 * MIN).toISOString() });
  rows4.push(old);
  await run(baseEnv(thaiAi(), { TRANSLATE_REVIEWED_DAILY: "1" }), db4);
  check("drafts older than 24 hours no longer count against the cap", rows4[0].status === "draft");
}

// ── unconfigured: does nothing, does not throw ──────────────────────────────
{
  const rows = [row()];
  const db = fakeSupabase({ fields: FIELDS, rows });
  const noAi = await run({ SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k" }, db);
  check("no AI binding: nothing happens", rows[0].status === "pending" && /no AI binding/.test(noAi.note) && db.calls.length === 0);
  const noKey = await run({ AI: { run: thaiAi() }, SUPABASE_URL: "https://x" }, db);
  check("no service key: nothing happens", /not set/.test(noKey.note) && db.calls.length === 0);
  const down = await runTranslations(baseEnv(thaiAi()), { fetchImpl: async () => new Response("no", { status: 500 }), now: T0, log: () => {} });
  check("an unreachable database is reported, not thrown", /error:/.test(down.note));
}

// ── the engine seam ─────────────────────────────────────────────────────────
{
  check("the default engine is Workers AI", pickEngine(baseEnv(thaiAi())).engine.id === "workers-ai");
  check("an unknown engine name is refused with the list", /not one of/.test(pickEngine({ TRANSLATE_ENGINE: "gpt" }).reason));
  check("ollama needs OLLAMA_URL", /OLLAMA_URL/.test(pickEngine({ TRANSLATE_ENGINE: "ollama" }).reason));

  const rows = [row()];
  const db = fakeSupabase({ fields: FIELDS, rows });
  const sent = [];
  const fetchImpl = async (url, init) => {
    if (String(url).startsWith("http://ollama.test")) {
      sent.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ message: { content: THAI_REPLY } }), { status: 200 });
    }
    return db.fetchImpl(url, init);
  };
  const env = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", TRANSLATE_ENGINE: "ollama", OLLAMA_URL: "http://ollama.test" };
  await runTranslations(env, { fetchImpl, now: T0, log: () => {} });
  check("the same cron drafts through Ollama with no AI binding", rows[0].status === "draft" && rows[0].engine === "ollama:qwen2.5:14b" && sent.length === 1, rows[0].engine);

  const m = pickEngine(baseEnv(async (model, input) => ({ translated_text: `[${input.source_lang}>${input.target_lang}] ${input.text}` }), { TRANSLATE_ENGINE: "workers-ai-m2m100" }));
  const out = await m.engine.translate(baseEnv(async (model, input) => ({ translated_text: `${input.target_lang}:${input.text}` })), { text: "a\n\nb", from: "en", to: "th" });
  check("M2M100 translates line by line and keeps the blank line", out === "th:a\n\nth:b", JSON.stringify(out));
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
