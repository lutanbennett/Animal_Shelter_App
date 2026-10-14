import type { Metadata } from "next";
import Image from "next/image";
import { PawPrint } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { RESIDENT_SIZES, sizeLabel, speciesLabel } from "@/lib/i18n/enum-labels";
import { CARD_COLUMNS } from "@/lib/residents/public";
import { loadSiteContent } from "@/lib/site/content";
import { loadSitePage, sitePageText } from "@/lib/site/pages";
import { showcaseAdoptPause } from "@/lib/adopt/showcase-pause";
import { SiteBody } from "@/components/SiteBody";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { ResidentCard, type ResidentCardRow } from "./ResidentCard";
import { HappyEndings, type RecentAdoption } from "./HappyEndings";

export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const content = await loadSiteContent(supabase);
  const title = `${t.adopt.pageTitle} · ${t.header.appName}`;
  const share = shareImageMetadata(
    defaultShareImage(content, locale, t.header.appName),
    title,
    t.adopt.metaDescription,
  );
  return {
    title,
    description: t.adopt.metaDescription,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "website",
      title,
      description: t.adopt.metaDescription,
      url: "/adopt",
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

/** One search param as a single trimmed string, or null. */
function param(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || null;
}

/**
 * /adopt[?species=Dog&size=Small&ready=1] — every public resident as a
 * card, with the filters in the URL so "all the small dogs ready to go"
 * is a link someone can send on, and the page stays server-rendered.
 * Chips are shown only for values a listed resident has.
 */
export default async function AdoptPage(props: PageProps<"/adopt">) {
  const searchParams = await props.searchParams;
  await showcaseAdoptPause(searchParams);
  const supabase = await createClient();
  const { t, locale } = await getT();
  const signedIn = Boolean((await supabase.auth.getUser()).data.user);

  const [residentsResult, recentResult, content, howTo] = await Promise.all([
    supabase
      .from("public_resident_profiles")
      .select(CARD_COLUMNS)
      .order("name")
      .returns<ResidentCardRow[]>(),
    supabase
      .from("public_recent_adoptions")
      .select("id, name, species, profile_photo_drive_file_id, adopted_on")
      .order("adopted_on", { ascending: false })
      .limit(8)
      .returns<RecentAdoption[]>(),
    loadSiteContent(supabase),
    loadSitePage(supabase, "how-to-adopt"),
  ]);
  const all = residentsResult.data ?? [];
  const error = residentsResult.error;

  // Only values that exist in the listing become chips, and only a value
  // in the listing counts as a filter — a stale link filters to nothing
  // rather than to a 400.
  const speciesPresent = [...new Set(all.map((r) => r.species).filter(Boolean))] as string[];
  const sizesPresent = RESIDENT_SIZES.filter((s) => all.some((r) => r.size === s));
  const species = speciesPresent.includes(param(searchParams.species) ?? "")
    ? param(searchParams.species)
    : null;
  const size = (sizesPresent as readonly string[]).includes(param(searchParams.size) ?? "")
    ? param(searchParams.size)
    : null;
  const readyOnly = param(searchParams.ready) === "1";

  const shown = all.filter(
    (r) =>
      (!species || r.species === species) &&
      (!size || r.size === size) &&
      (!readyOnly || r.ready_for_adoption),
  );
  const anyReady = all.some((r) => r.ready_for_adoption);

  // Each chip links to the listing with just its own parameter changed.
  const href = (next: { species?: string | null; size?: string | null; ready?: boolean }) => {
    const q = new URLSearchParams();
    const s = next.species === undefined ? species : next.species;
    const z = next.size === undefined ? size : next.size;
    const ready = next.ready === undefined ? readyOnly : next.ready;
    if (s) q.set("species", s);
    if (z) q.set("size", z);
    if (ready) q.set("ready", "1");
    const qs = q.toString();
    return qs ? `/adopt?${qs}` : "/adopt";
  };
  const chipClass = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-3 py-1 text-sm font-medium transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface text-muted hover:border-primary hover:text-foreground"
    }`;
  const filtering = Boolean(species || size || readyOnly);

  const howToText = howTo ? sitePageText(howTo, locale) : null;
  const recent = recentResult.data ?? [];

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="adopt" trail={[{ label: t.adopt.adoptNav }]} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.adopt.pageTitle}
          </h1>
          <p className="max-w-2xl text-sm text-muted">{signedIn ? t.adopt.pageSubtitleSignedIn : t.adopt.pageSubtitle}</p>
        </div>

        {error && (
          <p className="text-sm text-danger">
            {t.adopt.couldntLoad}: {error.message}
          </p>
        )}

        {all.length > 0 && (speciesPresent.length > 1 || sizesPresent.length > 1 || anyReady) && (
          <nav aria-label={t.adopt.filters.label} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {speciesPresent.length > 1 && (
                <>
                  <Link
                    href={href({ species: null })}
                    aria-current={species ? undefined : "page"}
                    className={chipClass(!species)}
                  >
                    {t.adopt.filters.allSpecies}
                  </Link>
                  {speciesPresent.map((s) => (
                    <Link
                      key={s}
                      href={href({ species: s })}
                      aria-current={s === species ? "page" : undefined}
                      className={chipClass(s === species)}
                    >
                      {speciesLabel(t, s)}
                    </Link>
                  ))}
                </>
              )}
              {anyReady && (
                <Link
                  href={href({ ready: !readyOnly })}
                  aria-pressed={readyOnly}
                  className={`${chipClass(readyOnly)} ${speciesPresent.length > 1 ? "sm:ml-auto" : ""}`}
                >
                  {t.adopt.filters.readyOnly}
                </Link>
              )}
            </div>
            {sizesPresent.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t.adopt.details.size}
                </span>
                <Link
                  href={href({ size: null })}
                  aria-current={size ? undefined : "page"}
                  className={chipClass(!size)}
                >
                  {t.adopt.filters.anySize}
                </Link>
                {sizesPresent.map((s) => (
                  <Link
                    key={s}
                    href={href({ size: s })}
                    aria-current={s === size ? "page" : undefined}
                    className={chipClass(s === size)}
                  >
                    {sizeLabel(t, s)}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        )}

        {!error && all.length === 0 && (
          <p className="rounded border border-border bg-surface p-6 text-center text-sm text-muted">
            {t.adopt.noneListed}
          </p>
        )}
        {all.length > 0 && shown.length === 0 && (
          <p className="rounded border border-border bg-surface p-6 text-center text-sm text-muted">
            {t.adopt.filters.noneMatch}{" "}
            <Link href="/adopt" className="font-medium text-primary hover:underline">
              {t.adopt.filters.clear}
            </Link>
          </p>
        )}

        {shown.length > 0 && (
          <>
            {filtering && (
              <p className="text-xs text-muted">{t.adopt.filters.showing(shown.length, all.length)}</p>
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((resident) => (
                <ResidentCard key={resident.id} resident={resident} t={t} />
              ))}
            </div>
          </>
        )}

        <HappyEndings recent={recent} t={t} locale={locale} />

        {howToText?.body && (
          <section
            id="how-to-adopt"
            data-reveal
            aria-labelledby="how-to-adopt-heading"
            className="flex scroll-mt-6 flex-col gap-4 rounded-lg border border-border bg-surface p-6 sm:p-8"
          >
            <h2 id="how-to-adopt-heading" className="text-xl font-semibold text-foreground">
              {howToText.title}
            </h2>
            {howToText.bodyIsOriginal && (
              <p role="note" className="rounded-lg border border-border bg-background p-4 text-sm text-muted">
                {t.sitePages.englishOnly}
              </p>
            )}
            <SiteBody body={howToText.body} />
          </section>
        )}

        {/* For someone adopting from another country: the International
            adoption page says what that involves. */}
        <p data-reveal className="text-sm text-muted">
          {t.adopt.fromAbroad}{" "}
          <Link href="/adopt/international" className="inline-flex min-h-11 items-center md:min-h-9 font-medium text-primary hover:underline">
            {t.adopt.fromAbroadLink} &rarr;
          </Link>
        </p>
      </div>

      <PublicFooter content={content} />
    </main>
  );
}
