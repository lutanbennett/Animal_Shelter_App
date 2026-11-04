import Link from "next/link";
import { PublicPhoto } from "@/components/PublicPhoto";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/format";
import { eventText, type PublicEvent } from "@/lib/events/public";

/** One event as a card: cover, name, date and place. */
export function EventCard({ event, t, locale }: { event: PublicEvent; t: Dictionary; locale: Locale }) {
  const text = eventText(locale, event);
  const when =
    event.end_date && event.end_date !== event.event_date
      ? `${formatDate(event.event_date, locale)} – ${formatDate(event.end_date, locale)}`
      : formatDate(event.event_date, locale);
  return (
    <Link
      href={`/events/${event.id}`}
      className="spring-lift flex flex-col overflow-hidden rounded-2xl border border-site-line bg-site-paper hover:border-site-line-strong"
    >
      <div className="relative aspect-[4/3] w-full bg-site-sand">
        {event.cover_drive_file_id ? (
          <PublicPhoto
            fileId={event.cover_drive_file_id}
            alt=""
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-base text-site-ink-muted">{t.adopt.noPhoto}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-2xl font-bold leading-tight text-site-ink">{text.title}</h3>
        <p className="text-[15px] font-semibold text-site-ink-soft">{when}</p>
        {text.location && <p className="text-base text-site-ink-soft">{text.location}</p>}
        {text.summary && <p className="text-base leading-snug text-site-ink-soft">{text.summary}</p>}
      </div>
    </Link>
  );
}
