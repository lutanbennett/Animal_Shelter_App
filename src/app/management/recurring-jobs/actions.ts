"use server";

import { revalidatePath } from "next/cache";
import { assertManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { addDaysIso, todayIso } from "@/lib/format";
import {
  isRepeat,
  isTimeOfDay,
  normalizeRule,
  ruleProblem,
  type RecurrenceRule,
  type TimeOfDay,
} from "@/lib/recurring-jobs/rule";
import {
  MAX_SPAN_DAYS,
  loadOpenOccurrences,
  loadRecurringJobs,
} from "@/lib/recurring-jobs/queries";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ActionResult = { error?: string };

/** The roles 0095 lets do a job — the only logins a job can be given to. */
const ASSIGNABLE_ROLES = ["admin", "management", "staff", "vet", "volunteer"];

function revalidateRecurring() {
  revalidatePath("/management/recurring-jobs");
  revalidatePath("/my");
}

// ---------------------------------------------------------------------------
// Outcomes — called from /my by whoever the date is with. No role check here:
// record_recurring_job() is security definer and decides (0095).
// ---------------------------------------------------------------------------

export async function recordRecurringJob(
  jobId: string,
  occursOn: string,
  outcome: "done" | "skipped" | null,
  note: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_recurring_job", {
    p_job_id: jobId,
    p_occurs_on: occursOn,
    p_outcome: outcome,
    p_note: note,
  });
  if (error) return { error: error.message };
  revalidateRecurring();
  return {};
}

// ---------------------------------------------------------------------------
// The preview — the next few dates of a rule that may not be saved yet.
// ---------------------------------------------------------------------------

export type PreviewResult = { dates: string[]; error?: string };

/**
 * The first `count` dates `rule` falls on from today (or its start, if
 * later), within the two years recurrence_dates will look at. Evaluated by
 * the same SQL function as the saved jobs, so the preview can't disagree
 * with what /my will show.
 */
export async function previewRecurrence(rule: RecurrenceRule, count = 6): Promise<PreviewResult> {
  await assertManagementRole();
  const { t } = await getT();
  const normalized = normalizeRule(rule);
  const problem = ruleProblem(normalized);
  if (problem) return { dates: [], error: t.management.recurringJobs.errors[problem] };

  const today = todayIso();
  const from = normalized.starts_on > today ? normalized.starts_on : today;
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("recurrence_dates", {
      p_repeat: normalized.repeat,
      p_every: normalized.every,
      p_weekdays: normalized.weekdays,
      p_month_day: normalized.month_day,
      p_week_of_month: normalized.week_of_month,
      p_starts_on: normalized.starts_on,
      p_ends_on: normalized.ends_on,
      p_from: from,
      p_to: addDaysIso(from, MAX_SPAN_DAYS - 1),
    })
    .limit(count);
  if (error) return { dates: [], error: error.message };
  // A set-returning scalar function comes back as bare values; tolerate the
  // one-key-object shape too, which PostgREST has used for them.
  const dates = ((data ?? []) as unknown[]).map((value) =>
    typeof value === "string" ? value : String(Object.values(value as Record<string, unknown>)[0]),
  );
  return { dates };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export type RecurringJobFields = {
  title: string;
  description: string;
  timeOfDay: TimeOfDay;
  linkPath: string;
  rule: RecurrenceRule;
  dependsOnJobId: string | null;
  assigneeIds: string[];
  active: boolean;
};

/**
 * The usual team becomes exactly `userIds`, as maintenance does it (0063):
 * rows not in the list go, missing ones are added. A login newly added must
 * be one that can still sign in and do the job — the table doesn't enforce
 * that (0095 leaves it to the picker), so this does. One already on the
 * team who has since been archived may stay until someone takes them off.
 */
async function setAssignees(supabase: Supabase, jobId: string, userIds: string[]): Promise<string | null> {
  const { t } = await getT();
  const { data: current, error: readError } = await supabase
    .from("recurring_job_assignees")
    .select("user_id")
    .eq("job_id", jobId)
    .returns<{ user_id: string }[]>();
  if (readError) return readError.message;

  const have = new Set((current ?? []).map((r) => r.user_id));
  const want = new Set(userIds);
  const remove = [...have].filter((id) => !want.has(id));
  const add = [...want].filter((id) => !have.has(id));

  if (add.length > 0) {
    const { data: live, error } = await supabase
      .from("app_users")
      .select("id")
      .in("id", add)
      .in("role", ASSIGNABLE_ROLES)
      .is("archived_at", null)
      .returns<{ id: string }[]>();
    if (error) return error.message;
    if ((live ?? []).length !== add.length) return t.management.recurringJobs.errors.assigneeNotLive;
  }

  if (remove.length > 0) {
    const { error } = await supabase
      .from("recurring_job_assignees")
      .delete()
      .eq("job_id", jobId)
      .in("user_id", remove);
    if (error) return error.message;
  }
  if (add.length > 0) {
    const { error } = await supabase
      .from("recurring_job_assignees")
      .insert(add.map((user_id) => ({ job_id: jobId, user_id })));
    if (error) return error.message;
  }
  return null;
}

/** Friendlier words for the database's own refusals. */
async function explain(message: string): Promise<string> {
  const { t } = await getT();
  const e = t.management.recurringJobs.errors;
  if (message.includes("recurring_job_occurrences_job_id_fkey")) return e.hasHistory;
  if (message.includes("link_path")) return e.linkInvalid;
  return message;
}

export async function saveRecurringJob(
  id: string | null,
  fields: RecurringJobFields,
): Promise<{ error?: string; id?: string }> {
  await assertManagementRole();
  const { t } = await getT();
  const e = t.management.recurringJobs.errors;

  const title = fields.title.trim();
  if (!title) return { error: e.titleRequired };
  if (title.length > 200) return { error: e.titleTooLong };
  const description = fields.description.trim() || null;
  if (description && description.length > 4000) return { error: e.descriptionTooLong };
  if (!isTimeOfDay(fields.timeOfDay)) return { error: e.timeOfDayInvalid };
  const linkPath = fields.linkPath.trim() || null;
  if (linkPath && (!/^\/([^/\\]|$)/.test(linkPath) || linkPath.length > 500)) return { error: e.linkInvalid };
  if (!isRepeat(fields.rule.repeat)) return { error: e.repeatInvalid };
  const rule = normalizeRule({ ...fields.rule, ends_on: fields.rule.ends_on || null });
  const problem = ruleProblem(rule);
  if (problem) return { error: e[problem] };
  if (id && fields.dependsOnJobId === id) return { error: e.dependsOnSelf };

  const row = {
    title,
    description,
    time_of_day: fields.timeOfDay,
    link_path: linkPath,
    ...rule,
    depends_on_job_id: fields.dependsOnJobId || null,
    active: fields.active,
  };

  const supabase = await createClient();
  let jobId = id;
  if (id) {
    const { error } = await supabase.from("recurring_jobs").update(row).eq("id", id);
    if (error) return { error: await explain(error.message) };
  } else {
    const { data, error } = await supabase
      .from("recurring_jobs")
      .insert(row)
      .select("id")
      .single<{ id: string }>();
    if (error) return { error: await explain(error.message) };
    jobId = data.id;
  }

  const assigneeError = await setAssignees(supabase, jobId!, [...new Set(fields.assigneeIds)]);
  revalidateRecurring();
  if (assigneeError) return { error: assigneeError, id: jobId! };
  return { id: jobId! };
}

/** Pause (nothing shows, overdue included) or resume (overdue restarts today — the 0095 trigger). */
export async function setRecurringJobActive(id: string, active: boolean): Promise<ActionResult> {
  await assertManagementRole();
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_jobs").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidateRecurring();
  return {};
}

/** Only a job nobody has ever acted on can go; one with history is paused or ended instead (0095). */
export async function deleteRecurringJob(id: string): Promise<ActionResult> {
  await assertManagementRole();
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_jobs").delete().eq("id", id);
  if (error) return { error: await explain(error.message) };
  revalidateRecurring();
  return {};
}

// ---------------------------------------------------------------------------
// Handing work on
// ---------------------------------------------------------------------------

/** Gives one date back to the job's usual team. */
export async function handBackRecurringJob(jobId: string, occursOn: string): Promise<ActionResult> {
  await assertManagementRole();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reassign_recurring_job", {
    p_job_id: jobId,
    p_occurs_on: occursOn,
    p_user_ids: [],
    p_note: null,
  });
  if (error) return { error: error.message };
  revalidateRecurring();
  return {};
}

export type HandOverInput = {
  fromUserId: string;
  toUserIds: string[];
  /** "dates": cover from–to only (someone off sick). "permanent": change the jobs themselves (someone has left). */
  mode: "dates" | "permanent";
  startDate: string;
  endDate: string;
  note: string;
};

export type HandOverResult = { error?: string; changed?: number; failed?: string[] };

/**
 * "All of Anna's jobs, 5–9 Oct → Ben" (0095 leaves the form to the feature).
 *
 * dates: every open occurrence in the range whose team for that date
 * includes the person gets a cover team — that team with the person taken
 * out and the new people put in, so a teammate who was also on it stays.
 * One reassign_recurring_job() call per date, so each covered date is its
 * own record. The jobs themselves are untouched and the week after goes
 * back to normal with nothing to undo.
 *
 * permanent: the person is swapped out of every job's usual team. The way to
 * clear jobs stranded by an archived login.
 */
export async function handOverRecurringJobs(input: HandOverInput): Promise<HandOverResult> {
  await assertManagementRole();
  const { t } = await getT();
  const e = t.management.recurringJobs.errors;
  const toIds = [...new Set(input.toUserIds)].filter((id) => id !== input.fromUserId);
  if (!input.fromUserId) return { error: e.handOverFromRequired };
  if (toIds.length === 0) return { error: e.handOverToRequired };

  const supabase = await createClient();
  const { jobs, error } = await loadRecurringJobs(supabase);
  if (error) return { error };

  if (input.mode === "permanent") {
    let changed = 0;
    const failed: string[] = [];
    for (const job of jobs.filter((j) => j.assignee_ids.includes(input.fromUserId))) {
      const team = [...new Set([...job.assignee_ids.filter((id) => id !== input.fromUserId), ...toIds])];
      const problem = await setAssignees(supabase, job.id, team);
      if (problem) failed.push(`${job.title}: ${problem}`);
      else changed += 1;
    }
    revalidateRecurring();
    return { changed, failed };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) {
    return { error: e.handOverDatesRequired };
  }
  if (input.endDate < input.startDate) return { error: e.endBeforeStart };
  if (input.endDate > addDaysIso(input.startDate, 365)) return { error: e.handOverTooLong };

  // Open occurrences only: a date already done or skipped is history (0095
  // refuses to reassign it), and a paused job has nothing to cover.
  const today = todayIso();
  const { open, error: openError } = await loadOpenOccurrences(
    supabase,
    jobs,
    new Set(jobs.map((j) => j.id)),
    today,
    input.endDate,
  );
  if (openError) return { error: openError };

  let changed = 0;
  const failed: string[] = [];
  for (const o of open) {
    if (o.occurs_on < input.startDate || o.occurs_on > input.endDate) continue;
    if (!o.team.includes(input.fromUserId)) continue;
    const team = [...new Set([...o.team.filter((id) => id !== input.fromUserId), ...toIds])];
    const { error: reassignError } = await supabase.rpc("reassign_recurring_job", {
      p_job_id: o.job.id,
      p_occurs_on: o.occurs_on,
      p_user_ids: team,
      p_note: input.note.trim() || null,
    });
    if (reassignError) failed.push(`${o.job.title}, ${o.occurs_on}: ${reassignError.message}`);
    else changed += 1;
  }
  revalidateRecurring();
  return { changed, failed };
}
