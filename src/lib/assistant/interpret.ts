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
import type { LevelKey } from "@/lib/permissions/catalogue";
import {
  DRAFT_KINDS,
  LOOKUP_KINDS,
  draftFromToolCall,
  draftTools,
  fieldSpecs,
  toolNeeds,
  type LookupKind,
} from "./llm-tools";
import { isWriteIntent, type AssistantTrace, type Draft, type ParseContext } from "./types";

export type InterpretRows = Pick<
  ParseContext,
  "residents" | "enclosures" | "zones" | "clinics" | "carers" | "immunizationTypes" | "medications"
>;

/** The rows an id field of each lookup kind must come from. */
function idsOf(rows: InterpretRows, kind: LookupKind): string[] {
  switch (kind) {
    case "resident":
      return rows.residents.map((r) => r.id);
    case "enclosure":
      return rows.enclosures.map((e) => e.id);
    case "zone":
      return rows.zones.map((z) => z.id);
    case "clinic":
      return rows.clinics.map((c) => c.id);
    case "carer":
      return rows.carers.map((c) => c.id);
    case "vaccine":
      return rows.immunizationTypes.map((v) => v.id);
    case "medication":
      return rows.medications.map((m) => m.id);
  }
}

/** Model calls per leg (from the sentence, or from an answer to the next draft or question). */
export const MAX_ROUNDS = 4;
/** Model calls per sentence across all its legs: a model that keeps asking still stops. */
export const MAX_ROUNDS_PER_SENTENCE = 6;
/** Malformed tool calls tolerated per sentence. The second one ends the turn. */
export const MAX_MALFORMED = 2;
/** Questions the model may put to the person per sentence. */
export const MAX_ASKS = 2;
/** Earlier sentences of this conversation the model is shown. Older ones are dropped, not summarised. */
export const MAX_HISTORY = 3;
/** Milliseconds one model call may take before the turn falls back. */
export const MODEL_TIMEOUT_MS = 25_000;
const MAX_MATCHES = 5;
const MAX_TEXT_IN_EXCHANGE = 2000;
const MAX_HISTORY_REQUEST_CHARS = 300;
const MAX_QUESTION_CHARS = 200;
const MAX_ANSWER_TEXT = 200;
/** The browser hands a paused exchange back; anything larger than this was not made here. */
const MAX_RESUME_CHARS = 40_000;
export const PROMPT_VERSION = "v2";
export const REQUEST_DETAILS = "request_details";

export type InterpretOutcome =
  | "draft" // a valid draft came back
  | "asked" // the model asked the person for details; the turn waits on them
  | "no_draft" // the model answered in words or called no draft tool
  | "refused" // the model declined
  | "malformed" // bad calls twice, or ran out of rounds
  | "timeout"
  | "error"; // an LlmError of any other kind

/**
 * What `assistant_actions.exchange` holds for a version 2 turn: ONE row per
 * sentence, whatever questions it took. Reasoning in
 * docs/decisions/2026-10-30-assistant-v2-interpret.md (v1) and
 * docs/decisions/2026-10-30-assistant-v2-conversation.md (v2).
 */
export type AssistantExchange = {
  v: 2;
  /** Which system prompt, by label. The text lives in this file, in git. */
  prompt: string;
  outcome: InterpretOutcome;
  /** An LlmErrorKind, only when outcome is "error". */
  errorKind?: string;
  /** Model calls for this sentence, across every leg. */
  rounds: number;
  /** Questions put to the person. */
  asks: number;
  /**
   * How many earlier sentences the model was shown. Their text is not copied
   * here: each has its own row, and a sentence is kept in one place only.
   */
  history: number;
  usage: { inputTokens: number; outputTokens: number };
  /** The messages after the system prompt, tool results and answers included. */
  messages: LlmMessage[];
};

/** One field the model asked for, as the modal draws it. Built from the action tool's own schema. */
export type AskField = {
  name: string;
  input: "date" | "time" | "number" | "integer" | "text" | "choice";
  options?: string[];
};

export type DetailsAsk = { action: Draft["kind"]; question: string; fields: AskField[] };

/**
 * A paused exchange. The browser holds it while the person answers and hands
 * it back unchanged; nothing about it is trusted on the way back (see
 * `resumeConversation`), and it lives only as long as the page does.
 */
export type InterpretResume = {
  messages: LlmMessage[];
  usage: { inputTokens: number; outputTokens: number };
  model: string;
};

/** An earlier sentence of the same conversation, as the browser reports it. */
export type HistoryLine = {
  request: string;
  outcome: "recorded" | "answered" | "cancelled" | "open";
  kind?: Draft["kind"] | null;
  residentId?: string | null;
};

export type InterpretResult =
  | {
      ok: true;
      draft: Draft;
      /** The residents a name could have meant, for the card's "which one?" picker. */
      residentCandidates: string[];
      trace: AssistantTrace;
    }
  /** The model asked the person for details. Answer with `resume` and the values. */
  | { ok: true; ask: DetailsAsk; resume: InterpretResume; trace: AssistantTrace }
  /** No draft. `trace` is absent only when no model call was ever made. */
  | { ok: false; reason: InterpretOutcome | "not_configured"; trace?: AssistantTrace };

// ---------------------------------------------------------------- prompt

function systemPrompt(today: string, weekday: string): string {
  return [
    "You turn one sentence from a staff member at an animal shelter into exactly one tool call.",
    `Today is ${weekday} ${today}. Resolve dates like "tomorrow" or "last Friday" to YYYY-MM-DD from that.`,
    "You are given no list of residents, enclosures, zones, clinics, carers, vaccines or medicines. Use the lookup tool to find the id of each one the sentence names, then call one action tool with those ids.",
    "Never invent an id. If a name has no match or several matches, pass null for that field and the person will choose on the form. Never ask the person which resident they meant.",
    `If the action cannot be done without something the sentence did not say (a weight, a cause of death, foster or adopt), you may call ${REQUEST_DETAILS} on its own, naming the action and those fields. Never ask for an id. Never ask again for a field the person has already answered or skipped. For anything else not said, pass null: the person fills it in on the form.`,
    "When the person has answered, call the action tool with their answers.",
    "If the sentence does not ask for any of the action tools, reply in one short sentence and call no tool.",
    "Call at most one action tool. Pass null for anything the sentence did not say.",
    "Earlier sentences from this conversation may be listed before the new one. Use them only to understand words like 'her' or 'the same one'. Act only on the new sentence.",
  ].join("\n");
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function weekdayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : WEEKDAYS[d.getUTCDay()];
}

// ---------------------------------------------------------------- tools

export { LOOKUP_KINDS, type LookupKind };

const LOOKUP_TOOL: LlmToolDef = {
  name: "lookup",
  description:
    "Find the id of a resident, enclosure, zone, clinic, carer, vaccine or medicine by name or code. Returns up to 5 matches.",
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

function requestDetailsTool(actions: LlmToolDef[]): LlmToolDef {
  return {
    name: REQUEST_DETAILS,
    description:
      "Ask the person for fields an action needs that the sentence did not give. Not for ids, and not for choosing between residents.",
    inputSchema: {
      type: "object",
      properties: {
        action: { enum: actions.map((a) => a.name), description: "The action tool the answers are for." },
        fields: { type: "array", items: { type: "string" }, description: "Field names of that action to ask for." },
        question: { type: "string", description: "One short question to show the person." },
      },
      required: ["action", "fields", "question"],
      additionalProperties: false,
    },
  };
}

/**
 * Lookup first, then the action tools, then `request_details`. A person who
 * may only ask gets only the questions, and can only be asked about them.
 *
 * `holds` answers the extra activity a tool declares in `needs`, and it
 * **defaults to no**: a caller that forgets to pass it offers the tool to
 * nobody rather than to everyone (CLAUDE.md, "A button is shown only if the
 * login's cards let it do that action").
 */
export function interpretTools(canWrite: boolean, holds: (activity: LevelKey) => boolean = () => false): LlmToolDef[] {
  const actions = draftTools().filter((t) => {
    const kind = t.name as Draft["kind"];
    if (isWriteIntent(kind) && !canWrite) return false;
    const needs = toolNeeds(kind);
    return needs === null || holds(needs);
  });
  return [LOOKUP_TOOL, ...actions, requestDetailsTool(actions)];
}

/**
 * The modal field for one field of an action tool, read off that tool's own
 * field table (`fieldSpecs`, llm-tools.ts), so there is no hand-written form
 * per intent. Null for a field that may not be asked: ids and id lists are
 * chosen on the card, from rows, never typed.
 *
 * It asks the table what a field IS rather than inferring it. Until #1122 it
 * probed the JSON schema and spotted ids by the `…Id` / `…Ids` naming, which
 * worked only while every id field happened to be named that way.
 */
export function askableField(tool: LlmToolDef, name: string): AskField | null {
  if (!DRAFT_KINDS.includes(tool.name as Draft["kind"])) return null;
  const specs = fieldSpecs(tool.name as Draft["kind"]);
  if (!Object.prototype.hasOwnProperty.call(specs, name)) return null;
  const f = specs[name];
  switch (f.type) {
    case "id":
    case "id_list":
      return null;
    case "choice":
      return { name, input: "choice", options: [...f.options] };
    case "number":
      return { name, input: f.integer ? "integer" : "number" };
    case "date":
      return { name, input: "date" };
    case "time":
      return { name, input: "time" };
    case "text":
      return { name, input: "text" };
  }
}

/** The person's answer to one field, made to fit it. Anything that does not fit is null: skipped. */
export function coerceAnswer(f: AskField, v: unknown): string | number | null {
  if (v === null || v === undefined || v === "") return null;
  switch (f.input) {
    case "date":
      return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
    case "time":
      return typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : null;
    case "number":
    case "integer": {
      const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
      if (!Number.isFinite(n)) return null;
      return f.input === "integer" && !Number.isInteger(n) ? null : n;
    }
    case "choice":
      return typeof v === "string" && (f.options ?? []).includes(v) ? v : null;
    case "text":
      return typeof v === "string" ? v.trim().slice(0, MAX_ANSWER_TEXT) || null : null;
  }
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
    case "zone":
      return rows.zones
        .filter((z) => has(z.name, q) || has(z.nameTh, q))
        .slice(0, MAX_MATCHES)
        .map((z) => ({ id: z.id, name: z.name }));
    case "medication":
      return rows.medications
        .filter((m) => has(m.name, q) || has(m.nameTh, q))
        .slice(0, MAX_MATCHES)
        .map((m) => ({ id: m.id, name: m.name, unit: m.doseUnit }));
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
  // Which fields are ids, and which rows each must come from, comes from the
  // tool's own field table — so a new id field is checked by construction
  // rather than when someone remembers to add it to a list here.
  if (!DRAFT_KINDS.includes(tool.name as Draft["kind"])) return null;
  for (const [field, f] of Object.entries(fieldSpecs(tool.name as Draft["kind"]))) {
    if (f.type !== "id" && f.type !== "id_list") continue;
    const ids = new Set(idsOf(rows, f.of));
    if (f.type === "id") {
      if (obj[field] != null && !(typeof obj[field] === "string" && ids.has(obj[field] as string))) {
        return `"${field}" is not an id from a lookup. Call lookup with kind "${f.of}" and use the id it returns, or pass null.`;
      }
      continue;
    }
    const list = obj[field];
    if (Array.isArray(list) && list.some((id) => !ids.has(id as string))) {
      return `"${field}" holds an id that is not from a lookup. Call lookup with kind "${f.of}".`;
    }
  }
  return null;
}

// ------------------------------------------------------- the conversation

/**
 * The earlier sentences, as one plain paragraph put in front of the new one.
 * In the user message and not the system prompt, so the system prompt and
 * tool block stay byte-identical from call to call and a local server can
 * reuse what it already read of them. Only what the browser reports is used,
 * and only after checking it: a resident id must be a row this person can
 * see, and its name comes from that row, never from the browser.
 */
export function historyPreface(history: unknown, rows: InterpretRows): { text: string; count: number } {
  if (!Array.isArray(history)) return { text: "", count: 0 };
  const outcomes: Record<HistoryLine["outcome"], string> = {
    recorded: "recorded",
    answered: "answered",
    cancelled: "cancelled by the person",
    open: "shown on a form, not yet confirmed",
  };
  const lines: string[] = [];
  for (const h of history.slice(-MAX_HISTORY)) {
    if (!h || typeof h !== "object") continue;
    const { request, outcome, kind, residentId } = h as Record<string, unknown>;
    if (typeof request !== "string" || !request.trim()) continue;
    if (typeof outcome !== "string" || !Object.prototype.hasOwnProperty.call(outcomes, outcome)) continue;
    let line = `- ${JSON.stringify(request.slice(0, MAX_HISTORY_REQUEST_CHARS))}: ${outcomes[outcome as HistoryLine["outcome"]]}`;
    if (typeof kind === "string" && DRAFT_KINDS.includes(kind as Draft["kind"])) line += ` (${kind})`;
    const resident = typeof residentId === "string" ? rows.residents.find((r) => r.id === residentId) : undefined;
    if (resident) line += `; resident ${resident.name}, id ${resident.id}`;
    lines.push(line);
  }
  if (lines.length === 0) return { text: "", count: 0 };
  return {
    text: `Earlier in this conversation, oldest first (do not act on these again):\n${lines.join("\n")}\n\nThe new sentence:\n`,
    count: lines.length,
  };
}

function withPreface(messages: LlmMessage[], preface: string): LlmMessage[] {
  if (!preface) return messages;
  const [first, ...rest] = messages;
  return [{ ...first, content: [{ type: "text", text: preface + textOf(first) }] }, ...rest];
}

function textOf(m: LlmMessage): string {
  return m.content.map((p) => (p.type === "text" ? p.text : "")).join("");
}

/** What a sentence's messages say about itself. Counted from the messages, so nothing the browser claims is believed. */
type Ledger = {
  rounds: number;
  asks: number;
  malformed: number;
  /** Per action, every field the person has answered (a value) or skipped (null). */
  answered: Map<string, Record<string, string | number | null>>;
  /** Resident lookups and the ids each found, oldest first. */
  residentLookups: { query: string; ids: string[] }[];
};

function ledgerOf(messages: LlmMessage[]): Ledger {
  const calls = new Map<string, { name: string; input: Record<string, unknown> }>();
  const ledger: Ledger = { rounds: 0, asks: 0, malformed: 0, answered: new Map(), residentLookups: [] };
  for (const m of messages) {
    if (m.role === "assistant") ledger.rounds += 1;
    for (const p of m.content) {
      if (p.type === "tool_call") calls.set(p.id, { name: p.name, input: p.input });
      if (p.type !== "tool_result") continue;
      if (p.isError) {
        ledger.malformed += 1;
        continue;
      }
      const call = calls.get(p.callId);
      if (!call) continue;
      if (call.name === REQUEST_DETAILS) {
        ledger.asks += 1;
        const answers = (parseJson(p.content) as { answers?: unknown } | null)?.answers;
        const action = String(call.input.action);
        if (answers && typeof answers === "object") {
          ledger.answered.set(action, { ...ledger.answered.get(action), ...(answers as Record<string, string | number | null>) });
        }
      } else if (call.name === "lookup" && call.input.kind === "resident") {
        const found = parseJson(p.content);
        const ids = Array.isArray(found) ? found.map((r) => (r as { id?: unknown })?.id).filter((id): id is string => typeof id === "string") : [];
        ledger.residentLookups.push({ query: String(call.input.query ?? ""), ids });
      }
    }
  }
  return ledger;
}

function parseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * "Which Panda?" is asked, never guessed. The model is told to pass null when
 * a name matched several residents; a small model will sometimes pick the
 * first instead, so the pick is checked here. It stands only when it is the
 * exact name or code a lookup asked for. Otherwise it is cleared and the
 * lookup's matches go to the card's existing picker.
 */
export function settleResident(
  draft: Draft,
  lookups: Ledger["residentLookups"],
  rows: InterpretRows,
): { draft: Draft; residentCandidates: string[] } {
  if (!("residentId" in draft)) return { draft, residentCandidates: [] };
  const exact = (id: string, query: string) => {
    const r = rows.residents.find((x) => x.id === id);
    const q = norm(query);
    return !!r && (norm(r.name) === q || (!!r.thaiName && norm(r.thaiName) === q) || norm(r.code) === q);
  };
  if (draft.residentId) {
    const chosen = draft.residentId;
    const several = lookups.filter((l) => l.ids.length > 1 && l.ids.includes(chosen));
    if (several.length === 0 || several.some((l) => exact(chosen, l.query))) return { draft, residentCandidates: [] };
    return { draft: { ...draft, residentId: null }, residentCandidates: several[several.length - 1].ids };
  }
  const last = lookups[lookups.length - 1];
  return { draft, residentCandidates: last && last.ids.length > 1 ? last.ids : [] };
}

/**
 * Checks a `request_details` call and turns it into the question to show.
 * Each refusal goes back to the model as an error and counts as malformed,
 * so a model that keeps getting it wrong ends on the keyword parser:
 * - an action it was not given, or a field that action does not have;
 * - an id, which is chosen on the card from rows, never typed;
 * - a field already answered or skipped for this sentence (asked fields
 *   already answered are dropped; if nothing new is left, it is refused);
 * - a question past MAX_ASKS.
 */
function askFrom(
  call: LlmToolCall,
  toolByName: Map<string, LlmToolDef>,
  rows: InterpretRows,
  ledger: Ledger,
): { ask: DetailsAsk } | { error: string } {
  const problem = validateToolInput(toolByName.get(REQUEST_DETAILS)!, call.input, rows);
  if (problem) return { error: problem };
  const { action, fields, question } = call.input as { action: Draft["kind"]; fields: unknown; question: unknown };
  const tool = toolByName.get(action);
  if (!tool || !Array.isArray(fields) || typeof question !== "string") return { error: `"action", "fields" and "question" are all needed.` };
  const answered = ledger.answered.get(action) ?? {};
  if (ledger.asks >= MAX_ASKS) {
    return { error: `No more questions. Call ${action} now, with the answers so far and null for anything else: the person fills it in on the form.` };
  }
  const asked: AskField[] = [];
  for (const name of new Set(fields.map(String))) {
    if (!Object.prototype.hasOwnProperty.call(tool.inputSchema.properties, name)) {
      return { error: `"${name}" is not a field of ${action}. Fields: ${Object.keys(tool.inputSchema.properties).join(", ")}.` };
    }
    const field = askableField(tool, name);
    if (!field) {
      return { error: `"${name}" cannot be asked. Ids come from lookup; if a name matched several, pass null and the person will choose on the form.` };
    }
    if (!Object.prototype.hasOwnProperty.call(answered, name)) asked.push(field);
  }
  if (asked.length === 0) {
    return { error: `Already answered: ${JSON.stringify(answered)}. Do not ask again. Call ${action} now.` };
  }
  return { ask: { action, question: question.trim().slice(0, MAX_QUESTION_CHARS), fields: asked } };
}

const PART_TYPES = new Set(["text", "tool_call", "tool_result"]);

function isMessages(x: unknown): x is LlmMessage[] {
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every((m) => {
    if (!m || typeof m !== "object") return false;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || !Array.isArray(content)) return false;
    return content.every((p) => {
      if (!p || typeof p !== "object" || !PART_TYPES.has((p as LlmPart).type)) return false;
      const part = p as Record<string, unknown>;
      if (part.type === "text") return typeof part.text === "string";
      if (part.type === "tool_call") {
        return typeof part.id === "string" && typeof part.name === "string" && !!part.input && typeof part.input === "object" && !Array.isArray(part.input);
      }
      return typeof part.callId === "string" && typeof part.content === "string";
    });
  });
}

/**
 * Takes back a paused exchange and the person's answer. The browser held it,
 * so it is checked as if it came from anywhere: its shape, its size, that it
 * starts with this very sentence and that it ends on a question still
 * waiting for its answer. The answer is fitted to the fields that question
 * asked and nothing else. Every counter is recounted from the messages, so
 * editing a number buys nothing. Returns null for anything that does not fit.
 */
export function resumeConversation(
  state: unknown,
  answer: unknown,
  request: string,
  toolByName: Map<string, LlmToolDef>,
  rows: InterpretRows,
): InterpretResume | null {
  if (!state || typeof state !== "object") return null;
  if (JSON.stringify(state).length > MAX_RESUME_CHARS) return null;
  const { messages, usage, model } = state as Record<string, unknown>;
  if (!isMessages(messages) || messages.length < 3) return null;
  const first = messages[0];
  if (first.role !== "user" || first.content.length !== 1 || textOf(first) !== request) return null;
  const last = messages[messages.length - 1];
  const asking = messages[messages.length - 2];
  if (last.role !== "user" || asking.role !== "assistant") return null;
  const pending = asking.content.filter(
    (p): p is Extract<LlmPart, { type: "tool_call" }> =>
      p.type === "tool_call" && p.name === REQUEST_DETAILS && !last.content.some((r) => r.type === "tool_result" && r.callId === p.id),
  );
  if (pending.length !== 1) return null;
  const call = pending[0];
  // Re-derive the question rather than trust it: the same checks, against the ledger before it was asked.
  const before = ledgerOf(messages.slice(0, -2));
  const asked = askFrom({ id: call.id, name: call.name, input: call.input }, toolByName, rows, before);
  if (!("ask" in asked)) return null;
  const given = answer && typeof answer === "object" ? (answer as Record<string, unknown>) : {};
  const answers: Record<string, string | number | null> = {};
  for (const f of asked.ask.fields) answers[f.name] = coerceAnswer(f, given[f.name]);
  const skipped = Object.values(answers).every((v) => v === null);
  const reply: LlmPart = {
    type: "tool_result",
    callId: call.id,
    content: JSON.stringify({
      answers,
      note: skipped
        ? `The person skipped these. Call ${asked.ask.action} now with null for them; they will fill them in on the form.`
        : `Call ${asked.ask.action} now with these answers. Null means the person skipped it.`,
    }),
  };
  const u = (usage && typeof usage === "object" ? usage : {}) as Record<string, unknown>;
  const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  return {
    messages: [...messages.slice(0, -1), { role: "user", content: [...last.content, reply] }],
    usage: { inputTokens: count(u.inputTokens), outputTokens: count(u.outputTokens) },
    model: typeof model === "string" ? model.slice(0, 200) : "",
  };
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

/** Action calls first, then lookups, then a question: a model that both answers and asks has answered. */
function callOrder(c: LlmToolCall): number {
  return c.name === REQUEST_DETAILS ? 2 : c.name === "lookup" ? 1 : 0;
}

export async function interpretSentence(input: {
  llm: LlmAdapter;
  rows: InterpretRows;
  request: string;
  /** The asker's calendar date, YYYY-MM-DD. */
  today: string;
  canWrite: boolean;
  /** Answers a tool's `needs` activity. Defaults to no, so a tool that asks for one is withheld. */
  holds?: (activity: LevelKey) => boolean;
  timeoutMs?: number;
  /** Earlier sentences of this conversation, from the browser. Checked, capped at MAX_HISTORY. */
  history?: unknown;
  /** A paused exchange and the person's answer to its question. */
  resume?: { state: unknown; answer: unknown };
}): Promise<InterpretResult> {
  const { llm, rows } = input;
  const tools = interpretTools(input.canWrite, input.holds);
  const toolByName = new Map(tools.map((t) => [t.name, t]));
  const preface = historyPreface(input.history, rows);
  let messages: LlmMessage[] = [{ role: "user", content: [{ type: "text", text: input.request }] }];
  let usage = { inputTokens: 0, outputTokens: 0 };
  let model = llm.model;
  if (input.resume) {
    const resumed = resumeConversation(input.resume.state, input.resume.answer, input.request, toolByName, rows);
    if (!resumed) return { ok: false, reason: "malformed" };
    messages = resumed.messages;
    usage = resumed.usage;
    model = resumed.model || model;
  }
  let ledger = ledgerOf(messages);

  const finish = (outcome: InterpretOutcome, errorKind?: string): InterpretResult => ({
    ok: false,
    reason: outcome,
    trace: trace(outcome, errorKind),
  });
  const trace = (outcome: InterpretOutcome, errorKind?: string): AssistantTrace => {
    const exchange: AssistantExchange = {
      v: 2,
      prompt: PROMPT_VERSION,
      outcome,
      ...(errorKind ? { errorKind } : {}),
      rounds: ledger.rounds,
      asks: ledger.asks,
      history: preface.count,
      usage,
      messages,
    };
    return { model, exchange };
  };

  for (let leg = 0; leg < MAX_ROUNDS; leg += 1) {
    if (ledger.rounds >= MAX_ROUNDS_PER_SENTENCE) return finish("malformed");
    let response;
    try {
      const answered = await withTimeout(
        llm.complete({
          system: systemPrompt(input.today, weekdayOf(input.today)),
          messages: withPreface(messages, preface.text),
          tools,
        }),
        input.timeoutMs ?? MODEL_TIMEOUT_MS,
      );
      if (answered === "timeout") {
        ledger = { ...ledger, rounds: ledger.rounds + 1 };
        return finish("timeout");
      }
      response = answered;
    } catch (e) {
      if (e instanceof LlmError) {
        // Nothing was asked of a model that is not there; that is version 1, unchanged.
        if (e.kind === "not_configured") return { ok: false, reason: "not_configured" };
        ledger = { ...ledger, rounds: ledger.rounds + 1 };
        return finish("error", e.kind);
      }
      ledger = { ...ledger, rounds: ledger.rounds + 1 };
      return finish("error", "unknown");
    }
    model = response.model || model;
    usage = {
      inputTokens: usage.inputTokens + response.usage.inputTokens,
      outputTokens: usage.outputTokens + response.usage.outputTokens,
    };

    const assistantParts: LlmPart[] = [];
    if (response.text) assistantParts.push({ type: "text", text: response.text });
    for (const c of response.toolCalls) assistantParts.push({ type: "tool_call", id: c.id, name: c.name, input: c.input });
    messages = [...messages, { role: "assistant", content: clip(assistantParts) }];
    ledger = ledgerOf(messages);

    if (response.stop === "refused") return finish("refused");
    if (response.toolCalls.length === 0) return finish("no_draft");

    const results: LlmPart[] = [];
    let draft: Draft | null = null;
    let ask: DetailsAsk | null = null;
    for (const call of [...response.toolCalls].sort((a, b) => callOrder(a) - callOrder(b))) {
      if (call.name === REQUEST_DETAILS) {
        if (ask) {
          results.push({ type: "tool_result", callId: call.id, content: "One question at a time.", isError: true });
          continue;
        }
        const asked = askFrom(call, toolByName, rows, ledger);
        if ("ask" in asked) ask = asked.ask;
        else results.push({ type: "tool_result", callId: call.id, content: asked.error, isError: true });
        continue;
      }
      // The person's answers outrank the model's memory of them: a small model
      // that drops or rewrites an answered field gets it put back.
      const answers = Object.fromEntries(
        Object.entries(ledger.answered.get(call.name) ?? {}).filter(([, v]) => v !== null),
      );
      const fixed = Object.keys(answers).length && call.input && typeof call.input === "object" && !Array.isArray(call.input)
        ? { ...call, input: { ...call.input, ...answers } }
        : call;
      const answer = answerCall(fixed, toolByName, rows);
      if (answer.draft) {
        draft = answer.draft;
        break;
      }
      results.push({ type: "tool_result", callId: call.id, content: answer.content, ...(answer.isError ? { isError: true } : {}) });
    }
    if (draft) {
      const settled = settleResident(draft, ledger.residentLookups, rows);
      return { ok: true, draft: settled.draft, residentCandidates: settled.residentCandidates, trace: trace("draft") };
    }
    messages = [...messages, { role: "user", content: clip(results) }];
    ledger = ledgerOf(messages);
    if (ask && ledger.malformed < MAX_MALFORMED) {
      // Counted as asked once it is shown; recounted from the answer on the way back.
      const shown = { ...ledger, asks: ledger.asks + 1 };
      ledger = shown;
      return { ok: true, ask, resume: { messages, usage, model }, trace: trace("asked") };
    }
    if (ledger.malformed >= MAX_MALFORMED) return finish("malformed");
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
