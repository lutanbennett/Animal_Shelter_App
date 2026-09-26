import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { RESIDENT_SIZES, sizeLabel, speciesLabel } from "@/lib/i18n/enum-labels";
import { CARD_COLUMNS } from "@/lib/residents/public";
import { loadSiteContent } from "@/lib/site/content";
import { loadSitePage, sitePageText } from "@/lib/site/pages";
import { SiteBody } from "@/components/SiteBody";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { ResidentCard, type ResidentCardRow } from "./ResidentCard";

type RecentAdoption = {
  id: string;
  name: string;
  species: string | null;
  profile_photo_drive_file_id: string | null;
  adopted_on: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const [{ t, locale }, origin] = await Promise.all([getT(), getSiteOrigin()]);
  const title = `${t.adopt.pageTitle} · ${t.header.appName}`;
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
    },
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
  const supabase = await createClient();
  const { t, locale } = await getT();

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
    `rounded-full border px-3 py-1 text-sm font-medium transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface text-muted hover:border-primary hover:text-foreground"
    }`;
  const filtering = Boolean(species || size || readyOnly);

  const howToText = howTo ? sitePageText(howTo, locale) : null;
  const recent = recentResult.data ?? [];
  const monthFormat = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="adopt" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.adopt.pageTitle}
          </h1>
          <p className="max-w-2xl text-sm text-muted">{t.adopt.pageSubtitle}</p>
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

        {recent.length > 0 && (
          <section data-reveal aria-labelledby="happy-endings-heading" className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-1">
              <h2 id="happy-endings-heading" className="text-lg font-semibold text-foreground">
                {t.adopt.happyEndings.heading}
              </h2>
              <p className="text-sm text-muted">{t.adopt.happyEndings.subtitle}</p>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-col items-center gap-2 text-center">
                  <div className="relative aspect-square w-full overflow-hidden rounded-full border border-border bg-surface">
                    {a.profile_photo_drive_file_id ? (
                      <Image
                        src={driveImageUrl(a.profile_photo_drive_file_id)}
                        alt={a.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">
                        {speciesLabel(t, a.species) || t.adopt.noPhoto}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{a.name}</span>
                  <span className="text-xs text-muted">
                    {t.adopt.happyEndings.adopted(monthFormat.format(new Date(a.adopted_on)))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
            <SiteBody body={howToText.body} />
          </section>
        )}
      </div>

      <PublicFooter content={content} />
    </main>
  );
}
