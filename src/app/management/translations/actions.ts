"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { ROW_COLUMNS, type TranslationRow } from "@/lib/translations/types";
import { linkTargets, sameLinks } from "@/lib/site/links";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

const refuse = (error: string) => ({ ok: false as const, error });

/**
 * The pages whose output the row feeds: the record's own page (or the
 * page the caller was on, for a photo caption that lives on its folder's
 * page), the queue, and the public pages that read the approved text.
 */
function revalidateFor(row: TranslationRow, recordPathHint?: string | null) {
  revalidatePath("/management/translations");
  const own =
    row.table_name === "residents"
      ? `/residents/${row.row_id}`
      : row.table_name === "project_folders"
        ? `/projects/${row.row_id}`
        : row.table_name === "maintenance"
          ? `/maintenance/${row.row_id}`
          : null;
  if (own) revalidatePath(own);
  if (row.table_name === "maintenance") revalidatePath("/maintenance");
  if (row.table_name === "site_pages") {
    // A page's text shows on its own route and, for the story and the
    // how-to-adopt section, on / and /adopt; the admin editor shows its status.
    for (const path of ["/admin/website", "/foster", "/volunteer", "/donate", "/adopt/international", "/friends/join"]) {
      revalidatePath(path);
    }
  }
  // A Friend's prose shows on /friends; record_path is its contact's page.
  if (row.table_name === "shelter_friends") revalidatePath("/friends");
  // A room's description shows in its card on the map, and beside its box in Settings → Facility map.
  if (row.table_name === "map_rooms") {
    revalidatePath("/enclosures");
    revalidatePath("/admin/facility-map");
  }
  if (recordPathHint && recordPathHint !== own) revalidatePath(recordPathHint);
  revalidatePath("/");
  revalidatePath("/adopt");
  revalidatePath(`/adopt/${row.row_id}`);
  revalidatePath("/our-work");
  revalidatePath(`/our-work/${row.row_id}`);
}

/**
 * A manager writes (or corrects) the translation and approves it in one
 * step: the text is theirs, so there is nothing further to review. The
 * source snapshot is taken now, which is what clears a stale row.
 */
export async function approveTranslation(
  id: string,
  text: string,
  requestId: string,
  recordPathHint?: string | null,
): Promise<ActionResult<{ row: TranslationRow }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("translations.approveTranslation", write(t), { id: requestId, action: "translations.approveTranslation", db: supabase }, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const trimmed = text.trim();
    if (!trimmed) return refuse(t.translations.errors.textRequired);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: current } = await supabase
      .from("translations")
      .select("source_text")
      .eq("id", id)
      .limit(1)
      .returns<{ source_text: string }[]>();
    if (!current?.[0]) return refuse(t.translations.errors.notFound);
    // A link is an address, and an address must not be translated.
    if (!sameLinks(current[0].source_text, trimmed)) {
      // Say which addresses differ: an invented link and an English edit look the same without this.
      const want = linkTargets(current[0].source_text);
      const got = linkTargets(trimmed);
      const added = [...new Set(got.filter((h) => !want.includes(h)))].join(", ");
      const removed = [...new Set(want.filter((h) => !got.includes(h)))].join(", ");
      return refuse(t.translations.errors.linksDiffer(added, removed));
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("translations")
      .update({
        text: trimmed,
        status: "approved",
        reviewed_source_text: current[0].source_text,
        engine: "human",
        reviewed_by: user?.id ?? null,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select(ROW_COLUMNS)
      .returns<TranslationRow[]>();

    if (error) return refuse(error.message);
    const row = data?.[0];
    if (!row) return refuse(t.translations.errors.notFound);
    revalidateFor(row, recordPathHint);
    return { ok: true, row };
  });
}

/**
 * Take a translation back to pending — for text that is wrong enough to
 * be better absent than live. The source snapshot goes with it.
 */
export async function clearTranslation(
  id: string,
  requestId: string,
  recordPathHint?: string | null,
): Promise<ActionResult<{ row: TranslationRow }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("translations.clearTranslation", write(t), { id: requestId, action: "translations.clearTranslation", db: supabase }, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const { data, error } = await supabase
      .from("translations")
      .update({
        text: null,
        status: "pending",
        reviewed_source_text: null,
        engine: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(ROW_COLUMNS)
      .returns<TranslationRow[]>();

    if (error) return refuse(error.message);
    const row = data?.[0];
    if (!row) return refuse(t.translations.errors.notFound);
    revalidateFor(row, recordPathHint);
    return { ok: true, row };
  });
}

/**
 * Write one label's Thai (0166's set_label_th()). Asks translations.manage,
 * not the list's own edit permission: translating "Standard Kibble +
 * Chicken" is not editing the diet list, and the Director translates
 * setup lists she cannot open. Empty text clears the Thai, which the page
 * then shows as missing (or "shown as typed" on an optional list).
 *
 * A label is read on many screens (a diet name on the Diet tab, the
 * special-diet list, stocktake, purchasing), so the whole app is
 * revalidated rather than guessing which pages show it.
 *
 * `reconfirm`: the English changed and the Thai is still right. The
 * snapshot trigger only re-records the English when the Thai changes, so
 * saving the same Thai would leave it out of date; clearing it first and
 * writing it back is what takes a fresh snapshot. Two audit rows, both
 * under the translator's name, for one deliberate act.
 */
export async function saveLabelTranslation(
  table: string,
  rowId: string,
  column: string,
  text: string,
  requestId: string,
  reconfirm = false,
): Promise<ActionResult<{ textTh: string | null }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("translations.saveLabelTranslation", write(t), { id: requestId, action: "translations.saveLabelTranslation", db: supabase }, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const trimmed = text.trim();
    if (reconfirm && trimmed) {
      const { error: clearError } = await supabase.rpc("set_label_th", {
        p_table: table,
        p_row_id: rowId,
        p_column: column,
        p_text: "",
      });
      if (clearError) return refuse(clearError.message);
    }
    const { data, error } = await supabase.rpc("set_label_th", {
      p_table: table,
      p_row_id: rowId,
      p_column: column,
      p_text: trimmed,
    });
    if (error) return refuse(error.message);
    if (data !== true) return refuse(t.translations.errors.labelNotFound);
    revalidatePath("/", "layout");
    return { ok: true, textTh: trimmed || null };
  });
}

/**
 * Propose a Thai label and leave it waiting (0293's propose_label_th()).
 *
 * The row is untouched: the proposal lives in `label_drafts` beside it, so
 * nothing that reads a `_th` column — and that is dozens of views and the
 * public website — can see it until somebody approves it. That property is the
 * whole design: docs/decisions/2026-10-31-label-drafts-and-unlisted-labels.md.
 *
 * Asks translations.propose, which is what the function asks (0296). Approving
 * and discarding still ask translations.manage, so a login can propose without
 * being able to publish.
 *
 * Nothing a reader sees changes, so only the queue is revalidated.
 */
export async function proposeLabelTranslation(
  table: string,
  rowId: string,
  column: string,
  text: string,
  requestId: string,
): Promise<ActionResult<{ textTh: string | null }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("translations.proposeLabelTranslation", write(t), { id: requestId, action: "translations.proposeLabelTranslation", db: supabase }, async () => {
    if (!can(await loadPermissions(), "translations.propose")) return refuse(t.management.errors.managementAccessRequired);
    const trimmed = text.trim();
    if (!trimmed) return refuse(t.translations.errors.proposalRequired);
    const { data, error } = await supabase.rpc("propose_label_th", {
      p_table: table,
      p_row_id: rowId,
      p_column: column,
      p_text: trimmed,
    });
    if (error) return refuse(error.message);
    // false means the row itself is gone (0294 checks, rather than writing a dead draft).
    if (data !== true) return refuse(t.translations.errors.labelNotFound);
    revalidatePath("/management/translations");
    return { ok: true, textTh: trimmed };
  });
}

/**
 * Publish the Thai that is waiting (0293's approve_label_th()).
 *
 * It takes no text: the Thai comes from the draft, never from an argument, so
 * an approval cannot quietly publish something other than the proposal that
 * was read. The whole app is revalidated because a label is shown on many
 * screens, the same reason saveLabelTranslation gives.
 */
export async function approveLabelTranslation(
  table: string,
  rowId: string,
  column: string,
  requestId: string,
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("translations.approveLabelTranslation", write(t), { id: requestId, action: "translations.approveLabelTranslation", db: supabase }, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const { data, error } = await supabase.rpc("approve_label_th", {
      p_table: table,
      p_row_id: rowId,
      p_column: column,
    });
    if (error) return refuse(error.message);
    if (data !== true) return refuse(t.translations.errors.labelNotFound);
    revalidatePath("/", "layout");
    return { ok: true };
  });
}

/**
 * Throw a proposal away (0293's discard_label_draft()). The row is untouched,
 * so nothing a reader sees changes and only the queue is revalidated. false
 * means there was nothing waiting — somebody else got there first.
 */
export async function discardLabelDraft(
  table: string,
  rowId: string,
  column: string,
  requestId: string,
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("translations.discardLabelDraft", write(t), { id: requestId, action: "translations.discardLabelDraft", db: supabase }, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const { data, error } = await supabase.rpc("discard_label_draft", {
      p_table: table,
      p_row_id: rowId,
      p_column: column,
    });
    if (error) return refuse(error.message);
    if (data !== true) return refuse(t.translations.errors.nothingWaiting);
    revalidatePath("/management/translations");
    return { ok: true };
  });
}
