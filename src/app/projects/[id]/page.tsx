import { notFound } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import {
  loadAllProjectFolders,
  loadProjectChildren,
  loadProjectFolder,
  loadProjectFolderPath,
  loadProjectPhotos,
} from "@/lib/projects/queries";
import { loadTranslations } from "@/lib/translations/queries";
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
  const { supabase, perms } = await requirePermission("projects.folders", "read");

  const folder = await loadProjectFolder(supabase, id);
  if (!folder) notFound();

  const [path, children, photos, all] = await Promise.all([
    loadProjectFolderPath(supabase, id),
    loadProjectChildren(supabase, id),
    loadProjectPhotos(supabase, id),
    loadAllProjectFolders(supabase),
  ]);

  // The other-language story and captions (0056): the folder's own row
  // and one per photo, loaded together and split by table in the view.
  const [folderTranslations, photoTranslations] = await Promise.all([
    loadTranslations(supabase, "project_folders", [id]),
    loadTranslations(supabase, "attachments", photos.photos.map((p) => p.id)),
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
        canWrite={can(perms, "projects.folders")}
        canManageTranslations={can(perms, "translations.manage")}
        translations={[...folderTranslations.values(), ...photoTranslations.values()]}
      />
    </main>
  );
}
