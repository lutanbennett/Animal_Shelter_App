import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/get-t";
import { isPlatformSearchOpen } from "@/lib/public-site";
import { PRODUCT_COOPER, PRODUCT_COOPER_PAGE, PRODUCT_HOME } from "@/lib/platform-features";
import { driveImageUrl } from "@/lib/google/drive-client";
import { createClient } from "@/lib/supabase/server";
import { loadProductPage, overlayProductText, productPhotoId, productText } from "@/lib/site/product-content";
import { cooperHasContent, storyParagraphs } from "@/lib/site/cooper-page";
import { getSiteOrigin } from "@/lib/site-origin";
import { isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";
import { ProductNav } from "../about/ProductNav";

/**
 * Cooper's page (#cpstr): the dog the product is named for. The words and the photo are the product administrator's, typed in
 * /platform/content as page "cooper" (see src/lib/site/cooper-page.ts for the lines). There is no dictionary text for it and
 * nothing is invented: with no `heading` line the page is not-found, so it is never reachable-and-empty, and it is left out
 * of the sitemap until it has one. Same rules as the other product pages: plain links, no table read but this page's rows.
 */
async function load() {
  const { t, locale } = await getT();
  const content = await loadProductPage(await createClient(), PRODUCT_COOPER_PAGE);
  if (!cooperHasContent(content)) return null;
  const text = (key: string) => productText(content, key, locale, "");
  return { t, locale, heading: text("heading"), kicker: text("kicker"), story: text("story"), description: text("description"), photo: productPhotoId(content, "photo"), photoAlt: text("photo") };
}

export async function generateMetadata(): Promise<Metadata> {
  const got = await load();
  if (!got) return { robots: { index: false, follow: false } };
  const { t, locale, heading, story, description } = got;
  const open = isPlatformSearchOpen();
  const origin = await getSiteOrigin();
  const th = `/th${PRODUCT_COOPER}`;
  const self = locale === "th" ? th : PRODUCT_COOPER;
  const title = `${heading} | ${t.admin.productAdmin.platformName}`;
  const desc = description || storyParagraphs(story)[0]?.slice(0, 200) || undefined;
  return {
    ...(origin ? { metadataBase: origin } : {}),
    title: { absolute: title },
    description: desc,
    robots: { index: open, follow: open },
    alternates: { canonical: self, languages: { en: PRODUCT_COOPER, th, "x-default": PRODUCT_COOPER } },
    openGraph: { type: "website", url: self, siteName: t.admin.productAdmin.platformName, title, description: desc, locale: locale === "th" ? "th_TH" : "en_US" },
    twitter: { card: "summary", title, description: desc },
  };
}

export default async function CooperPage() {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();
  const got = await load();
  if (!got) notFound();
  const { t, locale, heading, kicker, story, photo, photoAlt } = got;
  // The navigation's chrome words come from the home page's dictionary, with any console edits over them.
  const home = await loadProductPage(await createClient(), "home");
  const a = overlayProductText(home, locale, t.admin.productAdmin.about, ["features", "slug"]);
  const homeHref = locale === "th" ? `/th${PRODUCT_HOME}` : PRODUCT_HOME;
  return (
    <main className="flex flex-1 flex-col">
      <ProductNav bands={a.bands} homeLabel={a.navHome} navLabel={a.navLabel} current="cooper" th={locale === "th"} />
      <section className="mx-auto w-full max-w-6xl px-6 pt-8">
        <a href={homeHref} className="text-sm font-medium text-foreground underline hover:text-primary">
          ← {a.backHome}
        </a>
      </section>
      <section className={`mx-auto grid w-full max-w-6xl items-start gap-10 px-6 py-10 ${photo ? "lg:grid-cols-2" : "max-w-3xl"}`}>
        <div>
          {kicker && <p className="text-sm font-medium uppercase tracking-wide text-primary">{kicker}</p>}
          <h1 className="mt-2 text-4xl font-semibold text-foreground">{heading}</h1>
          <div className="mt-4 space-y-4 text-lg text-foreground">
            {storyParagraphs(story).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        {photo && (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-surface">
            <Image src={driveImageUrl(photo)} alt={photoAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />
          </div>
        )}
      </section>
    </main>
  );
}
