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
