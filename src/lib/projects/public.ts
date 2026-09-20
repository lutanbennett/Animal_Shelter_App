import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";
import { PROJECT_CATEGORIES, type ProjectCategory } from "./queries";

/**
 * The public side of project work: what /our-work reads. Both views (0042)
 * are granted to anon, filtered on is_public, and carry nothing that names
 * a person or a Drive folder — the column lists here are the whole shape.
 */

/** One row of public_projects. */
export type PublicProject = {
  id: string;
  category: ProjectCategory;
  title: string;
  title_th: string | null;
  summary: string | null;
  summary_th: string | null;
  project_date: string | null;
  location: string | null;
  sort_date: string;
  cover_drive_file_id: string | null;
  photo_count: number;
};

/** One row of public_project_photos. */
export type PublicProjectPhoto = {
  id: string;
  drive_file_id: string;
  caption: string | null;
  caption_th: string | null;
};

const PROJECT_COLUMNS =
  "id, category, title, title_th, summary, summary_th, project_date, location, sort_date, cover_drive_file_id, photo_count";

/**
 * Every published story, newest first. The shelter publishes a handful a
 * month at most, so the listing loads them all and the category filter is
 * applied in memory — which is also what lets the filter chips show only
 * categories that have something in them.
 */
export async function loadPublicProjects(
  supabase: SupabaseClient,
  limit?: number,
): Promise<{ projects: PublicProject[]; error: string | null }> {
  let query = supabase
    .from("public_projects")
    .select(PROJECT_COLUMNS)
    .order("sort_date", { ascending: false })
    .order("title");
  if (limit) query = query.limit(limit);
  const { data, error } = await query.returns<PublicProject[]>();
  return { projects: data ?? [], error: error?.message ?? null };
}

export async function loadPublicProject(
  supabase: SupabaseClient,
  id: string,
): Promise<PublicProject | null> {
  const { data } = await supabase
    .from("public_projects")
    .select(PROJECT_COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<PublicProject[]>();
  return data?.[0] ?? null;
}

/** A story's photos in the order staff arranged them (sort_order, then upload). */
export async function loadPublicProjectPhotos(
  supabase: SupabaseClient,
  projectId: string,
): Promise<PublicProjectPhoto[]> {
  const { data } = await supabase
    .from("public_project_photos")
    .select("id, drive_file_id, caption, caption_th")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("uploaded_at", { ascending: true })
    .returns<PublicProjectPhoto[]>();
  return data ?? [];
}

/**
 * The Thai text when the visitor reads Thai and staff have written it,
 * otherwise the English — a story is never hidden for lacking a
 * translation. Empty strings count as missing.
 */
export function localized(
  locale: Locale,
  en: string | null | undefined,
  th: string | null | undefined,
): string {
  return (locale === "th" && th?.trim()) || en?.trim() || "";
}

/** A story's title, summary and cover alt text in the visitor's language. */
export function publicProjectText(project: PublicProject, locale: Locale) {
  return {
    title: localized(locale, project.title, project.title_th),
    summary: localized(locale, project.summary, project.summary_th),
  };
}

/**
 * Summaries are plain text with blank lines between paragraphs (the
 * /projects info card renders them whitespace-pre-line). The cards and the
 * share preview want just the opening sentence or two.
 */
export function summaryParagraphs(summary: string): string[] {
  return summary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function summaryLead(summary: string, maxLength = 160): string {
  const first = summaryParagraphs(summary)[0] ?? "";
  if (first.length <= maxLength) return first;
  return `${first.slice(0, maxLength - 1).trimEnd()}…`;
}

/** The `?category=` search param, or null for anything not in the fixed list. */
export function parseCategoryParam(
  value: string | string[] | undefined,
): ProjectCategory | null {
  if (typeof value !== "string") return null;
  return (PROJECT_CATEGORIES as readonly string[]).includes(value)
    ? (value as ProjectCategory)
    : null;
}
