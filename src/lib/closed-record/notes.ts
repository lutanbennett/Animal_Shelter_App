/**
 * The five tables on which 0320 lets a note be added after a death, with the activity each table's own UPDATE policy asks
 * (supabase/migrations/0264_inert_security_leftovers.sql: placement_history_update_perm resident.record; weight update
 * medical.weight; prescriptions_update_perm medical.prescriptions; immunization_records_update_perm medical.immunizations;
 * procedures update medical.procedures from 0195). The server action and the sections both read this, so the control and
 * the action cannot disagree. No role appears here.
 */
export const CLOSED_NOTE_KINDS = {
  placement: { table: "placement_history", activity: "resident.record", section: "housing" },
  weight: { table: "weight", activity: "medical.weight", section: "weight" },
  prescription: { table: "prescriptions", activity: "medical.prescriptions", section: "prescriptions" },
  immunization: { table: "immunization_records", activity: "medical.immunizations", section: "immunizations" },
  procedure: { table: "procedures", activity: "medical.procedures", section: "procedures" },
} as const;

export type ClosedNoteKind = keyof typeof CLOSED_NOTE_KINDS;

export function isClosedNoteKind(kind: string): kind is ClosedNoteKind {
  return Object.prototype.hasOwnProperty.call(CLOSED_NOTE_KINDS, kind);
}
