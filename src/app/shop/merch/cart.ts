"use client";

/** The buyer's cart, kept in this browser only (nothing is sent until they place the order). Prices here are for display;
 *  the server re-reads every price when the order is placed. */
export type CartItem = {
  variantId: string;
  name: string;
  label: string;
  quantity: number;
  priceThb: number;
  postageThailandThb: number;
  postageOverseasThb: number;
};

const KEY = "lanna-merch-cart";

export function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage blocked: the cart then lasts only until the page changes.
  }
}

export function addToCart(item: CartItem) {
  const cart = readCart();
  const have = cart.find((c) => c.variantId === item.variantId);
  if (have) have.quantity = Math.min(20, have.quantity + item.quantity);
  else cart.push(item);
  writeCart(cart);
}
