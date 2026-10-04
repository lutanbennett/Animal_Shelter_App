/**
 * Which kind of screen is asking: the rule behind "Admin's home follows the device"
 * (docs/decisions/2026-10-04-home-screens.md). Pure, so a check can run it.
 *
 * It is the browser's own statement of what it is, read on the server where the landing is
 * decided, not a measured width: a width is only known after the page has painted, and
 * landing on one screen and jumping to another is the flicker this avoids.
 *
 *   1. `Sec-CH-UA-Mobile` (Chromium sends it by default): `?1` is a phone, `?0` is not.
 *      It wins over the user-agent, so a phone told to "request desktop site" is a desk,
 *      which is what it was asked to be.
 *   2. Otherwise the user-agent: "Mobi" (every phone browser, Android Chrome only on phones),
 *      "iPhone" or "iPod" is a phone.
 *   3. Anything else is a desk. That includes both kinds of tablet: an iPad announces itself
 *      as a Mac and an Android tablet drops "Mobile", so no browser says "tablet" and the
 *      rule does not pretend to. A tablet is big enough for Settings; the switch is one tap.
 *
 * Nothing is remembered: it is asked again at every landing.
 */
export type Device = "phone" | "desk";

const PHONE_UA = /Mobi|iPhone|iPod/i;

export function deviceFrom(userAgent: string | null | undefined, chMobile?: string | null): Device {
  const hint = chMobile?.trim();
  if (hint === "?1") return "phone";
  if (hint === "?0") return "desk";
  return PHONE_UA.test(userAgent ?? "") ? "phone" : "desk";
}
