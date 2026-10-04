import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysIso, todayIso } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";
import { localizedFromRow } from "@/lib/translations/localize";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import type { MyDoneToday } from "./types";

/**
 * What the reader marked done or skipped today, for the "Done today" strip
 * on /my: the page is the day's record on a phone, and a reload used to
 * leave no trace of what had gone (backlog F-21). Both sources already
 * stamp who and when (recurring_job_occurrences.done_by/done_at;
 * maintenance.date_completed), so this reads and adds nothing.
 *
 * "Today" is the shelter day. done_at is a timestamp, so the query takes a
 * day either side and the shelter date of each row decides.
 */
export async function loadMyDoneToday(
  supabase: SupabaseClient,
  userId: string,
  today: string,
  locale: Locale,
): Promise<{ items: MyDoneToday[]; error: string | null }> {
  const [recurring, maintenance] = await Promise.all([
    supabase
      .from("recurring_job_occurrences")
      .select("job_id, occurs_on, outcome, done_at, recurring_jobs(title)")
      .eq("done_by", userId)
      .not("outcome", "is", null)
      .gte("done_at", `${addDaysIso(today, -1)}T00:00:00Z`)
      .order("done_at", { ascending: false })
      .returns<
        {
          job_id: string;
          occurs_on: string;
          outcome: "done" | "skipped";
          done_at: string;
          recurring_jobs: { title: string } | { title: string }[] | null;
        }[]
      >(),
    supabase
      .from("maintenance")
      .select("id, title, job_code, maintenance_assignees!inner(user_id)")
      .eq("maintenance_assignees.user_id", userId)
      .eq("status", "Completed")
      .eq("date_completed", today)
      .returns<{ id: string; title: string; job_code: string | null }[]>(),
  ]);

  const items: MyDoneToday[] = [];
  for (const row of recurring.data ?? []) {
    if (todayIso(new Date(row.done_at)) !== today) continue;
    const job = Array.isArray(row.recurring_jobs) ? row.recurring_jobs[0] : row.recurring_jobs;
    items.push({
      key: `recurring:${row.job_id}:${row.occurs_on}`,
      kind: "recurring",
      title: job?.title ?? "",
      outcome: row.outcome,
      jobId: row.job_id,
      occursOn: row.occurs_on,
      at: row.done_at,
    });
  }
  const done = maintenance.data ?? [];
  // A Thai reader sees the approved Thai title, as on the list above (0057).
  const translations = await loadTranslations(
    supabase,
    "maintenance",
    done.map((row) => row.id),
  );
  for (const row of done) {
    items.push({
      key: `maintenance:${row.id}`,
      kind: "maintenance",
      title: localizedFromRow(locale, row.title, translations.get(translationKey(row.id, "title"))),
      code: row.job_code ?? undefined,
      outcome: "done",
      jobId: row.id,
      occursOn: null,
      at: null,
    });
  }
  const error = recurring.error?.message ?? maintenance.error?.message ?? null;
  return { items, error };
}
