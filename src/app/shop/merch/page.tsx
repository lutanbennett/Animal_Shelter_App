import type { Metadata } from "next";
import { PUBLIC_FRAME } from "@/lib/site/frame";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { requirePageVisible } from "@/lib/public-page-access";
import { PublicHeader } from "../../adopt/PublicHeader";
import { PublicFooter } from "../../adopt/PublicFooter";
import { publicAlternates, ogAlternateLocale } from "@/lib/site/alternates";
import { localizedHref } from "@/lib/public-paths";
import { loadMerchCatalogue, merchText, variantLabel, type MerchCatalogueItem } from "@/lib/merch/shop";
import { ProductCard } from "./ProductCard";

export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const content = await loadSiteContent(supabase);
  const title = `${t.merchShop.pageTitle} · ${t.header.appName}`;
  const description = t.merchShop.pageSubtitle;
  const share = shareImageMetadata(defaultShareImage(content, locale, t.header.appName), title, description);
  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: publicAlternates("/shop/merch", locale),
    openGraph: {
      type: "website",
      title,
      description,
      url: localizedHref("/shop/merch", locale),
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      alternateLocale: ogAlternateLocale(locale),
      images: share.images,
    },
    twitter: share.twitter,
  };
}

const baht = (n: number) => `฿${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/**
 * /shop/merch: the shelter's own merchandise (#cjxq0, docs/merch-shop.md). Reads public_merch_products and
 * public_merch_variants only. An empty catalogue is the normal first state and says so.
 */
export default async function MerchShopPage() {
  await requirePageVisible("shop-merch");
  const supabase = await createClient();
  const { t, locale } = await getT();
  const s = t.merchShop;

  let products: MerchCatalogueItem[] = [];
  let failed = false;
  try {
    products = await loadMerchCatalogue(supabase);
  } catch {
    failed = true;
  }

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="shop-merch" trail={[{ label: t.publicNav.getInvolved }, { label: s.navLabel }]} />

      <div className={`${PUBLIC_FRAME} flex flex-col gap-6 py-10`}>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[40px] font-bold leading-[1.05] text-site-ink sm:text-5xl xl:text-[60px]">{s.pageTitle}</h1>
          <p className="max-w-2xl text-lg text-site-ink-soft sm:text-xl">{s.pageSubtitle}</p>
          <a href={localizedHref("/shop/merch/checkout", locale)} className="self-start font-medium text-primary hover:underline">
            {s.cart} &rarr;
          </a>
        </div>

        {failed && <p className="text-sm text-danger">{s.couldntLoad}</p>}

        {!failed && products.length === 0 && (
          <div className="rounded border border-border bg-surface p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">{s.emptyTitle}</h2>
            <p className="mt-1 text-sm text-muted">{s.empty}</p>
          </div>
        )}

        <ul className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const text = merchText(p, locale);
            return (
              <li key={p.id} className="flex flex-col gap-3 rounded border border-border bg-surface p-5">
                {p.photo_drive_file_id && (
                  <img src={driveImageUrl(p.photo_drive_file_id, 400)} alt={text.name} width={320} height={240} className="h-48 w-full rounded object-contain" />
                )}
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-foreground">{text.name}</h2>
                  {text.description && <p className="text-sm text-foreground">{text.description}</p>}
                  <p className="text-base font-semibold text-foreground">{baht(p.price_thb)}</p>
                  <p className="text-xs text-muted">{s.postageThailand(baht(p.postage_thailand_thb))}</p>
                  <p className="text-xs text-muted">{s.postageOverseas(baht(p.postage_overseas_thb))}</p>
                </div>
                <ProductCard
                  productId={p.id}
                  name={text.name}
                  priceThb={p.price_thb}
                  postageThailandThb={p.postage_thailand_thb}
                  postageOverseasThb={p.postage_overseas_thb}
                  variants={p.variants.map((v) => ({ id: v.id, label: variantLabel(v), available: v.available }))}
                  text={{ choose: s.choose, soldOut: s.soldOut, quantity: s.quantity, addToCart: s.addToCart, addedToCart: s.addedToCart, viewCart: s.viewCart }}
                  checkoutHref={localizedHref("/shop/merch/checkout", locale)}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <PublicFooter />
    </main>
  );
}
