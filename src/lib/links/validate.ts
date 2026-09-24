/**
 * Checks for links staff paste into forms that end up on a public page —
 * a Shelter Friend's website and Facebook page today, the shelter's own
 * Facebook / Instagram links in the footer next (the "Link to the LCA
 * Facebook page" backlog item reuses these rather than writing its own).
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
