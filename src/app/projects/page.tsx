import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  canWriteProjects,
  loadAllProjectFolders,
  loadProjectCategories,
} from "@/lib/projects/queries";
import { FolderGrid } from "./FolderGrid";
import { FolderSearch, SearchResults } from "./FolderSearch";

/**
 * /projects[?q=…] — the root of the project tree: the twelve fixed
 * categories as folder cards, or, with a search term, every folder whose
 * name matches, shown with its path. Folders are few enough (hundreds at
 * most) that search loads them all and filters here.
 */
export default async function ProjectsPage(props: PageProps<"/projects">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const { t } = await getT();
  const supabase = await createClient();

  const [{ data: role }, categories, all] = await Promise.all([
    supabase.rpc("current_user_role"),
    loadProjectCategories(supabase),
    q ? loadAllProjectFolders(supabase) : Promise.resolve(null),
  ]);
  const canWrite = canWriteProjects(role);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t.projects.pageTitle}</h1>
          <p className="text-sm text-muted">{t.projects.pageSubtitle}</p>
        </div>
        <FolderSearch initialQuery={q} />
      </div>

      {categories.error && (
        <p className="text-sm text-danger">
          {t.projects.couldntLoad}: {categories.error}
        </p>
      )}

      {q && all ? (
        <SearchResults query={q} folders={all} />
      ) : (
        <FolderGrid
          folders={categories.folders}
          parentId={null}
          canWrite={canWrite}
          empty={t.projects.folders.empty}
          showSort={false}
        />
      )}

      {!canWrite && !q && <p className="text-xs text-muted">{t.projects.readOnly}</p>}
    </main>
  );
}
