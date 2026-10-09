import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysIso } from "@/lib/format";

/**
 * Reading audit_log for Settings → Recent changes (backlog DB-6, part 2).
 *
 * The table holds whole-row images of eleven tables and is the most sensitive
 * one in the database, so this file is deliberately modest:
 *
 *  - It reads with the signed-in admin's own client. RLS (0121) lets only an
 *    admin through; nothing here widens that or reaches for the service role.
 *  - The list needs only *which fields changed*, so the images are reduced to
 *    field names server-side. Values leave this module only for the one row
 *    an admin opens (`loadDetail`).
 *  - It is paged by keyset on `id` (the identity primary key), a page at a
 *    time. There is no count: counting the table is what grows with it.
 */

export const AUDITED_TABLES = [
  "residents",
  "contacts",
  "prescriptions",
  "clinic_visits",
  "weight",
  "attachments",
  "immunization_records",
  // The settings tables with a record_audit() trigger: 0132, 0156, 0165.
  // Every table with that trigger belongs here, or its rows show unlabelled.
  "impact_baselines",
  "facility_maps",
  "roles",
  "role_permissions",
] as const;
export type AuditedTable = (typeof AUDITED_TABLES)[number];

export const PAGE_SIZE = 50;

/** Actor filter value for changes with no login behind them. */
export const SYSTEM_ACTOR = "system";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type AuditFilters = {
  table: AuditedTable | null;
  /** A user id, SYSTEM_ACTOR, or null for anyone. */
  actor: string | null;
  from: string | null;
  to: string | null;
  /** Every change to one record. */
  row: string | null;
  /** Keyset cursor: show rows older than this id. */
  before: number | null;
  /** The one row whose values are shown. */
  open: number | null;
};

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function positiveInt(v: string | undefined): number | null {
  return v && /^\d{1,15}$/.test(v) && Number(v) > 0 ? Number(v) : null;
}

/** Untrusted query string in, a filter set out; anything malformed is dropped. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): AuditFilters {
  const table = one(sp.table);
  const actor = one(sp.actor);
  const from = one(sp.from);
  const to = one(sp.to);
  const row = one(sp.row);
  return {
    table: (AUDITED_TABLES as readonly string[]).includes(table ?? "") ? (table as AuditedTable) : null,
    actor: actor === SYSTEM_ACTOR || (actor && UUID.test(actor)) ? actor! : null,
    from: from && ISO_DATE.test(from) ? from : null,
    to: to && ISO_DATE.test(to) ? to : null,
    row: row && UUID.test(row) ? row : null,
    before: positiveInt(one(sp.before)),
    open: positiveInt(one(sp.open)),
  };
}

export type Image = Record<string, unknown> | null;

export type AuditEntry = {
  id: number;
  table: AuditedTable;
  rowId: string;
  op: "INSERT" | "UPDATE" | "DELETE";
  actor: string | null;
  at: string;
  /** Archive / restore are updates that only flipped archived_at (0124). */
  kind: "added" | "edited" | "deleted" | "archived" | "restored";
  /** Names of the columns an edit changed; never values. */
  changed: string[];
  /** The record's own name, for the tables that have one. */
  name: string | null;
  /** The resident the record belongs to, when it is not itself a resident. */
  residentId: string | null;
};

/** Columns that change on every touch and mean nothing to a reader. */
export const NOISE = new Set(["updated_at", "updated_by"]);

export function changedColumns(oldRow: Image, newRow: Image): string[] {
  if (!oldRow || !newRow) return [];
  const keys = new Set([...Object.keys(oldRow), ...Object.keys(newRow)]);
  return [...keys]
    .filter((k) => !NOISE.has(k) && JSON.stringify(oldRow[k]) !== JSON.stringify(newRow[k]))
    .sort();
}

export function kindOf(op: string, oldRow: Image, newRow: Image, changed: string[]): AuditEntry["kind"] {
  if (op === "INSERT") return "added";
  if (op === "DELETE") return "deleted";
  if (changed.includes("archived_at")) {
    const was = oldRow?.archived_at ?? null;
    const now = newRow?.archived_at ?? null;
    if (was === null && now !== null) return "archived";
    if (was !== null && now === null) return "restored";
  }
  return "edited";
}

type RawRow = {
  id: number;
  table_name: string;
  row_id: string;
  op: string;
  actor: string | null;
  at: string;
  old_row: Image;
  new_row: Image;
};

function toEntry(r: RawRow): AuditEntry {
  const image = r.new_row ?? r.old_row ?? {};
  const changed = changedColumns(r.old_row, r.new_row);
  const table = r.table_name as AuditedTable;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  let residentId: string | null = null;
  if (table === "attachments") {
    residentId = image.owner_type === "resident" ? str(image.owner_id) : null;
  } else if (table !== "residents" && table !== "contacts") {
    residentId = str(image.resident_id);
  }
  return {
    id: r.id,
    table,
    rowId: r.row_id,
    op: r.op as AuditEntry["op"],
    actor: r.actor,
    at: r.at,
    kind: kindOf(r.op, r.old_row, r.new_row, changed),
    changed,
    name:
      table === "residents" || table === "contacts" || table === "roles"
        ? str(image.name)
        : table === "attachments"
          ? str(image.file_name)
          : table === "impact_baselines"
            ? str(image.label)
            : table === "role_permissions"
              ? str(image.activity)
              : null,
    residentId,
  };
}

export type AuditPage = {
  entries: AuditEntry[];
  /** Cursor for the next (older) page, or null on the last one. */
  nextBefore: number | null;
  /** resident id → current name, for residents the entries name or belong to. */
  residentNames: Map<string, string>;
  error: string | null;
};

/** The start of a shelter day as an instant: Thailand is UTC+7 all year. */
function dayStart(date: string) {
  return `${date}T00:00:00+07:00`;
}

export async function loadPage(supabase: SupabaseClient, f: AuditFilters): Promise<AuditPage> {
  let q = supabase
    .from("audit_log")
    .select("id, table_name, row_id, op, actor, at, old_row, new_row")
    .order("id", { ascending: false })
    // One more than a page: its presence is how we know there is another.
    .limit(PAGE_SIZE + 1);

  if (f.table) q = q.eq("table_name", f.table);
  if (f.row) q = q.eq("row_id", f.row);
  if (f.actor === SYSTEM_ACTOR) q = q.is("actor", null);
  else if (f.actor) q = q.eq("actor", f.actor);
  if (f.from) q = q.gte("at", dayStart(f.from));
  if (f.to) q = q.lt("at", dayStart(addDaysIso(f.to, 1)));
  if (f.before) q = q.lt("id", f.before);

  const { data, error } = await q;
  if (error) {
    return { entries: [], nextBefore: null, residentNames: new Map(), error: error.message };
  }

  const raw = (data ?? []) as RawRow[];
  const hasMore = raw.length > PAGE_SIZE;
  const entries = raw.slice(0, PAGE_SIZE).map(toEntry);

  const residentIds = new Set<string>();
  for (const e of entries) {
    if (e.table === "residents") residentIds.add(e.rowId);
    if (e.residentId) residentIds.add(e.residentId);
  }
  const residentNames = new Map<string, string>();
  if (residentIds.size > 0) {
    const { data: rs } = await supabase
      .from("residents")
      .select("id, name")
      .in("id", [...residentIds]);
    for (const r of rs ?? []) residentNames.set(r.id as string, r.name as string);
  }

  return {
    entries,
    nextBefore: hasMore ? entries[entries.length - 1].id : null,
    residentNames,
    error: null,
  };
}

export type AuditDetail = { id: number; before: Image; after: Image };

/** The values behind one row: the only place they are read for display. */
export async function loadDetail(supabase: SupabaseClient, id: number): Promise<AuditDetail | null> {
  const { data } = await supabase
    .from("audit_log")
    .select("id, old_row, new_row")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id as number, before: data.old_row as Image, after: data.new_row as Image };
}

/** A value as a short string for the detail panel. */
export function showValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 300 ? `${s.slice(0, 300)}…` : s;
}

export function fieldLabel(column: string): string {
  const spaced = column.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
