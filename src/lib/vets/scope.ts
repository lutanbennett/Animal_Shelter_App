import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * Which clinics this session may record a vet visit against. The shelter's
 * own people book against any clinic. A login whose role has the "own
 * clinic" clinical scope (a vet) books against the clinics of the doctor
 * it is linked to (vet_doctors.user_id, 0125),
 * set by an admin in Settings → Security; a doctor may work at several. A
 * vet account linked to no clinic is refused rather than shown every
 * clinic: Lutan's call, 2026-09-27 (docs/decisions.md).
 *
 * `doctorName` is the linked doctor's own name, which the Doctor field is
 * locked to when a vet records a visit (Lutan, 2026-10-01). Null for a
 * login that has clinics but no doctor entry yet, whose Doctor field stays
 * free text.
 *
 * This is the forms' and actions' rule, not RLS: the database still lets a
 * vet write a visit for any of their clinics, on a resident they can see.
 * Which residents they can see is RLS (0108, current_vet_resident_ids()),
 * and /residents uses this scope only to say whose list it is.
 */
export type VetScope =
  | { kind: "any" }
  | { kind: "clinics"; vetIds: string[]; doctorName: string | null }
  | { kind: "unlinked" };

export async function loadVetScope(supabase: SupabaseClient): Promise<VetScope> {
  if ((await loadPermissions())?.scopes.clinical !== "own_clinic") return { kind: "any" };
  const { data } = await supabase.rpc("current_user_vet_ids");
  const vetIds = Array.isArray(data) ? (data as string[]) : [];
  if (vetIds.length === 0) return { kind: "unlinked" };

  const { data: userData } = await supabase.auth.getUser();
  let doctorName: string | null = null;
  if (userData.user) {
    const { data: doctor } = await supabase
      .from("vet_doctors")
      .select("name")
      .eq("user_id", userData.user.id)
      .maybeSingle<{ name: string }>();
    doctorName = doctor?.name ?? null;
  }
  return { kind: "clinics", vetIds, doctorName };
}

/** Whether a visit may be recorded against `vetId`; `keep` is a clinic the visit already has. */
export function scopeAllowsVet(scope: VetScope, vetId: string, keep?: string | null): boolean {
  if (scope.kind === "any") return true;
  if (scope.kind === "unlinked") return false;
  return scope.vetIds.includes(vetId) || (!!keep && vetId === keep);
}
