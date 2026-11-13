import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";

/**
 * The public half of the merchandise shop (backlog #cjxq0, spec docs/merch-shop.md). Reads only the two
 * anon views public_merch_products / public_merch_variants; the order is written by checkout.ts.
 */

export type MerchProduct = {
  id: string;
  name: string;
  description: string | null;
  price_thb: number;
  postage_thailand_thb: number;
  postage_overseas_thb: number;
  photo_drive_file_id: string | null;
  sort_order: number;
  translations: PublicTranslations;
};

export type MerchVariant = {
  id: string;
  product_id: string;
  size: string | null;
  colour: string | null;
  sort_order: number;
  available: boolean;
};

export type MerchCatalogueItem = MerchProduct & { variants: MerchVariant[] };

/** Whether any product is shown: the menu, the footer and the sitemap list the merchandise shop only then. */
export async function hasPublicMerchProducts(supabase: SupabaseClient): Promise<boolean> {
  const { count, error } = await supabase.from("public_merch_products").select("id", { count: "exact", head: true });
  return !error && (count ?? 0) > 0;
}

export async function loadMerchCatalogue(supabase: SupabaseClient): Promise<MerchCatalogueItem[]> {
  const [p, v] = await Promise.all([
    supabase
      .from("public_merch_products")
      .select("id, name, description, price_thb, postage_thailand_thb, postage_overseas_thb, photo_drive_file_id, sort_order, translations")
      .order("sort_order")
      .order("name")
      .returns<MerchProduct[]>(),
    supabase
      .from("public_merch_variants")
      .select("id, product_id, size, colour, sort_order, available")
      .order("sort_order")
      .returns<MerchVariant[]>(),
  ]);
  // A failed read must not look like an empty shop (docs/decisions/2026-10-11-silent-empty-reads.md).
  if (p.error) throw new Error(`Merchandise: could not read the products: ${p.error.message}`);
  if (v.error) throw new Error(`Merchandise: could not read the variants: ${v.error.message}`);
  const byProduct = new Map<string, MerchVariant[]>();
  for (const variant of v.data ?? []) {
    byProduct.set(variant.product_id, [...(byProduct.get(variant.product_id) ?? []), variant]);
  }
  return (p.data ?? []).map((prod) => ({
    ...prod,
    price_thb: Number(prod.price_thb),
    postage_thailand_thb: Number(prod.postage_thailand_thb),
    postage_overseas_thb: Number(prod.postage_overseas_thb),
    variants: byProduct.get(prod.id) ?? [],
  }));
}

export function merchText(p: MerchProduct, locale: Locale) {
  return {
    name: localizedField(locale, p.name, p.translations, "name"),
    description: localizedField(locale, p.description, p.translations, "description"),
  };
}

export function variantLabel(v: { size: string | null; colour: string | null }): string {
  return [v.size, v.colour].filter(Boolean).join(" · ");
}

/**
 * Baht per one unit of each currency an overseas buyer may be quoted in, with the date it was set.
 * No paid rate service (zero ongoing cost): this is a dated figure edited here until a staff-edited rate screen
 * exists. The buyer is always shown the rate and its date, and staff match the money by order number before
 * marking the order paid.
 */
export const RATES_AS_OF = "2026-11-13";
export const RATES_THB_PER_UNIT: Record<string, number> = {
  USD: 35,
  EUR: 38,
  GBP: 44,
  AUD: 23,
  SGD: 26,
};

export type CartLine = { variantId: string; quantity: number };
export const MAX_QTY = 20;
