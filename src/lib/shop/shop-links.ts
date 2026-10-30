import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";

/**
 * Shop for the shelter (0285): shops and Shelter Friends the shelter earns a little from when
 * a supporter buys through their link. /shop reads public_shop_links, which leaves out hidden
 * entries in the database; Settings → Shop for the shelter reads the table itself.
 *
 * A Friend's entry holds only its own link, note and price hint. Its name and logo are read from
 * public_shelter_friends by the view and never copied (docs/decisions/2026-10-30-affiliate-links-schema.md).
 */

/** A row of public_shop_links. */
export type PublicShopLink = {
  id: string;
  friend_id: string | null;
  name: string;
  logo_drive_file_id: string | null;
  photo_drive_file_id: string | null;
  link_url: string;
  note: string | null;
  price_hint: string | null;
  sort_order: number;
  translations: PublicTranslations;
};

export const PUBLIC_SHOP_COLUMNS =
  "id, friend_id, name, logo_drive_file_id, photo_drive_file_id, link_url, note, price_hint, sort_order, translations";

/** A row of the table, as the management screen sees it. A Friend's name and logo are joined in, never stored. */
export type ShopLinkRow = {
  id: string;
  friend_id: string | null;
  title: string | null;
  link_url: string;
  note: string | null;
  price_hint: string | null;
  photo_drive_file_id: string | null;
  sort_order: number;
  shown: boolean;
  /** The Friend's public name and logo, for a Friend entry. */
  friend: { name: string; logo_drive_file_id: string | null } | null;
};

/** A Shelter Friend that could be added to the page. */
export type FriendChoice = { id: string; name: string };

export async function loadPublicShopLinks(supabase: SupabaseClient): Promise<PublicShopLink[]> {
  const { data, error } = await supabase
    .from("public_shop_links")
    .select(PUBLIC_SHOP_COLUMNS)
    .order("sort_order")
    .order("id")
    .returns<PublicShopLink[]>();
  // A failed read must not look like "nothing to buy" (docs/decisions/2026-10-11-silent-empty-reads.md).
  if (error) throw new Error(`Shop: could not read the shop links: ${error.message}`);
  return data ?? [];
}

/** Whether there is anything to show; the header and /donate link to /shop only then. A failed read counts as none. */
export async function hasPublicShopLinks(supabase: SupabaseClient): Promise<boolean> {
  const { count, error } = await supabase
    .from("public_shop_links")
    .select("id", { count: "exact", head: true });
  return !error && (count ?? 0) > 0;
}

/** Note and price hint in the reader's language, falling back to what was typed. */
export function shopText(link: PublicShopLink, locale: Locale) {
  return {
    note: localizedField(locale, link.note, link.translations, "note"),
    priceHint: localizedField(locale, link.price_hint, link.translations, "price_hint"),
    // A shop's own title is translated; a Friend's name is theirs and is shown as it is.
    name: link.friend_id ? link.name : localizedField(locale, link.name, link.translations, "title"),
  };
}
