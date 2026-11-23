import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/get-t";
import { isPlatformSearchOpen } from "@/lib/public-site";
import { PRODUCT_FEATURE_SLUGS, PRODUCT_HOME, productFeaturePath } from "@/lib/platform-features";
import { getSiteOrigin } from "@/lib/site-origin";
import { isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";
import { ProductMockup } from "../../about/ProductMockup";
import { ProductNav } from "../../about/ProductNav";

/**
 * A product feature page (#psubp): the detail behind one band of the product home page (/platform/about).
 * Same rules as that page: static words only, no table read, no shelter or account listed, every link a plain link,
 * so nothing here asks a card. Each page carries its own canonical, its own language links and its own JSON-LD, and
 * overrides the /platform layout's blanket noindex with the same switch the home page follows (PLATFORM_SEARCH, #cjseo),
 * so the page, robots.txt and the sitemap always agree. The addresses come from src/lib/platform-features.ts.
 */
type Props = { params: Promise<{ slug: string }> };

type Feature = {
  searchTitle: string;
  metaDescription: string;
  kicker: string;
  heading: string;
  lead: string;
  sections: { name: string; text: string; mock: { title: string; sub: string; rows: string[][]; tags: string[] } }[];
  alsoTitle: string;
  also: string;
  noteTitle: string;
  note: string;
};

async function feature(slug: string) {
  if (!(PRODUCT_FEATURE_SLUGS as readonly string[]).includes(slug)) return null;
  const { t, locale } = await getT();
  const f = (t.admin.productAdmin.about.features as Record<string, Feature>)[slug];
  return f ? { f, t, locale } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const got = await feature(slug);
  if (!got) return { robots: { index: false, follow: false } };
  const { f, t, locale } = got;
  const open = isPlatformSearchOpen();
  const origin = await getSiteOrigin();
  const en = productFeaturePath(slug);
  const th = productFeaturePath(slug, true);
  const self = locale === "th" ? th : en;
  return {
    ...(origin ? { metadataBase: origin } : {}),
    title: { absolute: f.searchTitle },
    description: f.metaDescription,
    robots: { index: open, follow: open },
    alternates: { canonical: self, languages: { en, th, "x-default": en } },
    openGraph: { type: "website", url: self, siteName: t.admin.productAdmin.platformName, title: f.searchTitle, description: f.metaDescription, locale: locale === "th" ? "th_TH" : "en_US" },
    twitter: { card: "summary", title: f.searchTitle, description: f.metaDescription },
  };
}

const cta = "inline-block rounded bg-primary px-6 py-3 text-base font-medium !text-white hover:opacity-90";

export default async function FeaturePage({ params }: Props) {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();
  const { slug } = await params;
  const got = await feature(slug);
  if (!got) notFound();
  const { f, t, locale } = got;
  const a = t.admin.productAdmin.about;
  const origin = await getSiteOrigin();
  const self = productFeaturePath(slug, locale === "th");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: f.searchTitle,
    description: f.metaDescription,
    inLanguage: locale === "th" ? "th" : "en",
    isPartOf: { "@type": "SoftwareApplication", name: t.admin.productAdmin.platformName, applicationCategory: "BusinessApplication", operatingSystem: "Web" },
    ...(origin ? { url: new URL(self, origin).toString() } : {}),
  }).replace(/</g, "\\u003c");
  const home = locale === "th" ? `/th${PRODUCT_HOME}` : PRODUCT_HOME;
  return (
    <main className="flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <section className="mx-auto w-full max-w-6xl px-6 pt-8">
        <a href={home} className="text-sm font-medium text-foreground underline hover:text-primary">
          ← {a.backHome}
        </a>
      </section>
      <section className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">{f.kicker}</p>
        <h1 className="mt-2 text-4xl font-semibold text-foreground">{f.heading}</h1>
        <p className="mt-4 text-lg text-foreground">{f.lead}</p>
      </section>

      <div className="border-t border-border">
        {f.sections.map((s, i) => (
          <section key={s.name} className={`border-b border-border ${i % 2 === 1 ? "bg-surface" : ""}`}>
            <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:gap-12">
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <h2 className="text-2xl font-semibold text-foreground">{s.name}</h2>
                <p className="mt-3 text-foreground">{s.text}</p>
              </div>
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <ProductMockup mock={s.mock} />
              </div>
            </div>
          </section>
        ))}
        <p className="mx-auto max-w-6xl px-6 py-3 text-xs text-muted">{a.sampleNote}</p>
      </div>

      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h2 className="text-2xl font-semibold text-foreground">{f.noteTitle}</h2>
        <p className="mt-2 text-foreground">{f.note}</p>
        <h2 className="mt-8 text-xl font-semibold text-foreground">{f.alsoTitle}</h2>
        <p className="mt-2 text-foreground">{f.also}</p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-6 py-12">
          <h2 className="text-2xl font-semibold text-foreground">{a.joinTitle}</h2>
          <p className="text-foreground">{a.joinText}</p>
          <a href="/platform/enquire" className={cta}>
            {a.enquire}
          </a>
          <a href={home} className="text-sm font-medium text-foreground underline hover:text-primary">
            {a.otherPages}
          </a>
        </div>
      </section>
    </main>
  );
}
