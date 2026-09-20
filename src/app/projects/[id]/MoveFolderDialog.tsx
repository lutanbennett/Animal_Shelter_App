"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Folder, FolderInput } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { PROJECT_CATEGORIES, type ProjectFolder } from "@/lib/projects/queries";
import { moveProjectFolder } from "../actions";

type TreeNode = { folder: ProjectFolder; depth: number; disabled: boolean };

/**
 * Picks a new parent for a folder from the whole tree, shown indented
 * with categories at the top level. The folder itself and everything
 * beneath it are listed but disabled — moving into your own subtree is
 * refused by the database anyway (0034), but showing why is kinder.
 */
type MoveFolderDialogProps = {
  folder: ProjectFolder;
  allFolders: ProjectFolder[];
  onClose: () => void;
  onMoved: (driveWarning: string | null) => void;
};

export function MoveFolderDialog({ open, ...props }: MoveFolderDialogProps & { open: boolean }) {
  // Mounted only while open, so the selection and error start fresh each
  // time rather than being reset in an effect.
  if (!open || typeof document === "undefined") return null;
  return <MoveFolderDialogBody {...props} />;
}

function MoveFolderDialogBody({ folder, allFolders, onClose, onMoved }: MoveFolderDialogProps) {
  const { t, locale } = useI18n();
  const f = t.projects.folders;
  const [selected, setSelected] = useState<string | null>(folder.parent_folder_id);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const tree = useMemo<TreeNode[]>(() => {
    const children = new Map<string | null, ProjectFolder[]>();
    for (const item of allFolders) {
      const list = children.get(item.parent_folder_id) ?? [];
      list.push(item);
      children.set(item.parent_folder_id, list);
    }
    const nodes: TreeNode[] = [];
    const categoryOrder = new Map<string, number>(PROJECT_CATEGORIES.map((c, i) => [c, i]));
    function walk(parentId: string | null, depth: number, insideSelf: boolean) {
      const items = children.get(parentId) ?? [];
      // Categories in the shelter's order (as on the root page); user
      // folders alphabetically.
      items.sort((a, b) =>
        depth === 0
          ? (categoryOrder.get(a.name) ?? 99) - (categoryOrder.get(b.name) ?? 99)
          : a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
      for (const item of items) {
        const isSelf = item.id === folder.id;
        const disabled = insideSelf || isSelf;
        nodes.push({ folder: item, depth, disabled });
        walk(item.id, depth + 1, disabled);
      }
    }
    walk(null, 0, false);
    return nodes;
  }, [allFolders, folder.id]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-dialog-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-primary/15 p-2 text-primary">
            <FolderInput aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="move-dialog-title" className="text-lg font-semibold text-foreground">
              {f.moveTitle(folder.name)}
            </h2>
            <p className="text-sm text-muted">{f.moveHint}</p>
          </div>
        </div>

        <ul className="flex flex-col overflow-y-auto rounded border border-border">
          {tree.map(({ folder: item, depth, disabled }) => {
            const isCurrent = item.id === folder.parent_folder_id;
            const active = item.id === selected;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => setSelected(item.id)}
                  style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
                  className={`flex w-full items-center gap-2 py-2 pr-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {depth > 0 && <ChevronRight aria-hidden="true" className="h-3 w-3 shrink-0 opacity-60" />}
                  <Folder aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {depth === 0
                      ? projectCategoryLabel(t, item.name)
                      : (locale === "th" && item.name_th) || item.name}
                  </span>
                  {isCurrent && (
                    <span className={`ml-auto shrink-0 text-xs ${active ? "opacity-80" : "text-muted"}`}>
                      {f.currentLocation}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={isPending || !selected || selected === folder.parent_folder_id}
            onClick={() => {
              if (!selected) return;
              setError(null);
              startTransition(async () => {
                const result = await moveProjectFolder(folder.id, selected);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                onMoved(result.driveWarning ?? null);
              });
            }}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {isPending ? t.common.saving : f.moveHere}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
