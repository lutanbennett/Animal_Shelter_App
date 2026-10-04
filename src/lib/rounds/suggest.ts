/**
 * Rounds — the part of the day a dose or a meal belongs to (0137,
 * decisions/2026-10-04-medication-rounds.md).
 *
 * THE CLOCK SUGGESTS; THE PERSON CHOOSES. The pick list is for bagging doses up
 * *before* a round, so someone preparing lunch at 09:00 is not doing the morning
 * round. Anything that shows a round's doses must make the round an explicit
 * choice and use `suggestRound` only to pre-select it. Do not "simplify" the choice
 * away because the system could have worked it out: that is the bug this exists
 * to avoid.
 *
 * "Now" is read on the shelter's clock, Asia/Bangkok, never the runtime's: Workers
 * run in UTC, so 06:00 in Thailand is 23:00 the day before there, and a suggestion
 * taken from getUTCHours() or the local zone is wrong for seven hours of every day
 * (the same trap as F-03; scripts/check-shelter-dates.mjs pins both edges of each
 * round under several process time zones).
 *
 * Plain data and one import, so that script can load this very file.
 */

import { SHELTER_TIME_ZONE } from "@/lib/format";

export type RoundKey = "morning" | "lunch" | "evening";
export type RoundUse = "medication" | "food";

/** In day order. Mirrors the `rounds` rows seeded by 0137 (sort_order 1..3). */
export const ROUND_KEYS: readonly RoundKey[] = ["morning", "lunch", "evening"];

/** Food has no lunch round. */
export function roundsFor(use: RoundUse): readonly RoundKey[] {
  return use === "food" ? ["morning", "evening"] : ROUND_KEYS;
}

/** First hour (shelter clock, 24h) each round is suggested from. Lunch is 11:00–15:59. */
export const LUNCH_FROM_HOUR = 11;
export const EVENING_FROM_HOUR = 16;

const HOUR_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHELTER_TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

/** The hour of day, 0–23, at the shelter at this instant. */
export function shelterHour(now: Date | number = Date.now()): number {
  const hour = HOUR_FORMAT.formatToParts(now).find((p) => p.type === "hour")?.value ?? "0";
  return Number(hour) % 24;
}

/**
 * The round to pre-select. Medication: morning before 11:00, lunch 11:00–15:59,
 * evening from 16:00 (so 00:00–06:59 Thai time is still "morning", not yesterday's
 * evening: nobody is out before dawn bagging up a round that finished at night).
 * Food has no lunch, so the lunch window suggests evening: the morning feed is
 * done and the next one is the evening's.
 */
export function suggestRound(use: RoundUse, now: Date | number = Date.now()): RoundKey {
  const hour = shelterHour(now);
  if (hour < LUNCH_FROM_HOUR) return "morning";
  if (hour < EVENING_FROM_HOUR) return use === "food" ? "evening" : "lunch";
  return "evening";
}
