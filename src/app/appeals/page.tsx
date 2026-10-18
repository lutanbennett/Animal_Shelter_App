import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { todayIso } from "@/lib/format";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { appealPhase } from "@/lib/appeals/state";
import { appealProgress, loadPublicAppeals } from "@/lib/appeals/public";
import { PublicHeader } from "../adopt/PublicHeader";
import { PublicFooter } from "../adopt/PublicFooter";
import { AppealCard } from "./AppealCard";

// The raised figures are read live; never baked at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const content = await loadSiteContent(supabase);
  const title = `${t.appeals.pageTitle} · ${t.header.appName}`;
  const description = t.appeals.metaDescription;
  const share = shareImageMetadata(defaultShareImage(content, locale, t.header.appName), title, description);
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: { canonical: "/appeals" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/appeals",
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

const wrap = "mx-auto w-full max-w-6xl px-5 lg:px-8";

/**
 * Help a sick resident: a card per appeal that is asking for money now, then
 * the ones that recently reached their goal or finished, with how it went.
 * Drafts never reach this page (public_appeals leaves them out in SQL).
 */
export default async function AppealsPage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const [appeals, content] = await Promise.all([loadPublicAppeals(supabase), loadSiteContent(supabase)]);
  const today = todayIso();
  const a = t.appeals;

  // Asking now: live and short of the goal. Live-but-funded sits with the
  // finished ones rather than under "help needed".
  const phased = appeals.map((appeal) => ({ appeal, phase: appealPhase(appealProgress(appeal)) }));
  const asking = phased.filter((x) => x.phase === "open").map((x) => x.appeal);
  const finished = phased.filter((x) => x.phase !== "open").map((x) => x.appeal);

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="appeals" trail={[{ label: a.navLabel }]} />

      <div className={`${wrap} flex flex-col gap-10 py-10 lg:py-14`}>
        <header className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-display text-[40px] font-bold leading-tight lg:text-5xl">{a.heading}</h1>
          <p className="text-lg leading-relaxed text-site-ink-soft lg:text-xl">{a.lead}</p>
        </header>

        {asking.length > 0 ? (
          <section aria-labelledby="asking-heading" className="flex flex-col gap-5">
            <h2 id="asking-heading" className="font-display text-[26px] font-bold lg:text-[30px]">
              {a.askingHeading}
            </h2>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {asking.map((appeal) => (
                <li key={appeal.id} className="flex">
                  <div className="flex w-full flex-col">
                    <AppealCard appeal={appeal} t={t} locale={locale} today={today} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="max-w-3xl rounded-2xl border border-site-line bg-site-paper p-5 text-lg text-site-ink-soft">
            {a.noneOpen}
          </p>
        )}

        {asking.length === 0 && (
          <section aria-labelledby="give-heading" className="flex max-w-3xl flex-col gap-3">
            <h2 id="give-heading" className="font-display text-[26px] font-bold lg:text-[30px]">
              {a.otherWaysToGive}
            </h2>
            <p className="text-lg text-site-ink-soft">{a.otherWaysToGiveHint}</p>
            <Link href="/donate" className="flex min-h-11 items-center self-start font-semibold underline underline-offset-4">
              {t.adopt.donateNav} →
            </Link>
          </section>
        )}

        {finished.length > 0 && (
          <section aria-labelledby="finished-heading" className="flex flex-col gap-5">
            <h2 id="finished-heading" className="font-display text-[26px] font-bold lg:text-[30px]">
              {a.finishedHeading}
            </h2>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {finished.map((appeal) => (
                <li key={appeal.id} className="flex">
                  <div className="flex w-full flex-col">
                    <AppealCard appeal={appeal} t={t} locale={locale} today={today} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <PublicFooter content={content} />
    </main>
  );
}
