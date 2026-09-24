import type { ContactType } from "@/lib/contacts/contacts";
import type { Locale } from "@/lib/i18n/locales";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";

/**
 * Shelter Friends (0076): the businesses that help the shelter, thanked on
 * the public /friends page. A Friend is a contact with a public profile —
 * one shelter_friends row per contact — not a second address book.
 *
 * Pure and dependency-free so the contact hub's client card can use it.
 * The public loader is in ./public.ts.
 */

/**
 * Which contact types may be made a Shelter Friend. The profile is keyed
 * on contact_id, not the type, so the schema takes any contact; the app
 * offers it on Vendors only for now (decided 2026-09-24: any business,
 * including one that only donates, is entered as a Vendor). **This is the
 * one gate** — the contact hub, the server action and the manual all go
 * through it, so a `Business` or `Supporter` type added later is a
 * one-line change here.
 */
export const FRIEND_CONTACT_TYPES: readonly ContactType[] = ["Vendor"];

export function canBecomeFriend(contact: { type: ContactType }): boolean {
  return FRIEND_CONTACT_TYPES.includes(contact.type);
}

/**
 * The contact details a Friend can opt into showing, in the order the
 * card offers them. Every box defaults off (0076); publishing a Friend
 * publishes its name, prose and links, never a detail nobody ticked.
 */
export const FRIEND_OPT_INS = [
  "show_phone",
  "show_email",
  "show_line",
  "show_address",
  "show_map",
] as const;
export type FriendOptIn = (typeof FRIEND_OPT_INS)[number];

/** A shelter_friends row as the staff side reads it (RLS: every signed-in role). */
export type ShelterFriend = {
  id: string;
  contact_id: string;
  blurb: string | null;
  help_kind: string | null;
  discount_note: string | null;
  website_url: string | null;
  facebook_url: string | null;
  logo_drive_file_id: string | null;
  friend_since: string | null;
  sort_order: number;
  published: boolean;
  updated_at: string;
} & Record<FriendOptIn, boolean>;

export const SHELTER_FRIEND_COLUMNS =
  "id, contact_id, blurb, help_kind, discount_note, website_url, facebook_url, logo_drive_file_id, friend_since, sort_order, published, updated_at, show_phone, show_email, show_line, show_address, show_map";

/**
 * One row of public_shelter_friends — the whole of what a visitor can
 * learn about a Friend. Each contact detail is already null unless its
 * box was ticked, and the row is absent unless the profile is published
 * and the contact isn't archived; the view does that, not the page.
 * `map_location` is the address again, gated by show_map instead.
 */
export type PublicFriend = {
  id: string;
  name: string;
  blurb: string | null;
  help_kind: string | null;
  discount_note: string | null;
  website_url: string | null;
  facebook_url: string | null;
  logo_drive_file_id: string | null;
  friend_since: string | null;
  sort_order: number;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  address: string | null;
  map_location: string | null;
  translations: PublicTranslations;
};

export const PUBLIC_FRIEND_COLUMNS =
  "id, name, blurb, help_kind, discount_note, website_url, facebook_url, logo_drive_file_id, friend_since, sort_order, phone, email, line_id, address, map_location, translations";

/**
 * The staff preview: what public_shelter_friends would return for this
 * profile if it were published, built from the rows a signed-in manager
 * can read. It mirrors the view's CASE columns one for one — the view is
 * what enforces the opt-ins on the real page; this only lets the contact
 * hub show the card before anything is live. Translations are left empty:
 * the preview is in the language the profile was written in.
 */
export function previewPublicFriend(
  friend: Pick<
    ShelterFriend,
    | "id"
    | "blurb"
    | "help_kind"
    | "discount_note"
    | "website_url"
    | "facebook_url"
    | "logo_drive_file_id"
    | "friend_since"
    | "sort_order"
    | FriendOptIn
  >,
  contact: {
    name: string;
    phone: string | null;
    email: string | null;
    line_id: string | null;
    address: string | null;
  },
): PublicFriend {
  return {
    id: friend.id,
    name: contact.name,
    blurb: friend.blurb,
    help_kind: friend.help_kind,
    discount_note: friend.discount_note,
    website_url: friend.website_url,
    facebook_url: friend.facebook_url,
    logo_drive_file_id: friend.logo_drive_file_id,
    friend_since: friend.friend_since,
    sort_order: friend.sort_order,
    phone: friend.show_phone ? contact.phone : null,
    email: friend.show_email ? contact.email : null,
    line_id: friend.show_line ? contact.line_id : null,
    address: friend.show_address ? contact.address : null,
    map_location: friend.show_map ? contact.address : null,
    translations: {},
  };
}

/** A Friend's prose in the visitor's language — never hidden for lacking a translation. */
export function publicFriendText(friend: PublicFriend, locale: Locale) {
  return {
    blurb: localizedField(locale, friend.blurb, friend.translations, "blurb"),
    helpKind: localizedField(locale, friend.help_kind, friend.translations, "help_kind"),
    discountNote: localizedField(locale, friend.discount_note, friend.translations, "discount_note"),
  };
}

/** The anchor a Friend's card has on /friends, so the home strip can link to it. */
export function friendAnchor(id: string) {
  return `friend-${id}`;
}
