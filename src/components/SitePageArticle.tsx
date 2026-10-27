import type { ReactNode } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { ChannelLink } from "@/lib/site/channels";
import type { SitePageSlug } from "@/lib/site/pages";
import { SiteBodyView } from "./SiteBodyView";

/**
 * The part of a standalone site page between the header and the footer: the
 * heading (with its photo), the text, the "get in touch" card, the Shelter
 * Friends mention and the "also see" links. It loads nothing and reads no
 * cookies, so the public routes (through SitePageView) and the website editor's
 * live preview of unsaved edits render the same markup from the same props
 * (docs/decisions/2026-10-27-website-preview-unsaved.md).
 */
export function SitePageArticle({
  t,
  slug,
  title,
  body,
  englishOnly,
  photoNode,
  channels,
  channelNames,
  showFriends,
  afterIntro,
}: {
  t: Dictionary;
  slug: SitePageSlug;
  title: string;
  body: string;
  /** A Thai reader on a page nobody has translated yet. */
  englishOnly: boolean;
  photoNode: ReactNode;
  channels: ChannelLink[];
  channelNames: string;
  showFriends: boolean;
  afterIntro?: ReactNode;
}) {
  // Split at the first blank line: the intro paragraph, then everything else.
  const bodyParts = (body ?? "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);
  const intro = bodyParts[0] ?? "";
  const rest = bodyParts.slice(1).join("\n\n");
  // A business asking to join gets the message already started.
  const join = slug === "shelter-friends-join" ? t.sitePages.friendsJoin : null;
  const newTabLabel = t.common.opensInNewTab;

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-12">
      {photoNode ? (
        <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-[40px] font-bold leading-[1.05] text-site-ink sm:text-5xl xl:text-[60px]">
            {title || t.header.appName}
          </h1>
          <div className="w-56 shrink-0 self-center sm:w-64">{photoNode}</div>
        </div>
      ) : (
        <h1 className="font-display text-[40px] font-bold leading-[1.05] text-site-ink sm:text-5xl xl:text-[60px]">
          {title || t.header.appName}
        </h1>
      )}
      {englishOnly && (
        <p role="note" className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {t.sitePages.englishOnly}
        </p>
      )}
      {body ? (
        afterIntro ? (
          <>
            <div data-reveal>
              <SiteBodyView body={intro} size="lg" headingLevel="h2" newTabLabel={newTabLabel} />
            </div>
            {afterIntro}
            {rest && (
              <div data-reveal>
                <SiteBodyView body={rest} size="lg" headingLevel="h2" newTabLabel={newTabLabel} />
              </div>
            )}
          </>
        ) : (
          <div data-reveal>
            <SiteBodyView body={body} size="lg" headingLevel="h2" newTabLabel={newTabLabel} />
          </div>
        )
      ) : (
        <>
          <p className="text-sm text-muted">{t.sitePages.comingSoon}</p>
          {afterIntro}
        </>
      )}

      {channels.length > 0 && (
        <div data-reveal className="mt-4 flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t.sitePages.getInTouch}
          </h2>
          <p className="text-sm text-muted">
            {join?.hint ?? t.contactChannels.getInTouchHint(channelNames)}
          </p>
          <div className="flex flex-wrap gap-3">
            {channels.map((c, i) => (
              <a
                key={c.channel}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className={
                  i === 0
                    ? "spring-lift inline-flex min-h-11 items-center rounded bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                    : "spring-lift inline-flex min-h-11 items-center rounded border border-border px-5 text-sm font-semibold text-foreground hover:bg-surface-hover"
                }
              >
                {t.contactChannels.us[c.channel](c.value)}
              </a>
            ))}
          </div>
        </div>
      )}

      {showFriends && (
        <div data-reveal className="flex flex-col gap-2 rounded-[20px] border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t.shelterFriends.donateMention.heading}
          </h2>
          <p className="text-sm text-muted">{t.shelterFriends.donateMention.body}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/friends" className="inline-flex min-h-11 items-center md:min-h-9 text-sm font-semibold text-primary hover:underline">
              {t.shelterFriends.donateMention.link} &rarr;
            </Link>
            {/* A business reading this can be one of them. */}
            <Link href="/friends/join" className="inline-flex min-h-11 items-center md:min-h-9 text-sm font-semibold text-primary hover:underline">
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
              <Link href="/friends" className="inline-flex min-h-11 items-center md:min-h-9 font-medium text-primary hover:underline">
                {t.shelterFriends.navLabel}
              </Link>
              {" · "}
            </>
          )}
          <Link href="/adopt" className="inline-flex min-h-11 items-center md:min-h-9 font-medium text-primary hover:underline">
            {t.adopt.adoptNav}
          </Link>
          {" · "}
          <Link href="/our-work" className="inline-flex min-h-11 items-center md:min-h-9 font-medium text-primary hover:underline">
            {t.adopt.ourWorkNav}
          </Link>
        </p>
      )}
    </article>
  );
}
