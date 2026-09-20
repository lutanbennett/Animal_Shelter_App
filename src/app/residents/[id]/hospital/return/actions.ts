"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { returnResidentFromHospital } from "@/lib/placements/hospital";

export type ReturnFromHospitalState = { error: string } | undefined;

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

  const result = await returnResidentFromHospital(supabase, t, {
    residentId,
    enclosureId: str(formData, "enclosureId") ?? "",
    date: str(formData, "date") ?? "",
    notes: str(formData, "notes"),
  });
  if ("error" in result) return result;

  revalidatePath("/residents");
  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/housing`);
  revalidatePath(`/residents/${residentId}/vet-appointments`);
  // Occupancy on the enclosure browser and both enclosure hubs changes too.
  revalidatePath("/enclosures", "layout");
  redirect(`/residents/${residentId}`);
}
