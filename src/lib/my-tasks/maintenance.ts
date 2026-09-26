import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { placeName } from "@/lib/enclosures/names";
import { canWriteMaintenance, loadMaintenanceJobs } from "@/lib/maintenance/queries";
import { localizedFromRow } from "@/lib/translations/localize";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import type { MyTask, MyTaskSection } from "./types";

/**
 * Maintenance jobs the reader is on the team of (0063) that aren't
 * Completed, as `MyTask`s. Two reads rather than filtering the whole board:
 * the reader's job ids from `maintenance_assignees`, then just those jobs
 * through the board's own loader so a row here and a card there can't
 * disagree about a job.
 */
export async function loadMyMaintenanceTasks(
  supabase: SupabaseClient,
  userId: string,
  role: string | null,
  t: Dictionary,
  locale: Locale,
): Promise<MyTaskSection> {
  const section: MyTaskSection = { source: "maintenance", tasks: [], error: null };

  const { data: mine, error: mineError } = await supabase
    .from("maintenance_assignees")
    .select("maintenance_id")
    .eq("user_id", userId)
    .returns<{ maintenance_id: string }[]>();
  if (mineError) return { ...section, error: mineError.message };
  const ids = (mine ?? []).map((row) => row.maintenance_id);
  if (ids.length === 0) return section;

  const { jobs, error } = await loadMaintenanceJobs(supabase, { ids });
  const open = jobs.filter((job) => job.status !== "Completed");

  // A Thai reader sees the approved Thai title, as on the board (0057).
  const translations = await loadTranslations(
    supabase,
    "maintenance",
    open.map((job) => job.id),
  );
  const titleFor = (id: string, original: string) =>
    localizedFromRow(locale, original, translations.get(translationKey(id, "title")));

  const canWrite = canWriteMaintenance(role);

  const tasks: MyTask[] = open.map((job) => ({
    key: `maintenance:${job.id}`,
    source: "maintenance",
    title: titleFor(job.id, job.title),
    code: job.job_code,
    about: [
      placeName(locale, job.zone_name, job.zone_name_th),
      job.enclosure_name
        ? placeName(locale, job.enclosure_name, job.enclosure_name_th)
        : t.maintenance.zoneWide,
    ].join(" › "),
    due: job.due_date,
    href: `/maintenance/${job.id}`,
    others: job.assignees.filter((a) => a.user_id !== userId).map((a) => a.name),
    status: job.status,
    action: canWrite ? { kind: "maintenanceStatus", jobId: job.id, status: job.status } : null,
  }));

  return { ...section, tasks, error };
}

/**
 * For the nav badge: open jobs on the reader's team that are due today or
 * overdue. One head-only count — this runs on every page, so it doesn't
 * load the jobs themselves. Undated and later jobs aren't counted: a badge
 * that is never zero stops being read.
 */
export async function countMyUrgentMaintenance(
  supabase: SupabaseClient,
  userId: string,
  today: string,
): Promise<number> {
  const { count } = await supabase
    .from("maintenance")
    .select("id, maintenance_assignees!inner(user_id)", { count: "exact", head: true })
    .eq("maintenance_assignees.user_id", userId)
    .neq("status", "Completed")
    .lte("due_date", today);
  return count ?? 0;
}
