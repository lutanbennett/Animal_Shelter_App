import type { Metadata } from "next";
import { PUBLIC_FRAME } from "@/lib/site/frame";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { loadPublicShopLinks, shopText } from "@/lib/shop/shop-links";
import { PublicHeader } from "../adopt/PublicHeader";
import { PublicFooter } from "../adopt/PublicFooter";

export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const content = await loadSiteContent(supabase);
  const title = `${t.shop.pageTitle} · ${t.header.appName}`;
  const description = t.shop.shareFallback;
  const share = shareImageMetadata(defaultShareImage(content, locale, t.header.appName), title, description);
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: { canonical: "/shop" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/shop",
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

/**
 * /shop - Shop for the shelter (0285). Everything on it comes from public_shop_links: shown entries
 * only, and a Shelter Friend's name and logo read from the Friend's own public profile, so a Friend
 * renamed in one place is renamed here. The shelter earns a small commission on these links and says
 * so above the list. Links are https only (shop_links_url_https) and carry rel="sponsored noopener".
 * No click is recorded and no visitor data goes in a link: see docs/decisions/2026-10-30-affiliate-links-app.md.
 */
export default async function ShopPage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const s = t.shop;

  let links: Awaited<ReturnType<typeof loadPublicShopLinks>> = [];
  let error: string | null = null;
  try {
    links = await loadPublicShopLinks(supabase);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader trail={[{ label: t.publicNav.getInvolved }, { label: s.navLabel }]} />

      <div className={`${PUBLIC_FRAME} flex flex-col gap-6 py-10`}>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[40px] font-bold leading-[1.05] text-site-ink sm:text-5xl xl:text-[60px]">{s.pageTitle}</h1>
          <p className="max-w-2xl text-lg text-site-ink-soft sm:text-xl">{s.pageSubtitle}</p>
          <p className="max-w-2xl rounded border border-border bg-surface px-4 py-3 text-sm text-foreground">{s.disclosure}</p>
        </div>

        {error && (
          <p className="text-sm text-danger">
            {s.couldntLoad}
          </p>
        )}

        {!error && links.length === 0 && (
          <p className="rounded border border-border bg-surface p-6 text-center text-sm text-muted">{s.noneYet}</p>
        )}

        <ul className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const text = shopText(link, locale);
            const image = link.friend_id ? link.logo_drive_file_id : link.photo_drive_file_id;
            return (
              <li key={link.id} className="flex flex-col gap-3 rounded border border-border bg-surface p-5">
                {image && (
                  <Image
                    src={driveImageUrl(image, 400)}
                    alt={text.name}
                    width={320}
                    height={200}
                    unoptimized
                    className="h-40 w-full rounded object-contain"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-foreground">{text.name}</h2>
                  {link.friend_id && <span className="text-xs font-medium text-muted">{s.friendBadge}</span>}
                  {text.note && <p className="text-sm text-foreground">{text.note}</p>}
                  {text.priceHint && <p className="text-sm text-muted">{text.priceHint}</p>}
                </div>
                <a
                  href={link.link_url}
                  target="_blank"
                  rel="sponsored noopener"
                  className="inline-flex min-h-11 items-center self-start font-medium text-primary hover:underline md:min-h-9"
                >
                  {s.visit} &rarr;
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <PublicFooter />
    </main>
  );
}
