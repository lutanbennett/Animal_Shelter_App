"use server";

import { runWriteAction } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { logAssistantAction } from "@/lib/assistant/audit";
import { contactRelation } from "@/lib/contacts/visibility";
import { can, type Permissions } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { spacesFree } from "@/lib/enclosures/occupancy";
import { SECTION_READS } from "@/lib/residents/section-reads";
import type {
  DueDraft,
  FindEnclosureDraft,
  SummaryDraft,
  WhereDraft,
  WhoDraft,
} from "@/lib/assistant/types";
import { addDaysIso, todayIso } from "@/lib/format";

/** Rows per list in a summary: enough to be useful, short enough to read. */
const SUMMARY_ROWS = 5;

/** The roomiest enclosures the free-space answer lists, before "and N more". */
const FREE_SHOWN = 8;

/**
 * The three questions that write nothing. They are answered here rather
 * than from the rows the page already loaded, because a question about
 * where someone is deserves the current answer, not the one that was true
 * when the tab was opened.
 *
 * Every query is one the app already runs: resident_list_view for a
 * resident and for an enclosure's occupants (the enclosure page's own
 * two-step, view first and photos second), and the dashboard's
 * seven-day scheduled-visit window for what is due.
 *
 * These are the only intents a volunteer gets, so the gate here is
 * "can open the assistant at all" rather than "may write".
 */

type ResidentBrief = {
  id: string;
  name: string;
  thaiName: string | null;
  code: string;
  photoFileId: string | null;
};

export type WhereAnswer = {
  kind: "where";
  resident: ResidentBrief;
  status: string | null;
  enclosureId: string | null;
  enclosureName: string | null;
  enclosureNameTh: string | null;
  zoneName: string | null;
  zoneNameTh: string | null;
  /**
   * A fostered resident is not at the shelter; the answer is the carer
   * (null name: the placement has none recorded). Absent otherwise.
   */
  fosterCarer?: { name: string | null };
};

export type WhoAnswer = {
  kind: "who";
  enclosure: { id: string; name: string; nameTh: string | null };
  residents: ResidentBrief[];
};

export type DueVisit = {
  id: string;
  residentId: string;
  /** ISO timestamp. */
  when: string;
  reason: string | null;
  clinicName: string | null;
};

export type DueJob = {
  id: string;
  jobCode: string;
  title: string;
  /** YYYY-MM-DD. */
  dueDate: string;
  status: string;
  placeName: string | null;
  placeNameTh: string | null;
};

export type DueAnswer = {
  kind: "due";
  days: number;
  /** Scheduled visits whose date has already passed. */
  overdueVisits: DueVisit[];
  /** Scheduled visits inside the window. */
  visits: DueVisit[];
  /** Open maintenance jobs due inside the window, overdue ones included. */
  jobs: DueJob[];
};

/** One enclosure with room in it, as "where is there space?" reports it. */
export type FreeEnclosure = {
  id: string;
  name: string;
  nameTh: string | null;
  zoneName: string | null;
  zoneNameTh: string | null;
  capacity: number;
  residentCount: number;
  /** Capacity minus headcount, never below zero. */
  spacesFree: number;
};

export type FindEnclosureAnswer = {
  kind: "find-enclosure";
  /** How many places were asked for. */
  places: number;
  /** The zone the question narrowed to, when it named one. */
  zoneName: string | null;
  zoneNameTh: string | null;
  /** Roomiest first, the longest list the answer shows. */
  enclosures: FreeEnclosure[];
  /** How many have room in all, which is more than the list when it was cut short. */
  total: number;
  /**
   * Enclosures with no capacity recorded, which are left out rather than
   * guessed at — said out loud, because a silent omission reads as "full".
   */
  unknownCapacity: number;
};

/** Which parts of a summary this login may read, from the resident hub's own map. */
export type SummarySections = {
  weight: boolean;
  prescriptions: boolean;
  visits: boolean;
  immunizations: boolean;
};

export type SummaryVisit = {
  id: string;
  /** ISO timestamp. */
  when: string;
  status: string;
  reason: string | null;
  clinicName: string | null;
};

export type SummaryAnswer = {
  kind: "summary";
  /** Where they are, in the same shape the "where is …" question answers. */
  where: WhereAnswer;
  sections: SummarySections;
  /** Most recent reading, or null for none recorded. Only meaningful when `sections.weight`. */
  weight: { date: string; weightKg: number } | null;
  /** Prescriptions not yet ended. */
  prescriptions: { id: string; name: string; nameTh: string | null; startDate: string; endDate: string | null }[];
  /** The soonest still-scheduled visit, and the most recent one that has been. */
  nextVisit: SummaryVisit | null;
  lastVisit: SummaryVisit | null;
  /** The most recent vaccinations, newest first. */
  immunizations: { id: string; date: string; name: string | null; nameTh: string | null }[];
};

export type LookupAnswer = WhereAnswer | WhoAnswer | DueAnswer | FindEnclosureAnswer | SummaryAnswer;
export type LookupResult = { error: string } | { answer: LookupAnswer };

type ListRow = {
  resident_id: string;
  name: string;
  thai_name: string | null;
  resident_code: string;
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
  zone_name: string | null;
  zone_name_th: string | null;
  profile_photo_drive_file_id: string | null;
};

// resident_who_and_where, not resident_list_view: the narrow view is what the who-and-where
// activity reads, and it carries the photo, so no second read of `residents` (which asks the
// whole record) is needed. `id` is aliased so the rows keep the shape they always had.
const LIST_COLUMNS =
  "resident_id:id, name, thai_name, resident_code, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th, profile_photo_drive_file_id";

/** The carer on a resident's current placement, through the contact view the asker may read. */
async function carerName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  residentId: string,
): Promise<string | null> {
  const perms = await loadPermissions();
  const { data: state } = await supabase
    .from("resident_current_state")
    .select("current_carer_id")
    .eq("resident_id", residentId)
    .limit(1)
    .returns<{ current_carer_id: string | null }[]>();
  const carerId = state?.[0]?.current_carer_id;
  if (!carerId) return null;
  const { data } = await supabase
    .from(contactRelation(perms))
    .select("name")
    .eq("id", carerId)
    .limit(1)
    .returns<{ name: string }[]>();
  return data?.[0]?.name ?? null;
}

/** Where one resident is. Shared by the "where is …" question and the summary. */
async function loadWhere(
  supabase: Awaited<ReturnType<typeof createClient>>,
  residentId: string,
): Promise<{ error: string } | { where: WhereAnswer }> {
  const { t } = await getT();
  const { data, error } = await supabase
    .from("resident_who_and_where")
    .select(LIST_COLUMNS)
    .eq("id", residentId)
    .limit(1)
    .returns<ListRow[]>();
  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) return { error: t.assistant.lookups.residentNotFound };

  const fosterCarer =
    row.current_status === "Fostered"
      ? { name: await carerName(supabase, row.resident_id) }
      : undefined;
  return {
    where: {
      kind: "where",
      resident: {
        id: row.resident_id,
        name: row.name,
        thaiName: row.thai_name,
        code: row.resident_code,
        photoFileId: row.profile_photo_drive_file_id,
      },
      status: row.current_status,
      enclosureId: row.enclosure_id,
      enclosureName: row.enclosure_name,
      enclosureNameTh: row.enclosure_name_th,
      zoneName: row.zone_name,
      zoneNameTh: row.zone_name_th,
      fosterCarer,
    },
  };
}

async function answerWhere(
  supabase: Awaited<ReturnType<typeof createClient>>,
  residentId: string,
): Promise<LookupResult> {
  const result = await loadWhere(supabase, residentId);
  return "error" in result ? result : { answer: result.where };
}

async function answerWho(
  supabase: Awaited<ReturnType<typeof createClient>>,
  enclosureId: string,
): Promise<LookupResult> {
  const { t } = await getT();
  const [enclosureResult, occupantsResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, name, name_th")
      .eq("id", enclosureId)
      .limit(1)
      .returns<{ id: string; name: string; name_th: string | null }[]>(),
    supabase
      .from("resident_who_and_where")
      .select(LIST_COLUMNS)
      .eq("enclosure_id", enclosureId)
      .order("name")
      .returns<ListRow[]>(),
  ]);

  if (enclosureResult.error) return { error: enclosureResult.error.message };
  if (occupantsResult.error) return { error: occupantsResult.error.message };
  const enclosure = enclosureResult.data?.[0];
  if (!enclosure) return { error: t.assistant.lookups.enclosureNotFound };

  const rows = occupantsResult.data ?? [];

  return {
    answer: {
      kind: "who",
      enclosure: { id: enclosure.id, name: enclosure.name, nameTh: enclosure.name_th },
      residents: rows.map((r) => ({
        id: r.resident_id,
        name: r.name,
        thaiName: r.thai_name,
        code: r.resident_code,
        photoFileId: r.profile_photo_drive_file_id,
      })),
    },
  };
}

type AppointmentRow = {
  id: string;
  resident_id: string;
  appointment_date: string;
  reason: string | null;
  clinics: { name: string } | null;
};

type JobRow = {
  id: string;
  job_code: string;
  title: string;
  due_date: string;
  status: string;
  enclosures: { name: string; name_th: string | null } | null;
  zones: { name: string; name_th: string | null } | null;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function answerDue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  days: number,
  /** The asker's own calendar date, YYYY-MM-DD, from their browser. */
  today: string,
): Promise<LookupResult> {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  // `maintenance.due_date` is a date, not an instant, so its upper bound
  // has to be a calendar date — and deriving one from a UTC timestamp is
  // how you get "yesterday" for the first seven hours of every day in
  // Thailand (backlog d98695a). It comes from the asker's clock, falling
  // back to the shelter's calendar — never the server's — if the browser
  // sent nonsense.
  const endDate = addDaysIso(ISO_DATE.test(today) ? today : todayIso(), days);

  const [visitsResult, jobsResult] = await Promise.all([
    // The dashboard's own "due" set: still scheduled, and either already
    // past or inside the window (src/lib/management/report.ts).
    supabase
      .from("clinic_visits")
      .select("id, resident_id, appointment_date, reason, clinics(name)")
      .is("archived_at", null)
      .eq("status", "scheduled")
      .lt("appointment_date", end.toISOString())
      .order("appointment_date")
      .returns<AppointmentRow[]>(),
    supabase
      .from("maintenance")
      .select("id, job_code, title, due_date, status, enclosures(name, name_th), zones(name, name_th)")
      .neq("status", "Completed")
      .not("due_date", "is", null)
      .lte("due_date", endDate)
      .order("due_date")
      .returns<JobRow[]>(),
  ]);

  if (visitsResult.error) return { error: visitsResult.error.message };
  if (jobsResult.error) return { error: jobsResult.error.message };

  const nowMs = now.getTime();
  const visits: DueVisit[] = [];
  const overdueVisits: DueVisit[] = [];
  for (const row of visitsResult.data ?? []) {
    const visit: DueVisit = {
      id: row.id,
      residentId: row.resident_id,
      when: row.appointment_date,
      reason: row.reason,
      clinicName: row.clinics?.name ?? null,
    };
    if (new Date(visit.when).getTime() < nowMs) overdueVisits.push(visit);
    else visits.push(visit);
  }

  return {
    answer: {
      kind: "due",
      days,
      overdueVisits,
      visits,
      jobs: (jobsResult.data ?? []).map((row) => ({
        id: row.id,
        jobCode: row.job_code,
        title: row.title,
        dueDate: row.due_date,
        status: row.status,
        placeName: row.enclosures?.name ?? row.zones?.name ?? null,
        placeNameTh: row.enclosures?.name_th ?? row.zones?.name_th ?? null,
      })),
    },
  };
}

/**
 * The enclosures with room, roomiest first. Capacity and headcount are the
 * enclosure list's own (`loadEnclosureOptions`), so this answer and that
 * page can never disagree; `spacesFree` is the same arithmetic as its bar.
 * An enclosure with no capacity recorded is not guessed at — it is counted
 * and reported, because leaving it out silently reads as "full".
 */
async function answerFindEnclosure(
  supabase: Awaited<ReturnType<typeof createClient>>,
  zoneId: string | null,
  places: number,
): Promise<LookupResult> {
  const { zones, enclosures, error } = await loadEnclosureOptions(supabase);
  if (error) return { error };
  const zone = zoneId ? (zones.find((z) => z.id === zoneId) ?? null) : null;
  if (zoneId && !zone) {
    const { t } = await getT();
    return { error: t.assistant.lookups.zoneNotFound };
  }

  const inScope = zone ? enclosures.filter((e) => e.zoneId === zone.id) : enclosures;
  const zoneOf = new Map(zones.map((z) => [z.id, z]));
  const free: FreeEnclosure[] = [];
  let unknownCapacity = 0;
  for (const e of inScope) {
    const spaces = spacesFree(e.residentCount, e.capacity);
    if (spaces === null) {
      unknownCapacity += 1;
      continue;
    }
    if (spaces < places) continue;
    const z = zoneOf.get(e.zoneId);
    free.push({
      id: e.id,
      name: e.name,
      nameTh: e.name_th,
      zoneName: z?.name ?? null,
      zoneNameTh: z?.name_th ?? null,
      capacity: e.capacity ?? 0,
      residentCount: e.residentCount,
      spacesFree: spaces,
    });
  }
  free.sort((a, b) => b.spacesFree - a.spacesFree || a.name.localeCompare(b.name));

  return {
    answer: {
      kind: "find-enclosure",
      places,
      zoneName: zone?.name ?? null,
      zoneNameTh: zone?.name_th ?? null,
      // Roomiest first and cut short: the shelter has 47 enclosures with room
      // on an ordinary day, and a list that long is not an answer. The count
      // is kept so the reply can say how many there are in all.
      enclosures: free.slice(0, FREE_SHOWN),
      total: free.length,
      unknownCapacity,
    },
  };
}

/**
 * One resident, gathered: where they are, then the medical parts.
 *
 * Each part is read only when this login holds the activity the resident
 * hub's own tab asks for (`SECTION_READS`), and a part it may not read is
 * not queried and not mentioned — the same information, under the same
 * cards, as clicking through the hub would give. Nothing here is keyed on a
 * role, and nothing is loaded "just in case".
 */
async function answerSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  perms: Permissions,
  residentId: string,
): Promise<LookupResult> {
  const where = await loadWhere(supabase, residentId);
  if ("error" in where) return where;

  const sections: SummarySections = {
    weight: can(perms, SECTION_READS.weight, "read"),
    prescriptions: can(perms, SECTION_READS.prescriptions, "read"),
    visits: can(perms, SECTION_READS["clinic-visits"], "read"),
    immunizations: can(perms, SECTION_READS.immunizations, "read"),
  };
  const today = todayIso();

  const [weightResult, rxResult, visitResult, immResult] = await Promise.all([
    sections.weight
      ? supabase
          .from("weight")
          .select("date, weight_kg")
          .is("archived_at", null)
          .eq("resident_id", residentId)
          .order("date", { ascending: false })
          .limit(1)
          .returns<{ date: string; weight_kg: number }[]>()
      : Promise.resolve({ data: [], error: null }),
    sections.prescriptions
      ? supabase
          .from("prescriptions")
          .select("id, start_date, end_date, medication:picker_medications(name, name_th)")
          .is("archived_at", null)
          .eq("resident_id", residentId)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("start_date", { ascending: false })
          .limit(SUMMARY_ROWS)
          .returns<
            { id: string; start_date: string; end_date: string | null; medication: { name: string; name_th: string | null } | null }[]
          >()
      : Promise.resolve({ data: [], error: null }),
    sections.visits
      ? supabase
          .from("clinic_visits")
          .select("id, appointment_date, status, reason, clinics(name)")
          .is("archived_at", null)
          .eq("resident_id", residentId)
          .order("appointment_date", { ascending: false })
          .returns<
            { id: string; appointment_date: string; status: string; reason: string | null; clinics: { name: string } | null }[]
          >()
      : Promise.resolve({ data: [], error: null }),
    sections.immunizations
      ? supabase
          .from("immunization_records")
          .select("id, date_administered, immunization_types:picker_immunization_types(name, name_th)")
          .is("archived_at", null)
          .eq("resident_id", residentId)
          .order("date_administered", { ascending: false })
          .limit(SUMMARY_ROWS)
          .returns<
            { id: string; date_administered: string; immunization_types: { name: string; name_th: string | null } | null }[]
          >()
      : Promise.resolve({ data: [], error: null }),
  ]);

  const problem =
    weightResult.error?.message ?? rxResult.error?.message ?? visitResult.error?.message ?? immResult.error?.message;
  if (problem) return { error: problem };

  const visits = (visitResult.data ?? []).map((v) => ({
    id: v.id,
    when: v.appointment_date,
    status: v.status,
    reason: v.reason,
    clinicName: v.clinics?.name ?? null,
  }));
  const nowMs = Date.now();
  // Ordered newest first, so the soonest one still ahead is the last of those ahead.
  const ahead = visits.filter((v) => v.status === "scheduled" && new Date(v.when).getTime() >= nowMs);

  return {
    answer: {
      kind: "summary",
      where: where.where,
      sections,
      weight: weightResult.data?.[0]
        ? { date: weightResult.data[0].date, weightKg: weightResult.data[0].weight_kg }
        : null,
      prescriptions: (rxResult.data ?? []).map((p) => ({
        id: p.id,
        name: p.medication?.name ?? "",
        nameTh: p.medication?.name_th ?? null,
        startDate: p.start_date,
        endDate: p.end_date,
      })),
      nextVisit: ahead[ahead.length - 1] ?? null,
      lastVisit: visits.find((v) => new Date(v.when).getTime() < nowMs) ?? null,
      immunizations: (immResult.data ?? []).map((r) => ({
        id: r.id,
        date: r.date_administered,
        name: r.immunization_types?.name ?? null,
        nameTh: r.immunization_types?.name_th ?? null,
      })),
    },
  };
}

/**
 * Answers one read-only question and records the turn, as every other
 * intent does. `result_table` / `result_row_id` stay null: the ANSWER wrote no
 * row of its own (0070).
 *
 * PI FAILOVER (D), 2026-11-01: THE QUESTION IS READ-ONLY; THIS ACTION IS NOT.
 * It records the turn, and recording the turn is an insert into
 * `assistant_actions`, so this is a write and is wrapped like every other.
 * `docs/decisions/2026-11-01-write-paths-admin-sweep.md` listed this module
 * among "the assistant's two read modules" and
 * `scripts/check-wrapped-write-paths.mjs` reported it as a module-granularity
 * false positive; it was neither. Nothing above but the sentence quoted above
 * said so, and that sentence is about the answer, not the row.
 *
 * The wrapper goes AROUND the answer and the audit row together, so a replay
 * hands back the first attempt's own answer and leaves exactly one row. The
 * card check stays outside it: it writes nothing, so a refused lookup spends
 * no id.
 *
 * `LookupResult` is deliberately left as it was rather than reshaped to
 * `ActionResult`: six helpers in this file and six branches below return it,
 * and the answer travels back through one line here instead.
 */
export async function assistantLookup(input: {
  request: string;
  draft: WhereDraft | WhoDraft | DueDraft | FindEnclosureDraft | SummaryDraft;
  /** The asker's own calendar date, YYYY-MM-DD; see `answerDue`. */
  today: string;
  /** Pi failover (D): the browser's own id for this attempt. */
  requestId: string;
}): Promise<LookupResult> {
  const { t } = await getT();
  const supabase = await createClient();

  const perms = await loadPermissions();
  if (!perms || !can(perms, "assistant.ask")) return { error: t.assistant.notAuthorized };

  const wrapped = await runWriteAction<{ lookup: LookupResult }>(
    "assistant.lookup",
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: input.requestId, action: "assistant.lookup", db: supabase },
    async () => ({ ok: true, lookup: await answerAndRecord(supabase, t, perms, input) }),
  );
  return wrapped.ok ? wrapped.lookup : { error: wrapped.error };
}

/** The answer and its audit row: one claim covers both (see above). */
async function answerAndRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  t: Awaited<ReturnType<typeof getT>>["t"],
  perms: Permissions,
  input: {
    request: string;
    draft: WhereDraft | WhoDraft | DueDraft | FindEnclosureDraft | SummaryDraft;
    today: string;
  },
): Promise<LookupResult> {
  const { draft } = input;
  const result =
    draft.kind === "where"
      ? draft.residentId
        ? await answerWhere(supabase, draft.residentId)
        : { error: t.assistant.lookups.whichResident }
      : draft.kind === "who"
        ? draft.enclosureId
          ? await answerWho(supabase, draft.enclosureId)
          : { error: t.assistant.lookups.whichEnclosure }
        : draft.kind === "find-enclosure"
          ? await answerFindEnclosure(supabase, draft.zoneId, Math.max(1, draft.places ?? 1))
          : draft.kind === "summary"
            ? draft.residentId
              ? await answerSummary(supabase, perms, draft.residentId)
              : { error: t.assistant.lookups.whichResident }
            : await answerDue(supabase, draft.days, input.today);

  await logAssistantAction(supabase, {
    requestText: input.request,
    intent: draft.kind,
    draft,
    status: "confirmed",
    result: "error" in result ? result.error : "ok",
  });

  return result;
}
