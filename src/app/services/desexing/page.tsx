import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { formatDate } from "@/lib/format";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { loadPublicDrives, type PublicDrive } from "@/lib/desexing/public";
import { PublicHeader } from "../../adopt/PublicHeader";
import { PublicFooter } from "../../adopt/PublicFooter";
import { SignupForm } from "./SignupForm";

// Places left are read live; never baked at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const content = await loadSiteContent(supabase);
  const title = `${t.desexing.pageTitle} · ${t.header.appName}`;
  const description = t.desexing.metaDescription;
  const share = shareImageMetadata(defaultShareImage(content, locale, t.header.appName), title, description);
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: { canonical: "/services/desexing" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/services/desexing",
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

const wrap = "mx-auto w-full max-w-6xl px-5 lg:px-8";
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : null);

/**
 * Desexing drives: the upcoming days when the public brings their own pet to
 * be desexed, each with what the shelter says about cost and who can come, and
 * a sign-up. Every date, price and rule on this page is typed by the shelter
 * in Management; nothing here is written in advance. Reads
 * public_desexing_drives only (0233).
 */
export default async function DesexingDrivesPage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const [drives, content] = await Promise.all([loadPublicDrives(supabase), loadSiteContent(supabase)]);
  const d = t.desexing;

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="desexing" trail={[{ label: t.publicNav.services }, { label: d.navLabel }]} />

      <div className={`${wrap} flex flex-col gap-10 py-10 lg:py-14`}>
        <header className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-display text-[40px] font-bold leading-tight lg:text-5xl">{d.heading}</h1>
          <p className="text-lg leading-relaxed text-site-ink-soft lg:text-xl">{d.lead}</p>
        </header>

        {drives.length === 0 ? (
          <p className="max-w-3xl rounded-2xl border border-site-line bg-site-paper p-5 text-lg text-site-ink-soft">
            {d.noneScheduled}
          </p>
        ) : (
          <ul className="flex max-w-3xl flex-col gap-6">
            {drives.map((drive) => (
              <li key={drive.id}>
                <DriveCard drive={drive} locale={locale} t={t} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <PublicFooter content={content} />
    </main>
  );
}

function DriveCard({
  drive,
  locale,
  t,
}: {
  drive: PublicDrive;
  locale: "en" | "th";
  t: Awaited<ReturnType<typeof getT>>["t"];
}) {
  const d = t.desexing;
  const start = hhmm(drive.starts_at);
  const end = hhmm(drive.ends_at);
  const when = [formatDate(drive.drive_date, locale), start && end ? `${start}–${end}` : (start ?? null)]
    .filter(Boolean)
    .join(" · ");
  const full = !drive.is_cancelled && drive.spots_left === 0;
  const closed = !drive.is_cancelled && !full && !drive.accepting_signups;

  return (
    <article
      aria-labelledby={`drive-${drive.id}`}
      className="flex flex-col gap-4 rounded-2xl border border-site-line bg-site-paper p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={`drive-${drive.id}`} className="font-display text-[26px] font-bold leading-tight lg:text-[30px]">
          {drive.title}
        </h2>
        <p className="text-lg font-semibold">{when}</p>
        {drive.is_cancelled && (
          <p className="w-fit rounded-full bg-site-sand px-3 py-1 text-[15px] font-bold">{d.cancelled}</p>
        )}
      </div>

      {drive.description && <p className="whitespace-pre-line text-[17px] leading-relaxed text-site-ink-soft">{drive.description}</p>}

      <dl className="grid gap-x-6 gap-y-3 text-[17px] sm:grid-cols-[max-content_1fr]">
        <dt className="font-semibold">{d.where}</dt>
        <dd>
          {drive.venue}
          {drive.venue_address && <span className="block whitespace-pre-line text-site-ink-soft">{drive.venue_address}</span>}
        </dd>
        <dt className="font-semibold">{d.takes}</dt>
        <dd>{drive.species.map((s) => (s === "dog" || s === "cat" ? d.species[s] : s)).join(", ")}</dd>
        {drive.price_note && (
          <>
            <dt className="font-semibold">{d.cost}</dt>
            <dd className="whitespace-pre-line">{drive.price_note}</dd>
          </>
        )}
        {drive.eligibility_note && (
          <>
            <dt className="font-semibold">{d.whoCanCome}</dt>
            <dd className="whitespace-pre-line">{drive.eligibility_note}</dd>
          </>
        )}
        {drive.spots_left !== null && !drive.is_cancelled && (
          <>
            <dt className="font-semibold">{d.places}</dt>
            <dd>{full ? d.full : d.placesLeft(drive.spots_left)}</dd>
          </>
        )}
        {drive.signups_close_on && !drive.is_cancelled && (
          <>
            <dt className="font-semibold">{d.signupsClose}</dt>
            <dd>{formatDate(drive.signups_close_on, locale)}</dd>
          </>
        )}
      </dl>

      {drive.accepting_signups ? (
        <SignupForm driveId={drive.id} species={drive.species} />
      ) : (
        !drive.is_cancelled && <p className="text-[17px] font-semibold">{full ? d.full : closed ? d.signupsClosed : null}</p>
      )}
    </article>
  );
}
