import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { projectCategoryLabel } from "@/lib/i18n/enum-labels";
import { PROJECT_CATEGORIES } from "@/lib/projects/queries";
import { loadPublicProjects, parseCategoryParam } from "@/lib/projects/public";
import { PublicHeader } from "../adopt/PublicHeader";
import { ProjectCard } from "./ProjectCard";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: `${t.ourWork.pageTitle} · ${t.header.appName}`,
    description: t.ourWork.pageSubtitle,
  };
}

/**
 * /our-work[?category=…] — every published project story as a card,
 * newest first. The category filter lives in the URL so a link to "all our
 * sterilisation work" can be shared, and the page stays server-rendered
 * (the same shape the /adopt filters item asks for). Chips are shown only
 * for categories that have a story, in the shelter's category order.
 */
export default async function OurWorkPage(props: PageProps<"/our-work">) {
  const searchParams = await props.searchParams;
  const category = parseCategoryParam(searchParams.category);
  const supabase = await createClient();
  const { t, locale } = await getT();

  const { projects, error } = await loadPublicProjects(supabase);
  const present = new Set(projects.map((p) => p.category));
  const chips = PROJECT_CATEGORIES.filter((c) => present.has(c));
  const shown = category ? projects.filter((p) => p.category === category) : projects;

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm font-medium transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface text-muted hover:border-primary hover:text-foreground"
    }`;

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="our-work" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.ourWork.pageTitle}
          </h1>
          <p className="max-w-2xl text-sm text-muted">{t.ourWork.pageSubtitle}</p>
        </div>

        {error && (
          <p className="text-sm text-danger">
            {t.ourWork.couldntLoad}: {error}
          </p>
        )}

        {chips.length > 1 && (
          <nav
            aria-label={t.ourWork.filterLabel}
            className="flex flex-wrap gap-2"
          >
            <Link
              href="/our-work"
              aria-current={category ? undefined : "page"}
              className={chipClass(!category)}
            >
              {t.ourWork.allCategories}
            </Link>
            {chips.map((c) => (
              <Link
                key={c}
                href={`/our-work?category=${encodeURIComponent(c)}`}
                aria-current={c === category ? "page" : undefined}
                className={chipClass(c === category)}
              >
                {projectCategoryLabel(t, c)}
              </Link>
            ))}
          </nav>
        )}

        {!error && shown.length === 0 && (
          <p className="rounded border border-border bg-surface p-6 text-center text-sm text-muted">
            {category && projects.length > 0
              ? t.ourWork.noneInCategory
              : t.ourWork.noneListed}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} t={t} />
          ))}
        </div>
      </div>
    </main>
  );
}
