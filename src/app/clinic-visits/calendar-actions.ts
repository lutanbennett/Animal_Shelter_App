"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { syncVisitToCalendar } from "@/lib/clinics/calendar-sync";
import { getSiteOrigin } from "@/lib/site-origin";

/**
 * The Retry beside "Not in the shelter calendar yet". Sends this one visit now; if Google still
 * will not take it the failure stays on the visit and the 15-minute sweep keeps trying. The visit
 * itself is never touched.
 */
export async function retryCalendarSync(formData: FormData): Promise<void> {
  if (!can(await loadPermissions(), "medical.visits")) return;
  const visitId = formData.get("visitId");
  const residentId = formData.get("residentId");
  if (typeof visitId !== "string" || !visitId || typeof residentId !== "string") return;
  await syncVisitToCalendar(visitId, (await getSiteOrigin())?.origin ?? null);
  revalidatePath(`/residents/${residentId}/clinic-visits`);
}
