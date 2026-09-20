"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Folder, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { projectFolderPathLabel, type ProjectFolder } from "@/lib/projects/queries";
import { folderDisplayName } from "./FolderGrid";

/**
 * Search box for the root page. Debounced into the URL (?q=) so the
 * server renders the results and the address is shareable / refreshable.
 */
export function FolderSearch({ initialQuery }: { initialQuery: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === initialQuery) return;
    const handle = setTimeout(() => {
      router.replace(trimmed ? `/projects?q=${encodeURIComponent(trimmed)}` : "/projects");
    }, 300);
    return () => clearTimeout(handle);
  }, [value, initialQuery, router]);

  return (
    <div className="relative w-full sm:w-72">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.projects.search.placeholder}
        aria-label={t.projects.search.placeholder}
        className="w-full rounded border border-border bg-background py-2 pl-8 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label={t.projects.search.clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-foreground"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Matching folders (not categories) as a list, each with its path. */
export function SearchResults({
  query,
  folders,
}: {
  query: string;
  folders: ProjectFolder[];
}) {
  const { t, locale } = useI18n();
  const needle = query.toLocaleLowerCase();
  const matches = folders.filter(
    (f) =>
      f.parent_folder_id &&
      (f.name.toLocaleLowerCase().includes(needle) ||
        (f.name_th ?? "").toLocaleLowerCase().includes(needle)),
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted">{t.projects.search.results(matches.length)}</h2>
      {matches.length === 0 ? (
        <p className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          {t.projects.search.noResults}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {matches.map((folder) => {
            const path = projectFolderPathLabel(folders, folder.id);
            const ancestors = path.slice(0, -1);
            return (
              <li key={folder.id}>
                <Link
                  href={`/projects/${folder.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover"
                >
                  <Folder aria-hidden="true" className="h-5 w-5 shrink-0 text-muted" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {folderDisplayName(folder, locale, t)}
                    </span>
                    <span className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted">
                      {ancestors.map((name, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i === 0 ? projectCategoryLabel(t, name) : name}
                          <ChevronRight aria-hidden="true" className="h-3 w-3" />
                        </span>
                      ))}
                      <span>{t.projects.folders.photos(folder.photo_count)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
