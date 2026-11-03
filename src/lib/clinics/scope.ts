/**
 * Which clinics this session may record a clinic visit against.
 *
 * THIS IS "ANY CLINIC" FOR EVERY LOGIN, AND NOTHING IS LOADED. current_user_clinic_ids() has answered
 * a constant '{}' since 0264 (supabase/migrations/0264_inert_security_leftovers.sql:629), because the
 * narrowing it used to do was keyed on a role column, which no longer exists. No live RLS policy on
 * clinic_visits narrows by clinic either: insert asks visit.book and update asks medical.visits
 * (0264:76-78, 153). Who may book is decided by those cards alone.
 * See docs/decisions/2026-11-02-clinic-scope-inert.md and docs/decisions/2026-11-03-clinic-harness-rewrite.md.
 *
 * `loadClinicScope()` used to call that function and the doctors table on every page that imported
 * this file, to arrive at { kind: "any" } every time. It is gone; the constant below is what it
 * returned. The "clinics" and "unlinked" members of the type are still tested by the importers
 * (clinic-visits pages and actions, residents, appointments, NavPane) but can never be true; deleting
 * those dead branches is a follow-up that also touches dictionary strings.
 *
 * `doctorName` is only ever set on the unreachable "clinics" branch.
 */
export type ClinicScope =
  | { kind: "any" }
  | { kind: "clinics"; clinicIds: string[]; doctorName: string | null }
  | { kind: "unlinked" };

export const ANY_CLINIC_SCOPE: ClinicScope = { kind: "any" };

/** Whether a visit may be recorded against `clinicId`; `keep` is a clinic the visit already has. */
export function scopeAllowsClinic(scope: ClinicScope, clinicId: string, keep?: string | null): boolean {
  if (scope.kind === "any") return true;
  if (scope.kind === "unlinked") return false;
  return scope.clinicIds.includes(clinicId) || (!!keep && clinicId === keep);
}
