import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { formatDate } from "@/lib/format";
import { getSiteOrigin } from "@/lib/site-origin";
import {
  loadPublicProject,
  loadPublicProjectPhotos,
  loadPublicProjects,
  publicProjectText,
  summaryLead,
  summaryParagraphs,
} from "@/lib/projects/public";
import { localizedField } from "@/lib/translations/localize";
import { PublicHeader } from "../../adopt/PublicHeader";
import { PublicFooter } from "../../adopt/PublicFooter";
import { ProjectCard } from "../ProjectCard";
import { StoryGallery, type StoryPhoto } from "./StoryGallery";

/**
 * Open Graph tags so a story pasted into Facebook or LINE previews with
 * its cover photo and opening line. The cover goes through the photo proxy
 * like every other image, so the scrapers fetch it unauthenticated the
 * same way a browser does.
 */
export async function generateMetadata(
  props: PageProps<"/our-work/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const project = await loadPublicProject(supabase, id);
  if (!project) return { title: t.ourWork.pageTitle };

  const { title, summary } = publicProjectText(project, locale);
  const description = summary ? summaryLead(summary, 200) : t.ourWork.shareFallback;
  const fullTitle = `${title} · ${t.header.appName}`;
  const image = project.cover_drive_file_id
    ? driveImageUrl(project.cover_drive_file_id)
    : undefined;

  return {
    title: fullTitle,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "article",
      title: fullTitle,
      description,
      url: `/our-work/${project.id}`,
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
      ...(project.project_date ? { publishedTime: project.project_date } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PublicProjectPage(
  props: PageProps<"/our-work/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { t, locale } = await getT();

  const [project, photos, recent] = await Promise.all([
    loadPublicProject(supabase, id),
    loadPublicProjectPhotos(supabase, id),
    // Four newest, so three remain once this story is dropped from them.
    loadPublicProjects(supabase, 4),
  ]);
  if (!project) notFound();

  const { title, summary } = publicProjectText(project, locale);
  const paragraphs = summaryParagraphs(summary);
  const ordered: StoryPhoto[] = photos.map((photo) => ({
    id: photo.id,
    drive_file_id: photo.drive_file_id,
    caption: localizedField(locale, photo.caption, photo.translations, "caption"),
  }));
  // The cover leads the gallery so the page opens on the shot staff chose;
  // the rest keep their arranged order.
  const galleryPhotos = [
    ...ordered.filter((p) => p.drive_file_id === project.cover_drive_file_id),
    ...ordered.filter((p) => p.drive_file_id !== project.cover_drive_file_id),
  ];
  const more = recent.projects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="our-work" />

      <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 sm:px-12">
        <Link
          href="/our-work"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          {t.ourWork.backToAll}
        </Link>

        <header className="flex flex-col gap-3">
          <Link
            href={`/our-work?category=${encodeURIComponent(project.category)}`}
            className="w-fit text-sm font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            {projectCategoryLabel(t, project.category)}
          </Link>
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          {(project.project_date || project.location) && (
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {project.project_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  <time dateTime={project.project_date}>
                    {formatDate(project.project_date, locale)}
                  </time>
                </span>
              )}
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  {project.location}
                </span>
              )}
            </p>
          )}
        </header>

        <StoryGallery title={title} photos={galleryPhotos} />

        {paragraphs.length > 0 && (
          <div className="flex flex-col gap-4 text-base leading-relaxed text-foreground sm:text-lg">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </article>

      {more.length > 0 && (
        <section
          aria-labelledby="more-stories-heading"
          className="border-t border-border bg-surface"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-10 sm:px-12">
            <h2
              id="more-stories-heading"
              className="text-lg font-semibold text-foreground"
            >
              {t.ourWork.moreStories}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <ProjectCard key={p.id} project={p} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicFooter />
    </main>
  );
}
