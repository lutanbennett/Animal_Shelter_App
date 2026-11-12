"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadPermissions } from "@/lib/permissions/load";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { can } from "@/lib/permissions/can";
import { loadImportCatalogue } from "@/lib/bills/import-load";
import { parseBillImport, type FileFault, type GoodRow, type ImportParsed, type Reject, type RejectCode } from "@/lib/bills/import";

/** What the page shows for one rejected row: the file's line, its own cells and the reason in words. */
export type RejectView = { line: number; reason: string; cells: string[] };
export type GoodView = { line: number; route: string; kind: string; place: string; account: string; amount: number; date: string; month: string; photo: string };
export type ImportPreview = { header: string[]; good: GoodView[]; rejects: RejectView[]; total: number };
export type ImportDone = { added: number; header: string[]; rejects: RejectView[] };

function reasonOf(t: Dictionary, r: Reject): string {
  const reasons = t.bills.import.reason as Record<RejectCode, (d: string) => string>;
  return reasons[r.code](r.detail);
}

function faultOf(t: Dictionary, f: FileFault): string {
  const m = t.bills.import.fault;
  switch (f.code) {
    case "badHeader":
      return m.badHeader(f.detail);
    case "tooManyRows":
      return m.tooManyRows(f.detail);
    default:
      return m[f.code];
  }
}

const viewOf = (t: Dictionary) => (r: Reject): RejectView => ({ line: r.line, reason: reasonOf(t, r), cells: r.cells });

/** Reads the posted file and the shelter's names, and checks every row. Nothing is written. */
type Checked = { error: string } | { error?: undefined; parsed: Extract<ImportParsed, { ok: true }>; supabase: Awaited<ReturnType<typeof createClient>> };
async function checked(formData: FormData, t: Dictionary): Promise<Checked> {
  const perms = await loadPermissions();
  // The two activities canImportBills() asks, named here as the table policies ask them; each ROW is then asked for its own destination.
  if (!can(perms, "bills.utilities") && !can(perms, "bills.general")) return { error: t.bills.import.fault.notAllowed };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: t.bills.import.fault.noFile };
  const supabase = await createClient();
  const cat = await loadImportCatalogue(supabase, perms);
  if ("error" in cat) return { error: t.bills.import.fault.loadFailed(cat.error) };
  const parsed = parseBillImport(new Uint8Array(await file.arrayBuffer()), cat);
  if (!parsed.ok) return { error: faultOf(t, parsed.fault) };
  return { parsed, supabase };
}

/** Step 1 of 2: what would happen. The file is read again by importBills, so nothing is held between the two presses. */
export async function previewBillImport(formData: FormData): Promise<ActionResult<{ preview: ImportPreview }>> {
  const { t } = await getT();
  const r = await checked(formData, t);
  if (r.error !== undefined) return { ok: false, error: r.error };
  const { parsed } = r;
  return {
    ok: true,
    preview: {
      header: parsed.header,
      total: parsed.total,
      rejects: parsed.rejects.map(viewOf(t)),
      good: parsed.good.map((g) => ({
        line: g.line,
        route: g.route,
        kind: g.kindLabel,
        place: g.placeName,
        account: g.accountName,
        amount: g.amount,
        date: g.date,
        month: g.coversMonth ? g.coversMonth.slice(0, 7) : "",
        photo: g.photoName,
      })),
    },
  };
}

// PI FAILOVER (D): this write goes through runWriteAction(), like every write in app/bills (write-requests.ts lists the page).
async function wrapped<R extends object>(requestId: string | null, body: (t: Dictionary) => Promise<ActionResult<R>>): Promise<ActionResult<R>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<R>(
    "bills.importBills",
    { somethingWentWrong: t.common.somethingWentWrong, saveUnknown: t.common.saveUnknown, reloadToSave: t.common.reloadToSave },
    { id: requestId, action: "bills.importBills", db: supabase },
    () => body(t),
  );
}

/**
 * Step 2 of 2: writes the good rows, one bill at a time, as the person importing and under their own session, so a row the
 * database refuses is reported with the others rather than hiding behind a service role. A row's photo changes owner from the
 * Bills inbox to the new bill; the inbox card it came from is deleted only when no other photo is left on it. A bill whose
 * photo then fails to move is removed again, so a row is wholly added or wholly not.
 */
export async function importBills(formData: FormData, requestId: string | null): Promise<ActionResult<{ done: ImportDone }>> {
  return wrapped<{ done: ImportDone }>(requestId, async (t) => {
    const r = await checked(formData, t);
    if (r.error !== undefined) return { ok: false, error: r.error };
    const { parsed, supabase } = r;

    const failed: Reject[] = [...parsed.rejects];
    let added = 0;
    for (const row of parsed.good) {
      const why = await writeRow(supabase, row, t.bills.import.photoGone);
      if (why) failed.push({ line: row.line, code: "writeFailed", detail: why, cells: cellsOf(parsed.header, row) });
      else added++;
    }
    failed.sort((a, b) => a.line - b.line);
    revalidatePath("/bills");
    revalidatePath("/bills/utilities");
    revalidatePath("/bills/general");
    revalidatePath("/home");
    return { ok: true, done: { added, header: parsed.header, rejects: failed.map(viewOf(t)) } };
  });
}

/** A written-off row's cells in the file's own column order, for the rejects file. */
function cellsOf(header: string[], row: GoodRow): string[] {
  const by: Record<string, string> = {
    destination: row.route,
    kind: row.kindLabel,
    place: row.placeName,
    account: row.accountName,
    amount: String(row.amount),
    date: row.date,
    covers_month: row.coversMonth ? row.coversMonth.slice(0, 7) : "",
    photo_filename: row.photoName,
  };
  return header.map((h) => by[h] ?? "");
}

type Db = Awaited<ReturnType<typeof createClient>>;

/** Writes one row; returns the reason it failed, or null. */
async function writeRow(supabase: Db, row: GoodRow, photoGone: string): Promise<string | null> {
  const table = row.route === "utility" ? "utility_bills" : "general_bills";
  const common = { kind_id: row.kindId, premises_id: row.placeId, account_id: row.accountId, amount: row.amount, bill_date: row.date };
  const values: Record<string, string | number | null> = row.route === "utility" ? { ...common, covers_month: row.coversMonth } : common;
  const { data: bill, error } = await supabase.from(table).insert(values).select("id").single<{ id: string }>();
  if (error || !bill) return error?.message ?? "no row came back";
  if (!row.photoId) return null;

  const ownerType = row.route === "utility" ? "utility_bill" : "general_bill";
  const { data: photo } = await supabase
    .from("attachments")
    .select("owner_id")
    .eq("id", row.photoId)
    .eq("owner_type", "bill_inbox")
    .maybeSingle<{ owner_id: string }>();
  const { error: moveError, count } = await supabase
    .from("attachments")
    .update({ owner_type: ownerType, owner_id: bill.id }, { count: "exact" })
    .eq("id", row.photoId)
    .eq("owner_type", "bill_inbox"); // never any other attachment, whatever the id
  if (moveError || !photo || !count) {
    await supabase.from(table).delete().eq("id", bill.id);
    return moveError?.message ?? photoGone;
  }
  // The card the photo came from is empty now unless it held more pages.
  const { count: left } = await supabase
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("owner_type", "bill_inbox")
    .eq("owner_id", photo.owner_id);
  if (left === 0) await supabase.from("bills_inbox").delete().eq("id", photo.owner_id);
  return null;
}
