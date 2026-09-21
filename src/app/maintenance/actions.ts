"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";
import { getT } from "@/lib/i18n/get-t";
import { syncJobFolderAfterChange } from "@/lib/maintenance/drive-sync";
import { isMaintenanceStatus, type MaintenanceStatus } from "@/lib/maintenance/status";

export type MaintenanceFormState =
  | { error: string }
  | { success: true; jobId: string; driveWarning: string | null }
  | undefined;

export type MaintenanceActionResult = { error?: string; driveWarning?: string | null };

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** A non-negative amount of baht, or null when blank; NaN when unparseable. */
function money(formData: FormData, key: string): number | null {
  const raw = str(formData, key);
  if (raw === null) return null;
  const n = Number(raw.replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : Number.NaN;
}

/**
 * The paths that show a job: the board, the job itself, and the enclosure
 * hub it belongs to (whose Maintenance card counts open jobs).
 */
function revalidateJob(jobId: string, enclosureId: string | null) {
  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${jobId}`);
  if (enclosureId) revalidatePath(`/enclosures/${enclosureId}`);
}

type ParsedFields = {
  title: string;
  description: string | null;
  status: MaintenanceStatus;
  enclosure_id: string | null;
  zone_id: string | null;
  due_date: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  assigned_to: string | null;
};

async function parseFields(
  formData: FormData,
): Promise<{ fields: ParsedFields } | { error: string }> {
  const { t } = await getT();
  const m = t.maintenance.errors;

  const title = str(formData, "title");
  if (!title) return { error: m.enterTitle };

  const status = str(formData, "status") ?? "Not Started";
  if (!isMaintenanceStatus(status)) return { error: m.invalidStatus };

  // An enclosure implies its zone (the database derives zone_id from it);
  // a zone alone means a zone-wide job.
  const enclosure_id = str(formData, "enclosureId");
  const zone_id = str(formData, "zoneId");
  if (!enclosure_id && !zone_id) return { error: m.selectLocation };

  const due_date = str(formData, "dueDate");
  if (due_date && Number.isNaN(new Date(due_date).getTime())) {
    return { error: m.invalidDate };
  }

  const estimated_cost = money(formData, "estimatedCost");
  const actual_cost = money(formData, "actualCost");
  if (Number.isNaN(estimated_cost) || Number.isNaN(actual_cost)) {
    return { error: m.invalidCost };
  }

  return {
    fields: {
      title,
      description: str(formData, "description"),
      status,
      enclosure_id,
      zone_id: enclosure_id ? null : zone_id,
      due_date,
      estimated_cost,
      actual_cost,
      // Any contact, not just carers; the FK is the only check needed.
      assigned_to: str(formData, "assignedTo"),
    },
  };
}

/**
 * Logs a job. Returns the new id rather than redirecting: the form then
 * uploads whatever photos were picked while filling it in (one form, one
 * Save — the two-step "save, then upload" of the medical forms was the
 * thing the user didn't want here) and navigates itself when they're up.
 * RLS (0001) is what stops a volunteer: their insert returns no row.
 */
export async function createMaintenanceJob(
  _state: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const parsed = await parseFields(formData);
  if ("error" in parsed) return parsed;
  const { fields } = parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance")
    .insert({
      title: fields.title,
      description: fields.description,
      status: fields.status,
      enclosure_id: fields.enclosure_id,
      zone_id: fields.zone_id,
      due_date: fields.due_date,
      estimated_cost: fields.estimated_cost,
      actual_cost: fields.actual_cost,
      assigned_to: fields.assigned_to,
    })
    .select("id")
    .limit(1)
    .returns<{ id: string }[]>();

  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) {
    const { t } = await getT();
    return { error: t.maintenance.errors.saveFailed };
  }

  revalidateJob(row.id, fields.enclosure_id);
  return { success: true, jobId: row.id, driveWarning: null };
}

/**
 * Edits a job's details. The title and location are part of the Drive
 * path, so the folder (if the job has one) is moved/renamed afterwards.
 */
export async function updateMaintenanceJob(
  _state: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const { t } = await getT();
  const jobId = str(formData, "jobId");
  if (!jobId) return { error: t.maintenance.errors.notFound };

  const parsed = await parseFields(formData);
  if ("error" in parsed) return parsed;
  const { fields } = parsed;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("maintenance")
    .select("enclosure_id")
    .eq("id", jobId)
    .limit(1)
    .returns<{ enclosure_id: string | null }[]>();

  const { data, error } = await supabase
    .from("maintenance")
    .update({
      title: fields.title,
      description: fields.description,
      status: fields.status,
      enclosure_id: fields.enclosure_id,
      zone_id: fields.zone_id ?? undefined,
      due_date: fields.due_date,
      estimated_cost: fields.estimated_cost,
      actual_cost: fields.actual_cost,
      assigned_to: fields.assigned_to,
    })
    .eq("id", jobId)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) return { error: error.message };
  // RLS filters rather than rejects, so a volunteer (or a stale id) shows
  // up as "nothing updated".
  if (!data || data.length === 0) return { error: t.maintenance.errors.notAuthorized };

  const driveWarning = await syncJobFolderAfterChange(supabase, jobId);

  revalidateJob(jobId, fields.enclosure_id);
  const previousEnclosure = before?.[0]?.enclosure_id ?? null;
  if (previousEnclosure && previousEnclosure !== fields.enclosure_id) {
    revalidatePath(`/enclosures/${previousEnclosure}`);
  }
  return { success: true, jobId, driveWarning };
}

/**
 * The board's drag-and-drop and the job page's status buttons. The row is
 * updated first (the trigger stamps or clears date_completed), then the
 * Drive folder follows it into the new status folder.
 */
export async function setMaintenanceStatus(
  jobId: string,
  status: string,
): Promise<MaintenanceActionResult> {
  const { t } = await getT();
  if (!isMaintenanceStatus(status)) return { error: t.maintenance.errors.invalidStatus };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance")
    .update({ status })
    .eq("id", jobId)
    .select("id, enclosure_id")
    .returns<{ id: string; enclosure_id: string | null }[]>();

  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) return { error: t.maintenance.errors.notAuthorized };

  const driveWarning = await syncJobFolderAfterChange(supabase, jobId);
  revalidateJob(jobId, row.enclosure_id);
  return { driveWarning };
}

/**
 * Removes a job for good: its file rows, the row itself, and then its
 * Drive folder (which takes the files with it) or, for a job that never
 * got a folder, nothing in Drive at all. The database goes first and is
 * the source of truth; a Drive failure after that leaves an orphaned
 * folder, which is a cleanup nuisance rather than a wrong record, so it
 * isn't allowed to fail the action. Redirects to the board on success.
 * RLS (0001) is what stops a volunteer: their delete matches no row.
 */
export async function deleteMaintenanceJob(jobId: string): Promise<{ error: string }> {
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("maintenance")
    .select("id, enclosure_id, drive_folder_id")
    .eq("id", jobId)
    .limit(1)
    .returns<{ id: string; enclosure_id: string | null; drive_folder_id: string | null }[]>();
  const job = rows?.[0];
  if (!job) return { error: t.maintenance.errors.notFound };

  const { data: files } = await supabase
    .from("attachments")
    .select("drive_file_id")
    .eq("owner_type", "maintenance")
    .eq("owner_id", jobId)
    .returns<{ drive_file_id: string }[]>();

  const { error: filesError } = await supabase
    .from("attachments")
    .delete()
    .eq("owner_type", "maintenance")
    .eq("owner_id", jobId);
  if (filesError) return { error: filesError.message };

  const { data: deleted, error } = await supabase
    .from("maintenance")
    .delete()
    .eq("id", jobId)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { error: error.message };
  if (!deleted || deleted.length === 0) return { error: t.maintenance.errors.notAuthorized };

  try {
    const drive = getDriveClient();
    if (job.drive_folder_id) {
      // Deleting the folder removes everything under it in one call.
      await drive.deleteFile(job.drive_folder_id);
    } else {
      for (const file of files ?? []) await drive.deleteFile(file.drive_file_id);
    }
  } catch {
    // See above: the record is gone; the folder can be tidied by hand.
  }

  revalidateJob(jobId, job.enclosure_id);
  redirect("/maintenance");
}

export async function deleteMaintenanceAttachment(
  jobId: string,
  attachmentId: string,
): Promise<MaintenanceActionResult> {
  const supabase = await createClient();

  const { data: rows, error: selectError } = await supabase
    .from("attachments")
    .select("id, drive_file_id")
    .eq("id", attachmentId)
    .eq("owner_type", "maintenance")
    .eq("owner_id", jobId)
    .limit(1)
    .returns<{ id: string; drive_file_id: string }[]>();

  const attachment = rows?.[0];
  if (selectError || !attachment) {
    const { t } = await getT();
    return { error: selectError?.message ?? t.maintenance.errors.fileNotFound };
  }

  const { error: deleteError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);
  if (deleteError) return { error: deleteError.message };

  try {
    await getDriveClient().deleteFile(attachment.drive_file_id);
  } catch {
    // The DB record is already gone; an orphaned Drive file is a minor
    // cleanup issue, not worth failing the user-facing action over (same
    // tradeoff as deleteProcedureAttachment).
  }

  const { data: job } = await supabase
    .from("maintenance")
    .select("enclosure_id")
    .eq("id", jobId)
    .limit(1)
    .returns<{ enclosure_id: string | null }[]>();
  revalidateJob(jobId, job?.[0]?.enclosure_id ?? null);
  return {};
}
