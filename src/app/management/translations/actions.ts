"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { ROW_COLUMNS, type TranslationRow } from "@/lib/translations/types";
import { sameLinks } from "@/lib/site/links";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

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
  recordPathHint?: string | null,
): Promise<ActionResult<{ row: TranslationRow }>> {
  const { t } = await getT();
  return runAction("translations.approveTranslation", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const trimmed = text.trim();
    if (!trimmed) return refuse(t.translations.errors.textRequired);

    const supabase = await createClient();
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
    if (!sameLinks(current[0].source_text, trimmed)) return refuse(t.translations.errors.linksDiffer);

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
  recordPathHint?: string | null,
): Promise<ActionResult<{ row: TranslationRow }>> {
  const { t } = await getT();
  return runAction("translations.clearTranslation", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
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
  reconfirm = false,
): Promise<ActionResult<{ textTh: string | null }>> {
  const { t } = await getT();
  return runAction("translations.saveLabelTranslation", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "translations.manage")) return refuse(t.management.errors.managementAccessRequired);
    const trimmed = text.trim();
    const supabase = await createClient();
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
