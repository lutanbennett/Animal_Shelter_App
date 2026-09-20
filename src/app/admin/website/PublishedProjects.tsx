"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { formatDate } from "@/lib/format";
import { unpublishProject } from "./actions";

export type PublishedProjectRow = {
  id: string;
  name: string;
  name_th: string | null;
  top_level_category: string;
  project_date: string | null;
  photo_count: number;
  thumbnail_drive_file_id: string | null;
};

/**
 * Everything currently on /our-work, with one-click removal. Publishing
 * still happens on the folder itself (/projects/[id], "Show on website"),
 * where the story is written; this is the quick way off the site when
 * something shouldn't be there, without hunting for the folder in the
 * tree. Each row links to the folder for editing and to the public page.
 */
export function PublishedProjects({ projects }: { projects: PublishedProjectRow[] }) {
  const { t, locale } = useI18n();
  const p = t.admin.website.published;
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleRemove(project: PublishedProjectRow) {
    if (!window.confirm(p.removeConfirm(project.name))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await unpublishProject(project.id);
      if (result && "error" in result) setMessage(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{p.heading}</h2>
        <p className="text-sm text-muted">{p.subtitle}</p>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">{p.none}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded border border-border bg-background">
          {projects.map((project) => {
            const title = (locale === "th" && project.name_th) || project.name;
            return (
              <li key={project.id} className="flex items-center gap-3 p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-surface">
                  {project.thumbnail_drive_file_id ? (
                    <Image
                      src={driveImageUrl(project.thumbnail_drive_file_id)}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-[10px] text-muted">
                      {t.adopt.noPhoto}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link
                    href={`/projects/${project.id}`}
                    className="truncate text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {title}
                  </Link>
                  <span className="truncate text-xs text-muted">
                    {[
                      projectCategoryLabel(t, project.top_level_category),
                      project.project_date ? formatDate(project.project_date, locale) : null,
                      t.ourWork.photoCount(project.photo_count),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/our-work/${project.id}`}
                    target="_blank"
                    rel="noopener"
                    className="hidden rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover sm:inline-block"
                  >
                    {p.view}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(project)}
                    disabled={isPending}
                    className="rounded border border-border px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                  >
                    {p.remove}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isPending && <span className="text-sm text-muted">{t.common.saving}</span>}
      {message && <p className="text-sm text-danger">{message}</p>}
    </div>
  );
}
