import { addDaysIso, todayIso } from "@/lib/format";

/** The placement types the daily count is derived from (hospital and enclosure moves never change it). */
export const DAILY_COUNT_PLACEMENTS = [
  "Intake",
  "Adopt",
  "Foster",
  "Deceased",
  "DeceasedInError",
  "ReturnToShelter",
];

export type DailyPlacement = {
  resident_id: string;
  placement_type: string;
  start_date: string;
  end_date: string | null;
};

export type DailyPoint = {
  /** Shelter date, YYYY-MM-DD. */
  date: string;
  /** Residents at the shelter at the end of this day (hospital counts; fostered, adopted, deceased do not). */
  atShelter: number;
  /** Running totals from the first day shown. */
  intakes: number;
  adoptions: number;
  deaths: number;
};

// A resident is away from the shelter while the open placement is one of these.
const AWAY = new Set(["Foster", "Adopt", "Deceased"]);

/**
 * One point per shelter day from `firstDay` to `lastDay`: start number + intakes − fostered −
 * adopted − deceased + returned. Walks each resident's placements in order and steps the count
 * whenever they move between "at the shelter" and "away" — so a missing or mistyped placement
 * shows up as drift against a straight count (scripts/check-daily-count.mjs).
 * Adoptions and deaths follow the monthly bars' rules (a withdrawn Deceased row is no death).
 */
export function dailySeries(placements: DailyPlacement[], firstDay: string, lastDay: string): DailyPoint[] {
  const byResident = new Map<string, DailyPlacement[]>();
  for (const p of placements) {
    const list = byResident.get(p.resident_id);
    if (list) list.push(p);
    else byResident.set(p.resident_id, [p]);
  }
  let start = 0;
  const step = new Map<string, number>();
  const events = new Map<string, { intakes: number; adoptions: number; deaths: number }>();
  const bump = (day: string) => {
    let e = events.get(day);
    if (!e) events.set(day, (e = { intakes: 0, adoptions: 0, deaths: 0 }));
    return e;
  };
  for (const rows of byResident.values()) {
    rows.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    let present = false;
    for (const p of rows) {
      const day = todayIso(new Date(p.start_date));
      const now = !AWAY.has(p.placement_type);
      if (now !== present) {
        const delta = now ? 1 : -1;
        if (day < firstDay) start += delta;
        else step.set(day, (step.get(day) ?? 0) + delta);
        present = now;
      }
      if (day < firstDay) continue;
      if (p.placement_type === "Intake") bump(day).intakes += 1;
      else if (p.placement_type === "Adopt") bump(day).adoptions += 1;
      else if (p.placement_type === "Deceased" && p.end_date == null) bump(day).deaths += 1;
    }
  }
  const out: DailyPoint[] = [];
  let count = start;
  let intakes = 0;
  let adoptions = 0;
  let deaths = 0;
  for (let day = firstDay; day <= lastDay; day = addDaysIso(day, 1)) {
    count += step.get(day) ?? 0;
    const e = events.get(day);
    if (e) {
      intakes += e.intakes;
      adoptions += e.adoptions;
      deaths += e.deaths;
    }
    out.push({ date: day, atShelter: count, intakes, adoptions, deaths });
  }
  return out;
}
