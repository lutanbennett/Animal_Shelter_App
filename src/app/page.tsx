import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";
import { sexLabel, speciesLabel } from "@/lib/i18n/enum-labels";
import { formatAge } from "@/lib/format";
import { friendAnchor } from "@/lib/shelter-friends/friends";
import { loadPublicFriends } from "@/lib/shelter-friends/public";
import { loadSiteContent, pairedText } from "@/lib/site/content";
import { loadSitePages, sitePageText } from "@/lib/site/pages";
import { bodyLead } from "@/lib/site/body";
import { impactStats, SHELTER_STATS_COLUMNS, type ShelterStats } from "@/lib/site/impact";
import { SiteBody } from "@/components/SiteBody";
import { PublicHeader } from "./adopt/PublicHeader";
import { PublicFooter } from "./adopt/PublicFooter";
import { LockedLanding } from "./LockedLanding";
import { isPublicSiteLocked } from "@/lib/public-site";

/** The "Pet of the week" card — read through public_resident_profiles. */
type FeaturedResident = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  sex: string | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  is_desexed: boolean | null;
  ready_for_adoption: boolean;
  bio: string | null;
  profile_photo_drive_file_id: string | null;
  translations: PublicTranslations;
};

type GalleryPhoto = { id: string; drive_file_id: string; alt: string };

/** The mockup's band holds five logos and the "Your business here?" tile. */
const FRIENDS_SHOWN = 5;

/** Every section lines up with the header's edges (PublicHeader.tsx). */
const wrap = "mx-auto w-full max-w-[1440px] px-4 lg:px-8 xl:px-16";
const eyebrow = "text-sm font-bold uppercase tracking-[0.08em] text-site-accent";
const sectionHeading = "font-display text-3xl font-bold text-site-ink lg:text-[38px]";
const textLink =
  "inline-flex min-h-11 items-center font-bold underline underline-offset-4 hover:text-site-action-hover";

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
  // Locked and signed out: no share preview — it would describe the site
  // the visitor can't see (docs/decisions.md, 2026-09-25).
  if (await showsLockedLanding(supabase)) {
    return { title: t.header.appName, robots: { index: false, follow: false } };
  }
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

/**
 * While the public site is locked (src/lib/public-site.ts) a signed-out
 * visitor gets the sign-in landing page here instead; signed-in staff
 * still see the home page, so they can test it.
 */
async function showsLockedLanding(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<boolean> {
  if (!isPublicSiteLocked()) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !user;
}

/**
 * The homepage, built on Lanna Care's mockup (docs/design/homepage-desktop.png,
 * part 2 of the redesign): hero, impact band, Shelter Friends, four ways to
 * help, then Pet of the week beside Our story. Every section that has no data
 * behind it — no hero photo, no stats, no published Friend, no featured
 * resident, no gallery — drops out rather than showing an empty frame.
 * Deviations from the mockup are in docs/decisions.md (2026-09-26).
 */
export default async function WelcomePage() {
  const supabase = await createClient();
  if (await showsLockedLanding(supabase)) return <LockedLanding />;
  const { t, locale } = await getT();

  const [content, pages, photosResult, statsResult, friendsResult] = await Promise.all([
    loadSiteContent(supabase),
    loadSitePages(supabase),
    supabase
      .from("site_content_photos")
      .select("id, drive_file_id, alt")
      .order("sort_order")
      .limit(3)
      .returns<GalleryPhoto[]>(),
    supabase
      .from("public_shelter_stats")
      .select(SHELTER_STATS_COLUMNS)
      .limit(1)
      .returns<ShelterStats[]>(),
    // The Shelter Friends band (0076) — the public view only.
    loadPublicFriends(supabase),
  ]);
  // No friends (or a failed query): no band, rather than an empty thank-you.
  const friends = friendsResult.friends.slice(0, FRIENDS_SHOWN);

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
        "id, name, species, breed, sex, estimated_age_years, age_estimated_on, is_desexed, ready_for_adoption, bio, profile_photo_drive_file_id, translations",
      )
      .eq("id", content.featured_resident_id)
      .limit(1)
      .returns<FeaturedResident[]>();
    featured = data?.[0] ?? null;
  }
  // The mockup's one-line hook: the bio's first paragraph, cut to a line or two.
  const featuredHook = bodyLead(
    localizedField(locale, featured?.bio, featured?.translations, "bio"),
    160,
  );
  const featuredFacts = featured
    ? [
        sexLabel(t, featured.sex),
        featured.breed || speciesLabel(t, featured.species),
        featured.estimated_age_years != null &&
          formatAge(t, featured.estimated_age_years, featured.age_estimated_on),
        featured.is_desexed === true && t.home.featured.desexed,
      ].filter(Boolean)
    : [];

  // The strip is a nice-to-have: a failed query drops it rather than the page.
  const stats = impactStats(t, statsResult.data?.[0] ?? null);

  const h = t.home.howToHelp;
  // "Sponsor a resident" goes to /donate until the sponsor flow exists, as
  // it does in the header (docs/decisions.md, part 1).
  const helpCards = [
    { key: "adopt", href: "/adopt", ...h.adopt },
    { key: "sponsor", href: "/donate", ...h.sponsor },
    { key: "foster", href: "/foster", ...h.foster },
    { key: "volunteer", href: "/volunteer", ...h.volunteer },
  ];
  const sf = t.shelterFriends.homeStrip;

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="home" />

      <section
        className={`${wrap} grid items-center gap-10 py-12 lg:pb-20 lg:pt-[72px] ${
          content?.hero_drive_file_id ? "lg:grid-cols-2" : ""
        }`}
      >
        <div className="flex flex-col gap-6">
          <p className={eyebrow}>{t.home.eyebrow}</p>
          <h1 className="max-w-2xl font-display text-[40px] font-bold leading-[1.05] text-site-ink sm:text-5xl xl:text-[60px]">
            {t.home.heroHeading}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-site-ink-soft lg:text-xl">
            {tagline || t.home.heroLead}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/adopt"
              className="flex h-14 items-center rounded-full bg-site-ink px-[30px] text-lg font-bold text-site-paper hover:bg-site-ink-soft"
            >
              {t.home.meetAnimals}
            </Link>
            {/* /donate until the /donate item gives monthly giving a flow of
                its own (docs/decisions.md, 2026-09-26). */}
            <Link
              href="/donate"
              className="flex h-14 items-center rounded-full border-2 border-site-action px-[30px] text-lg font-bold text-site-action hover:border-site-action-hover hover:text-site-action-hover"
            >
              {t.home.giveMonthly}
            </Link>
          </div>
        </div>
        {content?.hero_drive_file_id && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-site-sand lg:aspect-auto lg:h-[460px]">
            <Image
              src={driveImageUrl(content.hero_drive_file_id)}
              alt={heroAlt || t.header.appName}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_40%]"
            />
          </div>
        )}
      </section>

      {stats.length > 0 && (
        <section aria-labelledby="impact-heading" className={wrap}>
          <h2 id="impact-heading" className="sr-only">
            {t.home.stats.heading}
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 rounded-[20px] bg-site-accent px-6 py-8 text-site-on-accent sm:px-10 sm:py-9 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.key} className="flex flex-col-reverse gap-1.5">
                <dt className="text-base leading-snug">{stat.label}</dt>
                <dd className="font-display text-4xl font-bold tabular-nums lg:text-[44px]">
                  {stat.value.toLocaleString(locale === "th" ? "th-TH" : "en-GB")}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {friends.length > 0 && (
        <section aria-labelledby="shelter-friends-heading" className={`${wrap} pt-14`}>
          <div className="flex flex-col gap-6 rounded-[20px] bg-site-sand p-6 sm:p-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="flex flex-col gap-2">
                <h2
                  id="shelter-friends-heading"
                  className="font-display text-[28px] font-bold leading-tight text-site-ink lg:text-[32px]"
                >
                  {sf.heading}
                </h2>
                <p className="max-w-2xl text-[17px] leading-normal text-site-ink-soft">
                  {sf.subtitle}
                </p>
              </div>
              {/* No sign-up form yet: the footer's contact details are how a
                  business gets in touch (docs/decisions.md, 2026-09-26). */}
              <Link
                href="#contact"
                className="flex h-[52px] shrink-0 items-center self-start rounded-full bg-site-ink px-[26px] text-[17px] font-bold text-site-paper hover:bg-site-ink-soft lg:self-auto"
              >
                {sf.become}
              </Link>
            </div>
            {/* A logo where there is one, the name where there isn't — each
                a way into that friend's card on /friends. */}
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {friends.map((friend) => (
                <li key={friend.id}>
                  <Link
                    href={`/friends#${friendAnchor(friend.id)}`}
                    title={friend.name}
                    className="flex h-24 items-center justify-center rounded-[14px] border border-site-line bg-site-paper p-2 text-center text-sm font-semibold text-site-ink-muted hover:border-site-line-strong"
                  >
                    {friend.logo_drive_file_id ? (
                      <Image
                        src={driveImageUrl(friend.logo_drive_file_id)}
                        alt={friend.name}
                        width={144}
                        height={72}
                        className="h-[72px] w-auto max-w-full object-contain"
                      />
                    ) : (
                      friend.name
                    )}
                  </Link>
                </li>
              ))}
              <li>
                {/* action-hover, not action: terracotta text on the sand
                    band is 4.46:1, just under AA (decisions.md, part 1). */}
                <Link
                  href="#contact"
                  className="flex h-24 items-center justify-center rounded-[14px] border-2 border-dashed border-site-action p-2 text-center text-[15px] font-bold text-site-action-hover hover:bg-site-paper"
                >
                  {sf.yourBusiness}
                </Link>
              </li>
            </ul>
            <Link href="/friends" className={`${textLink} self-start text-site-action-hover`}>
              {sf.seeAll} &rarr;
            </Link>
          </div>
        </section>
      )}

      <section
        aria-labelledby="how-to-help-heading"
        className={`${wrap} flex flex-col gap-7 pt-16 lg:pt-[72px]`}
      >
        <div className="flex flex-col gap-2">
          <h2 id="how-to-help-heading" className={sectionHeading}>
            {h.heading}
          </h2>
          <p className="text-lg text-site-ink-soft">{h.subtitle}</p>
        </div>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {helpCards.map((card) => (
            <li key={card.key} className="flex">
              <Link
                href={card.href}
                className="group flex flex-1 flex-col gap-2.5 rounded-2xl border border-site-line bg-site-paper p-7 hover:border-site-line-strong"
              >
                <span className="font-display text-2xl font-bold text-site-ink">{card.title}</span>
                <span className="text-base leading-normal text-site-ink-soft">{card.body}</span>
                <span className="mt-auto pt-1.5 font-bold text-site-action group-hover:text-site-action-hover group-hover:underline">
                  {card.cta} &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`${wrap} grid gap-10 py-16 lg:pb-20 lg:pt-[72px] ${
          featured ? "lg:grid-cols-2" : ""
        }`}
      >
        {featured && (
          <Link
            href={`/adopt/${featured.id}`}
            aria-labelledby="featured-name"
            className="group flex flex-col self-start overflow-hidden rounded-[20px] border border-site-line bg-site-paper hover:border-site-line-strong"
          >
            <div className="relative aspect-[4/3] w-full bg-site-sand sm:aspect-auto sm:h-[280px]">
              {featured.profile_photo_drive_file_id ? (
                <Image
                  src={driveImageUrl(featured.profile_photo_drive_file_id)}
                  alt={featured.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-[center_30%]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-site-ink-muted">
                  {t.home.featured.noPhoto}
                </div>
              )}
              {featured.ready_for_adoption && (
                <span className="absolute left-4 top-4 rounded-full bg-site-accent px-3 py-1 text-sm font-bold text-site-on-accent">
                  {t.home.featured.availableForAdoption}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2.5 p-7">
              <p className={eyebrow}>{t.home.featured.heading}</p>
              <h2 id="featured-name" className="font-display text-[32px] font-bold leading-tight text-site-ink">
                {featured.name}
              </h2>
              {featuredFacts.length > 0 && (
                <p className="text-base text-site-ink-soft">{featuredFacts.join(" · ")}</p>
              )}
              {featuredHook && (
                <p className="text-[17px] leading-relaxed text-site-ink">{featuredHook}</p>
              )}
              <span className="flex min-h-11 items-center font-bold text-site-action underline underline-offset-4 group-hover:text-site-action-hover">
                {t.home.featured.readStory(featured.name)} &rarr;
              </span>
            </div>
          </Link>
        )}

        <div className={`flex flex-col gap-6 ${featured ? "" : "max-w-3xl"}`}>
          <h2 className={sectionHeading}>{storyText?.title || t.home.ourStoryFallback}</h2>
          <SiteBody body={storyText?.body} size="lg" />
          {gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {gallery.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-xl bg-site-sand sm:aspect-auto sm:h-[150px]"
                >
                  <Image
                    src={driveImageUrl(photo.drive_file_id)}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 16vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          <Link href="/our-work" className={`${textLink} self-start text-site-action`}>
            {t.home.seeOurWork} &rarr;
          </Link>
        </div>
      </section>

      <PublicFooter content={content} />
    </main>
  );
}
