"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { rehomeResident, type RehomeKind } from "@/lib/placements/rehome";

export type RehomeState = { error: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Records a Foster or Adopt placement from the hub's foster / adopt page.
 * The rules (roles, carer, date, current status) live in the shared
 * helper. Bound to the resident id.
 */
export async function rehome(
  residentId: string,
  _state: RehomeState,
  formData: FormData,
): Promise<RehomeState> {
  const { t } = await getT();
  const supabase = await createClient();

  // The carer picker posts either an existing contact id or the fields for
  // a new one, and says which with carerMode.
  const newCarer =
    str(formData, "carerMode") === "new"
      ? {
          name: str(formData, "newCarerName") ?? "",
          phone: str(formData, "newCarerPhone"),
          email: str(formData, "newCarerEmail"),
          lineId: str(formData, "newCarerLineId"),
        }
      : null;

  const result = await rehomeResident(supabase, t, {
    residentId,
    kind: (str(formData, "kind") ?? "") as RehomeKind,
    carerId: newCarer ? null : str(formData, "carerId"),
    newCarer,
    date: str(formData, "date") ?? "",
    notes: str(formData, "notes"),
  });
  if ("error" in result) return result;

  revalidatePath("/residents");
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/housing`);
  // Occupancy on the enclosure browser and both enclosure hubs changes too.
  revalidatePath("/enclosures", "layout");
  redirect(`/residents/${residentId}`);
}
