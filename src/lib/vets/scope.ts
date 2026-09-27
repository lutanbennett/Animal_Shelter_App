import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCurrentRole } from "@/lib/auth/app-access";

/**
 * Which clinics this session may record a vet visit against. The shelter's
 * own people book against any clinic. A vet account books against the
 * clinic it belongs to (user_roles.vet_id, 0102), set by an admin in
 * Settings → Security. A vet account with no clinic set is refused rather
 * than shown every clinic: Lutan's call, 2026-09-27 (docs/decisions.md).
 *
 * This is the forms' and actions' rule, not RLS: the database still lets a
 * vet write a visit for any clinic. Holding it in policies belongs with the
 * resident-level scope item, where a vet's database access is being decided.
 */
export type VetScope =
  | { kind: "any" }
  | { kind: "clinic"; vetId: string }
  | { kind: "unlinked" };

export async function loadVetScope(supabase: SupabaseClient): Promise<VetScope> {
  if ((await loadCurrentRole(supabase)) !== "vet") return { kind: "any" };
  const { data } = await supabase.rpc("current_user_vet_id");
  return typeof data === "string" && data ? { kind: "clinic", vetId: data } : { kind: "unlinked" };
}

/** Whether a visit may be recorded against `vetId`; `keep` is a clinic the visit already has. */
export function scopeAllowsVet(scope: VetScope, vetId: string, keep?: string | null): boolean {
  if (scope.kind === "any") return true;
  if (scope.kind === "unlinked") return false;
  return vetId === scope.vetId || (!!keep && vetId === keep);
}
