import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResidentCard } from "@/lib/residents/card";
import { isUuid } from "@/lib/tags/links";

/**
 * public_enclosures (0079): what a visitor who scans an enclosure's QR code
 * may see (src/app/e/[id]/page.tsx) — the enclosure's name, its zone, and
 * everyone living there as their whole public_resident_cards row (0068), so
 * the card decides what is shown about each resident. No capacity, notes or
 * maintenance, and no Lifecycle pseudo-enclosures: the view has no row for
 * Hospital, Fostered and the rest, so they read exactly like an id that
 * never existed.
 */
export type PublicEnclosure = {
  id: string;
  name: string;
  name_th: string | null;
  zone_name: string;
  zone_name_th: string | null;
  /** Ordered by name; `[]` for an empty kennel. */
  residents: ResidentCard[];
};

export async function loadPublicEnclosure(
  supabase: SupabaseClient,
  id: string,
): Promise<PublicEnclosure | null> {
  // Not a uuid would be a Postgres cast error, not an empty result.
  if (!isUuid(id)) return null;
  const { data } = await supabase
    .from("public_enclosures")
    .select("id, name, name_th, zone_name, zone_name_th, residents")
    .eq("id", id)
    .limit(1)
    .returns<PublicEnclosure[]>();
  return data?.[0] ?? null;
}
