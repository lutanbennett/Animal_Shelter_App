/**
 * Checks for links staff paste into forms that end up on a public page —
 * a Shelter Friend's website and Facebook page, and the shelter's own
 * Facebook / Instagram / Messenger / X links and WhatsApp number.
 *
 * Pure and dependency-free, so a form can show the error as the user
 * types and the server action applies the very same rule before saving.
 * The database's own check (0076: `~* '^https?://'`) is the last line —
 * it refuses a `javascript:` link however it arrives — and these are
 * stricter: https only, and the right host where there is one.
 */

export type LinkError = "notUrl" | "notHttps" | "wrongHost";

export type LinkCheck = { ok: true; url: string | null } | { ok: false; error: LinkError };

/**
 * Hosts a Facebook page link may be on. Subdomains count (www., m., web.,
 * business.), so whatever the phone's share button produced is accepted.
 */
export const FACEBOOK_HOSTS = ["facebook.com", "fb.com"] as const;

/**
 * Hosts an Instagram profile link may be on — instagram.com with any
 * subdomain (www., m.), and the instagr.am short form older share
 * sheets produced.
 */
export const INSTAGRAM_HOSTS = ["instagram.com", "instagr.am"] as const;

function onHost(hostname: string, hosts: readonly string[]) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * An optional `https://` link. Blank is fine (`url: null`); anything else
 * must parse as an https URL with a real host. A bare "www.shop.co.th" is
 * given its https:// rather than refused — that is how people copy a site
 * out of the address bar — but an explicit `http://` is refused rather
 * than silently upgraded, since the site may not serve https at all.
 */
export function checkHttpsUrl(
  value: string | null | undefined,
  hosts?: readonly string[],
): LinkCheck {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { ok: true, url: null };
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: "notUrl" };
  }
  if (parsed.protocol !== "https:") return { ok: false, error: "notHttps" };
  if (!parsed.hostname.includes(".")) return { ok: false, error: "notUrl" };
  if (hosts && !onHost(parsed.hostname, hosts)) return { ok: false, error: "wrongHost" };
  return { ok: true, url: parsed.toString() };
}

/** An optional link to a Facebook page: https, on facebook.com or fb.com. */
export function checkFacebookUrl(value: string | null | undefined): LinkCheck {
  return checkHttpsUrl(value, FACEBOOK_HOSTS);
}

/**
 * The message for a failed check, from the dictionary's `linkErrors`
 * (passed in so this file stays free of imports). `hosts` names the
 * allowed sites in a wrongHost message.
 */
export function linkErrorText(
  messages: { notUrl: string; notHttps: string; wrongHost: (hosts: string) => string },
  check: LinkCheck,
  hosts?: readonly string[],
): string | null {
  if (check.ok) return null;
  if (check.error === "wrongHost") return messages.wrongHost((hosts ?? []).join(" / "));
  return messages[check.error];
}

/** An optional link to an Instagram profile: https, on instagram.com or instagr.am. */
export function checkInstagramUrl(value: string | null | undefined): LinkCheck {
  return checkHttpsUrl(value, INSTAGRAM_HOSTS);
}

/**
 * Hosts a Messenger link may be on: m.me (what a page's "Send message"
 * share produces) and messenger.com's /t/<page> form.
 */
export const MESSENGER_HOSTS = ["m.me", "messenger.com"] as const;

/** An optional Facebook Messenger link: https, on m.me or messenger.com. */
export function checkMessengerUrl(value: string | null | undefined): LinkCheck {
  return checkHttpsUrl(value, MESSENGER_HOSTS);
}

/** Hosts an X profile may be on — the rename left both working. */
export const X_HOSTS = ["x.com", "twitter.com"] as const;

/** An optional link to an X (Twitter) profile: https, on x.com or twitter.com. */
export function checkXUrl(value: string | null | undefined): LinkCheck {
  return checkHttpsUrl(value, X_HOSTS);
}

export type WhatsAppCheck =
  | { ok: true; number: string | null }
  | { ok: false; error: "notInternational" };

/**
 * An optional WhatsApp number, stored as digits only (0092): what wa.me
 * accepts, so the link is always `https://wa.me/<number>`. People paste
 * "+66 81 234 5678" or "+66-81-234-5678", so the `+`, spaces, dashes,
 * dots and brackets are dropped first. What is left must be 7–15 digits
 * (E.164's maximum) and not start with 0 — no country code does, so a
 * leading 0 is a local number ("081 …") that wa.me cannot open.
 */
export function checkWhatsAppNumber(value: string | null | undefined): WhatsAppCheck {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { ok: true, number: null };
  const digits = trimmed.replace(/[\s+\-.()]/g, "");
  if (!/^[1-9][0-9]{6,14}$/.test(digits)) return { ok: false, error: "notInternational" };
  return { ok: true, number: digits };
}
