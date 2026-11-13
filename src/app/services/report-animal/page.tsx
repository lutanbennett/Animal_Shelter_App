import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { PublicHeader } from "../../adopt/PublicHeader";
import { PublicFooter } from "../../adopt/PublicFooter";
import { ReportForm } from "./ReportForm";
import { publicAlternates, ogAlternateLocale } from "@/lib/site/alternates";
import { localizedHref } from "@/lib/public-paths";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const content = await loadSiteContent(supabase);
  const title = `${t.animalReport.pageTitle} · ${t.header.appName}`;
  const description = t.animalReport.metaDescription;
  const share = shareImageMetadata(defaultShareImage(content, locale, t.header.appName), title, description);
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: publicAlternates("/services/report-animal", locale),
    openGraph: {
      type: "website",
      title,
      description,
      url: localizedHref("/services/report-animal", locale),
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      alternateLocale: ogAlternateLocale(locale),
      images: share.images,
    },
    twitter: share.twitter,
  };
}

const wrap = "mx-auto w-full max-w-6xl px-5 lg:px-8";

/**
 * Report an animal: one public form for a stray, an injured animal, a welfare concern or a lost pet. Writes to
 * animal_reports (0372) as anon; staff see them under Management. Not on the hide list, on purpose: a way to
 * report an injured animal is not something to switch off by accident (docs/decisions/2026-11-13-report-an-animal.md).
 */
export default async function ReportAnimalPage() {
  const supabase = await createClient();
  const { t } = await getT();
  const content = await loadSiteContent(supabase);
  const r = t.animalReport;

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="report-animal" trail={[{ label: t.publicNav.services }, { label: r.navLabel }]} />
      <div className={`${wrap} flex flex-col gap-8 py-10 lg:py-14`}>
        <header className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-display text-[40px] font-bold leading-tight lg:text-5xl">{r.heading}</h1>
          <p className="text-lg leading-relaxed text-site-ink-soft lg:text-xl">{r.lead}</p>
        </header>
        <ReportForm />
      </div>
      <PublicFooter content={content} />
    </main>
  );
}
