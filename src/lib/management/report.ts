/**
 * The management dashboard's numbers, as pure functions over the rows the
 * page loads. Same approach as src/lib/vets/stats.ts: the shelter's data
 * is small (a few hundred residents, a few hundred placements and visits a
 * year), so everything for the chosen month is loaded once and the
 * sections, name lists and trend buckets are derived here rather than
 * asked of the database one aggregate at a time.
 *
 * The sections mirror the monthly report the shelter already produces by
 * hand (total in care, adopted, fostered, died, blood work split by where
 * it was done, initial vs follow-up vet visits, procedures) so the
 * dashboard can replace it, plus the things that report can't show —
 * intakes, hospitalisations, the current picture and a trend.
 */

export type ResidentRow = {
  id: string;
  name: string;
  species: string | null;
  ready_for_adoption: boolean;
  is_public_visible: boolean;
};

export type StateRow = { resident_id: string; current_status: string | null };

export type PlacementRow = {
  resident_id: string;
  placement_type: string;
  start_date: string;
  end_date: string | null;
};

export type AppointmentRow = {
  resident_id: string;
  appointment_date: string;
  status: "scheduled" | "completed" | "cancelled";
};

export type BloodTestRow = {
  resident_id: string;
  date: string;
  vet_appointment_id: string | null;
};

export type ProcedureRow = {
  resident_id: string;
  date: string;
  procedure_types: { name: string } | null;
};

export type MaintenanceRow = { status: string };

/** One resident in a section's name list; `count` > 1 renders as "Name (2)". */
export type NamedEntry = { id: string; name: string; count: number };

export type MonthWindow = {
  /** "YYYY-MM". */
  key: string;
  /** First instant of the month (local time). */
  start: Date;
  /** First instant of the following month — exclusive. */
  end: Date;
  /** The same bounds as ISO dates, for date-only columns (blood_tests.date). */
  startDate: string;
  endDate: string;
};

const MONTH_KEY = /^(\d{4})-(\d{2})$/;

/** Parses a "YYYY-MM" search param; anything else means the current month. */
export function monthWindow(key: string | undefined, now: Date): MonthWindow {
  const match = key ? MONTH_KEY.exec(key) : null;
  let year = now.getFullYear();
  let month = now.getMonth();
  if (match) {
    const m = Number(match[2]);
    if (m >= 1 && m <= 12) {
      year = Number(match[1]);
      month = m - 1;
    }
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return {
    key: toMonthKey(start),
    start,
    end,
    startDate: `${toMonthKey(start)}-01`,
    endDate: `${toMonthKey(end)}-01`,
  };
}

export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(window: MonthWindow, by: number): string {
  return toMonthKey(new Date(window.start.getFullYear(), window.start.getMonth() + by, 1));
}

/**
 * Whether a timestamp or date falls in the month. A date-only value
 * ("2026-01-31", as blood_tests.date and procedures.date come back) is
 * compared as text so the server's time zone can't shift it across a
 * month boundary; timestamptz values are compared as instants in the
 * server's local time, which is what the window was built in.
 */
function inWindow(value: string, window: MonthWindow): boolean {
  if (value.length === 10) {
    return value >= window.startDate && value < window.endDate;
  }
  const ms = new Date(value).getTime();
  return ms >= window.start.getTime() && ms < window.end.getTime();
}

/**
 * Turns rows carrying a resident_id into a name list, one entry per
 * resident with how many rows they had, ordered by name. Unknown ids
 * (a resident the role can't read, which shouldn't happen for management)
 * are skipped rather than shown as blanks.
 */
function toEntries<T extends { resident_id: string }>(
  rows: T[],
  residents: Map<string, ResidentRow>,
): NamedEntry[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.resident_id, (counts.get(row.resident_id) ?? 0) + 1);
  }
  const entries: NamedEntry[] = [];
  for (const [id, count] of counts) {
    const resident = residents.get(id);
    if (resident) entries.push({ id, name: resident.name, count });
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export function residentIndex(rows: ResidentRow[]): Map<string, ResidentRow> {
  return new Map(rows.map((r) => [r.id, r]));
}

// ---------------------------------------------------------------------------
// The month
// ---------------------------------------------------------------------------

export type MonthReport = {
  intakes: NamedEntry[];
  adopted: NamedEntry[];
  /** Foster placements that started this month. */
  fosteredNew: NamedEntry[];
  /** Fostered before the month began and still fostered on the 1st. */
  fosteredContinued: NamedEntry[];
  died: NamedEntry[];
  hospitalised: NamedEntry[];
  returned: NamedEntry[];
  /** Blood tests not linked to a vet appointment — done at the shelter. */
  bloodWorkInHouse: NamedEntry[];
  /** Blood tests linked to a vet appointment. */
  bloodWorkVetVisit: NamedEntry[];
  /** Visits this month that were the resident's first visit ever. */
  vetVisitsInitial: NamedEntry[];
  vetVisitsFollowUp: NamedEntry[];
  /** Procedures grouped by type, most frequent type first. */
  procedures: { type: string; entries: NamedEntry[]; count: number }[];
};

export function monthReport(
  window: MonthWindow,
  now: Date,
  data: {
    residents: Map<string, ResidentRow>;
    placements: PlacementRow[];
    appointments: AppointmentRow[];
    bloodTests: BloodTestRow[];
    procedures: ProcedureRow[];
  },
): MonthReport {
  const { residents, placements } = data;
  const started = (type: string) =>
    placements.filter((p) => p.placement_type === type && inWindow(p.start_date, window));
  // A Deceased placement is only ever ended by a DeceasedInError one (0049),
  // so a closed Deceased row is a death that was withdrawn — not a death.
  const died = started("Deceased").filter((p) => p.end_date == null);

  // A foster that began before the 1st and hadn't ended by then. A resident
  // moved between carers during the month shows once, under "new".
  const newFosterIds = new Set(started("Foster").map((p) => p.resident_id));
  const continued = placements.filter(
    (p) =>
      p.placement_type === "Foster" &&
      new Date(p.start_date).getTime() < window.start.getTime() &&
      (p.end_date == null || new Date(p.end_date).getTime() >= window.start.getTime()) &&
      !newFosterIds.has(p.resident_id),
  );

  // Visits that happened: not cancelled and not still in the future.
  // "Initial" is the resident's earliest such visit on record.
  const happened = data.appointments
    .filter(
      (a) => a.status !== "cancelled" && new Date(a.appointment_date).getTime() <= now.getTime(),
    )
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
  const seen = new Set<string>();
  const initial: AppointmentRow[] = [];
  const followUp: AppointmentRow[] = [];
  for (const a of happened) {
    const first = !seen.has(a.resident_id);
    seen.add(a.resident_id);
    if (!inWindow(a.appointment_date, window)) continue;
    (first ? initial : followUp).push(a);
  }

  const bloodTests = data.bloodTests.filter((b) => inWindow(b.date, window));

  const byType = new Map<string, ProcedureRow[]>();
  for (const p of data.procedures) {
    if (!inWindow(p.date, window)) continue;
    const type = p.procedure_types?.name ?? "";
    byType.set(type, [...(byType.get(type) ?? []), p]);
  }
  const procedures = [...byType.entries()]
    .map(([type, rows]) => ({ type, entries: toEntries(rows, residents), count: rows.length }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return {
    intakes: toEntries(started("Intake"), residents),
    adopted: toEntries(started("Adopt"), residents),
    fosteredNew: toEntries(started("Foster"), residents),
    fosteredContinued: toEntries(continued, residents),
    died: toEntries(died, residents),
    hospitalised: toEntries(started("SendToHospital"), residents),
    returned: toEntries(started("ReturnToShelter"), residents),
    bloodWorkInHouse: toEntries(
      bloodTests.filter((b) => b.vet_appointment_id == null),
      residents,
    ),
    bloodWorkVetVisit: toEntries(
      bloodTests.filter((b) => b.vet_appointment_id != null),
      residents,
    ),
    vetVisitsInitial: toEntries(initial, residents),
    vetVisitsFollowUp: toEntries(followUp, residents),
    procedures,
  };
}

/** Total rows behind a name list (a resident with two tests counts twice). */
export function entryTotal(entries: NamedEntry[]): number {
  return entries.reduce((sum, e) => sum + e.count, 0);
}

// ---------------------------------------------------------------------------
// Right now
// ---------------------------------------------------------------------------

/** The statuses that count as "in the shelter's care" — matches public_shelter_stats. */
export const IN_CARE_STATUSES = new Set(["Resident", "Unassigned", "Hospitalised", "Fostered"]);

export type Snapshot = {
  inCare: number;
  /** In-care residents by species, largest group first; null species read as "Other". */
  bySpecies: { species: string | null; count: number }[];
  inShelter: number;
  inHospital: number;
  fostered: number;
  unassigned: number;
  readyForAdoption: number;
  publicVisible: number;
  /** Scheduled visits in the next seven days. */
  vetVisitsDue: number;
  /** Scheduled visits whose date has passed. */
  vetVisitsOverdue: number;
  openMaintenance: number;
  blockedMaintenance: number;
};

export function snapshot(
  now: Date,
  data: {
    residents: ResidentRow[];
    states: StateRow[];
    appointments: AppointmentRow[];
    maintenance: MaintenanceRow[];
  },
): Snapshot {
  const statusOf = new Map(data.states.map((s) => [s.resident_id, s.current_status ?? "Resident"]));
  const counts = { Resident: 0, Unassigned: 0, Hospitalised: 0, Fostered: 0 };
  const species = new Map<string | null, number>();
  let readyForAdoption = 0;
  let publicVisible = 0;

  for (const r of data.residents) {
    const status = statusOf.get(r.id) ?? "Resident";
    if (status in counts) counts[status as keyof typeof counts] += 1;
    if (IN_CARE_STATUSES.has(status)) {
      const key = r.species?.trim() || null;
      species.set(key, (species.get(key) ?? 0) + 1);
    }
    if (status === "Deceased" || status === "Adopted") continue;
    if (r.ready_for_adoption) readyForAdoption += 1;
    if (r.is_public_visible) publicVisible += 1;
  }

  const nowMs = now.getTime();
  const weekMs = nowMs + 7 * 24 * 60 * 60 * 1000;
  let vetVisitsDue = 0;
  let vetVisitsOverdue = 0;
  for (const a of data.appointments) {
    if (a.status !== "scheduled") continue;
    const ms = new Date(a.appointment_date).getTime();
    if (ms < nowMs) vetVisitsOverdue += 1;
    else if (ms <= weekMs) vetVisitsDue += 1;
  }

  let openMaintenance = 0;
  let blockedMaintenance = 0;
  for (const job of data.maintenance) {
    if (job.status === "Completed") continue;
    openMaintenance += 1;
    if (job.status === "Blocked") blockedMaintenance += 1;
  }

  return {
    inCare: counts.Resident + counts.Unassigned + counts.Hospitalised + counts.Fostered,
    bySpecies: [...species.entries()]
      .map(([s, count]) => ({ species: s, count }))
      .sort((a, b) => b.count - a.count),
    inShelter: counts.Resident,
    inHospital: counts.Hospitalised,
    fostered: counts.Fostered,
    unassigned: counts.Unassigned,
    readyForAdoption,
    publicVisible,
    vetVisitsDue,
    vetVisitsOverdue,
    openMaintenance,
    blockedMaintenance,
  };
}

// ---------------------------------------------------------------------------
// Trend
// ---------------------------------------------------------------------------

export type TrendBucket = {
  /** First day of the month, ISO date. */
  month: string;
  intakes: number;
  adoptions: number;
  deaths: number;
};

/**
 * Intakes, adoptions and deaths per calendar month for the `months` months
 * ending with the one containing `now`, oldest first, empty months kept.
 */
export function trend(placements: PlacementRow[], months: number, now: Date): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  const index = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${toMonthKey(d)}-01`;
    index.set(key, buckets.length);
    buckets.push({ month: key, intakes: 0, adoptions: 0, deaths: 0 });
  }
  for (const p of placements) {
    const slot = index.get(`${toMonthKey(new Date(p.start_date))}-01`);
    if (slot == null) continue;
    if (p.placement_type === "Intake") buckets[slot].intakes += 1;
    else if (p.placement_type === "Adopt") buckets[slot].adoptions += 1;
    // A closed Deceased row is a death that was withdrawn (see monthReport).
    else if (p.placement_type === "Deceased" && p.end_date == null) buckets[slot].deaths += 1;
  }
  return buckets;
}
