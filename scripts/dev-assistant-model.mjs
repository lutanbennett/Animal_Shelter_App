// A stand-in language model for a DEV session, so the assistant can be run end to end with no Ollama.
//
//   node scripts/dev-assistant-model.mjs                 serve the stand-in on http://localhost:11500/v1
//   node scripts/dev-assistant-model.mjs --dev           the same, AND start `next dev` on this worktree's port
//                                                        (.port) already pointed at it
//   node scripts/dev-assistant-model.mjs --dev --force-tag-failure denied|failed
//                                                        also set ASSISTANT_FORCE_TAG_FAILURE for that dev server
//   node scripts/dev-assistant-model.mjs --port 11501    a different stand-in port (two streams at once)
//
// Written down in docs/dev-assistant-model.md. READ THAT FIRST for what this is and is not good for.
//
// WHAT IT IS: a few lines of rules that speak the OpenAI chat-completions shape the app already speaks
// (src/lib/assistant/llm-openai.ts). It is NOT a model. It reads the sentence with a capital-letter rule, asks the
// app's own `lookup` tool for each name, then calls `weight` (the sentence has a "kg") with the first name as the
// resident and every other name as `mentions`. Anything else it answers in words with no tool call.
//
// So it exercises a SAVE PATH and a FAILURE NOTICE, with real lookups, real validation and a real card. It cannot
// tell you whether the assistant UNDERSTANDS a sentence: use a real model (Ollama, docs/self-hosted-model-runbook.md).
//
// No secret: the stand-in takes no key and listens on localhost only.
import http from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MODEL_NAME = "scripted-dev";
export const DEFAULT_PORT = 11500;

// Capitalised words that are not names.
const NOT_NAMES = new Set([
  "I", "A", "The", "Today", "Yesterday", "Tomorrow", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
  "Saturday", "Sunday", "Dr", "Kg", "Weighed", "Weighs", "Weight", "Was", "Is", "Bitten", "Moved", "And",
]);

export function namesIn(sentence) {
  const out = [];
  for (const m of sentence.matchAll(/\b[A-Z][a-z]+(?: \d+)?\b/g)) {
    if (!NOT_NAMES.has(m[0]) && !out.includes(m[0])) out.push(m[0]);
  }
  return out;
}

const textOf = (m) => (typeof m.content === "string" ? m.content : "");

/** The reply for one request. Pure, so a test can drive it without a socket. */
export function reply(body) {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const first = messages.find((m) => m.role === "user");
  const sentence = first ? textOf(first) : "";
  const asked = new Set();
  const found = new Map(); // name -> first matching id
  const pending = new Map(); // tool_call id -> name
  for (const m of messages) {
    if (m.role === "assistant") {
      for (const c of m.tool_calls ?? []) {
        let args = {};
        try { args = JSON.parse(c.function?.arguments ?? "{}"); } catch { /* ignore */ }
        if (c.function?.name === "lookup" && args.kind === "resident") {
          asked.add(args.query);
          pending.set(c.id, args.query);
        }
      }
    } else if (m.role === "tool" && pending.has(m.tool_call_id)) {
      try {
        const rows = JSON.parse(textOf(m));
        const want = String(pending.get(m.tool_call_id)).toLowerCase();
        // One row, or else the one row whose name is exactly the query ("Test 1" also matches "Test 10" on a fuller dev).
        const exact = Array.isArray(rows) ? rows.filter((r) => String(r.name ?? "").toLowerCase() === want) : [];
        const row = Array.isArray(rows) && rows.length === 1 ? rows[0] : exact.length === 1 ? exact[0] : null;
        if (row?.id) found.set(pending.get(m.tool_call_id), row.id);
      } catch { /* an error result: leave the name unfound, so the field goes null */ }
    }
  }

  const kg = sentence.match(/(\d+(?:\.\d+)?)\s*kg/i);
  const names = namesIn(sentence);
  if (!kg || names.length === 0) return say("The stand-in model only knows weights: name a resident and a weight in kg.");

  const next = names.find((n) => !asked.has(n));
  if (next) return call("lookup", { kind: "resident", query: next });

  const ids = names.map((n) => found.get(n) ?? null);
  const subject = ids[0];
  const others = ids.slice(1).filter(Boolean);
  const today = (sentence.match(/\d{4}-\d{2}-\d{2}/) ?? [null])[0];
  return call("weight", { residentId: subject, weightKg: Number(kg[1]), date: today, mentions: others });
}

function say(text) {
  return { choices: [{ message: { role: "assistant", content: text }, finish_reason: "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0 } };
}
let n = 0;
function call(name, args) {
  return {
    model: MODEL_NAME,
    choices: [{
      message: { role: "assistant", content: null, tool_calls: [{ id: `scripted_${++n}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] },
      finish_reason: "tool_calls",
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0 },
  };
}

export function serve(port) {
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || !req.url?.endsWith("/chat/completions")) {
      res.writeHead(404).end("scripted-dev model: POST /v1/chat/completions only");
      return;
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      let out;
      try { out = reply(JSON.parse(raw)); } catch { res.writeHead(400).end("bad json"); return; }
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(out));
    });
  });
  return new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(port, "127.0.0.1", () => ok(server));
  });
}

const isMain = !!process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const port = Number(opt("--port") ?? DEFAULT_PORT);
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    await serve(port);
  } catch (e) {
    console.error(`Could not listen on ${port}: ${e.code ?? e.message}. Another stand-in may be running; use --port.`);
    process.exit(1);
  }
  console.log(`scripted-dev model on http://localhost:${port}/v1  (model name: ${MODEL_NAME})`);
  if (argv.includes("--dev")) {
    const portFile = join(root, ".port");
    const devPort = existsSync(portFile) ? readFileSync(portFile, "utf8").trim() : "3000";
    const env = {
      ...process.env,
      ASSISTANT_LLM_MODEL: MODEL_NAME,
      ASSISTANT_LLM_BASE_URL: `http://localhost:${port}/v1`,
    };
    const force = opt("--force-tag-failure");
    if (force) env.ASSISTANT_FORCE_TAG_FAILURE = force;
    console.log(`next dev on :${devPort} with the stand-in${force ? ` and ASSISTANT_FORCE_TAG_FAILURE=${force}` : ""}`);
    const child = spawn(process.execPath, [join(root, "node_modules", "next", "dist", "bin", "next"), "dev", "--port", devPort], { cwd: root, env, stdio: "inherit" });
    child.on("exit", (c) => process.exit(c ?? 0));
  } else {
    console.log("Point a dev server at it: ASSISTANT_LLM_MODEL=scripted-dev ASSISTANT_LLM_BASE_URL=http://localhost:" + port + "/v1");
  }
}
