"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { DOSE_UNITS, type DoseUnit } from "@/lib/i18n/enum-labels";
import { parseBahtAmount } from "@/lib/format";
import { parseLeadDays, parseSafetyStock, parseStockCount } from "@/lib/management/stock";
import { resolveSafetyStock } from "@/lib/management/purchasing";
import { loadConversions } from "@/lib/units-server";
import { MAX_UPLOAD_BYTES, WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import {
  confirmUploaded,
  findOrCreateFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { driveErrorMessage } from "@/lib/google/drive-errors";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

const refuse = (error: string) => ({ ok: false as const, error });

export type MedicationFormState = ActionResult<{ success: string }> | undefined;

export type MedicationFields = {
  name: string;
  doseUnit: string;
  /** Baht per dose_unit, or null for "not priced yet" (0071). */
  costPerUnit: number | null;
  /** Supplier lead time in days, as typed; blank = no reorder flag (0083). */
  reorderLeadDays: string;
  /**
   * Safety stock as typed, in `safetyUnit` (0128). Blank = no floor (null);
   * 0 is a floor of nothing. Converted to the base unit on save.
   */
  safetyStock: string;
  /** Blank = the base unit; else the name of one of the item's other units. */
  safetyUnit: string;
};

function optional(value: FormDataEntryValue | string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function isDoseUnit(value: string | null): value is DoseUnit {
  return value != null && DOSE_UNITS.includes(value as DoseUnit);
}

function revalidateMedicationPages() {
  revalidatePath("/management/medications");
  revalidatePath("/management/purchasing");
  // The prescription form's pickers and the hub's medication(name) embeds
  // read these tables too.
  revalidatePath("/prescriptions/new");
  revalidatePath("/residents", "layout");
}

/** Where the photo shows: this table, the stocktake sheet and the delivery form. */
function revalidateLabelPages() {
  revalidatePath("/management/medications");
  revalidatePath("/stocktake");
  revalidatePath("/deliveries");
}

async function countPrescriptions(id: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("prescriptions")
    .select("id", { count: "exact", head: true })
    .eq("medication_id", id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

export async function createMedication(
  _state: MedicationFormState,
  formData: FormData,
): Promise<MedicationFormState> {
  const { t } = await getT();
  return runAction("medications.createMedication", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(formData.get("name"));
    if (!name) return refuse(t.management.medications.errors.nameRequired);
    const doseUnit = optional(formData.get("doseUnit"));
    if (!isDoseUnit(doseUnit)) {
      return refuse(t.management.medications.errors.unitInvalid);
    }

    // Optional: a medication can be added before anyone knows the price.
    const cost = parseBahtAmount(formData.get("costPerUnit") as string | null);
    if (!cost.ok) return refuse(t.management.medications.errors.costInvalid);

    // A new item has no other units yet, so the floor is in its own unit.
    const safety = parseSafetyStock(optional(formData.get("safetyStock")));
    if (!safety.ok) return refuse(t.management.stock.errors.safetyInvalid);

    const supabase = await createClient();
    const { error } = await supabase
      .from("medication")
      .insert({ name, dose_unit: doseUnit, cost_per_unit: cost.value, safety_stock: safety.value });

    if (error) return refuse(error.message);

    revalidateMedicationPages();
    return { ok: true, success: t.management.medications.createdMedication(name) };
  });
}

/**
 * Renaming is safe; changing the unit silently redefines the dose of every
 * prescription written against this medication (the unit lives on the
 * product, 0027), so the table asks for confirmation first when any exist.
 */
export async function updateMedication(id: string, fields: MedicationFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medications.updateMedication", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    const name = optional(fields.name);
    if (!name) return refuse(t.management.medications.errors.nameRequired);
    const doseUnit = optional(fields.doseUnit);
    if (!isDoseUnit(doseUnit)) {
      return refuse(t.management.medications.errors.unitInvalid);
    }
    // Re-checked here, not only in the table: null clears the price back to
    // "not priced yet", but a bad number must not become one.
    const cost = parseBahtAmount(fields.costPerUnit?.toString() ?? null);
    if (!cost.ok) return refuse(t.management.medications.errors.costInvalid);
    const leadDays = parseLeadDays(fields.reorderLeadDays);
    if (!leadDays.ok) return refuse(t.management.stock.errors.leadDaysInvalid);

    const supabase = await createClient();
    // The floor may be typed in the purchase unit; it is stored in base
    // units (0128), converted with the factor in force now.
    const conversions = await loadConversions(supabase, "medication", [id]);
    if (conversions.error) return refuse(conversions.error);
    const safety = resolveSafetyStock(
      fields.safetyStock,
      fields.safetyUnit,
      conversions.data[id] ?? [],
      [doseUnit],
    );
    if (!safety.ok) {
      return refuse(
        safety.reason === "unknownUnit" ? t.units.errors.unknownUnit : t.management.stock.errors.safetyInvalid,
      );
    }

    // stock_on_hand is deliberately not in this write: naming it restamps
    // stock_counted_at (0083), and a rename is not a stocktake.
    const { error } = await supabase
      .from("medication")
      .update({
        name,
        dose_unit: doseUnit,
        cost_per_unit: cost.value,
        reorder_lead_days: leadDays.value,
        safety_stock: safety.value,
      })
      .eq("id", id);

    if (error) return refuse(error.message);
    revalidateMedicationPages();
    return { ok: true };
  });
}

/**
 * Records a stocktake. Always writes stock_on_hand, so the trigger stamps
 * the count as taken now — re-saving the same figure is a count that
 * confirmed it (0083). Blank clears it back to "not counted".
 */
export async function updateMedicationStock(id: string, count: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medications.updateMedicationStock", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    const parsed = parseStockCount(count);
    if (!parsed.ok) return refuse(t.management.stock.errors.countInvalid);

    const supabase = await createClient();
    // One way in (0112): the function sets the figure and writes the history
    // row, marked as a correction so usage maths does not treat it as a count.
    const { error } = await supabase.rpc("record_stock_correction", {
      p_kind: "medication",
      p_id: id,
      p_count: parsed.value,
    });

    if (error) return refuse(error.message);
    revalidatePath("/management/medications");
    return { ok: true };
  });
}

export async function deleteMedication(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medications.deleteMedication", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    // prescriptions.medication_id has no cascade: a medication that has ever
    // been prescribed is part of a resident's medical record. Say so instead
    // of surfacing the foreign-key error.
    const count = await countPrescriptions(id);
    if (count > 0) {
      return refuse(t.management.medications.errors.hasPrescriptions(count));
    }

    const supabase = await createClient();
    const { error } = await supabase.from("medication").delete().eq("id", id);

    if (error) return refuse(error.message);
    revalidateMedicationPages();
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Merging duplicates (0043: one transaction in the database)
// ---------------------------------------------------------------------------

/**
 * Moves every prescription from `fromId` onto `intoId` and deletes `fromId`.
 * Both must share a dose_unit — the moved doses keep their numbers, so they
 * must keep their meaning; the function enforces it too. Returns how many
 * prescriptions moved.
 */
export async function mergeMedication(
  fromId: string,
  intoId: string,
): Promise<ActionResult<{ count: number }>> {
  const { t } = await getT();
  return runAction("medications.mergeMedication", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    if (fromId === intoId) {
      return refuse(t.management.medications.errors.mergeSelf);
    }

    const supabase = await createClient();
    const { data: pair, error: pairError } = await supabase
      .from("medication")
      .select("id, dose_unit")
      .in("id", [fromId, intoId])
      .returns<{ id: string; dose_unit: string }[]>();
    if (pairError) return refuse(pairError.message);
    if (!pair || pair.length !== 2) {
      return refuse(t.management.medications.errors.notFound);
    }
    if (pair[0].dose_unit !== pair[1].dose_unit) {
      return refuse(t.management.medications.errors.mergeUnitMismatch);
    }

    const { data, error } = await supabase.rpc("merge_medication", {
      p_from: fromId,
      p_into: intoId,
    });
    if (error) return refuse(error.message);

    revalidateMedicationPages();
    return { ok: true, count: (data as number | null) ?? 0 };
  });
}

// ---------------------------------------------------------------------------
// Label photo (0129)
// ---------------------------------------------------------------------------

/** To Drive's trash, restorable for 30 days — as for Shelter Friend logos. */
async function trashInDrive(fileId: string) {
  try {
    await getDriveClient().trashFile(fileId);
  } catch {
    // Best-effort: an orphaned Drive file is a cleanup chore, not a reason
    // to fail the user's action.
  }
}

async function currentLabel(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data, error } = await supabase
    .from("medication")
    .select("label_drive_file_id")
    .eq("id", id)
    .limit(1)
    .returns<{ label_drive_file_id: string | null }[]>();
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

/**
 * Replace (or set) the photo of a medication's box or bottle label. Stored in
 * Drive under Medications/Labels and served through /api/photos, which only
 * shows it to a signed-in caller who can read the medication row — it is an
 * internal photo, never on the public site. Refusals come back as
 * { ok: false, error }, as for the Shelter Friend logo.
 */
export async function uploadMedicationLabel(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("medications.uploadMedicationLabel", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    const w = t.admin.website.errors;

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return refuse(w.noFile);
    if (!WEBSITE_IMAGE_MIME_TYPES.has(file.type)) return refuse(w.unsupportedFileType(file.type || "unknown"));
    if (file.size > MAX_UPLOAD_BYTES) return refuse(w.fileTooLarge);
    // The bytes decide, not the browser's guess from the name (file-signature.ts).
    const mimeType = await checkFileSignature(file, WEBSITE_IMAGE_MIME_TYPES);
    if (!mimeType) {
      return refuse(t.uploads.notReadable(file.name, formatNames(WEBSITE_IMAGE_MIME_TYPES)));
    }

    const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootId) return refuse(w.driveNotConfigured);

    const supabase = await createClient();
    const current = await currentLabel(supabase, id);
    if (!current) return refuse(t.management.medications.errors.notFound);

    let driveFileId: string;
    try {
      const drive = getDriveClient();
      const medications = await findOrCreateFolder(drive, rootId, "Medications");
      const folderId = await findOrCreateFolder(drive, medications, "Labels");
      driveFileId = await uploadImageToFolder(drive, folderId, {
        name: file.name,
        mimeType,
        content: file,
      });
    } catch (err) {
      return refuse(await driveErrorMessage(err, w.uploadFailed));
    }
    // Read it back before the row points at it or the old photo is trashed.
    try {
      await confirmUploaded(getDriveClient(), driveFileId, file.size);
    } catch (err) {
      console.error("Label upload did not land whole:", err);
      await trashInDrive(driveFileId);
      return refuse(w.uploadFailed);
    }

    // .select() so success is only said when the row really changed: an
    // update that matches nothing (RLS, a medication merged away meanwhile)
    // is not an error to PostgREST, just zero rows.
    const { data: saved, error } = await supabase
      .from("medication")
      .update({ label_drive_file_id: driveFileId })
      .eq("id", id)
      .select("label_drive_file_id")
      .returns<{ label_drive_file_id: string | null }[]>();
    if (error || saved?.[0]?.label_drive_file_id !== driveFileId) {
      await trashInDrive(driveFileId);
      return refuse(error?.message ?? t.management.medications.errors.notFound);
    }

    if (current.label_drive_file_id) await trashInDrive(current.label_drive_file_id);
    revalidateLabelPages();
    return { ok: true, success: t.management.medications.label.updated };
  });
}

export async function removeMedicationLabel(id: string): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("medications.removeMedicationLabel", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();

    const current = await currentLabel(supabase, id);
    if (!current) return refuse(t.management.medications.errors.notFound);

    const { error } = await supabase.from("medication").update({ label_drive_file_id: null }).eq("id", id);
    if (error) return refuse(error.message);

    if (current.label_drive_file_id) await trashInDrive(current.label_drive_file_id);
    revalidateLabelPages();
    return { ok: true, success: t.management.medications.label.removed };
  });
}
