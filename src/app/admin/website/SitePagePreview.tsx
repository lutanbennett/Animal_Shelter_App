"use client";

import { useEffect, useState } from "react";
import { PublicPhoto } from "@/components/PublicPhoto";
import { SitePageArticle } from "@/components/SitePageArticle";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { preferredChannels, type ChannelLink } from "@/lib/site/channels";
import { sitePageStarter } from "@/lib/site/starter";
import type { SitePageSlug } from "@/lib/site/pages";

/** What the preview needs from the saved site, read on the server: nothing here is the unsaved text. */
export type PagePreviewContext = {
  contact: Parameters<typeof preferredChannels>[0];
  photo: { fileId: string; alt: string; altTh: string } | null;
  showFriends: boolean;
  /** The saved Thai wording, if any: an English edit is not translated until it is saved. */
  thai: { title: string; body: string } | null;
};

/**
 * The public page as the unsaved heading and text would render it: the same
 * SitePageArticle the visitor's route uses, fed the form's current values.
 * Nothing is written. Photo, contact details and the header and footer show
 * as saved; only the wording is live.
 */
export function SitePagePreview({
  slug,
  title,
  body,
  context,
}: {
  slug: SitePageSlug;
  title: string;
  body: string;
  context: PagePreviewContext;
}) {
  const { t: adminT } = useI18n();
  const p = adminT.admin.website.pages;
  const [lang, setLang] = useState<"en" | "th">("en");
  const [dicts, setDicts] = useState<{ en?: Dictionary; th?: Dictionary }>({});

  useEffect(() => {
    let live = true;
    const load = lang === "th" ? import("@/lib/i18n/dictionaries/th") : import("@/lib/i18n/dictionaries/en");
    load.then((m) => live && setDicts((d) => ({ ...d, [lang]: m.default as Dictionary })));
    return () => {
      live = false;
    };
  }, [lang]);

  const t = dicts[lang];
  if (!t) return <p className="text-sm text-muted">{p.previewLoading}</p>;

  const starter = sitePageStarter(t, slug);
  const thai = lang === "th" ? context.thai : null;
  const shownTitle = (thai?.title || (lang === "en" ? title : "") || starter?.title) ?? "";
  const shownBody = (thai?.body || (lang === "en" ? body : "") || starter?.body) ?? "";
  const join = slug === "shelter-friends-join" ? t.sitePages.friendsJoin : null;
  const channels: ChannelLink[] = preferredChannels(
    context.contact,
    join ? { subject: join.subject, message: join.message } : undefined,
  ).slice(0, 3);
  const channelNames = new Intl.ListFormat(lang, { type: "disjunction" }).format(
    channels.map((c) => t.contactChannels.name[c.channel]),
  );
  const photo = context.photo;
  const photoNode = photo ? (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-surface">
      <PublicPhoto
        fileId={photo.fileId}
        alt={(lang === "th" && photo.altTh.trim()) || photo.alt}
        sizes="256px"
        className="object-cover"
      />
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-muted">{p.previewLanguage}</span>
        {(["en", "th"] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className={`min-h-11 rounded border px-3 md:min-h-9 ${
              lang === l ? "border-primary bg-primary/10 font-semibold text-foreground" : "border-border text-muted"
            }`}
          >
            {l === "en" ? "English" : "ไทย"}
          </button>
        ))}
      </div>
      {lang === "th" && <p className="text-xs text-muted">{p.previewThaiNote}</p>}
      {slug === "donate" && <p className="text-xs text-muted">{p.previewDonateNote}</p>}
      <div className="max-h-[70vh] overflow-auto rounded border border-border bg-site-cream">
        <SitePageArticle
          t={t}
          slug={slug}
          title={shownTitle}
          body={shownBody}
          englishOnly={lang === "th" && !thai?.body}
          photoNode={photoNode}
          channels={channels}
          channelNames={channelNames}
          showFriends={context.showFriends}
        />
      </div>
    </div>
  );
}
