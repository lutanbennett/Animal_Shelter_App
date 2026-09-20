import Image from "next/image";
import Link from "next/link";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { formatDate } from "@/lib/format";
import {
  publicProjectText,
  summaryLead,
  type PublicProject,
} from "@/lib/projects/public";

/**
 * One story as a card — the /our-work grid and the home page's "What we
 * do" strip share it. Cover photo, category, date, title and the opening
 * line of the summary in the visitor's language.
 */
export function ProjectCard({
  project,
  locale,
  t,
}: {
  project: PublicProject;
  locale: Locale;
  t: Dictionary;
}) {
  const { title, summary } = publicProjectText(project, locale);
  const lead = summary ? summaryLead(summary) : "";

  return (
    <Link
      href={`/our-work/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface hover:border-primary"
    >
      <div className="relative aspect-[4/3] w-full bg-background">
        {project.cover_drive_file_id ? (
          <Image
            src={driveImageUrl(project.cover_drive_file_id)}
            alt={title}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {t.ourWork.noPhoto}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {projectCategoryLabel(t, project.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {project.project_date && (
          <time
            dateTime={project.project_date}
            className="text-xs font-medium uppercase tracking-wide text-muted"
          >
            {formatDate(project.project_date, locale)}
          </time>
        )}
        <h2 className="text-base font-semibold text-foreground group-hover:text-primary">
          {title}
        </h2>
        {lead && <p className="text-sm text-muted">{lead}</p>}
      </div>
    </Link>
  );
}
