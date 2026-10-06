import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { estimatedAgeNow, formatAge, todayIso } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { sexLabel, sizeLabel, speciesLabel, statusLabel } from "@/lib/i18n/enum-labels";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { residentPlace } from "@/lib/residents/place";
import { can, type Permissions } from "@/lib/permissions/can";
import type { ResidentRow } from "@/app/residents/ResidentsTable";
import type { Filters } from "@/lib/residents/list-view";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The residents spreadsheet (backlog, 2026-10-05). English always: the header row and the words
 * in it (status, sex, size, age) are the same for everyone, so a file sorts, filters and scripts
 * the same whoever downloaded it, and a Thai name is its own column rather than a translation.
 */
const en = getDictionary("en");

/** Ids a request may name, so a ticked-rows link cannot carry anything else into a filter. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseTickedIds(value: unknown): string[] {
  const raw = typeof value === "string" ? value : "";
  return [...new Set(raw.split(",").map((id) => id.trim()).filter((id) => UUID.test(id)))];
}

/** What the file may hold for this person: the full record, and each medical group they can read. */
export type ExportScope = {
  /** False for a volunteer: who and where only (0134). */
  full: boolean;
  prescriptions: boolean;
  visits: boolean;
  weight: boolean;
  diet: boolean;
};

export function exportScope(perms: Permissions | null, limited: boolean): ExportScope {
  return {
    full: !limited,
    prescriptions: !limited && can(perms, "medical.prescriptions", "read"),
    visits: !limited && can(perms, "medical.visits", "read"),
    weight: !limited && can(perms, "medical.weight", "read"),
    diet: !limited && can(perms, "medical.diet", "read"),
  };
}

type Detail = {
  species: string | null;
  breed: string | null;
  sex: string | null;
  size: string | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  intake_date: string | null;
  colour: string | null;
  microchip_number: string | null;
  ready_for_adoption: boolean | null;
};

type Extras = {
  detail: Map<string, Detail>;
  /** Prescriptions running today, per resident. */
  prescriptions: Map<string, number>;
  nextVisit: Map<string, { date: string; clinic: string }>;
  diet: Map<string, string>;
  weight: Map<string, { kg: number; date: string }>;
};

const CHUNK = 100;
const PAGE = 1000;

/**
 * Runs a read once per slice of ids, side by side. A resident id is 36 characters, so one `in (…)`
 * for a whole shelter would outgrow a URL; a hundred at a time is a handful of requests, never one
 * per resident.
 */
async function inChunks<T>(ids: string[], read: (chunk: string[]) => PromiseLike<T[]>): Promise<T[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
  return (await Promise.all(chunks.map((chunk) => read(chunk)))).flat();
}

async function loadExtras(supabase: Supabase, ids: string[], scope: ExportScope): Promise<Extras> {
  const today = todayIso();
  const extras: Extras = {
    detail: new Map(),
    prescriptions: new Map(),
    nextVisit: new Map(),
    diet: new Map(),
    weight: new Map(),
  };
  if (!scope.full || ids.length === 0) return extras;

  const jobs: PromiseLike<void>[] = [];

  jobs.push(
    inChunks(ids, async (chunk) =>
      (
        await supabase
          .from("residents")
          .select("id, species, breed, sex, size, estimated_age_years, age_estimated_on, intake_date, colour, microchip_number, ready_for_adoption")
          .in("id", chunk)
          .returns<(Detail & { id: string })[]>()
      ).data ?? [],
    ).then((rows) => {
      for (const row of rows) extras.detail.set(row.id, row);
    }),
  );

  if (scope.prescriptions) {
    // Running today by the shelter's date: started, not ended, not archived (the hub's rule).
    jobs.push(
      inChunks(ids, async (chunk) =>
        (
          await supabase
            .from("prescriptions")
            .select("resident_id")
            .in("resident_id", chunk)
            .is("archived_at", null)
            .lte("start_date", today)
            .or(`end_date.is.null,end_date.gte.${today}`)
            .returns<{ resident_id: string }[]>()
        ).data ?? [],
      ).then((rows) => {
        for (const row of rows) extras.prescriptions.set(row.resident_id, (extras.prescriptions.get(row.resident_id) ?? 0) + 1);
      }),
    );
  }

  if (scope.visits) {
    // The next one still to come: scheduled, today or later at the shelter, soonest first.
    jobs.push(
      inChunks(ids, async (chunk) =>
        (
          await supabase
            .from("vet_appointments")
            .select("resident_id, appointment_date, vets(name)")
            .in("resident_id", chunk)
            .is("archived_at", null)
            .eq("status", "scheduled")
            .gte("appointment_date", `${today}T00:00:00+07:00`)
            .order("appointment_date")
            .returns<{ resident_id: string; appointment_date: string; vets: { name: string } | { name: string }[] | null }[]>()
        ).data ?? [],
      ).then((rows) => {
        for (const row of rows.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))) {
          if (extras.nextVisit.has(row.resident_id)) continue;
          const vet = Array.isArray(row.vets) ? row.vets[0] : row.vets;
          extras.nextVisit.set(row.resident_id, {
            date: todayIso(new Date(row.appointment_date).getTime()),
            clinic: vet?.name ?? "",
          });
        }
      }),
    );
  }

  if (scope.diet) {
    jobs.push(
      inChunks(ids, async (chunk) =>
        (
          await supabase
            .from("resident_diets")
            .select("resident_id, diet_types(name)")
            .in("resident_id", chunk)
            .lte("start_date", today)
            .or(`end_date.is.null,end_date.gte.${today}`)
            .returns<{ resident_id: string; diet_types: { name: string } | { name: string }[] | null }[]>()
        ).data ?? [],
      ).then((rows) => {
        for (const row of rows) {
          const type = Array.isArray(row.diet_types) ? row.diet_types[0] : row.diet_types;
          if (!type) continue;
          const names = extras.diet.get(row.resident_id);
          extras.diet.set(row.resident_id, names ? `${names}; ${type.name}` : type.name);
        }
      }),
    );
  }

  if (scope.weight) {
    // Newest first, so the first reading seen for a resident is the latest. A resident has many,
    // so each slice is read a page at a time past the API's row cap.
    jobs.push(
      inChunks(ids, async (chunk) => {
        const all: { resident_id: string; date: string; weight_kg: number }[] = [];
        for (let from = 0; ; from += PAGE) {
          const { data } = await supabase
            .from("weight")
            .select("resident_id, date, weight_kg")
            .in("resident_id", chunk)
            .is("archived_at", null)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .range(from, from + PAGE - 1)
            .returns<{ resident_id: string; date: string; weight_kg: number }[]>();
          all.push(...(data ?? []));
          if ((data?.length ?? 0) < PAGE) break;
        }
        return all;
      }).then((rows) => {
        for (const row of rows) {
          const seen = extras.weight.get(row.resident_id);
          if (!seen || row.date > seen.date) extras.weight.set(row.resident_id, { kg: row.weight_kg, date: row.date });
        }
      }),
    );
  }

  await Promise.all(jobs);
  return extras;
}

/** The year an estimated age points back to, from today: a number, so the column sorts. */
function estimatedBirthYear(years: number | null, estimatedOn: string | null): string {
  const age = estimatedAgeNow(years, estimatedOn);
  if (age == null) return "";
  return String(new Date(Date.now() - age * 365.25 * 24 * 3600 * 1000).getUTCFullYear());
}

type Column = {
  header: string;
  /** The group of columns this one belongs to; it is in the file only when the person's scope has it. */
  group: "who" | "record" | "prescriptions" | "visits" | "diet" | "weight";
  value: (row: ResidentRow, extras: Extras) => string;
};

const yesNo = (value: boolean | null | undefined) => (value ? "Yes" : "No");

/** In the order the sheet reads: who, what kind, where, then the medical columns. */
const COLUMNS: readonly Column[] = [
  { header: "R-code", group: "who", value: (r) => r.resident_code },
  { header: "Name", group: "who", value: (r) => r.name },
  { header: "Thai name", group: "who", value: (r) => r.thai_name ?? "" },
  { header: "Other names", group: "record", value: (r) => r.other_names ?? "" },
  { header: "Species", group: "who", value: (r, x) => speciesOf(r, x) },
  { header: "Breed", group: "record", value: (r, x) => x.detail.get(r.resident_id)?.breed ?? "" },
  { header: "Sex", group: "who", value: (r, x) => sexOf(r, x) },
  {
    header: "Age",
    group: "record",
    value: (r, x) => {
      const d = x.detail.get(r.resident_id);
      return d ? formatAge(en, d.estimated_age_years, d.age_estimated_on) : "";
    },
  },
  {
    header: "Estimated birth year",
    group: "record",
    value: (r, x) => {
      const d = x.detail.get(r.resident_id);
      return d ? estimatedBirthYear(d.estimated_age_years, d.age_estimated_on) : "";
    },
  },
  { header: "Size", group: "record", value: (r, x) => sizeLabelOrBlank(x.detail.get(r.resident_id)?.size) },
  { header: "Colour", group: "record", value: (r, x) => x.detail.get(r.resident_id)?.colour ?? "" },
  { header: "Microchipped", group: "record", value: (r, x) => yesNo(Boolean(x.detail.get(r.resident_id)?.microchip_number)) },
  {
    header: "Zone",
    group: "who",
    // The Lifecycle pseudo-zone holds Hospital / Fostered / Adopted, which is the Status column's job.
    value: (r) => (r.zone_name === SYSTEM_ZONE ? "" : (r.zone_name ?? "")),
  },
  { header: "Enclosure", group: "who", value: (r) => r.enclosure_name ?? "" },
  { header: "Status", group: "who", value: (r) => (r.current_status ? statusLabel(en, r.current_status) : "") },
  {
    header: "Place",
    group: "who",
    value: (r) => {
      const place = residentPlace(r.current_status);
      return place ? en.enclosures.hub[place] : "";
    },
  },
  { header: "Intake date", group: "record", value: (r, x) => x.detail.get(r.resident_id)?.intake_date ?? "" },
  { header: "Ready for adoption", group: "record", value: (r, x) => yesNo(x.detail.get(r.resident_id)?.ready_for_adoption) },
  { header: "Prescriptions running today", group: "prescriptions", value: (r, x) => String(x.prescriptions.get(r.resident_id) ?? 0) },
  { header: "Next vet visit", group: "visits", value: (r, x) => x.nextVisit.get(r.resident_id)?.date ?? "" },
  { header: "Next vet visit clinic", group: "visits", value: (r, x) => x.nextVisit.get(r.resident_id)?.clinic ?? "" },
  { header: "Current diet", group: "diet", value: (r, x) => x.diet.get(r.resident_id) ?? "" },
  { header: "Latest weight (kg)", group: "weight", value: (r, x) => (x.weight.has(r.resident_id) ? String(x.weight.get(r.resident_id)!.kg) : "") },
  { header: "Latest weight date", group: "weight", value: (r, x) => x.weight.get(r.resident_id)?.date ?? "" },
];

function sizeLabelOrBlank(size: string | null | undefined) {
  return size ? sizeLabel(en, size) : "";
}

// A volunteer's rows come from `resident_who_and_where`, which carries species and sex itself; the
// full list view does not, so those two come from the resident's own row.
function speciesOf(row: ResidentRow & { species?: string | null }, extras: Extras) {
  const value = row.species ?? extras.detail.get(row.resident_id)?.species;
  return value ? speciesLabel(en, value) : "";
}
function sexOf(row: ResidentRow & { sex?: string | null }, extras: Extras) {
  const value = row.sex ?? extras.detail.get(row.resident_id)?.sex;
  return value ? sexLabel(en, value) : "";
}

/** A row's own species and sex (a volunteer's view has them), carried alongside the list shape. */
export type ExportRow = ResidentRow & { species?: string | null; sex?: string | null };

/** The CSV text for these residents, with only the columns this person may have. */
export async function buildResidentsCsv(supabase: Supabase, rows: ExportRow[], scope: ExportScope): Promise<string> {
  const extras = await loadExtras(supabase, rows.map((r) => r.resident_id), scope);
  const groups = new Set<Column["group"]>(["who"]);
  if (scope.full) groups.add("record");
  if (scope.prescriptions) groups.add("prescriptions");
  if (scope.visits) groups.add("visits");
  if (scope.diet) groups.add("diet");
  if (scope.weight) groups.add("weight");
  const columns = COLUMNS.filter((c) => groups.has(c.group));
  return toCsv([columns.map((c) => c.header), ...rows.map((row) => columns.map((c) => c.value(row, extras)))]);
}

/**
 * residents-on-site-with-deceased-2026-10-06.csv: the view's place and toggles, then the shelter's
 * date. Plain ASCII, so it saves under the same name on every phone.
 */
export function exportFilename(view: Pick<Filters, "q" | "place" | "zoneIds" | "enclosureId" | "adopted" | "chippedIds"> & { showAll: boolean; noChip: boolean }, ticked: number, now: number = Date.now()): string {
  const parts = ["residents"];
  if (ticked > 0) parts.push("selected");
  if (view.place !== "all") parts.push(view.place === "internal" ? "on-site" : "off-site");
  if (view.adopted) parts.push("adopted");
  if (view.q || view.zoneIds.length > 0 || view.enclosureId || view.noChip) parts.push("filtered");
  if (view.showAll) parts.push("with-deceased");
  parts.push(todayIso(now));
  return `${parts.join("-")}.csv`;
}
