"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction, type ActionRefusal, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { returnResidentFromHospital } from "@/lib/placements/hospital";

export type ReturnFromHospitalState = ActionRefusal | undefined;

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Records a ReturnFromHospital placement from the hub's return page. The
 * rules (roles, target enclosure, date, current status) live in the shared
 * helper. Bound to the resident id.
 */
export async function returnFromHospital(
  residentId: string,
  _state: ReturnFromHospitalState,
  formData: FormData,
): Promise<ReturnFromHospitalState> {
  const { t } = await getT();
  const supabase = await createClient();
  // PI FAILOVER (D): the success path REDIRECTS, and a redirect throws, which would leave the claim open and
  // make a replay read "we cannot tell". So the body returns where to go, the result is stored, and the
  // redirect happens after runWriteAction() has finished the claim.
  const done = await runWriteAction<{ redirectTo: string }>(
    "residents.returnFromHospital",
    write(t),
    { id: writeRequestIdFrom(formData), action: "residents.returnFromHospital", db: supabase },
    async () => {

      const result = await returnResidentFromHospital(supabase, t, {
        residentId,
        enclosureId: str(formData, "enclosureId") ?? "",
        date: str(formData, "date") ?? "",
        notes: str(formData, "notes"),
      });
      if ("error" in result) return { ok: false, error: result.error };

      revalidatePath("/residents");
      revalidatePath(`/residents/${residentId}`);
      revalidatePath(`/residents/${residentId}/housing`);
      revalidatePath(`/residents/${residentId}/clinic-visits`);
      // Occupancy on the enclosure browser and both enclosure hubs changes too.
      revalidatePath("/enclosures", "layout");
      return { ok: true, redirectTo: `/residents/${residentId}` };
    },
  );
  if (done.ok) redirect(done.redirectTo);
  return done;
}
