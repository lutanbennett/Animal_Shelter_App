import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { addDaysIso, todayIso } from "@/lib/format";
import { appUserLabel, loadAppUsersById, type AppUser } from "@/lib/auth/app-users";
import {
  loadJobDates,
  loadOpenOccurrences,
  loadRecurringJobs,
  type OccurrenceRow,
} from "@/lib/recurring-jobs/queries";
import { RecurringJobsView, type JobSummary, type PersonOption, type CoveredDate, type RecordEntry } from "./RecurringJobsView";

/** How far ahead the list looks for each job's next dates: far enough for a yearly job. */
const NEXT_DATES_DAYS = 400;
/** How far ahead the "handed to someone else" list reaches. */
const COVER_DAYS_AHEAD = 60;
/** How many recent outcomes the record at the bottom shows. */
const RECORD_LIMIT = 30;

/**
 * Management → Recurring jobs (0095): the rules that put a job on someone's
 * My tasks every week or month. Create, edit, pause and reassign them, with
 * a preview of the next dates while editing; hand one person's dates to
 * someone else when they are off; and see the record of what was done.
 */
export default async function RecurringJobsPage() {
  await requireManagementUser();
  const { t } = await getT();
  const supabase = await createClient();
  const today = todayIso();

  const [{ jobs, error }, peopleResult, staffingResult, recordResult] = await Promise.all([
    loadRecurringJobs(supabase),
    supabase
      .from("app_users")
      .select("id, email, display_name, role, archived_at")
      .in("role", ["admin", "management", "staff", "vet", "volunteer"])
      .is("archived_at", null)
      .returns<AppUser[]>(),
    supabase
      .from("recurring_job_staffing")
      .select("job_id, live_assignees, archived_assignees")
      .returns<{ job_id: string; live_assignees: number; archived_assignees: number }[]>(),
    supabase
      .from("recurring_job_occurrences")
      .select("job_id, occurs_on, outcome, done_by, done_at, note, reassigned_by, reassigned_at, reassign_note")
      .not("outcome", "is", null)
      .order("done_at", { ascending: false })
      .limit(RECORD_LIMIT)
      .returns<OccurrenceRow[]>(),
  ]);

  const activeIds = jobs.filter((job) => job.active).map((job) => job.id);
  const [nextResult, openResult] = await Promise.all([
    loadJobDates(supabase, today, addDaysIso(today, NEXT_DATES_DAYS - 1), activeIds),
    loadOpenOccurrences(supabase, jobs, new Set(activeIds), today, addDaysIso(today, COVER_DAYS_AHEAD)),
  ]);

  // Names for everyone mentioned: the usual teams (archived included, so a
  // stranded job can say who it was with), cover teams and the record.
  const users = await loadAppUsersById(supabase, [
    ...jobs.flatMap((job) => job.assignee_ids),
    ...openResult.open.flatMap((o) => o.team),
    ...(recordResult.data ?? []).flatMap((row) => (row.done_by ? [row.done_by] : [])),
  ]);
  const person = (id: string) => ({
    id,
    name: appUserLabel(users.get(id)),
    archived: !!users.get(id)?.archived_at || !users.get(id),
  });

  const staffing = new Map((staffingResult.data ?? []).map((row) => [row.job_id, row]));
  const titles = new Map(jobs.map((job) => [job.id, job.title]));

  const overdue = new Map<string, number>();
  for (const o of openResult.open) {
    if (o.occurs_on < today) overdue.set(o.job.id, (overdue.get(o.job.id) ?? 0) + 1);
  }

  // "Next" leaves out dates already marked done or skipped (today's, or one
  // skipped ahead). Within the open window a date is still to do only if it
  // is open; beyond it nothing has been acted on often enough to matter.
  const openKeys = new Set(openResult.open.map((o) => `${o.job.id}:${o.occurs_on}`));
  const openUntil = addDaysIso(today, COVER_DAYS_AHEAD);

  const summaries: JobSummary[] = jobs.map((job) => ({
    job,
    team: job.assignee_ids.map(person).sort((a, b) => a.name.localeCompare(b.name)),
    liveAssignees: staffing.get(job.id)?.live_assignees ?? 0,
    nextDates: (nextResult.dates.get(job.id) ?? [])
      .filter((date) => date > openUntil || openKeys.has(`${job.id}:${date}`))
      .slice(0, 3),
    overdueCount: overdue.get(job.id) ?? 0,
    dependsOnTitle: job.depends_on_job_id ? (titles.get(job.depends_on_job_id) ?? null) : null,
  }));

  const covered: CoveredDate[] = openResult.open
    .filter((o) => o.cover)
    .map((o) => ({
      jobId: o.job.id,
      title: o.job.title,
      occursOn: o.occurs_on,
      team: o.team.map((id) => person(id).name),
      // Who the cover replaced: the usual team minus anyone still on it.
      usual: o.job.assignee_ids.filter((id) => !o.team.includes(id)).map((id) => person(id).name),
      note: o.cover?.note ?? null,
    }));

  const record: RecordEntry[] = (recordResult.data ?? []).map((row) => ({
    key: `${row.job_id}:${row.occurs_on}`,
    title: titles.get(row.job_id) ?? "—",
    occursOn: row.occurs_on,
    outcome: row.outcome!,
    by: row.done_by ? person(row.done_by).name : "—",
    at: row.done_at!,
    note: row.note,
  }));

  const people: PersonOption[] = (peopleResult.data ?? [])
    .map((user) => ({ id: user.id, name: appUserLabel(user), role: user.role }))
    .sort((a, b) => a.name.localeCompare(b.name));
  // Anyone on a job's usual team, archived or not, can be handed over *from*.
  const onJobs = new Map<string, { id: string; name: string; archived: boolean }>();
  for (const job of jobs) for (const id of job.assignee_ids) onJobs.set(id, person(id));
  const handOverFrom = [...onJobs.values()].sort((a, b) => a.name.localeCompare(b.name));

  const errors = [
    error,
    peopleResult.error?.message,
    staffingResult.error?.message,
    recordResult.error?.message,
    nextResult.error,
    openResult.error,
  ].filter((message): message is string => !!message);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.management.recurringJobs.title}</h1>
        <p className="text-sm text-muted">{t.management.recurringJobs.subtitle}</p>
      </div>

      {errors.map((message) => (
        <p key={message} className="text-sm text-danger">
          {t.management.recurringJobs.couldntLoad}: {message}
        </p>
      ))}

      <RecurringJobsView
        jobs={summaries}
        people={people}
        handOverFrom={handOverFrom}
        covered={covered}
        record={record}
        today={today}
      />
    </main>
  );
}
