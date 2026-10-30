// The pure part of the assistant eval replay: read the could-not-help CSV, replay each labelled
// sentence through an LlmAdapter, and score it. No network, no src/ imports, so a test can drive it
// with a scripted adapter. The runnable script is scripts/assistant-eval-replay.mjs.

/** Read CSV text (RFC 4180 quoting, optional BOM) into an array of {heading: value} objects. */
export function parseCsv(text) {
  const src = text.replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const endRow = () => {
    row.push(field);
    field = "";
    if (row.some((v) => v !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field !== "" || row.length) endRow();
  if (rows.length === 0) throw new Error("the file has no rows");
  const [heading, ...body] = rows;
  for (const need of ["id", "typed", "correct_intent", "correct_answer"]) {
    if (!heading.includes(need)) throw new Error(`the file has no "${need}" column; is this the could-not-help export?`);
  }
  return body.map((r) => Object.fromEntries(heading.map((h, i) => [h, r[i] ?? ""])));
}

/** An export cell that csvField guarded against spreadsheet formulas starts with a single quote. */
const clean = (v) => String(v ?? "").trim().replace(/^'(?=[=+\-@])/, "");

/**
 * What a row should score as. correct_intent is a draft kind ("weight", "move", ...) or "none" when
 * the sentence should get no draft. correct_answer is the resident id the draft should carry; blank
 * means resident agreement is not scored for that row. Null = unlabelled, skipped.
 */
export function labelOf(row) {
  const intent = clean(row.correct_intent).toLowerCase();
  if (!intent) return null;
  const resident = clean(row.correct_answer);
  return { intent, resident: resident || null };
}

/** Ask the model once and reduce the answer to {intent, resident}. A model error is its own outcome. */
export async function ask(llm, { system, tools }, typed) {
  let res;
  try {
    res = await llm.complete({ system, tools, maxTokens: 512, messages: [{ role: "user", content: [{ type: "text", text: typed }] }] });
  } catch (e) {
    return { intent: "error", resident: null, error: e instanceof Error ? e.message : String(e) };
  }
  const call = res.toolCalls[0];
  if (!call) return { intent: "none", resident: null };
  const id = call.input?.residentId;
  return { intent: call.name, resident: typeof id === "string" && id ? id : null };
}

export async function replay(rows, llm, setup) {
  const results = [];
  let unlabelled = 0;
  for (const row of rows) {
    const want = labelOf(row);
    if (!want) {
      unlabelled++;
      continue;
    }
    const got = await ask(llm, setup, row.typed);
    results.push({
      id: row.id,
      typed: row.typed,
      want,
      got,
      intentOk: got.intent === want.intent,
      residentOk: want.resident ? got.resident === want.resident : null,
    });
  }
  return { results, unlabelled, total: rows.length };
}

const pct = (n, d) => (d === 0 ? "n/a (nothing to score)" : `${((100 * n) / d).toFixed(1)}%  (${n} of ${d})`);

export function summarise({ results, unlabelled, total }) {
  const scoredRes = results.filter((r) => r.residentOk !== null);
  return {
    total,
    unlabelled,
    labelled: results.length,
    intent: { right: results.filter((r) => r.intentOk).length, of: results.length },
    resident: { right: scoredRes.filter((r) => r.residentOk).length, of: scoredRes.length },
    errors: results.filter((r) => r.got.intent === "error").length,
  };
}

export function report(outcome, { provider, model }) {
  const s = summarise(outcome);
  const lines = [
    `Assistant eval replay   model: ${provider} / ${model}`,
    `Rows in file: ${s.total}   labelled: ${s.labelled}   skipped (correct_intent blank): ${s.unlabelled}`,
    "",
    `INTENT agreement    ${pct(s.intent.right, s.intent.of)}`,
    `RESIDENT agreement  ${pct(s.resident.right, s.resident.of)}   (only rows whose correct_answer holds a resident id)`,
  ];
  if (s.errors) lines.push("", `${s.errors} row(s) got a model error and count as wrong intent.`);
  const misses = outcome.results.filter((r) => !r.intentOk || r.residentOk === false);
  if (misses.length) {
    lines.push("", "Disagreements:");
    for (const r of misses) {
      const w = `${r.want.intent}${r.want.resident ? ` / ${r.want.resident}` : ""}`;
      const g = `${r.got.intent}${r.got.resident ? ` / ${r.got.resident}` : ""}${r.got.error ? `  [${r.got.error}]` : ""}`;
      lines.push(`  ${r.id}  "${r.typed}"  wanted ${w}  got ${g}`);
    }
  }
  lines.push("", "No threshold is applied. The number is the output; whether it is good enough is a judgement.");
  return lines.join("\n");
}
