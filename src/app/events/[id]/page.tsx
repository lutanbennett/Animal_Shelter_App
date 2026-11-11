import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPhoto } from "@/components/PublicPhoto";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { formatDate } from "@/lib/format";
import { bodyLead } from "@/lib/site/body";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { eventText, loadPublicEvent, loadPublicEventPhotos } from "@/lib/events/public";
import { PublicHeader } from "../../adopt/PublicHeader";
import { PublicFooter } from "../../adopt/PublicFooter";
import { requirePageVisible } from "@/lib/public-page-access";
import { publicAlternates, ogAlternateLocale } from "@/lib/site/alternates";
import { localizedHref } from "@/lib/public-paths";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const event = await loadPublicEvent(supabase, id);
  if (!event) return { title: t.publicEvents.pageTitle };
  const content = await loadSiteContent(supabase);
  const text = eventText(locale, event);
  const description = text.summary || bodyLead(text.description, 200) || t.publicEvents.metaDescription;
  const title = `${text.title} · ${t.header.appName}`;
  const image = event.cover_drive_file_id
    ? { url: driveImageUrl(event.cover_drive_file_id, 1200), alt: text.title }
    : defaultShareImage(content, locale, t.header.appName);
  const share = shareImageMetadata(image, title, description);
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: publicAlternates(`/events/${event.id}`, locale),
    openGraph: {
      type: "article",
      title,
      description,
      url: localizedHref(`/events/${event.id}`, locale),
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      alternateLocale: ogAlternateLocale(locale),
      images: share.images,
    },
    twitter: share.twitter,
  };
}

const wrap = "mx-auto w-full max-w-[1440px] px-5 lg:px-8 xl:px-16";
const linkClass = "flex min-h-11 items-center font-semibold underline underline-offset-4";

export default async function EventPage(props: PageProps<"/events/[id]">) {
  await requirePageVisible("events");
  const { id } = await props.params;
  const supabase = await createClient();
  const { t, locale } = await getT();
  const event = await loadPublicEvent(supabase, id);
  if (!event) notFound();
  const [photos, content] = await Promise.all([loadPublicEventPhotos(supabase, event.id), loadSiteContent(supabase)]);
  const e = t.publicEvents;
  const text = eventText(locale, event);
  const when =
    event.end_date && event.end_date !== event.event_date
      ? `${formatDate(event.event_date, locale)} – ${formatDate(event.end_date, locale)}`
      : formatDate(event.event_date, locale);
  const links = event.social_links.filter((l) => /^https?:\/\//i.test(l));

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="events" trail={[{ label: e.navLabel, href: "/events" }, { label: text.title }]} />
      <article className={`${wrap} flex flex-col gap-8 py-10 lg:py-14`}>
        <header className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-display text-[40px] font-bold leading-tight lg:text-5xl">{text.title}</h1>
          <p className="text-lg font-semibold text-site-ink-soft">{when}</p>
          {text.location && <p className="text-lg text-site-ink-soft">{text.location}</p>}
          {text.summary && <p className="text-lg leading-relaxed text-site-ink-soft lg:text-xl">{text.summary}</p>}
        </header>
        {text.description && <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed">{text.description}</p>}
        {photos.length > 0 && (
          <section aria-labelledby="photos-heading" className="flex flex-col gap-4">
            <h2 id="photos-heading" className="font-display text-[26px] font-bold">
              {e.photosHeading}
            </h2>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {photos.map((p) => (
                <li key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-site-sand">
                  <PublicPhoto fileId={p.drive_file_id} alt={text.title} sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                </li>
              ))}
            </ul>
          </section>
        )}
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {event.appeal_id && (
            <Link href={`/campaigns/${event.appeal_id}`} className={linkClass}>
              {e.linkedAppeal} →
            </Link>
          )}
          {event.project_folder_id && (
            <Link href={`/our-work/${event.project_folder_id}`} className={linkClass}>
              {e.linkedProject} →
            </Link>
          )}
          {links.map((l) => (
            <a key={l} href={l} rel="noopener noreferrer" className={linkClass}>
              {new URL(l).hostname} →
            </a>
          ))}
          <Link href="/events" className={linkClass}>
            ← {e.backToAll}
          </Link>
        </nav>
      </article>
      <PublicFooter content={content} />
    </main>
  );
}
