"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
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
import { ASSIGNABLE_ROLES, canDoJob, needsForLinks } from "@/lib/recurring-jobs/eligibility";
import { loadEligibility } from "@/lib/recurring-jobs/eligibility-load";
import { appUserLabel, type AppUser } from "@/lib/auth/app-users";
import {
  MAX_SPAN_DAYS,
  loadOpenOccurrences,
  loadRecurringJobs,
} from "@/lib/recurring-jobs/queries";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

type Supabase = Awaited<ReturnType<typeof createClient>>;

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
  const { t } = await getT();
  return runAction("recurringJobs.recordRecurringJob", t.common.somethingWentWrong, async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_recurring_job", {
      p_job_id: jobId,
      p_occurs_on: occursOn,
      p_outcome: outcome,
      p_note: note,
    });
    if (error) return refuse(error.message);
    revalidateRecurring();
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// The preview — the next few dates of a rule that may not be saved yet.
// ---------------------------------------------------------------------------

/**
 * The first `count` dates `rule` falls on from today (or its start, if
 * later), within the two years recurrence_dates will look at. Evaluated by
 * the same SQL function as the saved jobs, so the preview can't disagree
 * with what /my will show.
 */
export async function previewRecurrence(
  rule: RecurrenceRule,
  count = 6,
): Promise<ActionResult<{ dates: string[] }>> {
  const { t } = await getT();
  return runAction("recurringJobs.previewRecurrence", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "recurring.manage")) return refuse(t.management.errors.managementAccessRequired);
    const normalized = normalizeRule(rule);
    const problem = ruleProblem(normalized);
    if (problem) return refuse(t.management.recurringJobs.errors[problem]);

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
    if (error) return refuse(error.message);
    // A set-returning scalar function comes back as bare values; tolerate the
    // one-key-object shape too, which PostgREST has used for them.
    const dates = ((data ?? []) as unknown[]).map((value) =>
      typeof value === "string" ? value : String(Object.values(value as Record<string, unknown>)[0]),
    );
    return { ok: true, dates };
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const refuse = (error: string) => ({ ok: false as const, error });

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
      .in("role", [...ASSIGNABLE_ROLES])
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

/**
 * The people in `userIds` who can still sign in but whose role cannot do a
 * job linking to `linkPath` (eligibility.ts) — a doctor on a stocktake. The
 * database would take them (0095 checks only that a login is live staff),
 * so this is the check, run before anything is written. Archived logins
 * are the stranded warning's business.
 */
async function whoCannotDo(
  supabase: Supabase,
  linkPath: string | null,
  userIds: string[],
): Promise<{ names: string[]; error: string | null }> {
  if (userIds.length === 0) return { names: [], error: null };
  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, display_name, role, archived_at, role_key")
    .in("id", userIds)
    .is("archived_at", null)
    .returns<AppUser[]>();
  if (error) return { names: [], error: error.message };
  const { eligibility, error: eligibilityError } = await loadEligibility(
    supabase,
    (data ?? []).map((user) => user.role_key),
    needsForLinks([linkPath]),
  );
  if (eligibilityError) return { names: [], error: eligibilityError };
  return {
    names: (data ?? [])
      .filter((user) => !canDoJob(user.role_key, linkPath, eligibility))
      .map((user) => appUserLabel(user)),
    error: null,
  };
}

/** whoCannotDo's answer as a refusal: its error, or who can't and why; null when everyone can. */
async function cannotDoProblem(
  supabase: Supabase,
  linkPath: string | null,
  userIds: string[],
): Promise<string | null> {
  const { names, error } = await whoCannotDo(supabase, linkPath, userIds);
  if (error) return error;
  if (names.length === 0) return null;
  const { t } = await getT();
  return t.management.recurringJobs.errors.assigneeCannotDo(names.join(", "));
}

/** Friendlier words for the database's own refusals. */
async function explain(message: string): Promise<string> {
  const { t } = await getT();
  const e = t.management.recurringJobs.errors;
  if (message.includes("recurring_job_occurrences_job_id_fkey")) return e.hasHistory;
  if (message.includes("link_path")) return e.linkInvalid;
  return message;
}

/**
 * A refusal can still carry the id: the job was saved but its team was not,
 * so a new job's form refreshes to show the row that now exists.
 */
export type SaveResult = ActionResult<{ id: string }> | { ok: false; error: string; id: string };

export async function saveRecurringJob(
  id: string | null,
  fields: RecurringJobFields,
): Promise<SaveResult> {
  const { t } = await getT();
  return runAction("recurringJobs.saveRecurringJob", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "recurring.manage")) return refuse(t.management.errors.managementAccessRequired);
    const e = t.management.recurringJobs.errors;

    const title = fields.title.trim();
    if (!title) return refuse(e.titleRequired);
    if (title.length > 200) return refuse(e.titleTooLong);
    const description = fields.description.trim() || null;
    if (description && description.length > 4000) return refuse(e.descriptionTooLong);
    if (!isTimeOfDay(fields.timeOfDay)) return refuse(e.timeOfDayInvalid);
    const linkPath = fields.linkPath.trim() || null;
    if (linkPath && (!/^\/([^/\\]|$)/.test(linkPath) || linkPath.length > 500)) return refuse(e.linkInvalid);
    if (!isRepeat(fields.rule.repeat)) return refuse(e.repeatInvalid);
    const rule = normalizeRule({ ...fields.rule, ends_on: fields.rule.ends_on || null });
    const problem = ruleProblem(rule);
    if (problem) return refuse(e[problem]);
    if (id && fields.dependsOnJobId === id) return refuse(e.dependsOnSelf);

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
    // Before the row is written, so pointing the link at a page someone on the
    // team cannot open is refused whole rather than saved half-way.
    const assigneeIds = [...new Set(fields.assigneeIds)];
    const cannotDo = await cannotDoProblem(supabase, linkPath, assigneeIds);
    if (cannotDo) return refuse(cannotDo);

    let jobId = id;
    if (id) {
      const { error } = await supabase.from("recurring_jobs").update(row).eq("id", id);
      if (error) return refuse(await explain(error.message));
    } else {
      const { data, error } = await supabase
        .from("recurring_jobs")
        .insert(row)
        .select("id")
        .single<{ id: string }>();
      if (error) return refuse(await explain(error.message));
      jobId = data.id;
    }

    const assigneeError = await setAssignees(supabase, jobId!, assigneeIds);
    revalidateRecurring();
    if (assigneeError) return { ok: false, error: assigneeError, id: jobId! };
    return { ok: true, id: jobId! };
  });
}

/** Pause (nothing shows, overdue included) or resume (overdue restarts today — the 0095 trigger). */
export async function setRecurringJobActive(id: string, active: boolean): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("recurringJobs.setRecurringJobActive", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "recurring.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { error } = await supabase.from("recurring_jobs").update({ active }).eq("id", id);
    if (error) return refuse(error.message);
    revalidateRecurring();
    return { ok: true };
  });
}

/** Only a job nobody has ever acted on can go; one with history is paused or ended instead (0095). */
export async function deleteRecurringJob(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("recurringJobs.deleteRecurringJob", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "recurring.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { error } = await supabase.from("recurring_jobs").delete().eq("id", id);
    if (error) return refuse(await explain(error.message));
    revalidateRecurring();
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Handing work on
// ---------------------------------------------------------------------------

/** Gives one date back to the job's usual team. */
export async function handBackRecurringJob(jobId: string, occursOn: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("recurringJobs.handBackRecurringJob", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "recurring.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();
    const { error } = await supabase.rpc("reassign_recurring_job", {
      p_job_id: jobId,
      p_occurs_on: occursOn,
      p_user_ids: [],
      p_note: null,
    });
    if (error) return refuse(error.message);
    revalidateRecurring();
    return { ok: true };
  });
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
export async function handOverRecurringJobs(input: HandOverInput): Promise<ActionResult<{ changed: number; failed: string[] }>> {
  const { t } = await getT();
  return runAction("recurringJobs.handOverRecurringJobs", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "recurring.manage")) return refuse(t.management.errors.managementAccessRequired);
    const e = t.management.recurringJobs.errors;
    const toIds = [...new Set(input.toUserIds)].filter((id) => id !== input.fromUserId);
    if (!input.fromUserId) return refuse(e.handOverFromRequired);
    if (toIds.length === 0) return refuse(e.handOverToRequired);

    const supabase = await createClient();
    const { jobs, error } = await loadRecurringJobs(supabase);
    if (error) return refuse(error);

    if (input.mode === "permanent") {
      let changed = 0;
      const failed: string[] = [];
      for (const job of jobs.filter((j) => j.assignee_ids.includes(input.fromUserId))) {
        const team = [...new Set([...job.assignee_ids.filter((id) => id !== input.fromUserId), ...toIds])];
        const problem =
          (await cannotDoProblem(supabase, job.link_path, team)) ?? (await setAssignees(supabase, job.id, team));
        if (problem) failed.push(`${job.title}: ${problem}`);
        else changed += 1;
      }
      revalidateRecurring();
      return { ok: true, changed, failed };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) {
      return refuse(e.handOverDatesRequired);
    }
    if (input.endDate < input.startDate) return refuse(e.endBeforeStart);
    if (input.endDate > addDaysIso(input.startDate, 365)) return refuse(e.handOverTooLong);

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
    if (openError) return refuse(openError);

    let changed = 0;
    const failed: string[] = [];
    for (const o of open) {
      if (o.occurs_on < input.startDate || o.occurs_on > input.endDate) continue;
      if (!o.team.includes(input.fromUserId)) continue;
      const team = [...new Set([...o.team.filter((id) => id !== input.fromUserId), ...toIds])];
      // reassign_recurring_job() takes any live staff login; whether they can
      // open the job's page is checked here.
      const cannotDo = await cannotDoProblem(supabase, o.job.link_path, team);
      if (cannotDo) {
        failed.push(`${o.job.title}, ${o.occurs_on}: ${cannotDo}`);
        continue;
      }
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
    return { ok: true, changed, failed };
  });
}
