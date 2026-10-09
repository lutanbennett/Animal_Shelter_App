import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * Which clinics this session may record a clinic visit against. The
 * shelter's own people book against any clinic. A login whose role has the
 * "own clinic" clinical scope (a doctor login) books against the clinics
 * its doctor currently works at (doctors.user_id, active doctor_clinics
 * links: current_user_clinic_ids(), 0172), set by an admin in Settings →
 * Security; a doctor may work at several. A doctor login with no current
 * clinic is refused rather than shown every clinic: Lutan's call,
 * 2026-09-27 (docs/decisions.md).
 *
 * `doctorName` is the linked doctor's own name, which the Doctor field is
 * locked to when a doctor login records a visit (Lutan, 2026-10-01).
 *
 * This is the forms' and actions' rule for booking and editing. RLS agrees
 * (writes need a current clinic, current_clinic_resident_ids()) but reads
 * reach further: a doctor login also sees its own patients at any clinic it
 * has worked at (current_doctor_resident_ids(), 0172). /residents uses this
 * scope only to say whose list it is.
 */
export type ClinicScope =
  | { kind: "any" }
  | { kind: "clinics"; clinicIds: string[]; doctorName: string | null }
  | { kind: "unlinked" };

export async function loadClinicScope(supabase: SupabaseClient): Promise<ClinicScope> {
  if ((await loadPermissions())?.scopes.clinical !== "own_clinic") return { kind: "any" };
  const { data } = await supabase.rpc("current_user_clinic_ids");
  const clinicIds = Array.isArray(data) ? (data as string[]) : [];
  if (clinicIds.length === 0) return { kind: "unlinked" };

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
