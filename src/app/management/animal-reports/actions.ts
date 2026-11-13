"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { REPORT_STATUSES, type ReportStatus } from "@/lib/animal-reports/form";

/**
 * Staff handling of public animal reports. Asks animal_report.manage at edit, the activity animal_reports' own
 * policies ask (0372), and the control is drawn only when the login holds it. Runs as the signed-in login.
 */
const BACK = "/management/animal-reports";

export async function setReportStatus(form: FormData): Promise<void> {
  const perms = await loadPermissions();
  if (!perms || !can(perms, "animal_report.manage", "edit")) redirect(`${BACK}?err=1`);
  const id = form.get("id");
  const status = form.get("status");
  if (typeof id !== "string" || typeof status !== "string" || !REPORT_STATUSES.includes(status as ReportStatus)) {
    redirect(`${BACK}?err=1`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("animal_reports").update({ status }).eq("id", id).select("id");
  if (error || !data?.length) redirect(`${BACK}?err=1`);
  revalidatePath(BACK);
  redirect(`${BACK}?ok=1`);
}
