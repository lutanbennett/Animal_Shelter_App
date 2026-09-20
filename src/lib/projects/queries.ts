import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The twelve fixed categories under /Projects/, in the order the shelter
 * listed them (which is the order the root page shows them). The database
 * enforces the same list (0034, project_folders_category_check); this copy
 * is for ordering and the Thai labels in enum-labels.ts.
 */
export const PROJECT_CATEGORIES = [
  "Shelter Projects",
  "Community Projects",
  "Community Outreach",
  "Visitors and Volunteers",
  "Social Media",
  "Puppies",
  "Sterilisations",
  "Donations",
  "Fundraising Campaigns",
  "Events",
  "Rescues",
  "Miscellaneous",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** One row of project_folder_summary (0034). */
export type ProjectFolder = {
  id: string;
  parent_folder_id: string | null;
  top_level_category: ProjectCategory;
  name: string;
  name_th: string | null;
  summary: string | null;
  summary_th: string | null;
  project_date: string | null;
  location: string | null;
  is_public: boolean;
  cover_attachment_id: string | null;
  drive_folder_id: string | null;
  created_at: string;
  updated_at: string;
  child_count: number;
  photo_count: number;
  thumbnail_drive_file_id: string | null;
};

export type ProjectPhoto = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  caption: string | null;
  caption_th: string | null;
  sort_order: number | null;
  date_taken: string | null;
  uploaded_at: string;
};

/** A folder's ancestors root-first, then itself — the breadcrumb. */
export type ProjectFolderPath = Pick<ProjectFolder, "id" | "name" | "name_th">[];

const SUMMARY_COLUMNS =
  "id, parent_folder_id, top_level_category, name, name_th, summary, summary_th, project_date, location, is_public, cover_attachment_id, drive_folder_id, created_at, updated_at, child_count, photo_count, thumbnail_drive_file_id";

/** The category rows, in the shelter's order. */
export async function loadProjectCategories(
  supabase: SupabaseClient,
): Promise<{ folders: ProjectFolder[]; error: string | null }> {
  const { data, error } = await supabase
    .from("project_folder_summary")
    .select(SUMMARY_COLUMNS)
    .is("parent_folder_id", null)
    .returns<ProjectFolder[]>();
  if (error) return { folders: [], error: error.message };

  const order = new Map<string, number>(PROJECT_CATEGORIES.map((c, i) => [c, i]));
  const folders = [...(data ?? [])].sort(
    (a, b) => (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99),
  );
  return { folders, error: null };
}

export async function loadProjectFolder(
  supabase: SupabaseClient,
  id: string,
): Promise<ProjectFolder | null> {
  const { data } = await supabase
    .from("project_folder_summary")
    .select(SUMMARY_COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<ProjectFolder[]>();
  return data?.[0] ?? null;
}

export async function loadProjectChildren(
  supabase: SupabaseClient,
  parentId: string,
): Promise<{ folders: ProjectFolder[]; error: string | null }> {
  const { data, error } = await supabase
    .from("project_folder_summary")
    .select(SUMMARY_COLUMNS)
    .eq("parent_folder_id", parentId)
    .order("name")
    .returns<ProjectFolder[]>();
  return { folders: data ?? [], error: error?.message ?? null };
}

export async function loadProjectPhotos(
  supabase: SupabaseClient,
  folderId: string,
): Promise<{ photos: ProjectPhoto[]; error: string | null }> {
  const { data, error } = await supabase
    .from("attachments")
    .select("id, drive_file_id, file_name, caption, caption_th, sort_order, date_taken, uploaded_at")
    .eq("owner_type", "project")
    .eq("owner_id", folderId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("uploaded_at", { ascending: true })
    .returns<ProjectPhoto[]>();
  return { photos: data ?? [], error: error?.message ?? null };
}

type PathRow = { id: string; name: string; name_th: string | null; parent_folder_id: string | null };

/**
 * Walks up from a folder to its category, one query per level. Trees are
 * shallow (a handful of levels) so this costs a few small round-trips and
 * needs no recursive SQL.
 */
export async function loadProjectFolderPath(
  supabase: SupabaseClient,
  folderId: string,
): Promise<ProjectFolderPath> {
  const path: ProjectFolderPath = [];
  let cursor: string | null = folderId;
  // Guard against a corrupted tree looping forever; 0034 refuses cycles.
  for (let depth = 0; cursor && depth < 32; depth += 1) {
    const result: { data: PathRow[] | null } = await supabase
      .from("project_folders")
      .select("id, name, name_th, parent_folder_id")
      .eq("id", cursor)
      .limit(1)
      .returns<PathRow[]>();
    const row = result.data?.[0];
    if (!row) break;
    path.unshift({ id: row.id, name: row.name, name_th: row.name_th });
    cursor = row.parent_folder_id;
  }
  return path;
}

/**
 * Every folder, for the move picker and the search box. Hundreds at most
 * for this shelter, so one query and an in-memory tree is simpler than
 * paging.
 */
export async function loadAllProjectFolders(
  supabase: SupabaseClient,
): Promise<ProjectFolder[]> {
  const { data } = await supabase
    .from("project_folder_summary")
    .select(SUMMARY_COLUMNS)
    .order("name")
    .returns<ProjectFolder[]>();
  return data ?? [];
}

/** "Events / 2026 Fun Run / Day 1" — a folder's path as text. */
export function projectFolderPathLabel(
  all: Pick<ProjectFolder, "id" | "name" | "parent_folder_id">[],
  id: string,
): string[] {
  const byId = new Map(all.map((f) => [f.id, f]));
  const names: string[] = [];
  let cursor = byId.get(id);
  for (let depth = 0; cursor && depth < 32; depth += 1) {
    names.unshift(cursor.name);
    cursor = cursor.parent_folder_id ? byId.get(cursor.parent_folder_id) : undefined;
  }
  return names;
}

/**
 * Who may create, rename, move, describe, publish and delete folders.
 * Volunteers can read the tree and add photos (RLS in 0001); the folder
 * itself is staff/admin work.
 */
export function canWriteProjects(role: string | null | undefined): boolean {
  return role === "admin" || role === "staff";
}
