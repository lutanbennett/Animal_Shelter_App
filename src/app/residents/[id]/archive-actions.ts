"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  MEDICAL_ARCHIVE_SECTIONS,
  MEDICAL_ARCHIVE_TABLES,
  isMedicalArchiveKind,
  type MedicalArchiveKind,
} from "@/lib/medical-archive/kinds";

const refuse = (error: string) => ({ ok: false as const, error });

function revalidate(kind: MedicalArchiveKind, residentId: string) {
  revalidatePath(`/residents/${residentId}`);
  for (const section of MEDICAL_ARCHIVE_SECTIONS[kind]) {
    revalidatePath(`/residents/${residentId}/${section}`);
  }
  // The lists that read these rows outside the resident's own pages.
  if (kind === "visit") revalidatePath("/appointments");
  if (kind === "prescription") revalidatePath("/management/stock-usage");
}

/**
 * Archives one weight reading, prescription, clinic visit or immunization
 * record: kept, but out of every list, chart, forecast and count (0124's
 * readers skip it). The audit trigger (0121) writes the one audit row for
 * the update; nothing here does.
 *
 * `medical.archive` decides who may, here and in the page; the database is
 * the backstop. An update RLS filters out comes
 * back with no rows, which is reported as not allowed rather than as a
 * mystery.
 */
export async function archiveMedicalRecord(
  kind: MedicalArchiveKind,
  residentId: string,
  id: string,
  reason: string | null,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medicalArchive.archive", t.common.somethingWentWrong, async () => {
    const a = t.recordArchive;
    if (!isMedicalArchiveKind(kind)) return refuse(a.errors.notAllowed);
    if (!can(await loadPermissions(), "medical.archive")) return refuse(a.errors.notAllowed);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Only a live row, so a second click or tab cannot overwrite who
    // archived it and when.
    const { data, error } = await supabase
      .from(MEDICAL_ARCHIVE_TABLES[kind])
      .update({
        archived_at: new Date().toISOString(),
        archived_by: user?.id ?? null,
        archive_reason: reason?.trim() || null,
      })
      .eq("id", id)
      .eq("resident_id", residentId)
      .is("archived_at", null)
      .select("id");

    if (error) return refuse(error.message);
    if (!data?.length) return refuse(a.errors.cannotArchive);
    revalidate(kind, residentId);
    return { ok: true };
  });
}

/**
 * Restores an archived record. All three archive columns clear in one
 * update (the consistency check allows who and why only while archived_at
 * is set). If a live record has since taken the same day (weight,
 * immunization) the partial unique index refuses, and that is the right
 * answer, said in words.
 */
export async function restoreMedicalRecord(
  kind: MedicalArchiveKind,
  residentId: string,
  id: string,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medicalArchive.restore", t.common.somethingWentWrong, async () => {
    const a = t.recordArchive;
    if (!isMedicalArchiveKind(kind)) return refuse(a.errors.notAllowed);
    if (!can(await loadPermissions(), "medical.archive")) return refuse(a.errors.notAllowed);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(MEDICAL_ARCHIVE_TABLES[kind])
      .update({ archived_at: null, archived_by: null, archive_reason: null })
      .eq("id", id)
      .eq("resident_id", residentId)
      .not("archived_at", "is", null)
      .select("id");

    if (error) {
      if (error.code === "23505") return refuse(a.errors.slotTaken[kind]);
      return refuse(error.message);
    }
    if (!data?.length) return refuse(a.errors.cannotRestore);
    revalidate(kind, residentId);
    return { ok: true };
  });
}
