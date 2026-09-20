import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  canWriteProjects,
  loadAllProjectFolders,
  loadProjectChildren,
  loadProjectFolder,
  loadProjectFolderPath,
  loadProjectPhotos,
} from "@/lib/projects/queries";
import { FolderView } from "./FolderView";

/**
 * /projects/[id] — one folder at any level of the tree: its breadcrumb,
 * the folders inside it, its photos and (below the category level) its
 * info card. The full folder list is loaded too, for the move picker;
 * it's a single small query at this shelter's scale.
 */
export default async function ProjectFolderPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const folder = await loadProjectFolder(supabase, id);
  if (!folder) notFound();

  const [{ data: role }, path, children, photos, all] = await Promise.all([
    supabase.rpc("current_user_role"),
    loadProjectFolderPath(supabase, id),
    loadProjectChildren(supabase, id),
    loadProjectPhotos(supabase, id),
    loadAllProjectFolders(supabase),
  ]);

  const error = children.error ?? photos.error;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      {error && (
        <p className="text-sm text-danger">
          {t.projects.couldntLoad}: {error}
        </p>
      )}
      <FolderView
        folder={folder}
        path={path}
        childFolders={children.folders}
        photos={photos.photos}
        allFolders={all}
        canWrite={canWriteProjects(role)}
      />
    </main>
  );
}
