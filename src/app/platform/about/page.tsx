import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/get-t";
import { isPlatformSearchOpen } from "@/lib/public-site";
import { getSiteOrigin } from "@/lib/site-origin";
import { isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";
import { productFeaturePath } from "@/lib/platform-features";
import { ProductMockup } from "./ProductMockup";

/**
 * The product page (#apxld, rebuilt as a product introduction in #cjlnd): what a stranger at cooperjaidee.org lands on.
 * Static words only. It reads no table and lists no shelter or account, so it cannot be used to find out which exist.
 * Every link is a plain link; none is an action that needs a card. With the feature pages under /platform/features/ (#psubp) it is one of the only pages under /platform that are ever
 * for search engines, and only when PLATFORM_SEARCH says "open" (src/lib/public-site.ts, #cjseo): its own robots
 * metadata follows that switch, so the page and robots.txt always agree. Closed is the default.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  const a = t.admin.productAdmin.about;
  const open = isPlatformSearchOpen();
  const origin = await getSiteOrigin();
  const en = "/platform/about";
  const th = "/th/platform/about";
  const self = locale === "th" ? th : en;
  return {
    ...(origin ? { metadataBase: origin } : {}),
    title: { absolute: a.searchTitle },
    description: a.metaDescription,
    robots: { index: open, follow: open },
    alternates: { canonical: self, languages: { en, th, "x-default": en } },
    openGraph: { type: "website", url: self, siteName: t.admin.productAdmin.platformName, title: a.searchTitle, description: a.metaDescription, locale: locale === "th" ? "th_TH" : "en_US" },
    twitter: { card: "summary", title: a.searchTitle, description: a.metaDescription },
  };
}

const link = "inline-block rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:text-primary";
const cta = "inline-block rounded bg-primary px-6 py-3 text-base font-medium !text-white hover:opacity-90";

export default async function AboutPage() {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();
  const { t, locale } = await getT();
  const a = t.admin.productAdmin.about;
  const origin = await getSiteOrigin();
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.admin.productAdmin.platformName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: a.metaDescription,
    inLanguage: ["en", "th"],
    audience: { "@type": "Audience", audienceType: locale === "th" ? "ศูนย์พักพิงสัตว์" : "Animal shelters and rescues" },
    ...(origin ? { url: new URL(locale === "th" ? "/th/platform/about" : "/platform/about", origin).toString() } : {}),
  }).replace(/</g, "\\u003c");
  return (
    <main className="flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">{a.kicker}</p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground sm:text-5xl">{a.heading}</h1>
          <p className="mt-4 text-lg text-foreground">{a.lead}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href="/platform/enquire" className={cta}>
              {a.enquire}
            </a>
            <a href="#features" className="text-sm font-medium text-foreground underline hover:text-primary">
              {a.seeMore}
            </a>
          </div>
        </div>
        <ProductMockup mock={a.bands[0].mock} />
      </section>

      <div id="features" className="border-t border-border">
        {a.bands.map((b, i) => (
          <section key={b.name} className={`border-b border-border ${i % 2 === 1 ? "bg-surface" : ""}`}>
            <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:gap-12">
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <h2 className="text-2xl font-semibold text-foreground">{b.name}</h2>
                <p className="mt-3 text-foreground">{b.text}</p>
                {b.slug && (
                  <a href={productFeaturePath(b.slug, locale === "th")} className="mt-4 inline-block text-sm font-medium text-primary underline">
                    {a.readMore}
                  </a>
                )}
              </div>
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <ProductMockup mock={b.mock} />
              </div>
            </div>
          </section>
        ))}
        <p className="mx-auto max-w-6xl px-6 py-3 text-xs text-muted">{a.sampleNote}</p>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold text-foreground">{a.whoTitle}</h2>
        <p className="mt-2 max-w-prose text-foreground">{a.who}</p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-6 py-12">
          <h2 className="text-2xl font-semibold text-foreground">{a.joinTitle}</h2>
          <p className="text-foreground">{a.joinText}</p>
          <a href="/platform/enquire" className={cta}>
            {a.enquire}
          </a>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8">
        <h2 className="text-sm font-semibold text-muted">{a.signInTitle}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="/login" className={link}>
            {a.signInShelter}
          </a>
          <a href="/login?next=%2Fplatform%2Fshelters" className={link}>
            {a.signInChooser}
          </a>
          <a href="/login?next=%2Fplatform" className={link}>
            {a.signInAdmin}
          </a>
        </div>
      </footer>
    </main>
  );
}
