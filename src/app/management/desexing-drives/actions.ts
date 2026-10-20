"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { SIGNUP_STATUSES, checkDrive, type DriveFields, type SignupStatus } from "@/lib/desexing/form";

/**
 * Staff actions for desexing drives (0233). Each asks website.content first;
 * RLS asks the same cell, so this is the friendly refusal, not the protection.
 * The public page is read live, so revalidating only reaches the staff pages.
 */

const refuse = (error: string): ActionRefusal => ({ ok: false, error });
const allowed = async () => can(await loadPermissions(), "website.content");

function revalidateDrives(id?: string) {
  revalidatePath("/management/desexing-drives");
  if (id) revalidatePath(`/management/desexing-drives/${id}`);
}

export async function createDrive(fields: DriveFields): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  return runAction("desexing.createDrive", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const checked = checkDrive(fields);
    if (!checked.ok) return refuse(t.desexingAdmin.errors[checked.problem]);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("desexing_drives")
      .insert(checked.drive)
      .select("id")
      .single<{ id: string }>();
    if (error) return databaseFailure("desexing.createDrive", error, t.common);
    revalidateDrives(data.id);
    return { ok: true, id: data.id };
  });
}

export async function saveDrive(id: string, fields: DriveFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("desexing.saveDrive", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const checked = checkDrive(fields);
    if (!checked.ok) return refuse(t.desexingAdmin.errors[checked.problem]);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("desexing_drives")
      .update(checked.drive)
      .eq("id", id)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return databaseFailure("desexing.saveDrive", error, t.common);
    if (!data) return refuse(t.desexingAdmin.errors.notFound);
    revalidateDrives(id);
    return { ok: true };
  });
}

/** Deleting a drive deletes its sign-ups with it (on delete cascade); the page asks first. */
export async function deleteDrive(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("desexing.deleteDrive", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const { error } = await supabase.from("desexing_drives").delete().eq("id", id);
    if (error) return databaseFailure("desexing.deleteDrive", error, t.common);
    revalidateDrives(id);
    return { ok: true };
  });
}

export async function setSignupStatus(id: string, driveId: string, status: SignupStatus): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("desexing.setSignupStatus", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    if (!SIGNUP_STATUSES.includes(status)) return refuse(t.common.notAccepted);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("desexing_drive_signups")
      .update({ status })
      .eq("id", id)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return databaseFailure("desexing.setSignupStatus", error, t.common);
    if (!data) return refuse(t.desexingAdmin.errors.notFound);
    revalidateDrives(driveId);
    return { ok: true };
  });
}

/** Removing a sign-up frees the place (junk, or a duplicate). */
export async function deleteSignup(id: string, driveId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("desexing.deleteSignup", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const { error } = await supabase.from("desexing_drive_signups").delete().eq("id", id);
    if (error) return databaseFailure("desexing.deleteSignup", error, t.common);
    revalidateDrives(driveId);
    return { ok: true };
  });
}
