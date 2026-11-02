import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Which clinics this session may record a clinic visit against.
 *
 * TODAY THIS IS "ANY CLINIC" FOR EVERY LOGIN. current_user_clinic_ids() has answered a constant
 * '{}' since 0264 (supabase/migrations/0264_inert_security_leftovers.sql:629), because the
 * narrowing it used to do was keyed on a role column, which no longer exists. An empty answer
 * becomes { kind: "any" } below, so the "clinics" and "unlinked" branches are unreachable.
 * No live RLS policy on clinic_visits narrows by clinic either: insert asks visit.book and
 * update asks medical.visits (0264:76-78, 153). Who may book is decided by those cards alone.
 * See docs/decisions/2026-11-02-clinic-scope-inert.md.
 *
 * `doctorName` is only ever set on the unreachable "clinics" branch.
 */
export type ClinicScope =
  | { kind: "any" }
  | { kind: "clinics"; clinicIds: string[]; doctorName: string | null }
  | { kind: "unlinked" };

export async function loadClinicScope(supabase: SupabaseClient): Promise<ClinicScope> {
  // Whose visits these are comes from the login's own clinic links (current_user_clinic_ids), not from a column on its role.
  const { data } = await supabase.rpc("current_user_clinic_ids");
  const clinicIds = Array.isArray(data) ? (data as string[]) : [];
  if (clinicIds.length === 0) return { kind: "any" };

  const { data: userData } = await supabase.auth.getUser();
  let doctorName: string | null = null;
  if (userData.user) {
    const { data: doctor } = await supabase
      .from("doctors")
      .select("name")
      .eq("user_id", userData.user.id)
      .maybeSingle<{ name: string }>();
    doctorName = doctor?.name ?? null;
  }
  return { kind: "clinics", clinicIds, doctorName };
}

/** Whether a visit may be recorded against `clinicId`; `keep` is a clinic the visit already has. */
export function scopeAllowsClinic(scope: ClinicScope, clinicId: string, keep?: string | null): boolean {
  if (scope.kind === "any") return true;
  if (scope.kind === "unlinked") return false;
  return scope.clinicIds.includes(clinicId) || (!!keep && clinicId === keep);
}
