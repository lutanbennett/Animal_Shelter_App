"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { parseUnitCost } from "@/lib/format";
import { parseLeadDays, parseStockCount } from "@/lib/management/stock";
import { resolveSafetyStock } from "@/lib/management/purchasing";
import { loadConversions } from "@/lib/units-server";
import { moveInCupboardOrder } from "@/lib/management/cupboard-order-server";
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

/**
 * What Management → Medication stock edits on a row. The name and the dose
 * unit are Settings → Medications' (admin/medications/actions.ts) since the
 * split of 2026-10-08, so they are not in this write at all: an action is
 * reachable whatever the page shows.
 */
export type MedicationStockFields = {
  /** Baht per dose_unit as typed, up to 4 places (0161); blank = "not priced yet" (0071). */
  costPerUnit: string;
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

function revalidateMedicationPages() {
  revalidatePath("/management/medications");
  revalidatePath("/management/purchasing");
  revalidatePath("/management/cashflow");
}

/** Where the photo shows: this table, the stocktake sheet and the delivery form. */
function revalidateLabelPages() {
  revalidatePath("/management/medications");
  revalidatePath("/stocktake");
  revalidatePath("/deliveries");
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

/**
 * Cost, reorder lead time and safety stock: the figures that change as the
 * shelter runs. Adding, renaming, re-uniting, merging and deleting a
 * medication are Settings → Medications'.
 */
export async function updateMedicationStockSettings(
  id: string,
  fields: MedicationStockFields,
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medications.updateMedicationStockSettings", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    // Re-checked here, not only on the card: blank clears the price back to
    // "not priced yet", but a bad number must not become one.
    const cost = parseUnitCost(fields.costPerUnit);
    if (!cost.ok) return refuse(t.management.medications.errors.costInvalid);
    const leadDays = parseLeadDays(fields.reorderLeadDays);
    if (!leadDays.ok) return refuse(t.management.stock.errors.leadDaysInvalid);

    const supabase = await createClient();
    const { data: row, error: rowError } = await supabase
      .from("medication")
      .select("dose_unit")
      .eq("id", id)
      .maybeSingle<{ dose_unit: string }>();
    if (rowError) return refuse(rowError.message);
    if (!row) return refuse(t.management.medications.errors.notFound);

    // The floor may be typed in the purchase unit; it is stored in base
    // units (0128), converted with the factor in force now.
    const conversions = await loadConversions(supabase, "medication", [id]);
    if (conversions.error) return refuse(conversions.error);
    const safety = resolveSafetyStock(
      fields.safetyStock,
      fields.safetyUnit,
      conversions.data[id] ?? [],
      [row.dose_unit],
    );
    if (!safety.ok) {
      return refuse(
        safety.reason === "unknownUnit" ? t.units.errors.unknownUnit : t.management.stock.errors.safetyInvalid,
      );
    }

    // stock_on_hand is deliberately not in this write: naming it restamps
    // stock_counted_at (0083), and a price change is not a stocktake.
    const { error } = await supabase
      .from("medication")
      .update({
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

/**
 * Move a medicine a place up or down the cupboard order (0161), which the
 * stocktake sheet walks. The stock cell's, not Settings': where a box sits
 * on the shelf is how the shelter runs, and the 2IC sets it on a phone.
 */
export async function moveMedication(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("medications.moveMedication", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "stock.medications")) return refuse(t.management.errors.managementAccessRequired);
    const { error } = await moveInCupboardOrder(await createClient(), "medication", id, direction);
    if (error) return refuse(error);
    revalidatePath("/management/medications");
    revalidatePath("/stocktake");
    refresh();
    return { ok: true };
  });
}