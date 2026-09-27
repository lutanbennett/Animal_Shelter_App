import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getSiteOrigin } from "@/lib/site-origin";
import { bodyLead } from "@/lib/site/body";
import { lineLink, lineMessageLink, loadSiteContent } from "@/lib/site/content";
import { loadSitePage, SITE_PAGE_PATHS, sitePageText, type SitePageSlug } from "@/lib/site/pages";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { SiteBody } from "@/components/SiteBody";
import { PublicHeader, type PublicSection } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

/**
 * /foster, /volunteer and /donate are the same page with a different
 * site_pages row: the admin's title and body in the visitor's language,
 * then a "get in touch" card with the shelter's email and LINE. Each
 * route is a two-line file so the header can mark the right section.
 *
 * /relocation is the same again, with the flying puppy beside its heading
 * (`hero`) and starter text until an admin saves a body of its own.
 *
 * /friends/join (shelter-friends-join) is the same again, with starter
 * text and a contact card made for a business asking to join: a Call
 * button beside email and LINE, and the message already started.
 */

/**
 * The text a page shows while its row has no body yet. /relocation and
 * /friends/join have one: each went live before the Director wrote hers,
 * so it carries a generic description instead of "coming soon"
 * (docs/decisions.md, 2026-09-27). The other pages keep "coming soon".
 */
export function sitePageStarter(t: Dictionary, slug: SitePageSlug) {
  if (slug === "relocation") return t.sitePages.relocationStarter;
  if (slug === "shelter-friends-join") return t.sitePages.friendsJoinStarter;
  return null;
}

function pageText(t: Dictionary, slug: SitePageSlug, text: { title: string; body: string } | null) {
  const starter = sitePageStarter(t, slug);
  return {
    title: text?.title || starter?.title || "",
    body: text?.body || starter?.body || "",
  };
}
export async function sitePageMetadata(slug: SitePageSlug): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const page = await loadSitePage(supabase, slug);
  const text = pageText(t, slug, page ? sitePageText(page, locale) : null);
  const title = `${text.title || t.header.appName} · ${t.header.appName}`;
  const description = bodyLead(text.body) || t.home.shareFallback;
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: SITE_PAGE_PATHS[slug],
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
    },
  };
}

export async function SitePageView({
  slug,
  section,
  hero,
}: {
  slug: SitePageSlug;
  section: PublicSection;
  /** A picture beside the heading, stacked above it on a phone. */
  hero?: ReactNode;
}) {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const [page, content, showFriends] = await Promise.all([
    loadSitePage(supabase, slug),
    loadSiteContent(supabase),
    // /donate points at the Shelter Friends — only once there are some.
    slug === "donate" ? hasPublicFriends() : false,
  ]);
  const text = pageText(t, slug, page ? sitePageText(page, locale) : null);
  // A business asking to join gets the message already started, in email
  // and (where LINE allows it) in LINE, and a Call button: a shop owner is
  // as likely to ring as to write.
  const join = slug === "shelter-friends-join" ? t.sitePages.friendsJoin : null;
  const line = join
    ? lineMessageLink(content?.contact_line, join.message)
    : lineLink(content?.contact_line);
  const phone = join ? content?.contact_phone?.trim() : null;
  const mailto = content?.contact_email
    ? join
      ? `mailto:${content.contact_email}?subject=${encodeURIComponent(join.subject)}&body=${encodeURIComponent(join.message)}`
      : `mailto:${content.contact_email}`
    : null;

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current={section} />

      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-12">
        {hero ? (
          <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
              {text.title || t.header.appName}
            </h1>
            <div className="w-56 shrink-0 self-center sm:w-64">{hero}</div>
          </div>
        ) : (
          <h1 className="text-3xl font-semibold text-foreground">
            {text.title || t.header.appName}
          </h1>
        )}
        {text.body ? (
          <div data-reveal>
            <SiteBody body={text.body} size="lg" />
          </div>
        ) : (
          <p className="text-sm text-muted">{t.sitePages.comingSoon}</p>
        )}

        {(mailto || line || phone) && (
          <div data-reveal className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground">
              {t.sitePages.getInTouch}
            </h2>
            <p className="text-sm text-muted">{join?.hint ?? t.sitePages.getInTouchHint}</p>
            <div className="flex flex-wrap gap-3">
              {mailto && (
                <a
                  href={mailto}
                  className="spring-lift rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  {t.sitePages.emailUs}
                </a>
              )}
              {line && (
                <a
                  href={line.href}
                  target="_blank"
                  rel="noreferrer"
                  className="spring-lift rounded border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
                >
                  {t.sitePages.lineUs(line.label)}
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="spring-lift rounded border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
                >
                  {t.sitePages.callUs(phone)}
                </a>
              )}
            </div>
          </div>
        )}

        {showFriends && (
          <div data-reveal className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground">
              {t.shelterFriends.donateMention.heading}
            </h2>
            <p className="text-sm text-muted">{t.shelterFriends.donateMention.body}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/friends" className="text-sm font-semibold text-primary hover:underline">
                {t.shelterFriends.donateMention.link} &rarr;
              </Link>
              {/* A business reading this can be one of them. */}
              <Link href="/friends/join" className="text-sm font-semibold text-primary hover:underline">
                {t.shelterFriends.donateMention.join} &rarr;
              </Link>
            </div>
          </div>
        )}

        {slug !== "donate" && (
          <p className="text-sm text-muted">
            {t.sitePages.alsoSee}{" "}
            {join && (
              <>
                <Link href="/friends" className="font-medium text-primary hover:underline">
                  {t.shelterFriends.navLabel}
                </Link>
                {" · "}
              </>
            )}
            <Link href="/adopt" className="font-medium text-primary hover:underline">
              {t.adopt.adoptNav}
            </Link>
            {" · "}
            <Link href="/our-work" className="font-medium text-primary hover:underline">
              {t.adopt.ourWorkNav}
            </Link>
          </p>
        )}
      </article>

      <PublicFooter content={content} />
    </main>
  );
}
