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
  address: string | null;
};

export const CONTACT_COLUMNS = "id, name, type, phone, email, line_id, address";

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
