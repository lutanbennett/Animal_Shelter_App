"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runAction, type ActionRefusal } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { moveResidentToEnclosure } from "@/lib/placements/move";

export type MoveResidentState = ActionRefusal | undefined;

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
  return runAction<never>("residents.moveResident", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();

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
    redirect(`/residents/${residentId}`);
  });
}
