"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { moveResidentToEnclosure } from "@/lib/placements/move";

export type AssistantResult = { error: string } | { ok: true };

/** Stamped into the notes so the hub history shows where a row came from. */
function stamp(request: string) {
  return `via the assistant (demo) — "${request.trim()}"`;
}

/**
 * Same helper as /residents/[id]/move, under the caller's own session, so
 * the role rules and RLS apply exactly as they do from the move page.
 */
export async function assistantMove(input: {
  residentId: string;
  enclosureId: string;
  moveDate: string;
  request: string;
}): Promise<AssistantResult> {
  const { t } = await getT();
  const supabase = await createClient();

  const result = await moveResidentToEnclosure(supabase, t, {
    residentId: input.residentId,
    enclosureId: input.enclosureId,
    moveDate: input.moveDate,
    notes: stamp(input.request),
  });
  if ("error" in result) return result;

  revalidatePath("/residents");
  revalidatePath(`/residents/${input.residentId}`);
  revalidatePath(`/residents/${input.residentId}/housing`);
  revalidatePath("/enclosures", "layout");
  revalidatePath("/assistant");
  return { ok: true };
}

/**
 * Same RPC as /vet-visits/new. The instant is built in the browser (the
 * person's own clock), so it is already an ISO timestamp here.
 */
export async function assistantBookVetVisit(input: {
  residentId: string;
  vetId: string;
  appointmentIso: string;
  reason: string | null;
  request: string;
}): Promise<AssistantResult> {
  const { t } = await getT();
  if (!input.residentId) return { error: t.vetVisits.errors.selectResident };
  if (!input.vetId) return { error: t.vetVisits.errors.selectVet };
  const appointment = new Date(input.appointmentIso);
  if (Number.isNaN(appointment.getTime())) {
    return { error: t.vetVisits.errors.invalidDate };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("schedule_bulk_appointments", {
    p_resident_ids: [input.residentId],
    p_vet_id: input.vetId,
    p_appointment_date: appointment.toISOString(),
    p_reason: input.reason?.trim() || null,
    p_notes: stamp(input.request),
    // Mirrors the booking form's default: a visit already in the past is
    // being logged, not scheduled.
    p_status: appointment.getTime() <= Date.now() ? "completed" : "scheduled",
  });
  if (error) return { error: error.message };

  revalidatePath(`/residents/${input.residentId}`);
  revalidatePath(`/vets/${input.vetId}`);
  revalidatePath("/");
  return { ok: true };
}
