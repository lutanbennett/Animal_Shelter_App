import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * The homepage's impact band (docs/design/homepage-desktop.png): four big
 * numbers on the forest band under the hero.
 *
 * The mockup asks for "300+ in our care today", "animals rehomed since
 * [YEAR]", "sterilisations in local villages" and "temple and community
 * dogs supported". Only the first has data today, so until part 4 of the
 * redesign answers the other three (backlog, "Public site redesign"), the
 * band shows what public_shelter_stats can count — every figure real, none
 * a placeholder (Lutan, 2026-09-26). A new figure is one more entry here
 * and one more column on the view; the band takes 1–4 tiles.
 */

/** public_shelter_stats (0039, 0062, 0073) — counts only, granted to anon. */
export type ShelterStats = {
  in_care: number;
  in_foster: number;
  in_treatment: number;
  adopted_last_7_days: number;
  adopted_this_year: number;
};

export const SHELTER_STATS_COLUMNS =
  "in_care, in_foster, in_treatment, adopted_last_7_days, adopted_this_year";

export type ImpactStat = { key: string; value: number; label: string };

export function impactStats(t: Dictionary, stats: ShelterStats | null): ImpactStat[] {
  if (!stats) return [];
  const s = t.home.stats;
  return [
    { key: "in-care", value: stats.in_care, label: s.inCare },
    { key: "adopted-this-year", value: stats.adopted_this_year, label: s.adoptedThisYear },
    { key: "in-foster", value: stats.in_foster, label: s.inFoster },
    { key: "in-vet-care", value: stats.in_treatment, label: s.inVetCare },
  ];
}
