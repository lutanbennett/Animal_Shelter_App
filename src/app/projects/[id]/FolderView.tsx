"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronRight,
  Folder,
  FolderInput,
  Globe,
  Lock,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TranslationPanel } from "@/components/TranslationPanel";
import { localizedFromRow } from "@/lib/translations/localize";
import type { TranslationRow } from "@/lib/translations/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { formatDate } from "@/lib/format";
import type { ProjectFolder, ProjectFolderPath, ProjectPhoto } from "@/lib/projects/queries";
import {
  deleteProjectFolder,
  renameProjectFolder,
  setProjectFolderPublic,
  updateProjectFolderInfo,
} from "../actions";
import { FolderGrid, folderDisplayName } from "../FolderGrid";
import { MoveFolderDialog } from "./MoveFolderDialog";
import { PhotoSection } from "./PhotoSection";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function Breadcrumb({ path }: { path: ProjectFolderPath }) {
  const { t, locale } = useI18n();
  const crumbs = path.slice(0, -1);
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      <Link href="/projects" className="hover:text-foreground hover:underline">
        {t.projects.root}
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
          <Link href={`/projects/${crumb.id}`} className="hover:text-foreground hover:underline">
            {i === 0
              ? projectCategoryLabel(t, crumb.name)
              : (locale === "th" && crumb.name_th) || crumb.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function FolderView({
  folder,
  path,
  childFolders,
  photos,
  allFolders,
  canWrite,
  canManageTranslations,
  translations,
}: {
  folder: ProjectFolder;
  path: ProjectFolderPath;
  childFolders: ProjectFolder[];
  photos: ProjectPhoto[];
  allFolders: ProjectFolder[];
  canWrite: boolean;
  /** Admin/management: may write and approve the other-language text. */
  canManageTranslations: boolean;
  /** The folder's story row and the photos' caption rows (0056). */
  translations: TranslationRow[];
}) {
  const { t, locale } = useI18n();
  const f = t.projects.folders;
  const info = t.projects.info;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driveWarning, setDriveWarning] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "rename" | "info">("view");
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isCategory = !folder.parent_folder_id;
  const parent = path.length >= 2 ? path[path.length - 2] : null;
  const displayName = folderDisplayName(folder, locale, t);
  // The story in the reader's language when an approved translation
  // exists in it, else as written; the panel below it carries the rest.
  const summaryTranslation =
    translations.find((row) => row.table_name === "project_folders" && row.row_id === folder.id) ?? null;
  const summary = localizedFromRow(locale, folder.summary, summaryTranslation) || null;
  const isEmpty = folder.child_count === 0 && folder.photo_count === 0;

  function run(action: () => Promise<{ error?: string; driveWarning?: string | null; folderId?: string }>, after?: (folderId?: string) => void) {
    setError(null);
    setDriveWarning(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.driveWarning) setDriveWarning(result.driveWarning);
      after?.(result.folderId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb path={path} />

      <header className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
        {mode === "rename" ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              run(() => renameProjectFolder(folder.id, formData), () => setMode("view"));
            }}
          >
            <h2 className="text-sm font-medium text-muted">{f.renameTitle}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                {f.nameLabel}
                <input name="name" defaultValue={folder.name} required autoFocus maxLength={120} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                {f.nameThLabel}
                <input name="nameTh" defaultValue={folder.name_th ?? ""} maxLength={120} className={inputClass} />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode("view")} disabled={isPending} className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={isPending} className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
                {isPending ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Folder aria-hidden="true" className="h-8 w-8 shrink-0 text-primary" />
                <div className="flex min-w-0 flex-col">
                  <h1 className="truncate text-2xl font-semibold text-foreground">{displayName}</h1>
                  {!isCategory && locale === "th" && folder.name_th && (
                    <span className="truncate text-sm text-muted">{folder.name}</span>
                  )}
                </div>
              </div>

              {canWrite && !isCategory && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setMode("rename")} disabled={isPending} className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50">
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    {f.rename}
                  </button>
                  <button type="button" onClick={() => setMoveOpen(true)} disabled={isPending} className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50">
                    <FolderInput aria-hidden="true" className="h-4 w-4" />
                    {f.move}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    disabled={isPending || !isEmpty}
                    title={isEmpty ? undefined : f.deleteHint}
                    className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {f.deleteFolder}
                  </button>
                </div>
              )}
            </div>

            {!isCategory && (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  {folder.project_date ? formatDate(folder.project_date, locale) : info.noDate}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  {folder.location ?? info.noLocation}
                </span>
                <span className={`flex items-center gap-1 ${folder.is_public ? "text-success" : ""}`}>
                  {folder.is_public ? (
                    <Globe aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Lock aria-hidden="true" className="h-4 w-4" />
                  )}
                  {folder.is_public ? info.isPublic : info.isPrivate}
                </span>
              </p>
            )}
            {isCategory && canWrite && <p className="text-xs text-muted">{f.categoryLocked}</p>}
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {driveWarning && <p className="text-xs text-primary">{info.driveWarning(driveWarning)}</p>}
      </header>

      <div className={`grid gap-6 ${isCategory ? "" : "lg:grid-cols-[2fr_1fr]"}`}>
        <div className="flex flex-col gap-6">
          <FolderGrid
            folders={childFolders}
            parentId={folder.id}
            canWrite={canWrite}
            empty={isCategory ? f.emptyCategory : f.empty}
          />
          {!isCategory && (
            <PhotoSection
              folder={folder}
              photos={photos}
              canWrite={canWrite}
              canManageTranslations={canManageTranslations}
              translations={translations.filter((row) => row.table_name === "attachments")}
            />
          )}
        </div>

        {!isCategory && (
          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-muted">{info.heading}</h3>
                {canWrite && mode !== "info" && (
                  <button type="button" onClick={() => setMode("info")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                    {info.edit}
                  </button>
                )}
              </div>

              {mode === "info" ? (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    run(() => updateProjectFolderInfo(folder.id, formData), () => setMode("view"));
                  }}
                >
                  <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                    {info.summary}
                    <textarea name="summary" defaultValue={folder.summary ?? ""} rows={5} className={inputClass} />
                    <span className="font-normal">{info.summaryHint}</span>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                    {info.date}
                    <input type="date" name="projectDate" defaultValue={folder.project_date ?? ""} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                    {info.location}
                    <input name="location" defaultValue={folder.location ?? ""} maxLength={200} className={inputClass} />
                  </label>
                  <label className="flex items-start gap-2 text-sm text-foreground">
                    <input type="checkbox" name="isPublic" defaultChecked={folder.is_public} className="mt-1 h-4 w-4 accent-primary" />
                    <span className="flex flex-col">
                      {info.showOnWebsite}
                      <span className="text-xs text-muted">{info.showOnWebsiteHint}</span>
                    </span>
                  </label>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setMode("view")} disabled={isPending} className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50">
                      {t.common.cancel}
                    </button>
                    <button type="submit" disabled={isPending} className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
                      {isPending ? t.common.saving : t.common.save}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {summary ? (
                    <p className="whitespace-pre-line text-sm text-foreground">{summary}</p>
                  ) : (
                    <p className="text-sm text-muted">{info.noSummary}</p>
                  )}
                  {summaryTranslation && canManageTranslations && (
                    <TranslationPanel
                      key={summaryTranslation.id + summaryTranslation.updated_at}
                      row={summaryTranslation}
                      canManage
                    />
                  )}
                  {canWrite && (
                    <label className="flex items-center gap-2 border-t border-border pt-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={folder.is_public}
                        disabled={isPending}
                        onChange={(e) => run(() => setProjectFolderPublic(folder.id, e.target.checked))}
                        className="h-4 w-4 accent-primary"
                      />
                      {info.showOnWebsite}
                    </label>
                  )}
                  <p className="text-xs text-muted">
                    {info.created(formatDate(folder.created_at, locale))}
                    {folder.updated_at !== folder.created_at &&
                      ` · ${info.updated(formatDate(folder.updated_at, locale))}`}
                  </p>
                </>
              )}
            </div>

            {parent && (
              <Link href={`/projects/${parent.id}`} className="text-sm text-muted hover:text-foreground">
                {t.projects.backToParent(
                  path.length === 2
                    ? projectCategoryLabel(t, parent.name)
                    : (locale === "th" && parent.name_th) || parent.name,
                )}
              </Link>
            )}
          </aside>
        )}
      </div>

      <MoveFolderDialog
        open={moveOpen}
        folder={folder}
        allFolders={allFolders}
        onClose={() => setMoveOpen(false)}
        onMoved={(warning) => {
          setMoveOpen(false);
          setDriveWarning(warning);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={f.deleteFolder}
        body={f.deleteConfirm(folder.name)}
        confirmLabel={t.common.delete}
        pending={isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() =>
          run(
            () => deleteProjectFolder(folder.id),
            (parentId) => {
              setDeleteOpen(false);
              router.push(parentId ? `/projects/${parentId}` : "/projects");
            },
          )
        }
      />
    </div>
  );
}
