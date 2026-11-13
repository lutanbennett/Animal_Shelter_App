"use client";

import { useState } from "react";
import { addToCart } from "./cart";

type Variant = { id: string; label: string; available: boolean };

export function ProductCard({
  productId,
  name,
  priceThb,
  postageThailandThb,
  postageOverseasThb,
  variants,
  text,
  checkoutHref,
}: {
  productId: string;
  name: string;
  priceThb: number;
  postageThailandThb: number;
  postageOverseasThb: number;
  variants: Variant[];
  text: { choose: string; soldOut: string; quantity: string; addToCart: string; addedToCart: string; viewCart: string };
  checkoutHref: string;
}) {
  const firstFree = variants.find((v) => v.available)?.id ?? "";
  const [variantId, setVariantId] = useState(firstFree);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const chosen = variants.find((v) => v.id === variantId);
  if (variants.every((v) => !v.available)) {
    return <p className="text-sm font-medium text-muted">{text.soldOut}</p>;
  }
  return (
    <form
      className="flex flex-col gap-2"
      data-product={productId}
      onSubmit={(e) => {
        e.preventDefault();
        if (!chosen) return;
        addToCart({
          variantId: chosen.id,
          name,
          label: chosen.label,
          quantity: qty,
          priceThb,
          postageThailandThb,
          postageOverseasThb,
        });
        setAdded(true);
      }}
    >
      {variants.length > 1 || variants[0]?.label ? (
        <label className="flex flex-col gap-1 text-sm">
          {text.choose}
          <select
            value={variantId}
            onChange={(e) => {
              setVariantId(e.target.value);
              setAdded(false);
            }}
            className="min-h-11 rounded border border-border bg-surface px-2 md:min-h-9"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={!v.available}>
                {v.label || name}
                {v.available ? "" : ` (${text.soldOut})`}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {text.quantity}
        <input
          type="number"
          min={1}
          max={20}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="min-h-11 w-24 rounded border border-border bg-surface px-2 md:min-h-9"
        />
      </label>
      <button type="submit" className="min-h-11 self-start rounded bg-primary px-4 font-medium text-white md:min-h-9">
        {text.addToCart}
      </button>
      {added && (
        <p className="text-sm text-foreground" role="status">
          {text.addedToCart}.{" "}
          <a href={checkoutHref} className="font-medium text-primary hover:underline">
            {text.viewCart} &rarr;
          </a>
        </p>
      )}
    </form>
  );
}
