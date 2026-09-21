"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type VetVisitEditState = { error: string } | undefined;

const STATUSES = ["scheduled", "completed", "cancelled"] as const;

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Updates one visit: vet, date/time, status, reason, notes and — after
 * the visit, from the invoice — the cost (0053). Rows for a deceased
 * resident are locked (0026), which the page refuses to show a form for.
 * RLS filters rather than rejects, so a volunteer's update matches no
 * row and reads as "not authorised".
 */
export async function updateVetVisit(
  _state: VetVisitEditState,
  formData: FormData,
): Promise<VetVisitEditState> {
  const { t } = await getT();
  const e = t.vetVisits.errors;

  const visitId = str(formData, "visitId");
  const residentId = str(formData, "residentId");
  if (!visitId || !residentId) return { error: e.notFound };

  const vetId = str(formData, "vetId");
  if (!vetId) return { error: e.selectVet };

  const appointmentDateLocal = str(formData, "appointmentDate");
  if (!appointmentDateLocal) return { error: e.enterDateTime };
  const appointmentDate = new Date(appointmentDateLocal);
  if (Number.isNaN(appointmentDate.getTime())) return { error: e.invalidDate };

  const status = str(formData, "status") ?? "scheduled";
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return { error: e.invalidStatus };

  const costRaw = str(formData, "cost");
  let cost: number | null = null;
  if (costRaw) {
    cost = Number(costRaw.replace(/[,\s]/g, ""));
    if (!Number.isFinite(cost) || cost < 0) return { error: e.invalidCost };
    cost = Math.round(cost * 100) / 100;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vet_appointments")
    .update({
      vet_id: vetId,
      appointment_date: appointmentDate.toISOString(),
      status,
      reason: str(formData, "reason"),
      notes: str(formData, "notes"),
      cost,
    })
    .eq("id", visitId)
    .eq("resident_id", residentId)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: e.notAuthorized };

  revalidatePath(`/residents/${residentId}`);
  revalidatePath(`/residents/${residentId}/vet-appointments`);
  revalidatePath(`/vets/${vetId}`, "page");
  revalidatePath("/vets");
  redirect(`/residents/${residentId}/vet-appointments`);
}
