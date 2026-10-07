import type { StatCardTone } from "@/components/StatCard";

/**
 * How full an enclosure is, derived from its current resident count and
 * configured capacity. Pure and dependency-free so both the list cards and
 * the enclosure hub read the same thresholds.
 *
 * - `unknown`: no capacity recorded (e.g. Lifecycle pseudo-enclosures), so
 *   there's nothing to compare against — show the count only.
 * - `near`: at or above 80% of capacity but not yet full.
 */
export type OccupancyLevel = "ok" | "near" | "full" | "over" | "unknown";

export const NEAR_CAPACITY_RATIO = 0.8;

export function occupancyLevel(
  count: number,
  capacity: number | null,
): OccupancyLevel {
  if (capacity == null || capacity <= 0) return "unknown";
  if (count > capacity) return "over";
  if (count === capacity) return "full";
  if (count / capacity >= NEAR_CAPACITY_RATIO) return "near";
  return "ok";
}

export const OCCUPANCY_TONE: Record<OccupancyLevel, StatCardTone> = {
  ok: "success",
  near: "warning",
  full: "warning",
  over: "danger",
  unknown: "neutral",
};

/** 0–100, clamped, for the capacity bar. */
export function occupancyPercent(count: number, capacity: number | null) {
  if (capacity == null || capacity <= 0) return 0;
  return Math.min(100, Math.round((count / capacity) * 100));
}

/**
 * Places free in one enclosure: capacity minus residents, never below zero.
 * An over-capacity enclosure is zero, so it neither adds spaces nor takes any
 * from its neighbours. `null` when no capacity is recorded: there is nothing
 * to count, and a guess could send someone to move an animal into a full kennel.
 */
export function spacesFree(count: number, capacity: number | null): number | null {
  if (capacity == null || capacity <= 0) return null;
  return Math.max(0, capacity - count);
}

export type OccupancyTotals = {
  enclosures: number;
  residents: number;
  spacesFree: number;
  /** Enclosures left out of spacesFree because they have no capacity set. */
  noCapacity: number;
};

/** The figures for a zone (or all of them) over the enclosures given. */
export function occupancyTotals(
  rows: { resident_count: number; capacity: number | null }[],
): OccupancyTotals {
  const totals: OccupancyTotals = { enclosures: rows.length, residents: 0, spacesFree: 0, noCapacity: 0 };
  for (const row of rows) {
    totals.residents += row.resident_count;
    const free = spacesFree(row.resident_count, row.capacity);
    if (free == null) totals.noCapacity += 1;
    else totals.spacesFree += free;
  }
  return totals;
}
