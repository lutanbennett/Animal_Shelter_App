import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HandHeart, Heart, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { loadPublicProjects } from "@/lib/projects/public";
import { loadSiteContent, pairedText } from "@/lib/site/content";
import { loadSitePages, sitePageText } from "@/lib/site/pages";
import { bodyLead } from "@/lib/site/body";
import { SiteBody } from "@/components/SiteBody";
import { PublicHeader } from "./adopt/PublicHeader";
import { PublicFooter } from "./adopt/PublicFooter";
import { ProjectCard } from "./our-work/ProjectCard";

/** The "Pet of the week" card — read through public_resident_profiles. */
type FeaturedResident = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  ready_for_adoption: boolean;
  bio: string | null;
  profile_photo_drive_file_id: string | null;
  translations: PublicTranslations;
};

type GalleryPhoto = { id: string; drive_file_id: string; alt: string };

/** Counts only — public_shelter_stats (0039, 0062) is granted to anon. */
type ShelterStats = {
  in_care: number;
  in_treatment: number;
  adopted_last_7_days: number;
  adopted_this_year: number;
};

/**
 * Open Graph for the home page: the tagline as the description and the
 * hero photo as the image, so a link to the site previews as the site.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const content = await loadSiteContent(supabase);
  const description =
    pairedText(locale, content?.tagline, content?.tagline_th) || t.home.shareFallback;
  const image = content?.hero_drive_file_id
    ? driveImageUrl(content.hero_drive_file_id)
    : undefined;
  const title = t.header.appName;

  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: "/",
      siteName: title,
      locale: locale === "th" ? "th_TH" : "en_GB",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function WelcomePage() {
  const supabase = await createClient();
  const { t, locale } = await getT();

  const [content, pages, photosResult, statsResult, recentWork] = await Promise.all([
    loadSiteContent(supabase),
    loadSitePages(supabase),
    supabase
      .from("site_content_photos")
      .select("id, drive_file_id, alt")
      .order("sort_order")
      .returns<GalleryPhoto[]>(),
    supabase
      .from("public_shelter_stats")
      .select("in_care, in_treatment, adopted_last_7_days, adopted_this_year")
      .limit(1)
      .returns<ShelterStats[]>(),
    // "What we do": the three newest published project stories (0042).
    loadPublicProjects(supabase, 3),
  ]);

  const gallery = photosResult.data ?? [];
  const tagline = pairedText(locale, content?.tagline, content?.tagline_th);
  const heroAlt = pairedText(locale, content?.hero_alt, content?.hero_alt_th);
  const story = pages.get("our-story");
  const storyText = story ? sitePageText(story, locale) : null;

  // Looked up through the public view rather than trusting the stored id:
  // a resident that has since been hidden, adopted or has died isn't in the
  // view, so the card simply disappears. Sequential because it depends on
  // the site_content row (anon can't join residents directly).
  let featured: FeaturedResident | null = null;
  if (content?.featured_resident_id) {
    const { data } = await supabase
      .from("public_resident_profiles")
      .select(
        "id, name, species, breed, ready_for_adoption, bio, profile_photo_drive_file_id, translations",
      )
      .eq("id", content.featured_resident_id)
      .limit(1)
      .returns<FeaturedResident[]>();
    featured = data?.[0] ?? null;
  }
  const featuredIntro = localizedField(locale, featured?.bio, featured?.translations, "bio")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find(Boolean);
  // The strip is a nice-to-have: a failed query drops it rather than the page.
  const stats = statsResult.data?.[0] ?? null;
  const statTiles = stats
    ? [
        {
          value: stats.in_care,
          label: t.home.stats.inCare,
          detail: t.home.stats.inCareDetail,
        },
        {
          value: stats.adopted_this_year,
          label: t.home.stats.adoptedThisYear,
          detail: t.home.stats.adoptedThisYearDetail(stats.adopted_last_7_days),
        },
        {
          value: stats.in_treatment,
          label: t.home.stats.inVetCare,
          detail: t.home.stats.inVetCareDetail,
        },
      ]
    : [];

  // "How you can help": one card per way in, each leading with the first
  // paragraph of its page so the copy is the admin's, not the app's.
  const helpCards = (
    [
      { slug: "foster", href: "/foster", Icon: Home, label: t.adopt.fosterNav },
      { slug: "volunteer", href: "/volunteer", Icon: HandHeart, label: t.adopt.volunteerNav },
      { slug: "donate", href: "/donate", Icon: Heart, label: t.adopt.donateNav },
    ] as const
  ).map((card) => {
    const page = pages.get(card.slug);
    const text = page ? sitePageText(page, locale) : null;
    return {
      ...card,
      title: text?.title || card.label,
      lead: bodyLead(text?.body, 160),
    };
  });

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="home" />

      <section className="relative flex min-h-[26rem] items-end overflow-hidden bg-surface">
        {content?.hero_drive_file_id && (
          <Image
            src={driveImageUrl(content.hero_drive_file_id)}
            alt={heroAlt || t.header.appName}
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative flex flex-col gap-4 px-6 py-10 sm:px-12">
          <h1 className="max-w-2xl text-3xl font-semibold text-white sm:text-4xl">
            {t.home.welcomeHeading}
          </h1>
          {tagline && (
            <p className="max-w-xl text-base text-white/90 sm:text-lg">{tagline}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/adopt"
              className="rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {t.home.browseGuest}
            </Link>
            <Link
              href="/donate"
              className="rounded border border-white/60 bg-black/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/40"
            >
              {t.adopt.donateNav}
            </Link>
          </div>
        </div>
      </section>

      {statTiles.length > 0 && (
        <section
          aria-label={t.home.stats.heading}
          className="border-b border-border bg-surface"
        >
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 divide-y divide-border px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-12">
            {statTiles.map((tile) => (
              <div
                key={tile.label}
                className="flex flex-col gap-1 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
              >
                <span className="text-3xl font-semibold tabular-nums text-primary">
                  {tile.value}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {tile.label}
                </span>
                <span className="text-xs text-muted">{tile.detail}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12 sm:px-12">
        <h2 className="text-2xl font-semibold text-foreground">
          {storyText?.title || t.home.ourStoryFallback}
        </h2>
        <SiteBody body={storyText?.body} size="lg" />

        {gallery.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {gallery.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
              >
                <Image
                  src={driveImageUrl(photo.drive_file_id)}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {featured && (
          <div
            role="region"
            aria-labelledby="featured-heading"
            className="mt-6 flex flex-col gap-4"
          >
            <h3
              id="featured-heading"
              className="text-sm font-semibold uppercase tracking-wide text-primary"
            >
              {t.home.featured.heading}
            </h3>
            <Link
              href={`/adopt/${featured.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface hover:border-primary sm:flex-row"
            >
              <div className="relative aspect-[4/3] w-full shrink-0 bg-background sm:aspect-square sm:w-72">
                {featured.profile_photo_drive_file_id ? (
                  <Image
                    src={driveImageUrl(featured.profile_photo_drive_file_id)}
                    alt={featured.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    {t.home.featured.noPhoto}
                  </div>
                )}
                {featured.ready_for_adoption && (
                  <span className="absolute left-3 top-3 rounded bg-success px-2 py-1 text-xs font-semibold text-success-foreground">
                    {t.home.featured.availableForAdoption}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
                <div className="flex flex-col gap-1">
                  <p className="text-2xl font-semibold text-foreground group-hover:text-primary">
                    {t.home.featured.meetName(featured.name)}
                  </p>
                  <p className="text-sm text-muted">
                    {[speciesLabel(t, featured.species), featured.breed]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {featuredIntro && (
                  <p className="text-base leading-relaxed text-muted">
                    {featuredIntro}
                  </p>
                )}
                <span className="mt-auto pt-2 text-sm font-semibold text-primary">
                  {t.home.featured.readMore} &rarr;
                </span>
              </div>
            </Link>
          </div>
        )}

        {recentWork.projects.length > 0 && (
          <div
            role="region"
            aria-labelledby="what-we-do-heading"
            className="mt-6 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1">
                <h3
                  id="what-we-do-heading"
                  className="text-sm font-semibold uppercase tracking-wide text-primary"
                >
                  {t.home.whatWeDo.heading}
                </h3>
                <p className="max-w-xl text-sm text-muted">
                  {t.home.whatWeDo.subtitle}
                </p>
              </div>
              <Link
                href="/our-work"
                className="shrink-0 text-sm font-semibold text-primary hover:underline"
              >
                {t.home.whatWeDo.seeAll} &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {recentWork.projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        <div
          role="region"
          aria-labelledby="how-to-help-heading"
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h3
              id="how-to-help-heading"
              className="text-sm font-semibold uppercase tracking-wide text-primary"
            >
              {t.home.howToHelp.heading}
            </h3>
            <p className="max-w-xl text-sm text-muted">{t.home.howToHelp.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {helpCards.map(({ slug, href, Icon, title, lead }) => (
              <Link
                key={slug}
                href={href}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 hover:border-primary"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-lg font-semibold text-foreground group-hover:text-primary">
                  {title}
                </span>
                {lead && <p className="text-sm leading-relaxed text-muted">{lead}</p>}
                <span className="mt-auto pt-1 text-sm font-semibold text-primary">
                  {t.home.howToHelp.readMore} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t.home.readyHeading}
            </h3>
            <p className="text-sm text-muted">{t.home.readySubtitle}</p>
          </div>
          <Link
            href="/adopt"
            className="shrink-0 rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {t.home.browseResidents}
          </Link>
        </div>
      </section>

      <PublicFooter content={content} />
    </main>
  );
}
