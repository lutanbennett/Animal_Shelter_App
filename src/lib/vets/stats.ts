/**
 * Vet visit statistics, shared by the `/vets` list and the vet hub. Pure
 * functions over the appointment rows: the shelter books a few hundred
 * visits a year at most, so every row for a vet is loaded once and the
 * period filter, monthly buckets and per-resident roll-ups are all computed
 * from that one list rather than re-queried per period.
 */

export type VisitStatus = "scheduled" | "completed" | "cancelled";

export type VetVisit = {
  id: string;
  resident_id: string;
  appointment_date: string;
  status: VisitStatus;
  reason: string | null;
};

/** How far back the hub looks; `null` is all time. */
export const VISIT_PERIODS = [3, 6, 12, null] as const;
export type VisitPeriod = (typeof VISIT_PERIODS)[number];

export const DEFAULT_VISIT_PERIOD: VisitPeriod = 6;

/** The first instant of the period, `months` back from `now`; null = no cut-off. */
export function periodStart(months: VisitPeriod, now: Date): Date | null {
  if (months == null) return null;
  const start = new Date(now);
  start.setMonth(start.getMonth() - months);
  return start;
}

/**
 * The visits that count towards "what happened in the last N months":
 * anything dated inside the window and not cancelled. Scheduled future
 * visits are excluded — they haven't happened yet, and get their own
 * upcoming/overdue card.
 */
export function visitsInPeriod(
  visits: VetVisit[],
  months: VisitPeriod,
  now: Date,
): VetVisit[] {
  const start = periodStart(months, now)?.getTime() ?? -Infinity;
  const end = now.getTime();
  return visits.filter((v) => {
    if (v.status === "cancelled") return false;
    const ms = new Date(v.appointment_date).getTime();
    return ms >= start && ms <= end;
  });
}

export type ScheduleSummary = {
  /** Scheduled and still in the future, soonest first. */
  upcoming: VetVisit[];
  /** Scheduled but the date has passed — needs a status update. */
  overdue: VetVisit[];
};

export function scheduleSummary(visits: VetVisit[], now: Date): ScheduleSummary {
  const nowMs = now.getTime();
  const scheduled = visits.filter((v) => v.status === "scheduled");
  return {
    upcoming: scheduled
      .filter((v) => new Date(v.appointment_date).getTime() >= nowMs)
      .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date)),
    overdue: scheduled.filter(
      (v) => new Date(v.appointment_date).getTime() < nowMs,
    ),
  };
}

/** The most recent visit that actually happened (completed or past). */
export function lastVisit(visits: VetVisit[], now: Date): VetVisit | null {
  const nowMs = now.getTime();
  return (
    visits
      .filter(
        (v) =>
          v.status !== "cancelled" &&
          new Date(v.appointment_date).getTime() <= nowMs,
      )
      .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))[0] ??
    null
  );
}

export type ResidentVisitSummary = {
  resident_id: string;
  visitCount: number;
  lastVisit: string;
  /** The reasons given, most recent first, de-duplicated. */
  reasons: string[];
};

/** One row per resident the vet saw, most recently seen first. */
export function visitsByResident(visits: VetVisit[]): ResidentVisitSummary[] {
  const byResident = new Map<string, ResidentVisitSummary>();
  const newestFirst = [...visits].sort((a, b) =>
    b.appointment_date.localeCompare(a.appointment_date),
  );
  for (const v of newestFirst) {
    const entry = byResident.get(v.resident_id) ?? {
      resident_id: v.resident_id,
      visitCount: 0,
      lastVisit: v.appointment_date,
      reasons: [],
    };
    entry.visitCount += 1;
    if (v.reason && !entry.reasons.includes(v.reason)) entry.reasons.push(v.reason);
    byResident.set(v.resident_id, entry);
  }
  return [...byResident.values()].sort((a, b) =>
    b.lastVisit.localeCompare(a.lastVisit),
  );
}

export type MonthBucket = {
  /** First day of the month, ISO date. */
  month: string;
  count: number;
};

/**
 * Visits per calendar month for the last `months` months ending with the
 * current one, oldest first, with empty months kept so the bars line up.
 * Cancelled visits are left out, matching visitsInPeriod().
 */
export function visitsByMonth(
  visits: VetVisit[],
  months: number,
  now: Date,
): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const index = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    index.set(key, buckets.length);
    buckets.push({ month: key, count: 0 });
  }
  for (const v of visits) {
    if (v.status === "cancelled") continue;
    const slot = index.get(monthKey(new Date(v.appointment_date)));
    if (slot != null) buckets[slot].count += 1;
  }
  return buckets;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
