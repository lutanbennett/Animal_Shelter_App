"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";

const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

const KINDS = ["resident", "adoption_update", "appeal", "event", "project", "drive"];

/**
 * Says that one piece of public text may be shown ("public_ok") or never shown ("private_only"). Asks text.approve, the
 * activity set_text_approval() and the guard on text_approval itself ask (0345); the check here is for a sentence, the
 * function is the rule.
 */
export async function setTextApproval(kind: string, id: string, state: "public_ok" | "private_only", requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  const action = "text.setApproval";
  return runWriteAction(action, write(t), { id: requestId, action, db: supabase }, async () => {
    if (!can(await loadPermissions(), "text.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };
    if (!KINDS.includes(kind)) return { ok: false, error: t.photoApproval.errors.approveFailed };
    const { error } = await supabase.rpc("set_text_approval", { p_kind: kind, p_id: id, p_state: state });
    if (error) return { ok: false, error: t.photoApproval.errors.approveFailed };
    revalidatePath("/text/approve");
    revalidatePath("/", "layout");
    return { ok: true };
  });
}
