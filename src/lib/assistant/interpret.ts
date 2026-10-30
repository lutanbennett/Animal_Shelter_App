/**
 * Assistant v2 stream 3: a model turns one sentence into one `Draft`.
 *
 * Pure of the framework on purpose (no Supabase, no `server-only`), so
 * `interpret.test.mjs` drives it with a scripted `LlmAdapter`. The server
 * action `src/app/assistant/interpret.ts` is the thin shell that loads the
 * rows and checks the caller's card.
 *
 * Designed for a small self-hosted model, not for Claude: every tool input
 * is validated against its own schema before anything is acted on, an
 * invented id is refused rather than trusted, and a malformed call is sent
 * back to the model once with a plain error before the turn gives up. Giving
 * up is never an error shown to a person: the caller falls back to the
 * keyword parser, which is a first-class path.
 *
 * The model never sees the resident list. It asks for the few rows it needs
 * through the `lookup` tool.
 */
import {
  LlmError,
  type LlmAdapter,
  type LlmMessage,
  type LlmPart,
  type LlmToolCall,
  type LlmToolDef,
} from "./llm";
import { draftFromToolCall, draftTools } from "./llm-tools";
import type { AssistantTrace, Draft, ParseContext } from "./types";

export type InterpretRows = Pick<
  ParseContext,
  "residents" | "enclosures" | "clinics" | "carers" | "immunizationTypes"
>;

/** Model calls per sentence, lookups and one retry of a bad call included. */
export const MAX_ROUNDS = 4;
/** Malformed tool calls tolerated per sentence. The second one ends the turn. */
export const MAX_MALFORMED = 2;
/** Milliseconds one model call may take before the turn falls back. */
export const MODEL_TIMEOUT_MS = 25_000;
const MAX_MATCHES = 5;
const MAX_TEXT_IN_EXCHANGE = 2000;
export const PROMPT_VERSION = "v1";

export type InterpretOutcome =
  | "draft" // a valid draft came back
  | "no_draft" // the model answered in words or called no draft tool
  | "refused" // the model declined
  | "malformed" // bad calls twice, or ran out of rounds
  | "timeout"
  | "error"; // an LlmError of any other kind

/**
 * What `assistant_actions.exchange` holds for a version 2 turn. Reasoning in
 * docs/decisions/2026-10-30-assistant-v2-interpret.md.
 */
export type AssistantExchange = {
  v: 1;
  /** Which system prompt, by label. The text lives in this file, in git. */
  prompt: string;
  outcome: InterpretOutcome;
  /** An LlmErrorKind, only when outcome is "error". */
  errorKind?: string;
  rounds: number;
  usage: { inputTokens: number; outputTokens: number };
  /** The messages after the system prompt, tool results included. */
  messages: LlmMessage[];
};

export type InterpretResult =
  | { ok: true; draft: Draft; trace: AssistantTrace }
  /** No draft. `trace` is absent only when no model call was ever made. */
  | { ok: false; reason: InterpretOutcome | "not_configured"; trace?: AssistantTrace };

// ---------------------------------------------------------------- prompt

function systemPrompt(today: string, weekday: string): string {
  return [
    "You turn one sentence from a staff member at an animal shelter into exactly one tool call.",
    `Today is ${weekday} ${today}. Resolve dates like "tomorrow" or "last Friday" to YYYY-MM-DD from that.`,
    "You are given no list of residents, enclosures, clinics, carers or vaccines. Use the lookup tool to find the id of each one the sentence names, then call one action tool with those ids.",
    "Never invent an id. If a name has no match or several matches, pass null for that field and the person will choose.",
    "If the sentence does not ask for any of the action tools, reply in one short sentence and call no tool.",
    "Call at most one action tool. Pass null for anything the sentence did not say.",
  ].join("\n");
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function weekdayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : WEEKDAYS[d.getUTCDay()];
}

// ---------------------------------------------------------------- tools

const LOOKUP_KINDS = ["resident", "enclosure", "clinic", "carer", "vaccine"] as const;
type LookupKind = (typeof LOOKUP_KINDS)[number];

const LOOKUP_TOOL: LlmToolDef = {
  name: "lookup",
  description:
    "Find the id of a resident, enclosure, clinic, carer or vaccine by name or code. Returns up to 5 matches.",
  inputSchema: {
    type: "object",
    properties: {
      kind: { enum: [...LOOKUP_KINDS], description: "What to look for." },
      query: { type: "string", description: "Part of the name, or the resident code." },
    },
    required: ["kind", "query"],
    additionalProperties: false,
  },
};

const READ_ONLY_KINDS = new Set(["where", "who", "due"]);

/** Lookup first, then the action tools. A person who may only ask gets only the questions. */
export function interpretTools(canWrite: boolean): LlmToolDef[] {
  const actions = draftTools().filter((t) => canWrite || READ_ONLY_KINDS.has(t.name));
  return [LOOKUP_TOOL, ...actions];
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const has = (hay: string | null | undefined, needle: string) => !!hay && norm(hay).includes(needle);

/** Pure: the rows a `lookup` call answers with. */
export function runLookup(rows: InterpretRows, kind: LookupKind, query: string): unknown[] {
  const q = norm(query);
  if (!q) return [];
  switch (kind) {
    case "resident":
      return rows.residents
        .filter((r) => has(r.name, q) || has(r.thaiName, q) || norm(r.code) === q)
        .slice(0, MAX_MATCHES)
        .map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          enclosure: r.enclosureName,
          status: r.status,
        }));
    case "enclosure":
      return rows.enclosures
        .filter((e) => has(e.name, q) || has(e.nameTh, q))
        .slice(0, MAX_MATCHES)
        .map((e) => ({ id: e.id, name: e.name }));
    case "clinic":
      return rows.clinics.filter((c) => has(c.name, q)).slice(0, MAX_MATCHES).map((c) => ({ id: c.id, name: c.name }));
    case "carer":
      return rows.carers.filter((c) => has(c.name, q)).slice(0, MAX_MATCHES).map((c) => ({ id: c.id, name: c.name }));
    case "vaccine":
      return rows.immunizationTypes
        .filter((v) => has(v.name, q) || has(v.nameTh, q))
        .slice(0, MAX_MATCHES)
        .map((v) => ({ id: v.id, name: v.name }));
  }
}

// ------------------------------------------------------------ validation

type Prop = { type?: string | string[]; enum?: unknown[]; pattern?: string; items?: { type?: string } };

function typeOk(p: Prop, v: unknown): boolean {
  if (v === null) return p.enum ? p.enum.includes(null) : p.type !== "array";
  if (p.enum) return p.enum.includes(v);
  const types = Array.isArray(p.type) ? p.type : p.type ? [p.type] : [];
  const okType = types.some((t) => {
    if (t === "string") return typeof v === "string";
    if (t === "number") return typeof v === "number" && Number.isFinite(v);
    if (t === "integer") return typeof v === "number" && Number.isInteger(v);
    if (t === "array") return Array.isArray(v) && v.every((x) => typeof x === "string");
    return false;
  });
  if (!okType) return false;
  if (p.pattern && typeof v === "string" && !new RegExp(p.pattern).test(v)) return false;
  return true;
}

/**
 * Checks one tool input against its own schema: no field the schema does not
 * have, every field the right type, every id a row that exists. Returns the
 * message to hand back to the model, or null when the input is good. A field
 * the model left out is not an error: it reads as null, a blank on the card.
 */
export function validateToolInput(tool: LlmToolDef, input: unknown, rows: InterpretRows): string | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return "The input must be a JSON object.";
  }
  const props = tool.inputSchema.properties as Record<string, Prop>;
  const obj = input as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!(key in props)) return `"${key}" is not a field of ${tool.name}. Fields: ${Object.keys(props).join(", ")}.`;
  }
  if (tool.name === "lookup") {
    if (!LOOKUP_KINDS.includes(obj.kind as LookupKind)) return `"kind" must be one of ${LOOKUP_KINDS.join(", ")}.`;
    if (typeof obj.query !== "string" || !obj.query.trim()) return `"query" must be a non-empty string.`;
    return null;
  }
  for (const [key, v] of Object.entries(obj)) {
    if (!typeOk(props[key], v)) return `"${key}" has the wrong type or format. Expected ${JSON.stringify(props[key])}.`;
  }
  const known = (ids: Iterable<string>, id: unknown) => typeof id === "string" && new Set(ids).has(id);
  const idChecks: [string, Iterable<string>][] = [
    ["residentId", rows.residents.map((r) => r.id)],
    ["enclosureId", rows.enclosures.map((e) => e.id)],
    ["clinicId", rows.clinics.map((c) => c.id)],
    ["carerId", rows.carers.map((c) => c.id)],
  ];
  for (const [field, ids] of idChecks) {
    if (obj[field] != null && !known(ids, obj[field])) {
      return `"${field}" is not an id from a lookup. Call lookup and use the id it returns, or pass null.`;
    }
  }
  const list = obj.immunizationTypeIds;
  if (Array.isArray(list)) {
    const ids = new Set(rows.immunizationTypes.map((v) => v.id));
    if (list.some((id) => !ids.has(id as string))) {
      return `"immunizationTypeIds" holds an id that is not from a lookup. Call lookup with kind "vaccine".`;
    }
  }
  return null;
}

// ------------------------------------------------------------- the loop

function clip(parts: LlmPart[]): LlmPart[] {
  return parts.map((p) => {
    if (p.type === "text" && p.text.length > MAX_TEXT_IN_EXCHANGE) return { ...p, text: p.text.slice(0, MAX_TEXT_IN_EXCHANGE) };
    if (p.type === "tool_result" && p.content.length > MAX_TEXT_IN_EXCHANGE) return { ...p, content: p.content.slice(0, MAX_TEXT_IN_EXCHANGE) };
    return p;
  });
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | "timeout"> {
  let timer: ReturnType<typeof setTimeout>;
  const clock = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), ms);
  });
  return Promise.race([p, clock]).finally(() => clearTimeout(timer));
}

export async function interpretSentence(input: {
  llm: LlmAdapter;
  rows: InterpretRows;
  request: string;
  /** The asker's calendar date, YYYY-MM-DD. */
  today: string;
  canWrite: boolean;
  timeoutMs?: number;
}): Promise<InterpretResult> {
  const { llm, rows } = input;
  const tools = interpretTools(input.canWrite);
  const toolByName = new Map(tools.map((t) => [t.name, t]));
  const messages: LlmMessage[] = [{ role: "user", content: [{ type: "text", text: input.request }] }];
  const usage = { inputTokens: 0, outputTokens: 0 };
  let rounds = 0;
  let malformed = 0;
  let model = llm.model;

  const finish = (outcome: InterpretOutcome, errorKind?: string): InterpretResult => ({
    ok: false,
    reason: outcome,
    trace: trace(outcome, errorKind),
  });
  const trace = (outcome: InterpretOutcome, errorKind?: string): AssistantTrace => {
    const exchange: AssistantExchange = {
      v: 1,
      prompt: PROMPT_VERSION,
      outcome,
      ...(errorKind ? { errorKind } : {}),
      rounds,
      usage,
      messages,
    };
    return { model, exchange };
  };

  while (rounds < MAX_ROUNDS) {
    rounds += 1;
    let response;
    try {
      const answered = await withTimeout(
        llm.complete({ system: systemPrompt(input.today, weekdayOf(input.today)), messages, tools }),
        input.timeoutMs ?? MODEL_TIMEOUT_MS,
      );
      if (answered === "timeout") return finish("timeout");
      response = answered;
    } catch (e) {
      if (e instanceof LlmError) {
        // Nothing was asked of a model that is not there; that is version 1, unchanged.
        if (e.kind === "not_configured") return { ok: false, reason: "not_configured" };
        return finish("error", e.kind);
      }
      return finish("error", "unknown");
    }
    model = response.model || model;
    usage.inputTokens += response.usage.inputTokens;
    usage.outputTokens += response.usage.outputTokens;

    const assistantParts: LlmPart[] = [];
    if (response.text) assistantParts.push({ type: "text", text: response.text });
    for (const c of response.toolCalls) assistantParts.push({ type: "tool_call", id: c.id, name: c.name, input: c.input });
    messages.push({ role: "assistant", content: clip(assistantParts) });

    if (response.stop === "refused") return finish("refused");
    if (response.toolCalls.length === 0) return finish("no_draft");

    const results: LlmPart[] = [];
    let draft: Draft | null = null;
    for (const call of response.toolCalls) {
      const answer = answerCall(call, toolByName, rows);
      if (answer.draft) {
        draft = answer.draft;
        break;
      }
      if (answer.isError) malformed += 1;
      results.push({ type: "tool_result", callId: call.id, content: answer.content, ...(answer.isError ? { isError: true } : {}) });
    }
    if (draft) return { ok: true, draft, trace: trace("draft") };
    if (malformed >= MAX_MALFORMED) return finish("malformed");
    messages.push({ role: "user", content: results });
  }
  return finish("malformed");
}

function answerCall(
  call: LlmToolCall,
  toolByName: Map<string, LlmToolDef>,
  rows: InterpretRows,
): { draft?: Draft; content: string; isError?: boolean } {
  const tool = toolByName.get(call.name);
  if (!tool) {
    return { content: `There is no tool called "${call.name}". Tools: ${[...toolByName.keys()].join(", ")}.`, isError: true };
  }
  const problem = validateToolInput(tool, call.input, rows);
  if (problem) return { content: problem, isError: true };
  if (call.name === "lookup") {
    const { kind, query } = call.input as { kind: LookupKind; query: string };
    return { content: JSON.stringify(runLookup(rows, kind, query)) };
  }
  const draft = draftFromToolCall(call.name, call.input);
  if (!draft) return { content: "That tool did not produce anything.", isError: true };
  return { draft, content: "ok" };
}
