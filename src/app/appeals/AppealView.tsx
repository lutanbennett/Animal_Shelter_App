import Link from "next/link";
import { formatBahtExact, formatDate, todayIso } from "@/lib/format";
import { bodyLead } from "@/lib/site/body";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { appealPhase, daysLeft, overBy, showsWaysToGive, socialKind } from "@/lib/appeals/state";
import { appealProgress, appealText, type PublicAppeal } from "@/lib/appeals/public";
import { ShareButton } from "@/components/ShareButton";
import { BackLink } from "../adopt/BackLink";
import { DonateWays } from "../donate/DonateWays";
import { AppealProgressDisplay } from "./AppealProgressDisplay";
import { AppealGallery } from "./[id]/AppealGallery";

const column = "mx-auto w-full max-w-3xl px-5 lg:px-8";
const storyHeading = "font-display text-[26px] font-bold leading-tight text-site-ink lg:text-[30px]";
const prose = "whitespace-pre-line text-[17px] leading-relaxed text-site-ink";
const textLink =
  "inline-flex min-h-11 items-center font-bold text-site-action-hover underline underline-offset-4 hover:text-site-action";

export type AppealGalleryItem = { id: string; fileId: string; isGraphic: boolean; isMedical?: boolean };

/**
 * The body of an appeal's page, without the site header and footer. The public
 * page and the staff "Preview" render this one component, so what staff
 * approve is what the public gets: the same words, the same progress picture,
 * the same states. Pure of the database; the caller loads the appeal.
 */
export function AppealView({
  appeal,
  gallery,
  bio,
  pageUrl,
  locale,
  t,
  backHref,
}: {
  appeal: PublicAppeal;
  gallery: AppealGalleryItem[];
  bio: string;
  pageUrl: string | null;
  locale: Locale;
  t: Dictionary;
  backHref: string;
}) {
  const a = t.appeals;
  const text = appealText(locale, appeal);
  const progress = appealProgress(appeal);
  const phase = appealPhase(progress);
  const over = overBy(appeal.raised_amount, appeal.target_amount);
  const money = (n: number) => formatBahtExact(n, locale);
  const left = phase === "open" ? daysLeft(appeal.deadline, todayIso()) : null;
  const links = appeal.social_links
    .map((url) => socialKind(url))
    .filter((l): l is NonNullable<typeof l> => l !== null);
  const shareTitle = `${text.title} · ${t.header.appName}`;

  const badge =
    phase === "closed"
      ? { label: a.badge.closed, tone: "bg-site-sand text-site-ink" }
      : phase === "funded" || phase === "goal-reached"
        ? { label: a.badge.goalReached, tone: "bg-site-accent-soft text-site-on-accent-soft" }
        : { label: a.badge.open, tone: "bg-site-accent-soft text-site-on-accent-soft" };

  return (
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-2 lg:px-8 lg:py-4">
          <BackLink
            href={backHref}
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
  );
}
