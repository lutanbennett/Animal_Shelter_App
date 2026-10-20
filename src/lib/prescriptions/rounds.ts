import { scheduleKind, type FrequencySchedule } from "@/lib/prescriptions/frequency";

/**
 * The Morning / Lunch / Evening ticks on the prescription form.
 *
 * The FREQUENCY is the count of doses a day (`doses_per_day`, which the stock
 * forecast, the medication list and usage-versus-plan read); the ticks only
 * say which rounds those doses go out in. Nothing here ever feeds the count
 * back, so a four-times-daily prescription with three rounds ticked stays four
 * (Lutan, 2026-10-20: the fourth dose goes in the notes).
 */

/** Mirrors `default_frequency_round_keys` (0137): what choosing a schedule pre-ticks. */
export function defaultRoundKeys(s: FrequencySchedule): string[] {
  if (s.doses_per_day != null) {
    if (s.doses_per_day >= 3) return ["morning", "lunch", "evening"];
    if (s.doses_per_day === 2) return ["morning", "evening"];
    return ["morning"];
  }
  return s.interval_count != null ? ["morning"] : [];
}

/** As needed (and no frequency at all) is never scheduled, so it shows no ticks. */
export function showsRoundTicks(s: FrequencySchedule | null): boolean {
  return s != null && scheduleKind(s) !== "asNeeded";
}

/** How many doses a day the schedule gives; an every-N-days one gives one. */
export function dosesOwed(s: FrequencySchedule): number {
  if (s.doses_per_day != null) return s.doses_per_day;
  return s.interval_count != null ? 1 : 0;
}

/**
 * ok      — as many ticks as doses, or the schedule shows no ticks.
 * fewer   — fewer ticks than doses: normal; the extra dose goes in the notes.
 * tooMany — more ticks than doses: the one case that is a mistake.
 * none    — owes a round and none is ticked (the medication list would flag it).
 */
export type TickVerdict = "ok" | "fewer" | "tooMany" | "none";

export function tickVerdict(s: FrequencySchedule | null, ticked: number): TickVerdict {
  if (!s || !showsRoundTicks(s)) return "ok";
  const owed = dosesOwed(s);
  if (ticked === 0) return "none";
  if (ticked > owed) return "tooMany";
  return ticked < owed ? "fewer" : "ok";
}
