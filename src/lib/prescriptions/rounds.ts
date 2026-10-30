import { isRecurring, MAX_DOSES_PER_DAY, type RxSchedule } from "@/lib/prescriptions/schedule";

/**
 * The Morning / Lunch / Evening / Night ticks on the prescription form.
 *
 * The ticks ARE the doses: each ticked round is one dose on every scheduled day, with its own amount
 * (prescription_rounds, 0138/0234), so there is no separate dose count to keep in step with them.
 * Four a day is the most (Lutan, 2026-10-30: "keep it to 4 with additional notes if something needs to be
 * given hourly"); a dose written only in the notes is not in the forecast, by design.
 */

/** What choosing a day pattern pre-ticks: Morning, for a prescription that has days. */
export function defaultRoundKeys(s: RxSchedule | null): string[] {
  return isRecurring(s) ? ["morning"] : [];
}

/** As needed (and nothing chosen yet) is never scheduled, so it shows no ticks. */
export function showsRoundTicks(s: RxSchedule | null): boolean {
  return isRecurring(s);
}

/**
 * ok      — a scheduled prescription with between one and four rounds ticked, or one that shows no ticks.
 * none    — scheduled but no round ticked (the medication list would flag it).
 * tooMany — more than four (the form has four boxes, so only a stale or hand-made submission reaches this).
 */
export type TickVerdict = "ok" | "none" | "tooMany";

export function tickVerdict(s: RxSchedule | null, ticked: number): TickVerdict {
  if (!showsRoundTicks(s)) return "ok";
  if (ticked === 0) return "none";
  return ticked > MAX_DOSES_PER_DAY ? "tooMany" : "ok";
}
