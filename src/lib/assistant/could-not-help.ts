import type { SupabaseClient } from "@supabase/supabase-js";
import { SHELTER_TIME_ZONE } from "@/lib/format";
import { toCsv } from "@/lib/csv";

/**
 * Reading back the assistant's could-not-help rows: the `unmatched` ones (no parser placed the
 * sentence) and the `refused` ones (a write it would not do for that login). Retention keeps both
 * 90 days (0227); this file reads that window and changes nothing about it.
 *
 * Who may read: Admin only, by the table's policy (`assistant_actions_admin_all`, 0153). Every
 * caller asks the Admin rule first, and a non-Admin login's query returns nothing in any case.
 */

export const COULD_NOT_HELP_STATUSES = ["unmatched", "refused"] as const;
export type CouldNotHelpStatus = (typeof COULD_NOT_HELP_STATUSES)[number];

export type CouldNotHelpFilters = {
  /** One status, or both. */
  status: CouldNotHelpStatus | "all";
  /** YYYY-MM-DD in shelter time, inclusive; "" for no limit. */
  from: string;
  to: string;
};

export type CouldNotHelpRow = {
  id: string;
  created_at: string;
  request_text: string;
  intent: string | null;
  draft: Record<string, unknown> | null;
  status: CouldNotHelpStatus;
  result: string | null;
  result_table: string | null;
  result_row_id: string | null;
};

/** The most the screen draws; the export is allowed more, since a file is for a whole look. */
export const SCREEN_LIMIT = 500;
export const EXPORT_LIMIT = 5000;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseCouldNotHelpFilters(params: Record<string, string | string[] | undefined>): CouldNotHelpFilters {
  const one = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const status = one("status");
  const day = (v: string) => (DAY.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");
  return {
    status: (COULD_NOT_HELP_STATUSES as readonly string[]).includes(status) ? (status as CouldNotHelpStatus) : "all",
    from: day(one("from")),
    to: day(one("to")),
  };
}

/** The filters as a query string, for the export link and the form's own round trip. */
export function filtersQuery(f: CouldNotHelpFilters): string {
  const q = new URLSearchParams();
  if (f.status !== "all") q.set("status", f.status);
  if (f.from) q.set("from", f.from);
  if (f.to) q.set("to", f.to);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Newest first. Shelter-time day bounds, so "from 30 Oct" means from midnight in Chiang Mai. */
export async function loadCouldNotHelp(
  supabase: SupabaseClient,
  f: CouldNotHelpFilters,
  limit: number,
): Promise<{ rows: CouldNotHelpRow[]; error: string | null }> {
  let q = supabase
    .from("assistant_actions")
    .select("id, created_at, request_text, intent, draft, status, result, result_table, result_row_id")
    .in("status", f.status === "all" ? [...COULD_NOT_HELP_STATUSES] : [f.status])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00+07:00`);
  if (f.to) q = q.lt("created_at", `${nextDay(f.to)}T00:00:00+07:00`);
  const { data, error } = await q.returns<CouldNotHelpRow[]>();
  return { rows: data ?? [], error: error?.message ?? null };
}

function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

/** The resident a parser inferred, if it got that far: draft.residentId. Null for a sentence nothing placed. */
export function inferredResidentId(row: Pick<CouldNotHelpRow, "draft">): string | null {
  const id = row.draft?.residentId;
  return typeof id === "string" && id ? id : null;
}

/** What the assistant did, in a word a reader and a spreadsheet can both use. */
export function assistantOutcome(row: Pick<CouldNotHelpRow, "status" | "intent" | "result">): string {
  if (row.status === "refused") return "refused: this login may not ask the assistant to change records";
  if (row.status === "unmatched") return "no match: no parser placed the sentence";
  return row.result ?? "";
}

/** Row ids of residents → names, for the screen only. The export carries the id, not the name. */
export async function residentNames(supabase: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("residents").select("id, name").in("id", unique).returns<{ id: string; name: string }[]>();
  return new Map((data ?? []).map((r) => [r.id, r.name]));
}

/** The shelter-time stamp "2026-10-30 14:05", sortable and unambiguous in a spreadsheet. */
function stamp(iso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHELTER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}`;
}

export const EVAL_HEADINGS = [
  "id",
  "when",
  "status",
  "typed",
  "assistant_did",
  "intent_guessed",
  "resident_id_guessed",
  "correct_intent",
  "correct_answer",
];

/**
 * One row per exchange. The last two columns are left empty on purpose: the person reviewing writes
 * what the sentence should have done there, and that is what turns a log into an eval set.
 */
export function buildEvalCsv(rows: CouldNotHelpRow[]): string {
  return toCsv([
    EVAL_HEADINGS,
    ...rows.map((r) => [
      r.id,
      stamp(r.created_at),
      r.status,
      r.request_text,
      assistantOutcome(r),
      r.intent ?? "",
      inferredResidentId(r) ?? "",
      "",
      "",
    ]),
  ]);
}
