import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PUBLIC_FRAME } from "@/lib/site/frame";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { requirePageVisible } from "@/lib/public-page-access";
import { PublicHeader } from "../../../../adopt/PublicHeader";
import { PublicFooter } from "../../../../adopt/PublicFooter";
import { localizedHref } from "@/lib/public-paths";
import { ClearCart } from "./ClearCart";
import { loadOrderView } from "@/lib/merch/checkout";
import { variantLabel } from "@/lib/merch/shop";
import { loadPublicDonationChannels, channelText } from "@/lib/site/donation-channels";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  // Per-buyer page: never indexed, and never edge-cached (NOT_EDGE_CACHED_PAGE_PREFIXES).
  return { title: `${t.merchShop.orderTitle} · ${t.header.appName}`, robots: { index: false } };
}

const baht = (n: number) => `฿${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/**
 * /shop/merch/order/<id>: status and tracking, read by the order's unguessable id. Shows what the buyer
 * bought, what to pay and how, the payment state and each part's tracking. No name, address, email or phone.
 */
export default async function MerchOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageVisible("shop-merch");
  const { id } = await params;
  const order = await loadOrderView(id);
  if (!order) notFound();
  const { t, locale } = await getT();
  const s = t.merchShop;

  const wantedWay = order.region === "thailand" ? "promptpay" : "wise";
  let channels: Awaited<ReturnType<typeof loadPublicDonationChannels>> = [];
  try {
    channels = (await loadPublicDonationChannels(await createClient())).filter((c) => c.way === wantedWay);
  } catch {
    channels = [];
  }
  const amount = order.region === "thailand" ? baht(order.total_thb) : `${order.total_charged.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${order.currency}`;

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="shop-merch" trail={[{ label: t.publicNav.getInvolved }, { label: s.navLabel, href: localizedHref("/shop/merch", locale) }, { label: s.orderTitle }]} />
      <div className={`${PUBLIC_FRAME} flex max-w-3xl flex-col gap-6 py-10`}>
        <ClearCart />
        <h1 className="font-display text-[40px] font-bold leading-[1.05] text-site-ink sm:text-5xl">{s.orderTitle}</h1>
        <p className="text-lg">
          {s.orderNo}: <strong>{order.order_no}</strong> · {s.state[order.payment_state] ?? order.payment_state}
        </p>
        <p className="text-sm text-muted">{s.keepLink}</p>

        {order.payment_state === "awaiting" && (
          <section className="flex flex-col gap-3 rounded border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">{s.howToPay}</h2>
            <p className="text-sm">{order.region === "thailand" ? s.payThai(amount) : s.payOverseas(amount)}</p>
            {order.region === "overseas" && order.exchange_rate && (
              <p className="text-xs text-muted">{s.rateLine(String(order.exchange_rate), order.created_at.slice(0, 10))}</p>
            )}
            {order.payment_method === "wise_link" && <p className="text-sm">{s.payByLink}</p>}
            {order.payment_method !== "wise_link" && channels.length === 0 && <p className="text-sm">{s.noPayDetails}</p>}
            {order.payment_method !== "wise_link" &&
              channels.map((c) => (
                <div key={c.id} className="flex flex-col gap-1 text-sm">
                  <p className="font-medium">{channelText(c, locale).label}</p>
                  {[c.bank_name, c.account_name, c.account_number, c.promptpay_id, c.url].filter(Boolean).map((v) => (
                    <p key={v}>{v}</p>
                  ))}
                  {channelText(c, locale).note && <p className="text-muted">{channelText(c, locale).note}</p>}
                  {c.qr_drive_file_id && <img src={driveImageUrl(c.qr_drive_file_id)} alt="" width={200} height={200} className="h-48 w-48 object-contain" />}
                </div>
              ))}
          </section>
        )}

        <dl className="grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-1 text-sm">
          <dt>{s.subtotal}</dt>
          <dd>{baht(order.subtotal_thb)}</dd>
          <dt>{s.postage}</dt>
          <dd>{baht(order.postage_thb)}</dd>
          <dt className="font-semibold">{s.total}</dt>
          <dd className="font-semibold">{amount}</dd>
        </dl>

        <ul className="flex flex-col gap-3">
          {order.parts.map((p) => (
            <li key={p.id} className="rounded border border-border bg-surface p-4 text-sm">
              <p className="font-medium">{s.part[p.status] ?? p.status}</p>
              <ul className="my-1">
                {p.items.map((i, n) => (
                  <li key={n}>
                    {i.product_name}
                    {variantLabel(i) ? ` (${variantLabel(i)})` : ""} × {i.quantity}
                  </li>
                ))}
              </ul>
              <p className="text-muted">{p.tracking_number ? `${s.tracking}: ${p.carrier ? p.carrier + " " : ""}${p.tracking_number}` : s.noTracking}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">{s.contact}</p>
      </div>
      <PublicFooter />
    </main>
  );
}
