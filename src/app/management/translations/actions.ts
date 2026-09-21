"use server";

import { revalidatePath } from "next/cache";
import { assertManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { ROW_COLUMNS, type TranslationRow } from "@/lib/translations/types";

export type TranslationActionResult = { error?: string; row?: TranslationRow };

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
    for (const path of ["/admin/website", "/foster", "/volunteer", "/donate"]) {
      revalidatePath(path);
    }
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
): Promise<TranslationActionResult> {
  await assertManagementRole();
  const { t } = await getT();

  const trimmed = text.trim();
  if (!trimmed) return { error: t.translations.errors.textRequired };

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
  if (!current?.[0]) return { error: t.translations.errors.notFound };

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

  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) return { error: t.translations.errors.notFound };
  revalidateFor(row, recordPathHint);
  return { row };
}

/**
 * Take a translation back to pending — for text that is wrong enough to
 * be better absent than live. The source snapshot goes with it.
 */
export async function clearTranslation(
  id: string,
  recordPathHint?: string | null,
): Promise<TranslationActionResult> {
  await assertManagementRole();
  const { t } = await getT();

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

  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) return { error: t.translations.errors.notFound };
  revalidateFor(row, recordPathHint);
  return { row };
}
