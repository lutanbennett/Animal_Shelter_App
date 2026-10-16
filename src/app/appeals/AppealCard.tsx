import Link from "next/link";
import { PublicPhoto } from "@/components/PublicPhoto";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { bodyLead } from "@/lib/site/body";
import { appealPhase, daysLeft } from "@/lib/appeals/state";
import { appealProgress, appealText, type PublicAppeal } from "@/lib/appeals/public";
import { AppealProgressDisplay } from "./AppealProgressDisplay";

/**
 * One appeal as a card: photo, name, the one-line need, the compact bar and the
 * days left. Every appeal draws the compact bar here whatever style it chose
 * (the chosen style shows on its own page). A distressing cover is blurred and
 * labelled; the visitor can look at it on the appeal's page, where they are
 * asked first.
 */
export function AppealCard({
  appeal,
  t,
  locale,
  today,
}: {
  appeal: PublicAppeal;
  t: Dictionary;
  locale: Locale;
  today: string;
}) {
  const text = appealText(locale, appeal);
  const c = t.appeals.card;
  const phase = appealPhase(appealProgress(appeal));
  const need = bodyLead(text.whatIsWrong, 140);
  const left = phase === "open" ? daysLeft(appeal.deadline, today) : null;
  const leftText = left == null ? null : left < 0 ? c.deadlinePassed : left === 0 ? c.lastDay : c.daysLeft(left);

  return (
    <Link
      href={`/appeals/${appeal.id}`}
      className="spring-lift flex flex-col overflow-hidden rounded-2xl border border-site-line bg-site-paper hover:border-site-line-strong"
    >
      <div className="relative aspect-[4/3] w-full bg-site-sand">
        {appeal.cover_drive_file_id ? (
          <>
            <PublicPhoto
              fileId={appeal.cover_drive_file_id}
              alt={appeal.cover_is_graphic ? "" : text.residentName}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={`object-cover ${appeal.cover_is_graphic ? "scale-110 blur-3xl" : ""}`}
            />
            {appeal.cover_is_graphic && (
              <p className="absolute inset-0 flex items-center justify-center bg-site-ink/55 p-4 text-center text-base font-bold text-white">
                {c.photoHidden}
              </p>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-base text-site-ink-muted">
            {t.adopt.noPhoto}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl font-bold leading-tight text-site-ink">{text.title}</h3>
          {need && <p className="text-base leading-snug text-site-ink-soft">{need}</p>}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <AppealProgressDisplay
            compact
            style="bar"
            raised={appeal.raised_amount}
            target={appeal.target_amount}
            locale={locale}
            t={t}
          />
          {(phase === "goal-reached" || phase === "funded") && (
            <p className="text-[15px] font-bold text-site-accent">{c.goalReached}</p>
          )}
          {phase === "closed" && <p className="text-[15px] font-bold text-site-accent">{c.finished}</p>}
          {leftText && <p className="text-[15px] font-semibold text-site-ink-soft">{leftText}</p>}
        </div>
      </div>
    </Link>
  );
}
