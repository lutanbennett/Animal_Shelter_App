/**
 * The management dashboard's numbers, as pure functions over the rows the
 * page loads. Same approach as src/lib/clinics/stats.ts: the shelter's data
 * is small (a few hundred residents, a few hundred placements and visits a
 * year), so everything for the chosen month is loaded once and the
 * sections, name lists and trend buckets are derived here rather than
 * asked of the database one aggregate at a time.
 *
 * The sections mirror the monthly report the shelter already produces by
 * hand (total in care, adopted, fostered, died, blood work split by where
 * it was done, initial vs follow-up clinic visits, procedures) so the
 * dashboard can replace it, plus the things that report can't show —
 * intakes, hospitalisations, the current picture and a trend.
 *
 * Months are the shelter's months (Asia/Bangkok), whatever zone the server
 * runs in: see shelterMidnight() in src/lib/format.ts.
 */

import { addMonthsToKey, shelterMidnight, shelterMonthKey } from "@/lib/format";

export type ResidentRow = {
  id: string;
  name: string;
  species: string | null;
  ready_for_adoption: boolean;
  is_public_visible: boolean;
  /** That a chip is on file (0113); the number is not needed to count it. */
  has_microchip: boolean;
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
  /** Baht from the invoice (0053); null until it arrives. Only the month's visits carry it. */
  cost?: number | string | null;
};

export type ImmunizationRow = {
  resident_id: string;
  date_administered: string;
  immunization_types: { name: string; name_th?: string | null } | null;
};

export type BloodTestRow = {
  resident_id: string;
  date: string;
  clinic_visit_id: string | null;
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
  /** First instant of the month at the shelter (00:00 Asia/Bangkok). */
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
  const valid = match != null && Number(match[2]) >= 1 && Number(match[2]) <= 12;
  const monthKey = valid ? key! : toMonthKey(now);
  const startDate = `${monthKey}-01`;
  const endDate = `${addMonthsToKey(monthKey, 1)}-01`;
  return {
    key: monthKey,
    start: shelterMidnight(startDate),
    end: shelterMidnight(endDate),
    startDate,
    endDate,
  };
}

/** The shelter month an instant falls in, "YYYY-MM". */
export function toMonthKey(d: Date): string {
  return shelterMonthKey(d);
}

export function shiftMonth(window: MonthWindow, by: number): string {
  return addMonthsToKey(window.key, by);
}

/**
 * Whether a timestamp or date falls in the month. A date-only value
 * ("2026-01-31", as blood_tests.date and procedures.date come back) is
 * compared as text, since it is already a shelter date; timestamptz values
 * are compared as instants against the shelter-midnight bounds.
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
  /** Blood tests not linked to a clinic visit — done at the shelter. */
  bloodWorkInHouse: NamedEntry[];
  /** Blood tests linked to a clinic visit. */
  bloodWorkClinicVisit: NamedEntry[];
  /** Visits this month that were the resident's first visit ever. */
  clinicVisitsInitial: NamedEntry[];
  clinicVisitsFollowUp: NamedEntry[];
  /** Procedures grouped by type, most frequent type first. */
  procedures: TypedGroup[];
  /** Vaccination doses given, grouped by vaccine, most frequent first. */
  immunizations: TypedGroup[];
  /**
   * What this month's clinic visits cost, from the invoices entered on them.
   * `notInvoiced` counts visits that happened with no cost yet, so a small
   * or zero `spent` is never read as the whole bill.
   */
  clinicSpend: { spent: number; invoiced: number; notInvoiced: number };
};

export type TypedGroup = { type: string; entries: NamedEntry[]; count: number };

/** Rows grouped by a type name, most frequent type first, then by name. */
function groupByType<T extends { resident_id: string }>(
  rows: T[],
  typeOf: (row: T) => string,
  residents: Map<string, ResidentRow>,
): TypedGroup[] {
  const byType = new Map<string, T[]>();
  for (const row of rows) {
    const type = typeOf(row);
    byType.set(type, [...(byType.get(type) ?? []), row]);
  }
  return [...byType.entries()]
    .map(([type, list]) => ({ type, entries: toEntries(list, residents), count: list.length }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

function amount(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

export function monthReport(
  window: MonthWindow,
  now: Date,
  data: {
    residents: Map<string, ResidentRow>;
    placements: PlacementRow[];
    appointments: AppointmentRow[];
    bloodTests: BloodTestRow[];
    procedures: ProcedureRow[];
    immunizations: ImmunizationRow[];
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

  // Spend is the month's visits that happened, initial and follow-up alike.
  let spent = 0;
  let invoiced = 0;
  let notInvoiced = 0;
  for (const a of [...initial, ...followUp]) {
    const cost = amount(a.cost);
    if (cost == null) {
      notInvoiced += 1;
    } else {
      spent += cost;
      invoiced += 1;
    }
  }

  const bloodTests = data.bloodTests.filter((b) => inWindow(b.date, window));

  const procedures = groupByType(
    data.procedures.filter((p) => inWindow(p.date, window)),
    (p) => p.procedure_types?.name ?? "",
    residents,
  );
  const immunizations = groupByType(
    data.immunizations.filter((i) => inWindow(i.date_administered, window)),
    (i) => i.immunization_types?.name ?? "",
    residents,
  );

  return {
    intakes: toEntries(started("Intake"), residents),
    adopted: toEntries(started("Adopt"), residents),
    fosteredNew: toEntries(started("Foster"), residents),
    fosteredContinued: toEntries(continued, residents),
    died: toEntries(died, residents),
    hospitalised: toEntries(started("SendToHospital"), residents),
    returned: toEntries(started("ReturnToShelter"), residents),
    bloodWorkInHouse: toEntries(
      bloodTests.filter((b) => b.clinic_visit_id == null),
      residents,
    ),
    bloodWorkClinicVisit: toEntries(
      bloodTests.filter((b) => b.clinic_visit_id != null),
      residents,
    ),
    clinicVisitsInitial: toEntries(initial, residents),
    clinicVisitsFollowUp: toEntries(followUp, residents),
    procedures,
    immunizations,
    clinicSpend: { spent, invoiced, notInvoiced },
  };
}

/** The labels monthReportText needs, from the dashboard dictionary. */
export type ReportTextLabels = {
  heading: string;
  none: string;
  lines: { label: string; entries?: NamedEntry[]; groups?: { label: string; entries: NamedEntry[] }[]; count?: number; detail?: string }[];
};

function namesText(entries: NamedEntry[], none: string): string {
  if (entries.length === 0) return none;
  return entries.map((e) => (e.count > 1 ? `${e.name} (${e.count})` : e.name)).join(", ");
}

/**
 * The month section as plain text, for pasting into the monthly report or a
 * LINE message: one line per card, "Label: count — names", and an indented
 * line per group for the cards that have them. Plain text on purpose: LINE
 * shows markdown as typed.
 */
export function monthReportText({ heading, none, lines }: ReportTextLabels): string {
  const out = [heading, ""];
  for (const line of lines) {
    if (line.groups) {
      const total = line.count ?? line.groups.reduce((n, g) => n + entryTotal(g.entries), 0);
      out.push(`${line.label}: ${total}${line.groups.length === 0 ? ` — ${none}` : ""}`);
      for (const g of line.groups) {
        out.push(`  ${g.label}: ${entryTotal(g.entries)} — ${namesText(g.entries, none)}`);
      }
    } else if (line.entries) {
      const total = line.count ?? entryTotal(line.entries);
      out.push(`${line.label}: ${total} — ${namesText(line.entries, none)}`);
    } else {
      out.push(`${line.label}: ${line.detail ?? ""}`);
    }
  }
  return out.join("\n");
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
  outreach: number;
  readyForAdoption: number;
  publicVisible: number;
  /** In-care residents with and without a microchip on file. */
  microchipped: number;
  notMicrochipped: number;
  /** Scheduled visits in the next seven days. */
  clinicVisitsDue: number;
  /** Scheduled visits whose date has passed. */
  clinicVisitsOverdue: number;
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
  const counts = { Resident: 0, Unassigned: 0, Hospitalised: 0, Fostered: 0, Outreach: 0 };
  const species = new Map<string | null, number>();
  let readyForAdoption = 0;
  let publicVisible = 0;
  let microchipped = 0;

  for (const r of data.residents) {
    const status = statusOf.get(r.id) ?? "Resident";
    if (status in counts) counts[status as keyof typeof counts] += 1;
    if (IN_CARE_STATUSES.has(status)) {
      const key = r.species?.trim() || null;
      species.set(key, (species.get(key) ?? 0) + 1);
      if (r.has_microchip) microchipped += 1;
    }
    if (status === "Deceased" || status === "Adopted") continue;
    if (r.ready_for_adoption) readyForAdoption += 1;
    if (r.is_public_visible) publicVisible += 1;
  }

  const nowMs = now.getTime();
  const weekMs = nowMs + 7 * 24 * 60 * 60 * 1000;
  let clinicVisitsDue = 0;
  let clinicVisitsOverdue = 0;
  for (const a of data.appointments) {
    if (a.status !== "scheduled") continue;
    const ms = new Date(a.appointment_date).getTime();
    if (ms < nowMs) clinicVisitsOverdue += 1;
    else if (ms <= weekMs) clinicVisitsDue += 1;
  }

  let openMaintenance = 0;
  let blockedMaintenance = 0;
  for (const job of data.maintenance) {
    if (job.status === "Completed") continue;
    openMaintenance += 1;
    if (job.status === "Blocked") blockedMaintenance += 1;
  }

  const inCare = counts.Resident + counts.Unassigned + counts.Hospitalised + counts.Fostered;
  return {
    inCare,
    bySpecies: [...species.entries()]
      .map(([s, count]) => ({ species: s, count }))
      .sort((a, b) => b.count - a.count),
    inShelter: counts.Resident,
    inHospital: counts.Hospitalised,
    fostered: counts.Fostered,
    unassigned: counts.Unassigned,
    outreach: counts.Outreach,
    readyForAdoption,
    publicVisible,
    microchipped,
    notMicrochipped: inCare - microchipped,
    clinicVisitsDue,
    clinicVisitsOverdue,
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
 * Intakes, adoptions and deaths per shelter month for the `months` months
 * ending with `lastMonth` ("YYYY-MM"), oldest first, empty months kept.
 */
export function trend(placements: PlacementRow[], months: number, lastMonth: string): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  const index = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const key = `${addMonthsToKey(lastMonth, -i)}-01`;
    index.set(key, buckets.length);
    buckets.push({ month: key, intakes: 0, adoptions: 0, deaths: 0 });
  }
  for (const p of placements) {
    const slot = index.get(`${shelterMonthKey(p.start_date)}-01`);
    if (slot == null) continue;
    if (p.placement_type === "Intake") buckets[slot].intakes += 1;
    else if (p.placement_type === "Adopt") buckets[slot].adoptions += 1;
    // A closed Deceased row is a death that was withdrawn (see monthReport).
    else if (p.placement_type === "Deceased" && p.end_date == null) buckets[slot].deaths += 1;
  }
  return buckets;
}
