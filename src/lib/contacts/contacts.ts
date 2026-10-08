/**
 * The contacts vocabulary and the one-tap links the contact list and hub
 * build from a row. Pure and dependency-free so client components can use
 * the link builders directly.
 */

/**
 * contacts.type — the `contact_type` enum (0001, trimmed to these three
 * in 0067), in the order the type picker and filter chips offer it. Stored
 * in English; labels come from `enums.contactType` in the dictionaries.
 * Only Carer contacts can be given a resident
 * (placement_history_check_carer_type), which is why the residents hub's
 * carer picker filters on it — see carers.ts.
 */
export const CONTACT_TYPES = ["Carer", "Volunteer", "Vendor"] as const;
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
  notes: string | null;
  /** Set = archived (0075): kept with its history, out of default lists and pickers. */
  archived_at: string | null;
  /** Optional reason given when archiving; null whenever archived_at is. */
  archive_reason: string | null;
};

/**
 * What a volunteer reads of a contact (0126, backlog DB-5): id, name and
 * phone, from the volunteer_contacts view. Everything else is null, and so is
 * the type — a page that shows the type or the archive state shows nothing
 * for these rather than a guess.
 */
export type VolunteerContact = Omit<Contact, "type"> & { type: null };

export function toVolunteerContact(row: {
  id: string;
  name: string;
  phone: string | null;
}): VolunteerContact {
  return {
    ...row,
    type: null,
    email: null,
    line_id: null,
    messenger_id: null,
    whatsapp: null,
    address: null,
    notes: null,
    archived_at: null,
    archive_reason: null,
  };
}

export const CONTACT_COLUMNS =
  "id, name, type, phone, email, line_id, messenger_id, whatsapp, address, notes, archived_at, archive_reason";

/**
 * Archived contacts stay in the table — a carer's placements, a supplier's
 * notes — but drop out of the default lists and every picker. The lists
 * offer them back behind a Show archived toggle, and a search still finds
 * them (with the badge) rather than reporting no match.
 */
export function isArchived(contact: { archived_at: string | null }) {
  return contact.archived_at !== null;
}

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
 * Hosts whose links are redirects to the real maps URL: what the Maps
 * app's Share button produces (`maps.app.goo.gl`), and the older forms.
 * Only following one shows whether it still leads anywhere — see
 * map-preview.ts.
 */
export const MAP_SHORT_LINK_HOSTS: readonly string[] = ["maps.app.goo.gl", "goo.gl", "g.co"];

/**
 * An address field split into the maps link it starts with, if any, and
 * the text around it. Staff paste a shared link and often type a note or
 * the written address after it; only the first word is the link, and
 * opening the whole field is a broken URL (Google answers 400).
 */
export function splitAddress(address: string | null | undefined): {
  link: URL | null;
  text: string;
} {
  const trimmed = address?.trim() ?? "";
  if (!/^https?:\/\//i.test(trimmed)) return { link: null, text: trimmed };
  const [first, ...rest] = trimmed.split(/\s+/);
  let link: URL | null = null;
  try {
    link = new URL(first);
  } catch {
    // not a URL after all — only the text is left
  }
  return { link, text: rest.join(" ") };
}

/** A Google Maps search for `query` — opens the Maps app on a phone. */
export function mapSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * What tapping the map opens and the thumbnail it shows, built from the
 * same place so the two never disagree. A link that says where it points
 * opens as pasted; anything else falls back to the text as a search.
 */
export type AddressMap = { href: string; src: string };

function textMap(text: string): AddressMap | null {
  const query = text.trim();
  return query ? { href: mapSearchHref(query), src: mapEmbedSrc(query)! } : null;
}

/**
 * The address's map without leaving the page: a full Google Maps link
 * (or a short link already followed, `resolvedQuery`) opens as pasted;
 * a short link not yet followed, a link to anything other than a map,
 * or a link Google no longer recognises falls back to the text after it,
 * and with no text there is no map — never a link that 404s.
 * map-preview.ts's `addressMap` is the server-side version that follows
 * short links first.
 */
export function addressMapNow(
  address: string | null | undefined,
  resolvedQuery?: string | null,
): AddressMap | null {
  const { link, text } = splitAddress(address);
  if (!link) return textMap(text);
  const query = resolvedQuery ?? mapQueryFromUrl(link.toString());
  if (query) return { href: link.toString(), src: mapEmbedSrc(query)! };
  return textMap(text);
}

/**
 * Opens the address in Google Maps — the Maps app on a phone, the site on
 * desktop — for pages that can't follow a short link (the contact list,
 * client previews). A pasted maps link opens on its own, without the text
 * after it; a short link is trusted unfollowed here, so the contact hub,
 * which does follow it, passes its own `AddressMap.href` instead. Plain
 * text goes in as a search, which handles Thai village addresses,
 * landmarks and plus codes alike.
 */
export function mapHref(address: string | null | undefined): string | null {
  const { link } = splitAddress(address);
  if (link && MAP_SHORT_LINK_HOSTS.includes(link.hostname)) return link.toString();
  return addressMapNow(address)?.href ?? null;
}

/**
 * The keyless Google Maps embed the contact hub shows under the address:
 * the same search `mapHref` opens, framed. Takes the *query* — plain
 * address text or "lat,lng" — not a URL; see `mapQueryFromUrl` and
 * map-preview.ts for turning a pasted maps link into one.
 */
export function mapEmbedSrc(query: string | null | undefined): string | null {
  const trimmed = query?.trim();
  if (!trimmed) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
}

/**
 * What a full Google Maps URL is pointing at, as a search query — the
 * shapes a shared link resolves to: `maps.google.com/?q=18.84,99.07`,
 * `/maps/place/<address>/…`, `/maps/search/<text>`, `…/@lat,lng,17z`
 * or a `!3dlat!4dlng` pin in the data blob. Null when the URL carries
 * none of those (a bare short link, an unrelated site).
 */
export function mapQueryFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)google\.[a-z.]+$/i.test(parsed.hostname)) return null;
  // google.com itself, or a web search, is not a map.
  if (!/^maps\./i.test(parsed.hostname) && !parsed.pathname.startsWith("/maps")) return null;
  const q = parsed.searchParams.get("q");
  if (q?.trim()) return q.trim();
  const pin = parsed.pathname.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) return `${pin[1]},${pin[2]}`;
  const place = parsed.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/);
  if (place) {
    const text = decodeURIComponent(place[1].replace(/\+/g, " ")).trim();
    if (text) return text;
  }
  const at = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return `${at[1]},${at[2]}`;
  return null;
}
