import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { formatBahtExact, formatDate, todayIso } from "@/lib/format";
import { bodyLead } from "@/lib/site/body";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { loadPublicResident } from "@/lib/residents/public";
import { localizedField } from "@/lib/translations/localize";
import { appealPhase, daysLeft, overBy, showsWaysToGive, socialKind } from "@/lib/appeals/state";
import {
  appealProgress,
  appealText,
  loadPublicAppeal,
  loadPublicAppealPhotos,
} from "@/lib/appeals/public";
import { ShareButton } from "@/components/ShareButton";
import { BackLink } from "../../adopt/BackLink";
import { PublicHeader } from "../../adopt/PublicHeader";
import { PublicFooter } from "../../adopt/PublicFooter";
import { DonateWays } from "../../donate/DonateWays";
import { AppealProgressDisplay } from "../AppealProgressDisplay";
import { AppealGallery } from "./AppealGallery";

// The raised figure is read live and says when it was last updated.
export const dynamic = "force-dynamic";

const column = "mx-auto w-full max-w-3xl px-5 lg:px-8";
const storyHeading = "font-display text-[26px] font-bold leading-tight text-site-ink lg:text-[30px]";
const prose = "whitespace-pre-line text-[17px] leading-relaxed text-site-ink";
const textLink =
  "inline-flex min-h-11 items-center font-bold text-site-action-hover underline underline-offset-4 hover:text-site-action";

/**
 * Open Graph for Facebook and LINE. The picture is never a distressing one: a
 * graphic cover is skipped for the first plain photo, then the resident's
 * profile photo, then the site's default picture, because a link preview is
 * shown to people who did not choose to look.
 */
export async function generateMetadata(props: PageProps<"/appeals/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const appeal = await loadPublicAppeal(supabase, id);
  if (!appeal) return { title: t.appeals.pageTitle };

  const [photos, resident, content] = await Promise.all([
    loadPublicAppealPhotos(supabase, appeal.id),
    loadPublicResident(supabase, appeal.resident_id),
    loadSiteContent(supabase),
  ]);
  const text = appealText(locale, appeal);
  const description =
    bodyLead(text.whatIsWrong, 200) ||
    t.appeals.shareFallback(text.residentName, formatBahtExact(appeal.target_amount, locale));
  const title = `${text.title} · ${t.header.appName}`;
  const plain = photos.find((p) => !p.is_graphic);
  const fileId = plain?.drive_file_id ?? resident?.profile_photo_drive_file_id ?? null;
  const image = fileId
    ? { url: driveImageUrl(fileId, 1200), alt: text.residentName }
    : defaultShareImage(content, locale, t.header.appName);
  const share = shareImageMetadata(image, title, description);

  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: { canonical: `/appeals/${appeal.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/appeals/${appeal.id}`,
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

export default async function AppealPage(props: PageProps<"/appeals/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { t, locale } = await getT();
  const appeal = await loadPublicAppeal(supabase, id);
  if (!appeal) notFound();

  const [photos, resident, content, origin] = await Promise.all([
    loadPublicAppealPhotos(supabase, appeal.id),
    loadPublicResident(supabase, appeal.resident_id),
    loadSiteContent(supabase),
    getSiteOrigin(),
  ]);
  const a = t.appeals;
  const text = appealText(locale, appeal);
  const progress = appealProgress(appeal);
  const phase = appealPhase(progress);
  const over = overBy(appeal.raised_amount, appeal.target_amount);
  const money = (n: number) => formatBahtExact(n, locale);
  const left = phase === "open" ? daysLeft(appeal.deadline, todayIso()) : null;
  const bio = resident ? localizedField(locale, resident.bio, resident.translations, "bio") : "";

  // The appeal's own photos; with none, the resident's profile photo so the
  // page is never bare. That photo is already public on /adopt.
  const gallery = photos.map((p) => ({ id: p.id, fileId: p.drive_file_id, isGraphic: p.is_graphic }));
  if (gallery.length === 0 && resident?.profile_photo_drive_file_id) {
    gallery.push({ id: "profile", fileId: resident.profile_photo_drive_file_id, isGraphic: false });
  }

  const links = appeal.social_links
    .map((url) => socialKind(url))
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const pageUrl = origin ? new URL(`/appeals/${appeal.id}`, origin).toString() : null;
  const shareTitle = `${text.title} · ${t.header.appName}`;

  const badge =
    phase === "closed"
      ? { label: a.badge.closed, tone: "bg-site-sand text-site-ink" }
      : phase === "funded" || phase === "goal-reached"
        ? { label: a.badge.goalReached, tone: "bg-site-accent-soft text-site-on-accent-soft" }
        : { label: a.badge.open, tone: "bg-site-accent-soft text-site-on-accent-soft" };

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader
        current="appeals"
        trail={[{ label: a.navLabel, href: "/appeals" }, { label: text.title }]}
      />

      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-2 lg:px-8 lg:py-4">
          <BackLink
            href="/appeals"
            className="flex min-h-11 items-center gap-1.5 rounded-full px-1 text-base font-semibold text-site-ink hover:text-site-action-hover"
          >
            {a.allAppeals}
          </BackLink>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ShareButton variant="site" title={shareTitle} text={a.shareText(text.residentName)} />
            {pageUrl && (
              <>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-full border border-site-line-strong/60 px-3.5 text-[15px] font-semibold text-site-ink hover:bg-site-sand"
                >
                  Facebook
                  <span className="sr-only"> ({t.donateWays.opensInNewTab})</span>
                </a>
                <a
                  href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-full border border-site-line-strong/60 px-3.5 text-[15px] font-semibold text-site-ink hover:bg-site-sand"
                >
                  LINE
                  <span className="sr-only"> ({t.donateWays.opensInNewTab})</span>
                </a>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 lg:grid-cols-2 lg:items-start lg:gap-12 lg:px-8">
          <AppealGallery items={gallery} alt={text.residentName} />

          <div className="flex flex-col gap-5 px-5 pt-5 lg:px-0 lg:pt-0">
            <div className="flex flex-col gap-2.5">
              <span className={`self-start rounded-full px-3.5 py-1.5 text-[15px] font-bold ${badge.tone}`}>
                {badge.label}
              </span>
              <h1 className="font-display text-[34px] font-bold leading-tight lg:text-[44px]">{text.title}</h1>
              <p className="text-[17px] text-site-ink-soft">
                <Link href={`/adopt/${appeal.resident_id}`} className={textLink}>
                  {a.meet(text.residentName)} &rarr;
                </Link>
              </p>
            </div>

            <section
              aria-labelledby="progress-heading"
              className="flex flex-col gap-3 rounded-2xl border border-site-line bg-site-paper p-[18px]"
            >
              <h2 id="progress-heading" className="font-site! text-lg font-bold">
                {a.progressHeading}
              </h2>
              <AppealProgressDisplay
                style={appeal.display_style}
                raised={appeal.raised_amount}
                target={appeal.target_amount}
                locale={locale}
                t={t}
              />
              {phase === "goal-reached" && (
                <p className="rounded-xl bg-site-accent-soft p-3 text-[15px] font-semibold text-site-on-accent-soft">
                  {over > 0 ? a.goalReachedOver(money(over)) : a.goalReachedExact}
                </p>
              )}
              <p className="text-sm text-site-ink-muted">
                {appeal.raised_as_of ? a.updated(formatDate(appeal.raised_as_of, locale)) : a.noGiftsYet}{" "}
                {a.countedNote}
              </p>
              {left != null && (
                <p className="text-[15px] font-semibold text-site-ink-soft">
                  {left < 0 ? a.deadlinePassed(formatDate(appeal.deadline, locale)) : left === 0 ? a.lastDay : a.daysLeft(left, formatDate(appeal.deadline, locale))}
                </p>
              )}
            </section>
          </div>
        </div>

        <div className={`${column} flex flex-col gap-7 pb-10 pt-7 lg:pt-12`}>
          {phase === "closed" && text.outcomeNote && (
            <section aria-labelledby="outcome-heading" className="flex flex-col gap-3 rounded-2xl bg-site-accent-soft p-5">
              <h2 id="outcome-heading" className={`${storyHeading} text-site-on-accent-soft`}>
                {a.outcomeHeading}
              </h2>
              <p className={`${prose} text-site-on-accent-soft`}>{text.outcomeNote}</p>
            </section>
          )}

          {text.whatIsWrong && (
            <section aria-labelledby="wrong-heading" className="flex flex-col gap-3">
              <h2 id="wrong-heading" className={storyHeading}>
                {a.whatIsWrong(text.residentName)}
              </h2>
              <p className={prose}>{text.whatIsWrong}</p>
            </section>
          )}

          {text.treatmentNeeded && (
            <section aria-labelledby="treatment-heading" className="flex flex-col gap-3">
              <h2 id="treatment-heading" className={storyHeading}>
                {a.treatment}
              </h2>
              <p className={prose}>{text.treatmentNeeded}</p>
            </section>
          )}

          <section aria-labelledby="cost-heading" className="flex flex-col gap-3">
            <h2 id="cost-heading" className={storyHeading}>
              {a.cost}
            </h2>
            <p className="font-display text-3xl font-bold tabular-nums">{money(appeal.target_amount)}</p>
            {text.costCovers && <p className={prose}>{text.costCovers}</p>}
          </section>

          {showsWaysToGive(progress) ? (
            <section aria-labelledby="give-heading" className="flex flex-col gap-4">
              <h2 id="give-heading" className={storyHeading}>
                {a.giveHeading(text.residentName)}
              </h2>
              <p className={prose}>{a.giveMark(text.residentName, text.title)}</p>
              <DonateWays />
              <p className="rounded-xl bg-site-sand p-4 text-[15px] leading-normal text-site-ink-soft">
                {a.extraGoes}
              </p>
            </section>
          ) : (
            <section aria-labelledby="give-heading" className="flex flex-col gap-3 rounded-2xl bg-site-sand p-5">
              <h2 id="give-heading" className="font-site! text-lg font-bold">
                {phase === "closed" ? a.closedHeading : a.fundedHeading}
              </h2>
              <p className="text-[16px] leading-relaxed text-site-ink-soft">
                {phase === "closed" ? a.closedBody : a.fundedBody}
              </p>
              <Link href="/donate" className={`${textLink} self-start`}>
                {a.otherWays} &rarr;
              </Link>
            </section>
          )}

          {bio && (
            <section aria-labelledby="about-heading" className="flex flex-col gap-3">
              <h2 id="about-heading" className={storyHeading}>
                {a.about(text.residentName)}
              </h2>
              <p className={prose}>{bodyLead(bio, 600)}</p>
              <Link href={`/adopt/${appeal.resident_id}`} className={`${textLink} self-start`}>
                {a.meet(text.residentName)} &rarr;
              </Link>
            </section>
          )}

          {links.length > 0 && (
            <section aria-labelledby="also-heading" className="flex flex-col gap-2">
              <h2 id="also-heading" className="font-site! text-lg font-bold">
                {a.alsoOn}
              </h2>
              <ul className="flex flex-col">
                {links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className={textLink}>
                      {l.kind === "other" ? l.host : a.socialNames[l.kind]} &rarr;
                      <span className="sr-only"> ({t.donateWays.opensInNewTab})</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <PublicFooter content={content} />
    </main>
  );
}

