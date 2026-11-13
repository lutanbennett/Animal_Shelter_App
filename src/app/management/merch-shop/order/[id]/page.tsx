import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { cancelOrder, markPaid, saveOrderNote, savePart } from "../../actions";

/**
 * One merchandise order (docs/merch-shop.md). Read needs merch.manage at read; Mark paid, per-part progress, the note
 * and cancel each ask merch.manage at edit, the same activity their actions in ../../actions.ts ask.
 */

type Order = {
  id: string;
  order_no: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  ship_country: string;
  ship_address: string;
  region: string;
  currency: string;
  exchange_rate: number | null;
  subtotal_thb: number;
  postage_thb: number;
  total_thb: number;
  total_charged: number;
  payment_method: string;
  payment_state: string;
  paid_at: string | null;
  payment_reference: string | null;
  buyer_note: string | null;
  staff_note: string | null;
  created_at: string;
  parts: {
    id: string;
    fulfilment: string;
    status: string;
    carrier: string | null;
    tracking_number: string | null;
    note: string | null;
    sent_to_supplier_at: string | null;
    supplier: { name: string } | null;
    items: { id: string; product_name: string; size: string | null; colour: string | null; quantity: number; unit_price_thb: number }[];
  }[];
};

const inputClass = "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";
const buttonClass = "rounded border border-border bg-surface px-3 py-1 text-sm font-medium text-foreground hover:border-primary";

export default async function MerchOrderPage(props: PageProps<"/management/merch-shop/order/[id]">) {
  const { supabase, perms } = await requirePermission("merch.manage", "read");
  const { t } = await getT();
  const m = t.merchStaff;
  const { id } = await props.params;
  const sp = await props.searchParams;
  const canEdit = can(perms, "merch.manage", "edit");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: order } = await supabase
    .from("merch_orders")
    .select(
      "*, parts:merch_order_parts(id, fulfilment, status, carrier, tracking_number, note, sent_to_supplier_at, supplier:suppliers(name), items:merch_order_items(id, product_name, size, colour, quantity, unit_price_thb))",
    )
    .eq("id", id)
    .maybeSingle<Order>();
  if (!order) notFound();
  const ok = typeof sp.ok === "string" ? sp.ok : "";
  const err = typeof sp.err === "string" ? sp.err : "";
  const stateLabel = m.state[order.payment_state as keyof typeof m.state] ?? order.payment_state;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <Link href="/management/merch-shop?tab=orders" className="text-sm text-primary underline">
          {m.backToOrders}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {order.order_no} <span className="text-base font-normal text-muted">{stateLabel}</span>
        </h1>
      </div>
      {ok && (
        <p role="status" className="text-sm text-success">
          {m.ok[ok as keyof typeof m.ok] ?? m.ok.saved}
        </p>
      )}
      {err && (
        <p role="alert" className="text-sm text-danger">
          {m.err[err as keyof typeof m.err] ?? m.err.failed}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-border bg-surface p-3 text-sm">
          <h2 className="font-semibold text-foreground">{m.delivery}</h2>
          <p>{order.buyer_name}</p>
          <p className="whitespace-pre-wrap">{order.ship_address}</p>
          <p>{order.ship_country}</p>
          <p className="text-muted">
            {order.buyer_email}
            {order.buyer_phone ? ` · ${order.buyer_phone}` : ""}
          </p>
          {order.buyer_note && <p className="mt-2 text-muted">{m.buyerNote}: {order.buyer_note}</p>}
        </div>
        <div className="rounded border border-border bg-surface p-3 text-sm">
          <h2 className="font-semibold text-foreground">{m.payment}</h2>
          <p>
            {m.subtotal}: {Number(order.subtotal_thb).toLocaleString()} THB · {m.postage}: {Number(order.postage_thb).toLocaleString()} THB
          </p>
          <p className="font-medium text-foreground">
            {m.colTotal}: {Number(order.total_thb).toLocaleString()} THB
            {order.currency !== "THB" ? ` = ${order.total_charged} ${order.currency} (${m.rate} ${order.exchange_rate})` : ""}
          </p>
          <p className="text-muted">{m.method[order.payment_method as keyof typeof m.method] ?? order.payment_method}</p>
          {order.payment_state === "paid" && (
            <p className="text-success">
              {m.paidOn(new Date(order.paid_at ?? "").toLocaleDateString("en-GB"))}
              {order.payment_reference ? ` · ${order.payment_reference}` : ""}
            </p>
          )}
          {canEdit && order.payment_state === "awaiting" && (
            <div className="mt-3 flex flex-col gap-2">
              <form action={markPaid} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={order.id} />
                <label className="flex flex-col text-xs text-muted">
                  {m.paymentReference}
                  <input name="reference" className={inputClass} />
                </label>
                <button type="submit" className="rounded bg-primary px-3 py-1 text-sm font-medium text-white">
                  {m.markPaid}
                </button>
              </form>
              <form action={cancelOrder}>
                <input type="hidden" name="id" value={order.id} />
                <button type="submit" className={buttonClass}>
                  {m.cancelOrder}
                </button>
              </form>
              <p className="text-xs text-muted">{m.cancelHelp}</p>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {order.parts.map((p) => (
          <article key={p.id} className="rounded border border-border bg-surface p-3 text-sm">
            <h2 className="font-semibold text-foreground">
              {p.fulfilment === "shelter" ? m.partShelter : m.partSupplier(p.supplier?.name ?? "")} ·{" "}
              <span className="font-normal text-muted">{m.partStatus[p.status as keyof typeof m.partStatus] ?? p.status}</span>
            </h2>
            <ul className="list-disc pl-5">
              {p.items.map((i) => (
                <li key={i.id}>
                  {i.quantity} × {[i.product_name, i.size, i.colour].filter(Boolean).join(" / ")} ({Number(i.unit_price_thb).toLocaleString()} THB)
                </li>
              ))}
            </ul>
            {p.status !== "cancelled" &&
              (canEdit ? (
                <form action={savePart} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="partId" value={p.id} />
                  <label className="flex flex-col text-xs text-muted">
                    {m.carrier}
                    <input name="carrier" defaultValue={p.carrier ?? ""} className={inputClass} />
                  </label>
                  <label className="flex flex-col text-xs text-muted">
                    {m.tracking}
                    <input name="tracking" defaultValue={p.tracking_number ?? ""} className={inputClass} />
                  </label>
                  <label className="flex flex-col text-xs text-muted">
                    {m.partNote}
                    <input name="note" defaultValue={p.note ?? ""} className={inputClass} />
                  </label>
                  <label className="flex flex-col text-xs text-muted">
                    {m.move}
                    <select name="move" defaultValue="keep" className={inputClass}>
                      <option value="keep">{m.moveKeep}</option>
                      <option value="shipped">{m.partStatus.shipped}</option>
                      <option value="delivered">{m.partStatus.delivered}</option>
                    </select>
                  </label>
                  <button type="submit" className={buttonClass}>
                    {m.save}
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-muted">{[p.carrier, p.tracking_number].filter(Boolean).join(" · ")}</p>
              ))}
          </article>
        ))}
      </section>

      <section className="rounded border border-border bg-surface p-3 text-sm">
        <h2 className="font-semibold text-foreground">{m.staffNote}</h2>
        {canEdit ? (
          <form action={saveOrderNote} className="mt-2 flex flex-col gap-2">
            <input type="hidden" name="id" value={order.id} />
            <textarea name="note" rows={3} defaultValue={order.staff_note ?? ""} className={inputClass} />
            <div>
              <button type="submit" className={buttonClass}>
                {m.save}
              </button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap text-muted">{order.staff_note}</p>
        )}
      </section>
    </main>
  );
}
