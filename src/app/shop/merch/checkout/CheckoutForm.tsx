"use client";

import { useActionState, useEffect, useState } from "react";
import { readCart, writeCart, type CartItem } from "../cart";
import { submitOrder, type OrderFormState } from "./actions";

type Text = Record<string, string>;

const baht = (n: number) => `฿${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const input = "min-h-11 rounded border border-border bg-surface px-2 md:min-h-9";

export function CheckoutForm({ text, currencies, shopHref }: { text: Text; currencies: string[]; shopHref: string }) {
  const [cart, setCart] = useState<CartItem[] | null>(null);
  const [region, setRegion] = useState<"thailand" | "overseas">("thailand");
  const [state, action, pending] = useActionState<OrderFormState, FormData>(submitOrder, { error: null });

  // The cart lives in localStorage, which the server cannot read: it is loaded once after the first render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setCart(readCart()), []);

  if (cart === null) return null;
  if (cart.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">{text.cartEmpty}</p>
        <a href={shopHref} className="font-medium text-primary hover:underline">
          &larr; {text.backToShop}
        </a>
      </div>
    );
  }

  const subtotal = cart.reduce((n, c) => n + c.quantity * c.priceThb, 0);
  const postage = cart.reduce((n, c) => n + c.quantity * (region === "thailand" ? c.postageThailandThb : c.postageOverseasThb), 0);
  const update = (next: CartItem[]) => {
    writeCart(next);
    setCart(next);
  };
  const errorKey = state.error ? ({ empty: "errEmpty", unavailable: "errUnavailable", currency: "errCurrency", failed: "errFailed", fields: "errFields" } as const)[state.error] : null;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <input type="hidden" name="cart" value={JSON.stringify(cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })))} />
      <ul className="flex flex-col divide-y divide-border rounded border border-border bg-surface">
        {cart.map((c) => (
          <li key={c.variantId} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span>
              {c.name}
              {c.label ? ` (${c.label})` : ""} × {c.quantity}
            </span>
            <span className="flex items-center gap-3">
              {baht(c.quantity * c.priceThb)}
              <button type="button" className="text-primary hover:underline" onClick={() => update(cart.filter((x) => x.variantId !== c.variantId))}>
                {text.remove}
              </button>
            </span>
          </li>
        ))}
      </ul>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1 font-semibold">{text.where}</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="region" value="thailand" checked={region === "thailand"} onChange={() => setRegion("thailand")} /> {text.thailand}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="region" value="overseas" checked={region === "overseas"} onChange={() => setRegion("overseas")} /> {text.overseas}
        </label>
        {region === "overseas" && (
          <div className="flex flex-wrap gap-3 pl-6">
            <label className="flex flex-col gap-1">
              {text.currency}
              <select name="currency" className={input}>
                {currencies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Wise
              <select name="method" className={input}>
                <option value="wise_transfer">{text.wiseTransfer}</option>
                <option value="wise_link">{text.wiseLink}</option>
              </select>
            </label>
          </div>
        )}
      </fieldset>

      <dl className="grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-1 text-sm">
        <dt>{text.subtotal}</dt>
        <dd>{baht(subtotal)}</dd>
        <dt>{text.postage}</dt>
        <dd>{baht(postage)}</dd>
        <dt className="font-semibold">{text.total}</dt>
        <dd className="font-semibold">{baht(subtotal + postage)}</dd>
      </dl>
      <p className="text-xs text-muted">{text.approx}</p>

      <h2 className="text-lg font-semibold">{text.yourDetails}</h2>
      <label className="flex flex-col gap-1 text-sm">
        {text.name}
        <input name="name" required maxLength={200} autoComplete="name" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {text.email}
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {text.phone}
        <input name="phone" type="tel" maxLength={60} autoComplete="tel" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {text.country}
        <input name="country" required maxLength={2} minLength={2} defaultValue="TH" autoComplete="country" className={`${input} w-24 uppercase`} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {text.address}
        <textarea name="address" required maxLength={1000} rows={3} autoComplete="street-address" className="rounded border border-border bg-surface p-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {text.note}
        <textarea name="note" maxLength={1000} rows={2} className="rounded border border-border bg-surface p-2" />
      </label>

      {errorKey && (
        <p className="text-sm text-danger" role="alert">
          {text[errorKey]}
        </p>
      )}
      <button type="submit" disabled={pending} className="min-h-11 self-start rounded bg-primary px-5 font-medium text-white disabled:opacity-60 md:min-h-9">
        {pending ? text.placing : text.placeOrder}
      </button>
    </form>
  );
}
