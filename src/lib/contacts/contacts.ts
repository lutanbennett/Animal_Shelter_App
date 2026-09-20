/**
 * The contacts vocabulary and the one-tap links the contact list and hub
 * build from a row. Pure and dependency-free so client components can use
 * the link builders directly.
 */

/**
 * contacts.type — the `contact_type` enum (0001), in the order the type
 * picker and filter chips offer it. Stored in English; labels come from
 * `enums.contactType` in the dictionaries. Only Carer contacts can be
 * given a resident (placement_history_check_carer_type), which is why the
 * residents hub's carer picker filters on it — see carers.ts.
 */
export const CONTACT_TYPES = ["Carer", "Volunteer", "Vendor", "Donor", "Other"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CARER_CONTACT_TYPE: ContactType = "Carer";

export function isContactType(value: unknown): value is ContactType {
  return typeof value === "string" && (CONTACT_TYPES as readonly string[]).includes(value);
}

/** A contacts row as every contact page selects it. */
export type Contact = {
  id: string;
  name: string;
  type: ContactType;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  messenger_id: string | null;
  whatsapp: string | null;
  address: string | null;
};

export const CONTACT_COLUMNS =
  "id, name, type, phone, email, line_id, messenger_id, whatsapp, address";

/**
 * `tel:` link for a stored phone number. Staff type numbers the way they
 * read them ("081-234 5678", "+66 81 234 5678"); the dialler wants digits
 * and an optional leading "+", so everything else is stripped. Null when
 * nothing dialable is left.
 */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

/**
 * Opens a LINE chat with the contact. `line_id` is the ID the person
 * shares for adding friends, which LINE resolves through its `ti/p/~`
 * links (the pattern docs/decisions.md assumed; a full `line.me` URL
 * pasted in as the ID is used as-is). On a phone this hands off to the
 * LINE app; on desktop it opens the LINE web page for the ID.
 */
export function lineHref(lineId: string | null | undefined): string | null {
  if (!lineId) return null;
  const trimmed = lineId.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://line.me/ti/p/~${encodeURIComponent(trimmed.replace(/^@/, ""))}`;
}

/**
 * Opens a Facebook Messenger chat. `messenger_id` is the Facebook
 * username — what follows `facebook.com/` or `m.me/` on the person's
 * profile — and `m.me/<username>` hands off to the Messenger app on a
 * phone. A pasted profile or m.me link is used as-is.
 */
export function messengerHref(messengerId: string | null | undefined): string | null {
  if (!messengerId) return null;
  const trimmed = messengerId.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://m.me/${encodeURIComponent(trimmed.replace(/^@/, ""))}`;
}

/**
 * Opens a WhatsApp chat. `wa.me` wants the number in international form
 * with no "+", spaces or leading zeros. A number written with a country
 * code ("+66 81 234 5678") is used as given; one written the local Thai
 * way ("081 234 5678") is assumed to be Thai and gets 66 in place of the
 * trunk 0 — the shelter is in Chiang Mai and that's how staff write
 * numbers. Anything else goes through as its digits.
 */
export function whatsappHref(number: string | null | undefined): string | null {
  if (!number) return null;
  const trimmed = number.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  const international = trimmed.startsWith("+")
    ? digits
    : digits.startsWith("0")
      ? `66${digits.slice(1)}`
      : digits;
  return `https://wa.me/${international}`;
}

export function mailtoHref(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  return trimmed ? `mailto:${trimmed}` : null;
}

/**
 * Opens the address in Google Maps — the Maps app on a phone, the site on
 * desktop. A pasted maps link (a shared pin, `maps.app.goo.gl/…`) is used
 * as-is; anything else goes in as a search query, which handles Thai
 * village addresses, landmarks and plus codes alike.
 */
export function mapHref(address: string | null | undefined): string | null {
  if (!address) return null;
  const trimmed = address.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}
