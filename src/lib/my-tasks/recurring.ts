import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { addDaysIso } from "@/lib/format";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";
import {
  MAX_SPAN_DAYS,
  loadOpenOccurrences,
  loadRecurringJobs,
  type OpenOccurrence,
} from "@/lib/recurring-jobs/queries";
import { timeOfDayRank } from "@/lib/recurring-jobs/rule";
import type { MyTask, MyTaskSection } from "./types";

/**
 * How far ahead /my looks for recurring jobs: the coming week, so Monday's
 * stocktake is visible on Friday. Only today and overdue count towards the
 * nav badge.
 */
export const RECURRING_DAYS_AHEAD = 6;

/**
 * The reader's open occurrences from the overdue look-back to `to`: dates
 * whose effective team (0095 — the cover team if the date has one, else the
 * usual team) includes them. A date handed to someone else drops off the
 * usual person's list; a date handed to the reader appears on theirs even
 * when the job isn't usually theirs.
 */
async function loadMine(
  supabase: SupabaseClient,
  userId: string,
  today: string,
  to: string,
): Promise<{ open: OpenOccurrence[]; error: string | null }> {
  const [{ jobs, error }, covered] = await Promise.all([
    loadRecurringJobs(supabase),
    supabase
      .from("recurring_job_occurrence_assignees")
      .select("job_id")
      .eq("user_id", userId)
      .gte("occurs_on", addDaysIso(to, -(MAX_SPAN_DAYS - 1)))
      .lte("occurs_on", to)
      .returns<{ job_id: string }[]>(),
  ]);
  if (error) return { open: [], error };
  if (covered.error) return { open: [], error: covered.error.message };

  const ids = new Set([
    ...jobs.filter((job) => job.assignee_ids.includes(userId)).map((job) => job.id),
    ...(covered.data ?? []).map((row) => row.job_id),
  ]);
  const result = await loadOpenOccurrences(supabase, jobs, ids, today, to);
  return { ...result, open: result.open.filter((o) => o.team.includes(userId)) };
}

export async function loadMyRecurringTasks(
  supabase: SupabaseClient,
  userId: string,
  t: Dictionary,
  today: string,
): Promise<MyTaskSection> {
  const section: MyTaskSection = { source: "recurring", tasks: [], error: null };
  const { open, error } = await loadMine(supabase, userId, today, addDaysIso(today, RECURRING_DAYS_AHEAD));
  if (error) return { ...section, error };
  if (open.length === 0) return section;

  const users = await loadAppUsersById(
    supabase,
    open.flatMap((o) => o.team),
  );
  const r = t.my.recurring;

  const tasks: MyTask[] = open
    .sort(
      (a, b) =>
        a.occurs_on.localeCompare(b.occurs_on) ||
        timeOfDayRank(a.job.time_of_day) - timeOfDayRank(b.job.time_of_day) ||
        a.job.title.localeCompare(b.job.title),
    )
    .map((o) => ({
      key: `recurring:${o.job.id}:${o.occurs_on}`,
      source: "recurring",
      title: o.job.title,
      about: [
        t.management.recurringJobs.timesOfDay[o.job.time_of_day],
        o.cover ? (o.cover.note ? r.handedToYouBecause(o.cover.note) : r.handedToYou) : null,
      ]
        .filter(Boolean)
        .join(" · "),
      due: o.occurs_on,
      href: o.job.link_path,
      others: o.team
        .filter((id) => id !== userId)
        .map((id) => appUserLabel(users.get(id)))
        .sort((a, b) => a.localeCompare(b)),
      status: null,
      waitingFor: o.waitingFor?.title ?? null,
      description: o.job.description,
      action: {
        kind: "recurringOutcome",
        jobId: o.job.id,
        occursOn: o.occurs_on,
        // record_recurring_job refuses "done" before the day; skipping ahead is allowed.
        canMarkDone: o.occurs_on <= today,
      },
    }));

  return { ...section, tasks };
}

/** For the nav badge: the reader's recurring jobs due today or overdue. */
export async function countMyUrgentRecurring(
  supabase: SupabaseClient,
  userId: string,
  today: string,
): Promise<number> {
  const { open } = await loadMine(supabase, userId, today, today);
  return open.length;
}
