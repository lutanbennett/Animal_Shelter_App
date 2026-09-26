import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysIso } from "@/lib/format";
import type { Repeat, TimeOfDay } from "./rule";

/**
 * Reading recurring jobs (0095). Occurrences are never stored ahead, so
 * "what is due" is three reads put together here: the saved rules, the
 * dates they fall on (recurring_job_dates, the one evaluator in SQL), and
 * the rows for dates somebody acted on (outcomes and cover teams). My tasks
 * and the Management page both go through openOccurrences(), so a job
 * can't be overdue on one and not the other.
 */

export type RecurringJob = {
  id: string;
  title: string;
  description: string | null;
  time_of_day: TimeOfDay;
  link_path: string | null;
  repeat: Repeat;
  every: number;
  weekdays: number[] | null;
  month_day: number | null;
  week_of_month: number | null;
  starts_on: string;
  ends_on: string | null;
  overdue_from: string;
  depends_on_job_id: string | null;
  active: boolean;
  created_at: string;
  /** The usual team (recurring_job_assignees): login ids. */
  assignee_ids: string[];
};

export type OccurrenceRow = {
  job_id: string;
  occurs_on: string;
  outcome: "done" | "skipped" | null;
  done_by: string | null;
  done_at: string | null;
  note: string | null;
  reassigned_by: string | null;
  reassigned_at: string | null;
  reassign_note: string | null;
};

const JOB_COLUMNS =
  "id, title, description, time_of_day, link_path, repeat, every, weekdays, month_day, week_of_month, starts_on, ends_on, overdue_from, depends_on_job_id, active, created_at, recurring_job_assignees(user_id)";

const OCCURRENCE_COLUMNS =
  "job_id, occurs_on, outcome, done_by, done_at, note, reassigned_by, reassigned_at, reassign_note";

/** recurring_job_dates and recurrence_dates refuse more than this (0095). */
export const MAX_SPAN_DAYS = 731;

/** PostgREST hands back at most this many rows a request; page past it. */
const PAGE = 1000;

/** Every job (all roles that read them read all of them), sorted by title. */
export async function loadRecurringJobs(
  supabase: SupabaseClient,
): Promise<{ jobs: RecurringJob[]; error: string | null }> {
  const { data, error } = await supabase
    .from("recurring_jobs")
    .select(JOB_COLUMNS)
    .order("title")
    .returns<(Omit<RecurringJob, "assignee_ids"> & { recurring_job_assignees: { user_id: string }[] })[]>();
  if (error) return { jobs: [], error: error.message };
  return {
    jobs: (data ?? []).map(({ recurring_job_assignees, ...job }) => ({
      ...job,
      assignee_ids: recurring_job_assignees.map((a) => a.user_id),
    })),
    error: null,
  };
}

/**
 * The dates the saved rules fall on from `from` to `to`, per job, oldest
 * first. Paged, because a daily job over a long overdue look-back is
 * hundreds of rows on its own.
 */
export async function loadJobDates(
  supabase: SupabaseClient,
  from: string,
  to: string,
  jobIds: string[],
): Promise<{ dates: Map<string, string[]>; error: string | null }> {
  const dates = new Map<string, string[]>();
  if (jobIds.length === 0 || to < from) return { dates, error: null };
  for (let offset = 0; ; offset += PAGE) {
    const { data: raw, error } = await supabase
      .rpc("recurring_job_dates", { p_from: from, p_to: to })
      .in("job_id", jobIds)
      .range(offset, offset + PAGE - 1);
    if (error) return { dates, error: error.message };
    const data = (raw ?? null) as { job_id: string; occurs_on: string }[] | null;
    for (const row of data ?? []) {
      const list = dates.get(row.job_id) ?? [];
      list.push(row.occurs_on);
      dates.set(row.job_id, list);
    }
    if (!data || data.length < PAGE) break;
  }
  return { dates, error: null };
}

/**
 * The acted-on rows for these jobs from `from` to `to`, keyed "job:date",
 * and each date's cover team when it has one.
 */
export async function loadOccurrenceRows(
  supabase: SupabaseClient,
  from: string,
  to: string,
  jobIds: string[],
): Promise<{
  rows: Map<string, OccurrenceRow>;
  covers: Map<string, string[]>;
  error: string | null;
}> {
  const rows = new Map<string, OccurrenceRow>();
  const covers = new Map<string, string[]>();
  if (jobIds.length === 0 || to < from) return { rows, covers, error: null };

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("recurring_job_occurrences")
      .select(OCCURRENCE_COLUMNS)
      .in("job_id", jobIds)
      .gte("occurs_on", from)
      .lte("occurs_on", to)
      .order("occurs_on")
      .order("job_id")
      .range(offset, offset + PAGE - 1)
      .returns<OccurrenceRow[]>();
    if (error) return { rows, covers, error: error.message };
    for (const row of data ?? []) rows.set(occurrenceKey(row.job_id, row.occurs_on), row);
    if (!data || data.length < PAGE) break;
  }

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("recurring_job_occurrence_assignees")
      .select("job_id, occurs_on, user_id")
      .in("job_id", jobIds)
      .gte("occurs_on", from)
      .lte("occurs_on", to)
      .order("occurs_on")
      .order("job_id")
      .order("user_id")
      .range(offset, offset + PAGE - 1)
      .returns<{ job_id: string; occurs_on: string; user_id: string }[]>();
    if (error) return { rows, covers, error: error.message };
    for (const row of data ?? []) {
      const key = occurrenceKey(row.job_id, row.occurs_on);
      covers.set(key, [...(covers.get(key) ?? []), row.user_id]);
    }
    if (!data || data.length < PAGE) break;
  }

  return { rows, covers, error: null };
}

export function occurrenceKey(jobId: string, occursOn: string) {
  return `${jobId}:${occursOn}`;
}

/** An occurrence nobody has marked done or skipped yet. */
export type OpenOccurrence = {
  job: RecurringJob;
  occurs_on: string;
  /** Who does it on this date: its cover team if it has one, else the usual team. */
  team: string[];
  /** Set when the date was handed to a cover team. */
  cover: { note: string | null } | null;
  /** The job this one waits for, when that one falls today too and isn't done. */
  waitingFor: RecurringJob | null;
};

/**
 * Where the overdue look-back starts for a set of jobs: the earliest
 * overdue_from among the active ones, but never more than the SQL
 * functions' two-year span before `to`.
 */
export function lookBackFrom(jobs: RecurringJob[], today: string, to: string): string {
  const floor = addDaysIso(to, -(MAX_SPAN_DAYS - 1));
  const earliest = jobs
    .filter((job) => job.active)
    .reduce((min, job) => (job.overdue_from < min ? job.overdue_from : min), today);
  return earliest < floor ? floor : earliest;
}

/**
 * The occurrences still to do, oldest first: rule dates of active jobs with
 * no outcome, from the job's overdue_from (0095: dates before it — paused
 * weeks, an old rule — are not missed) up to `to`. Dates from today on are
 * always included; the look-back only bounds the past.
 */
export function openOccurrences(
  jobs: RecurringJob[],
  dates: Map<string, string[]>,
  rows: Map<string, OccurrenceRow>,
  covers: Map<string, string[]>,
  today: string,
): OpenOccurrence[] {
  const byId = new Map(jobs.map((job) => [job.id, job]));

  // A date counts as live — something to do, or to wait for — when its job
  // is active and the date isn't before the look-back.
  const isLive = (job: RecurringJob, date: string) =>
    job.active && (date >= today || date >= job.overdue_from);
  const isOpen = (job: RecurringJob, date: string) =>
    isLive(job, date) && !rows.get(occurrenceKey(job.id, date))?.outcome;

  const result: OpenOccurrence[] = [];
  for (const job of jobs) {
    for (const date of dates.get(job.id) ?? []) {
      if (!isOpen(job, date)) continue;
      const key = occurrenceKey(job.id, date);
      const cover = covers.get(key);
      const dependency = job.depends_on_job_id ? byId.get(job.depends_on_job_id) : undefined;
      const waitingFor =
        dependency && (dates.get(dependency.id) ?? []).includes(date) && isOpen(dependency, date)
          ? dependency
          : null;
      result.push({
        job,
        occurs_on: date,
        team: cover && cover.length > 0 ? cover : job.assignee_ids,
        cover: cover && cover.length > 0 ? { note: rows.get(key)?.reassign_note ?? null } : null,
        waitingFor,
      });
    }
  }
  return result.sort((a, b) => a.occurs_on.localeCompare(b.occurs_on));
}

/**
 * Everything needed to say what is open for `jobs` from the look-back to
 * `to`: the jobs they wait for are read too, since "waiting for stocktake"
 * needs the stocktake's own dates and outcomes.
 */
export async function loadOpenOccurrences(
  supabase: SupabaseClient,
  allJobs: RecurringJob[],
  jobIds: Set<string>,
  today: string,
  to: string,
): Promise<{ open: OpenOccurrence[]; error: string | null }> {
  const byId = new Map(allJobs.map((job) => [job.id, job]));
  const wanted = allJobs.filter((job) => jobIds.has(job.id) && job.active);
  if (wanted.length === 0) return { open: [], error: null };

  const withDependencies = new Set(wanted.map((job) => job.id));
  for (const job of wanted) {
    if (job.depends_on_job_id && byId.has(job.depends_on_job_id)) withDependencies.add(job.depends_on_job_id);
  }
  const ids = [...withDependencies];
  const from = lookBackFrom(wanted, today, to);

  const [dateResult, rowResult] = await Promise.all([
    loadJobDates(supabase, from, to, ids),
    loadOccurrenceRows(supabase, from, to, ids),
  ]);
  const error = dateResult.error ?? rowResult.error;
  if (error) return { open: [], error };

  const open = openOccurrences(
    ids.map((id) => byId.get(id)!),
    dateResult.dates,
    rowResult.rows,
    rowResult.covers,
    today,
  ).filter((occurrence) => jobIds.has(occurrence.job.id));
  return { open, error: null };
}
