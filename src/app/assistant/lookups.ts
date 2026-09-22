"use server";

import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { logAssistantAction } from "@/lib/assistant/audit";
import { canUseAssistant } from "@/lib/assistant/data";
import type { DueDraft, WhereDraft, WhoDraft } from "@/lib/assistant/types";

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
  vetName: string | null;
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

export type LookupAnswer = WhereAnswer | WhoAnswer | DueAnswer;
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
};

const LIST_COLUMNS =
  "resident_id, name, thai_name, resident_code, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th";

/** The profile photos for a set of residents; the view doesn't carry them. */
async function photosById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, string | null>> {
  if (!ids.length) return new Map();
  const { data } = await supabase
    .from("residents")
    .select("id, profile_photo_drive_file_id")
    .in("id", ids)
    .returns<{ id: string; profile_photo_drive_file_id: string | null }[]>();
  return new Map((data ?? []).map((r) => [r.id, r.profile_photo_drive_file_id]));
}

async function answerWhere(
  supabase: Awaited<ReturnType<typeof createClient>>,
  residentId: string,
): Promise<LookupResult> {
  const { t } = await getT();
  const { data, error } = await supabase
    .from("resident_list_view")
    .select(LIST_COLUMNS)
    .eq("resident_id", residentId)
    .limit(1)
    .returns<ListRow[]>();
  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) return { error: t.assistant.lookups.residentNotFound };

  const photos = await photosById(supabase, [row.resident_id]);
  return {
    answer: {
      kind: "where",
      resident: {
        id: row.resident_id,
        name: row.name,
        thaiName: row.thai_name,
        code: row.resident_code,
        photoFileId: photos.get(row.resident_id) ?? null,
      },
      status: row.current_status,
      enclosureId: row.enclosure_id,
      enclosureName: row.enclosure_name,
      enclosureNameTh: row.enclosure_name_th,
      zoneName: row.zone_name,
      zoneNameTh: row.zone_name_th,
    },
  };
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
      .from("resident_list_view")
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
  const photos = await photosById(
    supabase,
    rows.map((r) => r.resident_id),
  );

  return {
    answer: {
      kind: "who",
      enclosure: { id: enclosure.id, name: enclosure.name, nameTh: enclosure.name_th },
      residents: rows.map((r) => ({
        id: r.resident_id,
        name: r.name,
        thaiName: r.thai_name,
        code: r.resident_code,
        photoFileId: photos.get(r.resident_id) ?? null,
      })),
    },
  };
}

type AppointmentRow = {
  id: string;
  resident_id: string;
  appointment_date: string;
  reason: string | null;
  vets: { name: string } | null;
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

/**
 * Calendar arithmetic on a YYYY-MM-DD string, via UTC so that it stays
 * pure date arithmetic whatever timezone the server happens to be in.
 */
function addCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

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
  // Thailand (backlog d98695a). It comes from the asker's clock instead,
  // and only falls back to the server's if the browser sent nonsense.
  const endDate = ISO_DATE.test(today)
    ? addCalendarDays(today, days)
    : end.toISOString().slice(0, 10);

  const [visitsResult, jobsResult] = await Promise.all([
    // The dashboard's own "due" set: still scheduled, and either already
    // past or inside the window (src/lib/management/report.ts).
    supabase
      .from("vet_appointments")
      .select("id, resident_id, appointment_date, reason, vets(name)")
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
      vetName: row.vets?.name ?? null,
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
 * Answers one read-only question and records the turn, as every other
 * intent does. `result_table` / `result_row_id` stay null: a lookup wrote
 * nothing (0070).
 */
export async function assistantLookup(input: {
  request: string;
  draft: WhereDraft | WhoDraft | DueDraft;
  /** The asker's own calendar date, YYYY-MM-DD; see `answerDue`. */
  today: string;
}): Promise<LookupResult> {
  const { t } = await getT();
  const supabase = await createClient();

  const { data: role } = await supabase.rpc("current_user_role");
  if (!canUseAssistant(role)) return { error: t.assistant.notAuthorized };

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
