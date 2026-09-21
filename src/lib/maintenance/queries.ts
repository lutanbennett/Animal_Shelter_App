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
  /** The login responsible for the job (0055), if anyone. */
  assigned_user_id: string | null;
  assignee_name: string | null;
  drive_folder_id: string | null;
  attachments: MaintenanceAttachment[];
};

type JobRow = Omit<
  MaintenanceJob,
  "zone_name" | "zone_name_th" | "enclosure_name" | "enclosure_name_th" | "assignee_name" | "attachments"
> & {
  zones: { name: string; name_th: string | null } | null;
  enclosures: { name: string; name_th: string | null } | null;
};

const JOB_COLUMNS =
  "id, job_code, title, description, status, zone_id, enclosure_id, estimated_cost, actual_cost, due_date, date_created, date_completed, updated_at, assigned_user_id, drive_folder_id, zones(name, name_th), enclosures(name, name_th)";

/**
 * Maintenance jobs with their files. `attachments` has no foreign key to
 * `maintenance` (it's polymorphic on owner_type/owner_id), so PostgREST
 * can't embed it and the files come in a second query keyed by job id —
 * the same two-step the enclosure hub does for resident photos. The
 * assignee's name comes the same way: the FK points at auth.users, which
 * PostgREST can't embed, so `app_users` (0055) is read for the ids seen.
 */
export async function loadMaintenanceJobs(
  supabase: SupabaseClient,
  filter: { enclosureId?: string; zoneId?: string; id?: string; assignedUserId?: string } = {},
): Promise<{ jobs: MaintenanceJob[]; error: string | null }> {
  let query = supabase.from("maintenance").select(JOB_COLUMNS);
  if (filter.id) query = query.eq("id", filter.id);
  if (filter.enclosureId) query = query.eq("enclosure_id", filter.enclosureId);
  if (filter.zoneId) query = query.eq("zone_id", filter.zoneId);
  if (filter.assignedUserId) query = query.eq("assigned_user_id", filter.assignedUserId);

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

  const assignees = await loadAppUsersById(
    supabase,
    rows.map((r) => r.assigned_user_id).filter((id): id is string => !!id),
  );

  return {
    jobs: rows.map(({ zones, enclosures, ...row }) => ({
      ...row,
      zone_name: zones?.name ?? "—",
      zone_name_th: zones?.name_th ?? null,
      enclosure_name: enclosures?.name ?? null,
      enclosure_name_th: enclosures?.name_th ?? null,
      assignee_name: row.assigned_user_id
        ? appUserLabel(assignees.get(row.assigned_user_id))
        : null,
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
