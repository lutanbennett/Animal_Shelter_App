import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getSiteOrigin } from "@/lib/site-origin";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { bodyLead } from "@/lib/site/body";
import { preferredChannels } from "@/lib/site/channels";
import { loadSiteContent, pairedText } from "@/lib/site/content";
import { sitePageStarter } from "@/lib/site/starter";
import { loadSitePage, SITE_PAGE_PATHS, sitePageText, type SitePageSlug } from "@/lib/site/pages";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { SitePageArticle } from "@/components/SitePageArticle";
import { PublicPhoto } from "@/components/PublicPhoto";
import { PublicHeader, type PublicSection } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { requirePageVisible } from "@/lib/public-page-access";

/**
 * /foster, /volunteer and /donate are the same page with a different
 * site_pages row: the admin's title and body in the visitor's language,
 * then a "get in touch" card with the shelter's email and LINE. Each
 * route is a two-line file so the header can mark the right section.
 *
 * /adopt/international is the same again, with the puppy flying over the
 * globe beside its heading (`hero`) and starter text until an admin saves a
 * body of its own.
 *
 * /friends/join (shelter-friends-join) is the same again, with starter
 * text and a contact card made for a business asking to join: a Call
 * button beside email and LINE, and the message already started.
 */

export { sitePageStarter };

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
  // The site's default picture: these pages have none of their own.
  const content = await loadSiteContent(supabase);
  const share = shareImageMetadata(
    defaultShareImage(content, locale, t.header.appName),
    title,
    description,
  );
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: { canonical: SITE_PAGE_PATHS[slug] },
    openGraph: {
      type: "website",
      title,
      description,
      url: SITE_PAGE_PATHS[slug],
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

export async function SitePageView({
  slug,
  section,
  hero,
  afterIntro,
}: {
  slug: SitePageSlug;
  section: PublicSection;
  /** A picture beside the heading, stacked above it on a phone. */
  hero?: ReactNode;
  /**
   * Directly under the page text's first paragraph, before the rest of it (the
   * Donate page's ways to give). Pages that leave it out render exactly as before.
   */
  afterIntro?: ReactNode;
}) {
  await requirePageVisible(section);
  const supabase = await createClient();
  const { t, locale } = await getT();
  const [page, content, showFriends] = await Promise.all([
    loadSitePage(supabase, slug),
    loadSiteContent(supabase),
    // /donate points at the Shelter Friends — only once there are some.
    slug === "donate" ? hasPublicFriends() : false,
  ]);
  // A photo an admin chose for Donate, Foster or Volunteer (0200). None chosen, or
  // a page that has no such photo: the heading takes the full width, as it always did.
  // A blank description renders as alt="" (skipped by screen readers), never a filename.
  const photoSlug = slug === "donate" || slug === "foster" || slug === "volunteer" || slug === "about" ? slug : null;
  const photoId = photoSlug && content ? content[`${photoSlug}_photo_drive_file_id`]?.trim() : "";
  const photoNode =
    hero ??
    (photoSlug && photoId ? (
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-surface">
        <PublicPhoto
          fileId={photoId}
          alt={pairedText(locale, content?.[`${photoSlug}_photo_alt`], content?.[`${photoSlug}_photo_alt_th`])}
          sizes="(min-width: 640px) 256px, 224px"
          className="object-cover"
        />
      </div>
    ) : null);
  const raw = page ? sitePageText(page, locale) : null;
  const text = pageText(t, slug, raw);
  // A Thai reader on a page nobody has translated yet: say so, once, in Thai
  // (the same honesty as the Release notes and Manual, docs/decisions/
  // 2026-10-04-staff-wording-and-thai.md), instead of English that looks like a mistake.
  const englishOnly = !!raw?.bodyIsOriginal;
  // A business asking to join gets the message already started, where the
  // channel can take one (email, LINE, WhatsApp). The channels come in the
  // shelter's order, and the card offers the first three.
  const join = slug === "shelter-friends-join" ? t.sitePages.friendsJoin : null;
  const channels = preferredChannels(
    content,
    join ? { subject: join.subject, message: join.message } : undefined,
  ).slice(0, 3);
  const channelNames = new Intl.ListFormat(locale, { type: "disjunction" }).format(
    channels.map((c) => t.contactChannels.name[c.channel]),
  );

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader
        current={section}
        trail={(() => {
          const gi = t.publicNav.getInvolved;
          const title = text.title || t.header.appName;
          switch (slug) {
            case "foster":
            case "volunteer":
            case "shelter-friends-join":
              return [{ label: gi }, { label: title }];
            case "international-adoption":
              return [{ label: t.adopt.adoptNav, href: "/adopt" }, { label: title }];
            default:
              return [{ label: title }];
          }
        })()}
      />

      <SitePageArticle
        t={t}
        slug={slug}
        title={text.title}
        body={text.body}
        englishOnly={englishOnly}
        photoNode={photoNode}
        channels={channels}
        channelNames={channelNames}
        showFriends={showFriends}
        afterIntro={afterIntro}
      />

      <PublicFooter content={content} />
    </main>
  );
}
