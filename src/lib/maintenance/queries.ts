import type { SupabaseClient } from "@supabase/supabase-js";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";
import type { MaintenanceStatus } from "./status";

export type MaintenancePhase = "before" | "after";

export type MaintenanceAttachment = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  phase: MaintenancePhase | null;
  uploaded_at: string;
};

/** One member of a job's team; `archived` when they have since left (0063). */
export type MaintenanceAssignee = {
  user_id: string;
  name: string;
  archived: boolean;
};

export type MaintenanceJob = {
  id: string;
  job_code: string;
  title: string;
  description: string | null;
  status: MaintenanceStatus;
  zone_id: string;
  zone_name: string;
  /** Display only — Drive folders use zone_name (0058). */
  zone_name_th: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  due_date: string | null;
  date_created: string;
  date_completed: string | null;
  updated_at: string;
  /** The logins responsible for the job (0063) — a team, or nobody. */
  assignees: MaintenanceAssignee[];
  drive_folder_id: string | null;
  attachments: MaintenanceAttachment[];
};

type JobRow = Omit<
  MaintenanceJob,
  "zone_name" | "zone_name_th" | "enclosure_name" | "enclosure_name_th" | "assignees" | "attachments"
> & {
  zones: { name: string; name_th: string | null } | null;
  enclosures: { name: string; name_th: string | null } | null;
  maintenance_assignees: { user_id: string }[];
};

const JOB_COLUMNS =
  "id, job_code, title, description, status, zone_id, enclosure_id, estimated_cost, actual_cost, due_date, date_created, date_completed, updated_at, drive_folder_id, zones(name, name_th), enclosures(name, name_th), maintenance_assignees(user_id)";

/**
 * Maintenance jobs with their files. `attachments` has no foreign key to
 * `maintenance` (it's polymorphic on owner_type/owner_id), so PostgREST
 * can't embed it and the files come in a second query keyed by job id —
 * the same two-step the enclosure hub does for resident photos. The team
 * (0063) embeds as ids only — the FK points at auth.users, which PostgREST
 * can't embed — so `app_users` (0055) is read once for the names.
 */
export async function loadMaintenanceJobs(
  supabase: SupabaseClient,
  filter: { enclosureId?: string; zoneId?: string; id?: string } = {},
): Promise<{ jobs: MaintenanceJob[]; error: string | null }> {
  let query = supabase.from("maintenance").select(JOB_COLUMNS);
  if (filter.id) query = query.eq("id", filter.id);
  if (filter.enclosureId) query = query.eq("enclosure_id", filter.enclosureId);
  if (filter.zoneId) query = query.eq("zone_id", filter.zoneId);

  const { data, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<JobRow[]>();

  if (error) return { jobs: [], error: error.message };
  const rows = data ?? [];
  if (rows.length === 0) return { jobs: [], error: null };

  const { data: files, error: filesError } = await supabase
    .from("attachments")
    .select("id, owner_id, drive_file_id, file_name, phase, uploaded_at")
    .eq("owner_type", "maintenance")
    .in(
      "owner_id",
      rows.map((r) => r.id),
    )
    .order("uploaded_at", { ascending: true })
    .returns<(MaintenanceAttachment & { owner_id: string })[]>();

  const byJob = new Map<string, MaintenanceAttachment[]>();
  for (const file of files ?? []) {
    const list = byJob.get(file.owner_id) ?? [];
    list.push(file);
    byJob.set(file.owner_id, list);
  }

  const users = await loadAppUsersById(
    supabase,
    rows.flatMap((r) => r.maintenance_assignees.map((a) => a.user_id)),
  );

  return {
    jobs: rows.map(({ zones, enclosures, maintenance_assignees, ...row }) => ({
      ...row,
      zone_name: zones?.name ?? "—",
      zone_name_th: zones?.name_th ?? null,
      enclosure_name: enclosures?.name ?? null,
      enclosure_name_th: enclosures?.name_th ?? null,
      // Sorted by name so a team reads the same on every card.
      assignees: maintenance_assignees
        .map(({ user_id }) => {
          const user = users.get(user_id);
          return { user_id, name: appUserLabel(user), archived: !!user?.archived_at };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
      attachments: byJob.get(row.id) ?? [],
    })),
    error: filesError?.message ?? null,
  };
}

export async function loadMaintenanceJob(
  supabase: SupabaseClient,
  id: string,
): Promise<MaintenanceJob | null> {
  const { jobs } = await loadMaintenanceJobs(supabase, { id });
  return jobs[0] ?? null;
}

/**
 * Who may log and update jobs. Volunteers can read maintenance but not
 * write it (RLS in 0001); they may still add photos, which the
 * `volunteer_rw_attachments` policy allows and the upload route honours.
 */
export function canWriteMaintenance(role: string | null | undefined): boolean {
  return role === "admin" || role === "management" || role === "staff";
}
