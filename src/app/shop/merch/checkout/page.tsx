import type { Metadata } from "next";
import { PUBLIC_FRAME } from "@/lib/site/frame";
import { getT } from "@/lib/i18n/get-t";
import { requirePageVisible } from "@/lib/public-page-access";
import { PublicHeader } from "../../../adopt/PublicHeader";
import { PublicFooter } from "../../../adopt/PublicFooter";
import { localizedHref } from "@/lib/public-paths";
import { loadRates } from "@/lib/merch/checkout";
import { CheckoutForm } from "./CheckoutForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  // Per-buyer page: never indexed, and never edge-cached (NOT_EDGE_CACHED_PAGE_PREFIXES).
  return { title: `${t.merchShop.checkoutTitle} · ${t.header.appName}`, robots: { index: false } };
}

/** /shop/merch/checkout: the cart (kept in the browser) and the order form. The server prices everything again. */
export default async function MerchCheckoutPage() {
  await requirePageVisible("shop-merch");
  const { t, locale } = await getT();
  const s = t.merchShop;
  // A failed read leaves overseas currencies out rather than quoting a stale figure; Thailand still works.
  const currencies = await loadRates().then(Object.keys, () => [] as string[]);
  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="shop-merch" trail={[{ label: t.publicNav.getInvolved }, { label: s.navLabel, href: localizedHref("/shop/merch", locale) }, { label: s.checkoutTitle }]} />
      <div className={`${PUBLIC_FRAME} flex flex-col gap-6 py-10`}>
        <h1 className="font-display text-[40px] font-bold leading-[1.05] text-site-ink sm:text-5xl">{s.checkoutTitle}</h1>
        <CheckoutForm
          text={{
            cartEmpty: s.cartEmpty, backToShop: s.backToShop, remove: s.remove, where: s.where, thailand: s.thailand, overseas: s.overseas,
            currency: s.currency, wiseTransfer: s.wiseTransfer, wiseLink: s.wiseLink, subtotal: s.subtotal, postage: s.postage, total: s.total,
            approx: s.approx, yourDetails: s.yourDetails, name: s.name, email: s.email, phone: s.phone, country: s.country, address: s.address,
            note: s.note, placeOrder: s.placeOrder, placing: s.placing, errEmpty: s.errEmpty, errUnavailable: s.errUnavailable,
            errCurrency: s.errCurrency, errFailed: s.errFailed, errFields: s.errFields,
          }}
          currencies={currencies}
          shopHref={localizedHref("/shop/merch", locale)}
        />
      </div>
      <PublicFooter />
    </main>
  );
}
