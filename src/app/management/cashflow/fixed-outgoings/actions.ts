"use server";

import { refresh, revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import {
  MAX_FIXED_OUTGOINGS,
  parseFixedOutgoing,
  type FixedOutgoingFields,
} from "@/lib/management/fixed-outgoings";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * Writes to fixed_outgoings (0114). Admin and management only, which is also
 * all its RLS allows; the role check here is so a refused caller is told why
 * instead of getting an empty result. Every action returns a result, never a
 * throw (src/lib/action-result.ts).
 */

const PG_UNIQUE_VIOLATION = "23505";
const PG_CHECK_VIOLATION = "23514";

function revalidateFixedOutgoings() {
  revalidatePath("/management/cashflow");
  revalidatePath("/management/cashflow/fixed-outgoings");
  refresh();
}

export async function createFixedOutgoing(
  fields: FixedOutgoingFields,
  requestId: string,
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  const m = t.management.fixedOutgoings;
  const supabase = await createClient();
  return runWriteAction<{ success: string }>("fixedOutgoings.create", write(t), { id: requestId, action: "fixedOutgoings.create", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reports.cashflow")) {
      return { ok: false, error: t.management.errors.managementAccessRequired };
    }
    const parsed = parseFixedOutgoing(fields);
    if (!parsed.ok) return { ok: false, error: m.errors[parsed.error] };

    // Check the cap ourselves so the person is told about the limit rather
    // than shown the trigger's message; the trigger still backs it up.
    const { count, error: countError } = await supabase
      .from("fixed_outgoings")
      .select("id", { count: "exact", head: true });
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= MAX_FIXED_OUTGOINGS) {
      return { ok: false, error: m.errors.capReached(MAX_FIXED_OUTGOINGS) };
    }

    const { error } = await supabase.from("fixed_outgoings").insert(parsed.row);
    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return { ok: false, error: m.errors.duplicateLabel(parsed.row.label) };
      }
      if (error.code === PG_CHECK_VIOLATION) return { ok: false, error: m.errors.capReached(MAX_FIXED_OUTGOINGS) };
      throw new Error(error.message);
    }
    revalidateFixedOutgoings();
    return { ok: true, success: m.created(parsed.row.label) };
  });
}

export async function updateFixedOutgoing(
  id: string,
  fields: FixedOutgoingFields,
  requestId: string,
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  const m = t.management.fixedOutgoings;
  const supabase = await createClient();
  return runWriteAction<{ success: string }>("fixedOutgoings.update", write(t), { id: requestId, action: "fixedOutgoings.update", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reports.cashflow")) {
      return { ok: false, error: t.management.errors.managementAccessRequired };
    }
    const parsed = parseFixedOutgoing(fields);
    if (!parsed.ok) return { ok: false, error: m.errors[parsed.error] };

    const { error } = await supabase.from("fixed_outgoings").update(parsed.row).eq("id", id);
    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return { ok: false, error: m.errors.duplicateLabel(parsed.row.label) };
      }
      throw new Error(error.message);
    }
    revalidateFixedOutgoings();
    return { ok: true, success: m.saved(parsed.row.label) };
  });
}

export async function deleteFixedOutgoing(id: string, requestId: string): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  const m = t.management.fixedOutgoings;
  const supabase = await createClient();
  return runWriteAction<{ success: string }>("fixedOutgoings.delete", write(t), { id: requestId, action: "fixedOutgoings.delete", db: supabase }, async () => {
    if (!can(await loadPermissions(), "reports.cashflow")) {
      return { ok: false, error: t.management.errors.managementAccessRequired };
    }
    const { error } = await supabase.from("fixed_outgoings").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidateFixedOutgoings();
    return { ok: true, success: m.deleted };
  });
}
