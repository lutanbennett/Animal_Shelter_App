"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { moveResidentToEnclosure } from "@/lib/placements/move";
import {
  returnResidentFromHospital,
  sendResidentToHospital,
} from "@/lib/placements/hospital";
import { recordWeight } from "@/lib/weight/record";
import { logAssistantAction, type AssistantActionStatus } from "@/lib/assistant/audit";
import {
  canUseAssistant,
  canWriteWithAssistant,
  emptyAssistantContext,
  loadAssistantContext,
  loadAssistantRole,
  type AssistantContext,
} from "@/lib/assistant/data";
import type { Draft, Intent } from "@/lib/assistant/types";

export type AssistantResult = { error: string } | { ok: true };

type Supabase = Awaited<ReturnType<typeof createClient>>;
type T = Awaited<ReturnType<typeof getT>>["t"];

/**
 * Stamped into the notes so the hub history shows where a row came from.
 * The demo said "(demo)"; version 1 is the real tool, so it doesn't.
 */
function stamp(request: string) {
  return `via the assistant — "${request.trim()}"`;
}

/** What every write action is handed on top of its own fields. */
type WriteInput<T> = T & {
  /** The request exactly as typed — the audit row keeps it verbatim (0070). */
  request: string;
  /** The draft as the card had it when Confirm was pressed. */
  draft: Draft;
};

/**
 * Runs one confirmed write and records it, whichever way it went.
 *
 * The role check is the assistant's own: admin / management / staff write,
 * volunteers get the read-only lookups. It sits on top of — never instead
 * of — the checks inside each helper, which are the same ones the pages
 * run and which RLS backs in the database.
 */
async function runWrite(
  intent: Intent,
  input: { request: string; draft: Draft },
  write: (supabase: Supabase, t: T) => Promise<{ error: string } | { ok: true; id: string }>,
  revalidate: () => void,
  resultTable: string,
): Promise<AssistantResult> {
  const { t } = await getT();
  const supabase = await createClient();

  const { data: role } = await supabase.rpc("current_user_role");
  if (!canWriteWithAssistant(role)) {
    const error = t.assistant.notAuthorized;
    await logAssistantAction(supabase, {
      requestText: input.request,
      intent,
      draft: input.draft,
      status: "confirmed",
      result: error,
    });
    return { error };
  }

  const result = await write(supabase, t);

  await logAssistantAction(supabase, {
    requestText: input.request,
    intent,
    draft: input.draft,
    status: "confirmed",
    result: "error" in result ? result.error : "ok",
    resultTable: "error" in result ? null : resultTable,
    resultRowId: "error" in result ? null : result.id || null,
  });

  if ("error" in result) return result;
  revalidate();
  return { ok: true };
}

function revalidateResident(residentId: string) {
  revalidatePath("/residents");
  revalidatePath(`/residents/${residentId}`);
}

/**
 * Same helper as /residents/[id]/move, under the caller's own session, so
 * the role rules and RLS apply exactly as they do from the move page.
 */
export async function assistantMove(
  input: WriteInput<{ residentId: string; enclosureId: string; moveDate: string }>,
): Promise<AssistantResult> {
  return runWrite(
    "move",
    input,
    (supabase, t) =>
      moveResidentToEnclosure(supabase, t, {
        residentId: input.residentId,
        enclosureId: input.enclosureId,
        moveDate: input.moveDate,
        notes: stamp(input.request),
      }),
    () => {
      revalidateResident(input.residentId);
      revalidatePath(`/residents/${input.residentId}/housing`);
      revalidatePath("/enclosures", "layout");
      revalidatePath("/assistant");
    },
    "placement_history",
  );
}

/**
 * Same RPC as /vet-visits/new. The instant is built in the browser (the
 * person's own clock), so it is already an ISO timestamp here.
 */
export async function assistantBookVetVisit(
  input: WriteInput<{
    residentId: string;
    vetId: string;
    appointmentIso: string;
    reason: string | null;
  }>,
): Promise<AssistantResult> {
  return runWrite(
    "vet",
    input,
    async (supabase, t) => {
      if (!input.residentId) return { error: t.vetVisits.errors.selectResident };
      if (!input.vetId) return { error: t.vetVisits.errors.selectVet };
      const appointment = new Date(input.appointmentIso);
      if (Number.isNaN(appointment.getTime())) {
        return { error: t.vetVisits.errors.invalidDate };
      }

      const { data, error } = await supabase.rpc("schedule_bulk_appointments", {
        p_resident_ids: [input.residentId],
        p_vet_id: input.vetId,
        p_appointment_date: appointment.toISOString(),
        p_reason: input.reason?.trim() || null,
        p_notes: stamp(input.request),
        // Mirrors the booking form's default: a visit already in the past
        // is being logged, not scheduled.
        p_status: appointment.getTime() <= Date.now() ? "completed" : "scheduled",
      });
      if (error) return { error: error.message };
      // The RPC books for a list of residents, so it answers with a list
      // of ids; the assistant only ever sends one.
      const id = Array.isArray(data) ? data[0] : data;
      return { ok: true, id: typeof id === "string" ? id : "" };
    },
    () => {
      revalidatePath(`/residents/${input.residentId}`);
      revalidatePath(`/vets/${input.vetId}`);
      revalidatePath("/");
    },
    "vet_appointments",
  );
}

/** Same helper as /residents/[id]/hospital. */
export async function assistantSendToHospital(
  input: WriteInput<{ residentId: string; date: string }>,
): Promise<AssistantResult> {
  return runWrite(
    "hospital",
    input,
    (supabase, t) =>
      sendResidentToHospital(supabase, t, {
        residentId: input.residentId,
        date: input.date,
        notes: stamp(input.request),
      }),
    () => {
      revalidateResident(input.residentId);
      revalidatePath(`/residents/${input.residentId}/housing`);
      revalidatePath(`/residents/${input.residentId}/vet-appointments`);
      revalidatePath("/enclosures", "layout");
      revalidatePath("/assistant");
    },
    "placement_history",
  );
}

/** Same helper as /residents/[id]/hospital/return. */
export async function assistantReturnFromHospital(
  input: WriteInput<{ residentId: string; enclosureId: string; date: string }>,
): Promise<AssistantResult> {
  return runWrite(
    "hospital-return",
    input,
    (supabase, t) =>
      returnResidentFromHospital(supabase, t, {
        residentId: input.residentId,
        enclosureId: input.enclosureId,
        date: input.date,
        notes: stamp(input.request),
      }),
    () => {
      revalidateResident(input.residentId);
      revalidatePath(`/residents/${input.residentId}/housing`);
      revalidatePath("/enclosures", "layout");
      revalidatePath("/assistant");
    },
    "placement_history",
  );
}

/** Same helper as /weight/new. */
export async function assistantLogWeight(
  input: WriteInput<{ residentId: string; weightKg: number; date: string }>,
): Promise<AssistantResult> {
  return runWrite(
    "weight",
    input,
    (supabase, t) =>
      recordWeight(supabase, t, {
        residentId: input.residentId,
        date: input.date,
        weightKg: input.weightKg,
        notes: stamp(input.request),
      }),
    () => {
      revalidatePath(`/residents/${input.residentId}`);
      revalidatePath(`/residents/${input.residentId}/weight`);
    },
    "weight",
  );
}

/**
 * The turns that never reach a write: the person cancelled the card, or no
 * parser recognised the sentence at all. Recorded from the browser because
 * that is where they happen — and the unmatched ones are the rows version
 * 2 is measured on (0070).
 */
export async function recordAssistantTurn(input: {
  request: string;
  intent: Intent | null;
  draft: Draft | null;
  status: Extract<AssistantActionStatus, "cancelled" | "unmatched">;
}): Promise<void> {
  const supabase = await createClient();
  await logAssistantAction(supabase, {
    requestText: input.request,
    intent: input.intent,
    draft: input.draft,
    status: input.status,
    result: null,
  });
}

/**
 * The rows the parser matches against, for the slide-over — the /assistant
 * page loads them itself. Fetched when the panel is first opened rather
 * than with every layout render, since most screens never open it.
 *
 * A server action can be called by anyone signed in, button or not, so it
 * checks the role itself as `assistantLookup` does: a vet gets an empty
 * context and `notAuthorized`, not the resident list.
 */
export async function fetchAssistantContext(): Promise<AssistantContext> {
  const supabase = await createClient();
  const role = await loadAssistantRole(supabase);
  if (!canUseAssistant(role)) {
    const { t } = await getT();
    return emptyAssistantContext(role, t.assistant.notAuthorized);
  }
  return loadAssistantContext(supabase, role);
}
