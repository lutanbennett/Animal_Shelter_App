import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { SitePageSlug } from "./pages";

/**
 * The text a page shows while its row has no body yet. /adopt/international
 * and /friends/join have one: each went live before the Director wrote hers,
 * so it carries a generic description instead of "coming soon"
 * (docs/decisions.md, 2026-09-27). The other pages keep "coming soon".
 * Here rather than in SitePageView so the editor's preview, a client
 * component, can use it too.
 */
export function sitePageStarter(t: Dictionary, slug: SitePageSlug) {
  if (slug === "international-adoption") return t.sitePages.internationalStarter;
  if (slug === "shelter-friends-join") return t.sitePages.friendsJoinStarter;
  if (slug === "about") return t.sitePages.aboutStarter;
  return null;
}
