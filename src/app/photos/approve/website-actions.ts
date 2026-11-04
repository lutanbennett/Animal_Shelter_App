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

/**
 * Publishes a drafted website change. Asks website.approve, the activity approve_website_draft() asks (0315); the
 * check here is for a sentence, the function is the rule.
 */
export async function approveWebsiteDraft(id: string, requestId: string): Promise<ActionResult> {
  return decide("website.approveDraft", "approve_website_draft", id, requestId);
}

/** Throws a drafted website change away. Asks website.approve, as discard_website_draft() does. */
export async function discardWebsiteDraft(id: string, requestId: string): Promise<ActionResult> {
  return decide("website.discardDraft", "discard_website_draft", id, requestId);
}

async function decide(action: string, fn: string, id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction(action, write(t), { id: requestId, action, db: supabase }, async () => {
    if (!can(await loadPermissions(), "website.approve")) return { ok: false, error: t.photoApproval.errors.notAllowed };
    const { data, error } = await supabase.rpc(fn, { p_id: id });
    if (error || data === false) return { ok: false, error: t.photoApproval.errors.approveFailed };
    revalidatePath("/photos/approve");
    revalidatePath("/", "layout");
    return { ok: true };
  });
}
