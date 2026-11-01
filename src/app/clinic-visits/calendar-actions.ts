"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { syncVisitToCalendar } from "@/lib/clinics/calendar-sync";
import { getSiteOrigin } from "@/lib/site-origin";

/**
 * The Retry beside "Not in the shelter calendar yet". Sends this one visit now; if Google still
 * will not take it the failure stays on the visit and the 15-minute sweep keeps trying. The visit
 * itself is never touched.
 *
 * PI FAILOVER (D), 2026-11-01: wrapped, and a replay would in fact be safe -- the event id is derived from the
 * visit (calendar-event.ts), a create that meets a 409 becomes a PATCH, a delete of an event already gone (404/410)
 * counts as done, and syncVisitToCalendar() never throws. It is wrapped anyway because the rule is "every write
 * reachable at the address", not "every harmful one". The outside service cannot be rolled back, but nothing here
 * needs it to be: the stored answer is returned on a replay and the body does not run again.
 */
export async function retryCalendarSync(_state: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<object>(
    "clinicVisits.retryCalendarSync",
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: writeRequestIdFrom(formData), action: "clinicVisits.retryCalendarSync", db: supabase },
    async () => {
      if (!can(await loadPermissions(), "medical.visits")) return { ok: false, error: t.common.notAllowed };
      const visitId = formData.get("visitId");
      const residentId = formData.get("residentId");
      if (typeof visitId !== "string" || !visitId || typeof residentId !== "string") {
        return { ok: false, error: t.common.somethingWentWrong("calendar-retry") };
      }
      await syncVisitToCalendar(visitId, (await getSiteOrigin())?.origin ?? null);
      revalidatePath(`/residents/${residentId}/clinic-visits`);
      return { ok: true };
    },
  );
}
