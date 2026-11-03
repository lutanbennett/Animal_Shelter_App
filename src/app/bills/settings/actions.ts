"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { keyFromLabel } from "@/lib/bills/kinds";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * Bills settings: the three catalogues (premises, bill_accounts, bill_kinds, 0305). Every write here asks bills.sites, the one
 * activity the three tables' write policies ask, and the page asks it too. Nothing is ever deleted: an entry that is no longer
 * used is archived (archived_at), because bills already filed against it must keep their place.
 */

// PI FAILOVER (D), 2026-11-01: every write here goes through runWriteAction() via wrapped(), which is what lets the
// Worker replay a save the Pi did not clearly answer (docs/decisions/2026-11-01-write-paths-tail-a.md). A new write
// added to this file goes through wrapped() too, with its own action name.
async function wrapped<R extends object>(
  action: string,
  requestId: string | null,
  body: (t: Dictionary) => Promise<ActionResult<R>>,
): Promise<ActionResult<R>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<R>(
    action,
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: requestId, action, db: supabase },
    () => body(t),
  );
}

async function allowed(): Promise<boolean> {
  return can(await loadPermissions(), "bills.sites");
}

function failed(t: Dictionary, message: string, code?: string): { ok: false; error: string } {
  const e = t.bills.settings.errors;
  if (code === "23505") return { ok: false, error: e.duplicate };
  return { ok: false, error: `${e.failed}: ${message}` };
}

export async function addPremises(name: string, note: string, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.addPremises", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    if (!name.trim()) return { ok: false, error: t.bills.settings.errors.nameNeeded };
    const supabase = await createClient();
    const { error } = await supabase.from("premises").insert({ name: name.trim(), note: note.trim() || null });
    if (error) return failed(t, error.message, error.code);
    revalidatePath("/bills/settings");
    return { ok: true };
  });
}

export async function updatePremises(id: string, name: string, note: string, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.updatePremises", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    if (!name.trim()) return { ok: false, error: t.bills.settings.errors.nameNeeded };
    const supabase = await createClient();
    const { error, count } = await supabase
      .from("premises")
      .update({ name: name.trim(), note: note.trim() || null }, { count: "exact" })
      .eq("id", id);
    if (error) return failed(t, error.message, error.code);
    if (!count) return { ok: false, error: t.bills.settings.errors.gone };
    revalidatePath("/bills/settings");
    return { ok: true };
  });
}

export async function setPremisesArchived(id: string, archived: boolean, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.setPremisesArchived", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    const supabase = await createClient();
    const { error, count } = await supabase
      .from("premises")
      .update({ archived_at: archived ? new Date().toISOString() : null }, { count: "exact" })
      .eq("id", id);
    if (error) return failed(t, error.message, error.code);
    if (!count) return { ok: false, error: t.bills.settings.errors.gone };
    revalidatePath("/bills/settings");
    return { ok: true };
  });
}

export type AccountInput = { supplier: string; accountRef: string; note: string; premisesId: string; kindId: string };

export async function saveAccount(id: string | null, input: AccountInput, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.saveAccount", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    if (!input.supplier.trim()) return { ok: false, error: t.bills.settings.errors.supplierNeeded };
    const row = {
      supplier: input.supplier.trim(),
      account_ref: input.accountRef.trim() || null,
      note: input.note.trim() || null,
      premises_id: input.premisesId || null,
      kind_id: input.kindId || null,
    };
    const supabase = await createClient();
    if (id) {
      const { error, count } = await supabase.from("bill_accounts").update(row, { count: "exact" }).eq("id", id);
      if (error) return failed(t, error.message, error.code);
      if (!count) return { ok: false, error: t.bills.settings.errors.gone };
    } else {
      const { error } = await supabase.from("bill_accounts").insert(row);
      if (error) return failed(t, error.message, error.code);
    }
    revalidatePath("/bills/settings");
    return { ok: true };
  });
}

export async function setAccountArchived(id: string, archived: boolean, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.setAccountArchived", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    const supabase = await createClient();
    const { error, count } = await supabase
      .from("bill_accounts")
      .update({ archived_at: archived ? new Date().toISOString() : null }, { count: "exact" })
      .eq("id", id);
    if (error) return failed(t, error.message, error.code);
    if (!count) return { ok: false, error: t.bills.settings.errors.gone };
    revalidatePath("/bills/settings");
    return { ok: true };
  });
}

/** A new kind: top level, or a child of a top-level kind (a utility type under Utilities). The key is made from the label. */
export async function addKind(label: string, parentId: string, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.addKind", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    if (!label.trim()) return { ok: false, error: t.bills.settings.errors.nameNeeded };
    const supabase = await createClient();
    if (parentId) {
      const { data: parent } = await supabase.from("bill_kinds").select("parent_id").eq("id", parentId).maybeSingle<{ parent_id: string | null }>();
      if (!parent || parent.parent_id) return { ok: false, error: t.bills.settings.errors.parentInvalid };
    }
    const base = keyFromLabel(label);
    const { data: taken } = await supabase.from("bill_kinds").select("key").like("key", `${base}%`).returns<{ key: string }[]>();
    const used = new Set((taken ?? []).map((k) => k.key));
    let key = base;
    for (let n = 2; used.has(key); n++) key = `${base}_${n}`;
    const { data: last } = await supabase
      .from("bill_kinds")
      .select("sort")
      .lt("sort", 900)
      .order("sort", { ascending: false })
      .limit(1)
      .returns<{ sort: number }[]>();
    // New kinds sort after the existing ones and before Other (900).
    const sort = Math.min(890, (last?.[0]?.sort ?? 0) + 10);
    const { error } = await supabase.from("bill_kinds").insert({ key, label: label.trim(), parent_id: parentId || null, sort });
    if (error) return failed(t, error.message, error.code);
    revalidatePath("/bills/settings");
    revalidatePath("/bills");
    return { ok: true };
  });
}

/** Renaming changes the words only: the key, and so the form the kind asks for, stays. */
export async function renameKind(id: string, label: string, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.renameKind", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    if (!label.trim()) return { ok: false, error: t.bills.settings.errors.nameNeeded };
    const supabase = await createClient();
    const { error, count } = await supabase.from("bill_kinds").update({ label: label.trim() }, { count: "exact" }).eq("id", id);
    if (error) return failed(t, error.message, error.code);
    if (!count) return { ok: false, error: t.bills.settings.errors.gone };
    revalidatePath("/bills/settings");
    revalidatePath("/bills");
    return { ok: true };
  });
}

export async function setKindArchived(id: string, archived: boolean, requestId: string | null): Promise<ActionResult> {
  return wrapped<object>("bills.setKindArchived", requestId, async (t) => {
    if (!(await allowed())) return { ok: false, error: t.bills.errors.notAuthorized };
    const supabase = await createClient();
    const { error, count } = await supabase
      .from("bill_kinds")
      .update({ archived_at: archived ? new Date().toISOString() : null }, { count: "exact" })
      .eq("id", id);
    if (error) return failed(t, error.message, error.code);
    if (!count) return { ok: false, error: t.bills.settings.errors.gone };
    revalidatePath("/bills/settings");
    revalidatePath("/bills");
    return { ok: true };
  });
}
