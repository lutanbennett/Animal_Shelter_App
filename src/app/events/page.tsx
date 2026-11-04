import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { todayIso } from "@/lib/format";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { loadPublicEvents } from "@/lib/events/public";
import { PublicHeader } from "../adopt/PublicHeader";
import { PublicFooter } from "../adopt/PublicFooter";
import { EventCard } from "./EventCard";
import { requirePageVisible } from "@/lib/public-page-access";

// Read live from the views; an event published today shows without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const content = await loadSiteContent(supabase);
  const title = `${t.publicEvents.pageTitle} · ${t.header.appName}`;
  const description = t.publicEvents.metaDescription;
  const share = shareImageMetadata(defaultShareImage(content, locale, t.header.appName), title, description);
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: { canonical: "/events" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/events",
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

const wrap = "mx-auto w-full max-w-[1440px] px-5 lg:px-8 xl:px-16";

/** Fundraising events: what is coming up, then what has happened. Only published, not cancelled events reach it. */
export default async function EventsPage() {
  await requirePageVisible("events");
  const supabase = await createClient();
  const { t, locale } = await getT();
  const [events, content] = await Promise.all([loadPublicEvents(supabase), loadSiteContent(supabase)]);
  const today = todayIso();
  const e = t.publicEvents;
  const isUpcoming = (ev: { event_date: string; end_date: string | null }) => (ev.end_date ?? ev.event_date) >= today;
  const upcoming = events.filter(isUpcoming).reverse();
  const past = events.filter((ev) => !isUpcoming(ev));

  const grid = (list: typeof events) => (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((ev) => (
        <li key={ev.id} className="flex">
          <div className="flex w-full flex-col">
            <EventCard event={ev} t={t} locale={locale} />
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="events" trail={[{ label: e.navLabel }]} />
      <div className={`${wrap} flex flex-col gap-10 py-10 lg:py-14`}>
        <header className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-display text-[40px] font-bold leading-tight lg:text-5xl">{e.heading}</h1>
          <p className="text-lg leading-relaxed text-site-ink-soft lg:text-xl">{e.lead}</p>
        </header>
        {upcoming.length > 0 ? (
          <section aria-labelledby="upcoming-heading" className="flex flex-col gap-5">
            <h2 id="upcoming-heading" className="font-display text-[26px] font-bold lg:text-[30px]">
              {e.upcomingHeading}
            </h2>
            {grid(upcoming)}
          </section>
        ) : (
          <section className="flex max-w-3xl flex-col gap-3">
            <p className="rounded-2xl border border-site-line bg-site-paper p-5 text-lg text-site-ink-soft">{e.noneUpcoming}</p>
            <Link href="/donate" className="flex min-h-11 items-center self-start font-semibold underline underline-offset-4">
              {t.adopt.donateNav} →
            </Link>
          </section>
        )}
        {past.length > 0 && (
          <section aria-labelledby="past-heading" className="flex flex-col gap-5">
            <h2 id="past-heading" className="font-display text-[26px] font-bold lg:text-[30px]">
              {e.pastHeading}
            </h2>
            {grid(past)}
          </section>
        )}
      </div>
      <PublicFooter content={content} />
    </main>
  );
}
