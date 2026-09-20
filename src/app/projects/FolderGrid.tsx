"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Folder, FolderPlus, Globe, Image as ImageIcon } from "lucide-react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { formatDate } from "@/lib/format";
import type { ProjectFolder } from "@/lib/projects/queries";
import { createProjectFolder } from "./actions";

export type FolderSort = "name" | "newest" | "date";

/** The folder's display name in the reader's language (Thai falls back to English). */
export function folderDisplayName(
  folder: Pick<ProjectFolder, "name" | "name_th" | "parent_folder_id">,
  locale: string,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (!folder.parent_folder_id) return projectCategoryLabel(t, folder.name);
  return (locale === "th" && folder.name_th) || folder.name;
}

export function sortFolders(folders: ProjectFolder[], sort: FolderSort): ProjectFolder[] {
  const sorted = [...folders];
  switch (sort) {
    case "newest":
      sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      break;
    case "date":
      // Dated projects first, newest date first; undated after, by name.
      sorted.sort((a, b) => {
        if (a.project_date && b.project_date) return b.project_date.localeCompare(a.project_date);
        if (a.project_date) return -1;
        if (b.project_date) return 1;
        return a.name.localeCompare(b.name);
      });
      break;
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }
  return sorted;
}

function FolderCard({ folder }: { folder: ProjectFolder }) {
  const { t, locale } = useI18n();
  const f = t.projects.folders;
  const isCategory = !folder.parent_folder_id;
  const thumb = folder.thumbnail_drive_file_id;

  return (
    <Link
      href={`/projects/${folder.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:bg-surface-hover"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-hover">
        {thumb ? (
          <img
            src={driveImageUrl(thumb)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted">
            <Folder aria-hidden="true" className="h-12 w-12 opacity-50" />
          </span>
        )}
        {folder.is_public && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-xs font-medium text-white">
            <Globe aria-hidden="true" className="h-3 w-3" />
            {f.publicBadge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="truncate font-medium text-foreground" title={folder.name}>
          {folderDisplayName(folder, locale, t)}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Folder aria-hidden="true" className="h-3.5 w-3.5" />
            {f.subfolders(folder.child_count)}
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon aria-hidden="true" className="h-3.5 w-3.5" />
            {f.photos(folder.photo_count)}
          </span>
          {!isCategory && folder.project_date && (
            <span>{formatDate(folder.project_date, locale)}</span>
          )}
        </span>
      </div>
    </Link>
  );
}

/**
 * Inline "new folder" form, shown in place of a card at the end of the
 * grid. Creates the folder in `parentId` and navigates into it.
 */
export function NewFolderCard({ parentId }: { parentId: string }) {
  const { t } = useI18n();
  const f = t.projects.folders;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface p-4 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
      >
        <FolderPlus aria-hidden="true" className="h-8 w-8" />
        {f.newFolder}
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-primary bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await createProjectFolder(parentId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setOpen(false);
          if (result.folderId) router.push(`/projects/${result.folderId}`);
          else router.refresh();
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {f.nameLabel}
        <input
          name="name"
          required
          autoFocus
          maxLength={120}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
        <span className="font-normal">{f.nameHint}</span>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {f.nameThLabel}
        <input
          name="nameTh"
          maxLength={120}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={isPending}
          className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? t.common.creating : f.create}
        </button>
      </div>
    </form>
  );
}

/**
 * A grid of folder cards with a sort switcher. `parentId` enables the
 * "new folder" card (staff only, never at the root — categories are fixed).
 */
export function FolderGrid({
  folders,
  parentId,
  canWrite,
  empty,
  showSort = true,
}: {
  folders: ProjectFolder[];
  parentId: string | null;
  canWrite: boolean;
  empty: string;
  showSort?: boolean;
}) {
  const { t } = useI18n();
  const [sort, setSort] = useState<FolderSort>("name");
  const sorted = showSort ? sortFolders(folders, sort) : folders;
  const canCreate = canWrite && parentId !== null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {t.projects.folders.heading}{" "}
          <span className="text-sm text-muted">({folders.length})</span>
        </h2>
        {showSort && folders.length > 1 && (
          <div
            role="group"
            aria-label={t.projects.sort.label}
            className="flex gap-1 rounded border border-border bg-surface p-0.5 text-xs"
          >
            {(["name", "newest", "date"] as FolderSort[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={sort === option}
                onClick={() => setSort(option)}
                className={`rounded px-2.5 py-1 font-medium transition ${
                  sort === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.projects.sort[option]}
              </button>
            ))}
          </div>
        )}
      </div>

      {sorted.length === 0 && !canCreate ? (
        <p className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
          {canCreate && <NewFolderCard parentId={parentId} />}
        </div>
      )}
    </section>
  );
}
