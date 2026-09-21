import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { bodyLead } from "@/lib/site/body";
import { lineLink, loadSiteContent } from "@/lib/site/content";
import { loadSitePage, sitePageText, type SitePageSlug } from "@/lib/site/pages";
import { SiteBody } from "@/components/SiteBody";
import { PublicHeader, type PublicSection } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

/**
 * /foster, /volunteer and /donate are the same page with a different
 * site_pages row: the admin's title and body in the visitor's language,
 * then a "get in touch" card with the shelter's email and LINE. Each
 * route is a two-line file so the header can mark the right section.
 */
export async function sitePageMetadata(slug: SitePageSlug): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const page = await loadSitePage(supabase, slug);
  const text = page ? sitePageText(page, locale) : null;
  const title = `${text?.title || t.header.appName} · ${t.header.appName}`;
  const description = bodyLead(text?.body) || t.home.shareFallback;
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: `/${slug}`,
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
    },
  };
}

export async function SitePageView({
  slug,
  section,
}: {
  slug: SitePageSlug;
  section: PublicSection;
}) {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const [page, content] = await Promise.all([
    loadSitePage(supabase, slug),
    loadSiteContent(supabase),
  ]);
  const text = page ? sitePageText(page, locale) : null;
  const line = lineLink(content?.contact_line);

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current={section} />

      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-12">
        <h1 className="text-3xl font-semibold text-foreground">
          {text?.title || t.header.appName}
        </h1>
        {text?.body ? (
          <SiteBody body={text.body} size="lg" />
        ) : (
          <p className="text-sm text-muted">{t.sitePages.comingSoon}</p>
        )}

        {(content?.contact_email || line) && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground">
              {t.sitePages.getInTouch}
            </h2>
            <p className="text-sm text-muted">{t.sitePages.getInTouchHint}</p>
            <div className="flex flex-wrap gap-3">
              {content?.contact_email && (
                <a
                  href={`mailto:${content.contact_email}`}
                  className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  {t.sitePages.emailUs}
                </a>
              )}
              {line && (
                <a
                  href={line.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
                >
                  {t.sitePages.lineUs(line.label)}
                </a>
              )}
            </div>
          </div>
        )}

        {slug !== "donate" && (
          <p className="text-sm text-muted">
            {t.sitePages.alsoSee}{" "}
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
