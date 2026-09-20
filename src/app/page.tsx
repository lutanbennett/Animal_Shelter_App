import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { LanguageSwitcher } from "./LanguageSwitcher";

type SiteContent = {
  hero_drive_file_id: string | null;
  hero_alt: string;
  tagline: string;
  story_heading: string;
  story_body: string;
  contact_email: string | null;
  contact_address: string | null;
  featured_resident_id: string | null;
};

/** The "Pet of the week" card — read through public_resident_profiles. */
type FeaturedResident = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  ready_for_adoption: boolean;
  bio: string | null;
  profile_photo_drive_file_id: string | null;
};

type GalleryPhoto = { id: string; drive_file_id: string; alt: string };

/** Counts only — public_shelter_stats (0039) is granted to anon. */
type ShelterStats = {
  in_care: number;
  in_hospital: number;
  adopted_last_7_days: number;
  adopted_this_year: number;
};

export default async function WelcomePage() {
  const supabase = await createClient();
  const { t } = await getT();

  const [contentResult, photosResult, statsResult] = await Promise.all([
    supabase
      .from("site_content")
      .select(
        "hero_drive_file_id, hero_alt, tagline, story_heading, story_body, contact_email, contact_address, featured_resident_id",
      )
      .eq("id", true)
      .limit(1)
      .returns<SiteContent[]>(),
    supabase
      .from("site_content_photos")
      .select("id, drive_file_id, alt")
      .order("sort_order")
      .returns<GalleryPhoto[]>(),
    supabase
      .from("public_shelter_stats")
      .select("in_care, in_hospital, adopted_last_7_days, adopted_this_year")
      .limit(1)
      .returns<ShelterStats[]>(),
  ]);

  const content = contentResult.data?.[0];
  const gallery = photosResult.data ?? [];

  // Looked up through the public view rather than trusting the stored id:
  // an animal that has since been hidden, adopted or has died isn't in the
  // view, so the card simply disappears. Sequential because it depends on
  // the site_content row (anon can't join residents directly).
  let featured: FeaturedResident | null = null;
  if (content?.featured_resident_id) {
    const { data } = await supabase
      .from("public_resident_profiles")
      .select(
        "id, name, species, breed, ready_for_adoption, bio, profile_photo_drive_file_id",
      )
      .eq("id", content.featured_resident_id)
      .limit(1)
      .returns<FeaturedResident[]>();
    featured = data?.[0] ?? null;
  }
  const featuredIntro = (featured?.bio ?? "")
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
          value: stats.in_hospital,
          label: t.home.stats.inVetCare,
          detail: t.home.stats.inVetCareDetail,
        },
      ]
    : [];
  const storyParagraphs = (content?.story_body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-1">
            <Image
              src="/lca-logo.jpg"
              alt={t.header.appName}
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </span>
          <span className="text-base font-semibold text-foreground">
            {t.header.appName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t.home.staffLogin}
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-[26rem] items-end overflow-hidden bg-surface">
        {content?.hero_drive_file_id && (
          <Image
            src={driveImageUrl(content.hero_drive_file_id)}
            alt={content.hero_alt || t.header.appName}
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
          {content?.tagline && (
            <p className="max-w-xl text-base text-white/90 sm:text-lg">
              {content.tagline}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/login"
              className="rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {t.home.staffLogin}
            </Link>
            <Link
              href="/adopt"
              className="rounded border border-white/60 bg-black/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/40"
            >
              {t.home.browseGuest}
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
          {content?.story_heading || t.home.ourStoryFallback}
        </h2>
        {storyParagraphs.length > 0 && (
          <div className="flex flex-col gap-4 text-base leading-relaxed text-muted sm:text-lg">
            {storyParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

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
            {t.home.browseAnimals}
          </Link>
        </div>
      </section>

      {(content?.contact_address || content?.contact_email) && (
        <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted sm:px-12">
          {t.home.footerOrgName}
          {content.contact_address ? ` · ${content.contact_address}` : ""}
          {content.contact_email && (
            <>
              {" · "}
              <a
                href={`mailto:${content.contact_email}`}
                className="underline hover:text-foreground"
              >
                {content.contact_email}
              </a>
            </>
          )}
        </footer>
      )}
    </main>
  );
}
