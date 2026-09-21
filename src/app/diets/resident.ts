import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * What the diet pages need to know about the resident: the display name,
 * the size (for the quantity hint) and whether the record is closed.
 */
export async function loadDietResident(supabase: Supabase, residentId: string) {
  const [residentResult, stateResult] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, size")
      .eq("id", residentId)
      .limit(1)
      .returns<{ id: string; name: string; thai_name: string | null; size: string | null }[]>(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
  ]);
  const resident = residentResult.data?.[0];
  if (!resident) return null;
  return {
    ...resident,
    displayName: resident.thai_name ? `${resident.name} (${resident.thai_name})` : resident.name,
    isDeceased: stateResult.data?.[0]?.is_deceased ?? false,
  };
}
