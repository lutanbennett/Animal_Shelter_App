import { checkHttpsUrl, type LinkError } from "./validate";

/**
 * Links on /donate (0191 donation_channels). A donor sent to a look-alike
 * address loses real money under the shelter's name, so PayPal, DonorBox and
 * Wise links must be on that company's own domain. The rule is the one the
 * database enforces (`donation_channels_url_own_domain`): only subdomain labels
 * may sit between `https://` and the company's domain, which must then be
 * followed by `/`, `?`, `#` or the end. A suffix test on the host would pass
 * `paypal.com.evil.test`'s cousins; this does not. Anything doubtful is refused:
 * a refused good link is a support question, an accepted bad one is a theft.
 */

export const DONATION_WAYS = [
  "paypal",
  "donorbox",
  "wise",
  "bank_transfer",
  "promptpay",
  "other",
] as const;
export type DonationWay = (typeof DONATION_WAYS)[number];

export function isDonationWay(value: string): value is DonationWay {
  return (DONATION_WAYS as readonly string[]).includes(value);
}

/** Ways whose link is the whole point: they need one, and it must be the company's own. */
export const LINKED_WAYS = ["paypal", "donorbox", "wise"] as const;

/** Same patterns as the migration, case-insensitive. */
const OWN_DOMAIN: Partial<Record<DonationWay, RegExp>> = {
  paypal: /^https:\/\/([a-z0-9-]+\.)*(paypal\.com|paypal\.me)([/?#]|$)/i,
  donorbox: /^https:\/\/([a-z0-9-]+\.)*donorbox\.org([/?#]|$)/i,
  wise: /^https:\/\/([a-z0-9-]+\.)*wise\.com([/?#]|$)/i,
};

/** The domains named in a wrongHost message. */
export const DONATION_DOMAINS: Partial<Record<DonationWay, string>> = {
  paypal: "paypal.com / paypal.me",
  donorbox: "donorbox.org",
  wise: "wise.com",
};

export type DonationLinkCheck =
  | { ok: true; url: string | null }
  | { ok: false; error: LinkError };

export function checkDonationUrl(
  way: DonationWay,
  value: string | null | undefined,
): DonationLinkCheck {
  const checked = checkHttpsUrl(value);
  if (!checked.ok) return checked;
  const pattern = OWN_DOMAIN[way];
  // Checked on the address as it will be stored and opened, not as typed.
  if (pattern && checked.url !== null && !pattern.test(checked.url)) {
    return { ok: false, error: "wrongHost" };
  }
  return checked;
}
