"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction, type ActionRefusal, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { moveResidentToEnclosure } from "@/lib/placements/move";

export type MoveResidentState = ActionRefusal | undefined;

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
 * Records a ChangeEnclosure placement from the hub's move page. The rules
 * (roles, target enclosure, date) live in the shared helper so the edit
 * form's housing section behaves identically. Bound to the resident id.
 */
export async function moveResident(
  residentId: string,
  _state: MoveResidentState,
  formData: FormData,
): Promise<MoveResidentState> {
  const { t } = await getT();
  const supabase = await createClient();
  // PI FAILOVER (D): the success path REDIRECTS, and a redirect throws, which would leave the claim open and
  // make a replay read "we cannot tell". So the body returns where to go, the result is stored, and the
  // redirect happens after runWriteAction() has finished the claim.
  const done = await runWriteAction<{ redirectTo: string }>(
    "residents.moveResident",
    write(t),
    { id: writeRequestIdFrom(formData), action: "residents.moveResident", db: supabase },
    async () => {

      const result = await moveResidentToEnclosure(supabase, t, {
        residentId,
        enclosureId: str(formData, "enclosureId") ?? "",
        moveDate: str(formData, "moveDate") ?? "",
        notes: str(formData, "notes"),
      });
      if ("error" in result) return { ok: false, error: result.error };

      revalidatePath("/residents");
      revalidatePath(`/residents/${residentId}`);
      revalidatePath(`/residents/${residentId}/housing`);
      // Occupancy on the enclosure browser and both enclosure hubs changes too.
      revalidatePath("/enclosures", "layout");
      return { ok: true, redirectTo: `/residents/${residentId}` };
    },
  );
  if (done.ok) redirect(done.redirectTo);
  return done;
}
