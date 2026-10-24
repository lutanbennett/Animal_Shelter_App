import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * The public site's pages, listed once. The header menu, the phone menu, the
 * footer, the home page's links and the sitemap all read this list, so a page
 * is added, renamed or (later) hidden in one place. See
 * docs/decisions/2026-10-24-public-pages-list.md for the vocabulary.
 *
 * Not on the list: /r/ and /e/ (card and QR scans), and the pages under a
 * page (/adopt/<id>, /our-work/<id>, /appeals/<id>), which the sitemap adds
 * from the database.
 */

/** A page's key. Also what the header marks as the page the visitor is on. */
export type PublicSection =
  | "home"
  | "adopt"
  | "our-work"
  | "foster"
  | "volunteer"
  | "donate"
  | "friends"
  | "friends-join"
  | "adopt-international"
  | "appeals"
  | "desexing"
  | "about"
  | "privacy";

/** A header menu group: the heading a page sits under, or none for a top-level link. */
export type PublicMenuGroup = "adopt" | "get-involved" | "services";

type ChangeFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type PublicPage = {
  key: PublicSection;
  href: string;
  /** The page's name, as the footer and the Donate button use it. */
  label: (t: Dictionary) => string;
  /** Home and Privacy: recorded now, acted on by the Admin → Website switches. */
  neverHidden?: boolean;
  /** In the header and phone menu. `group` omitted = a top-level link. */
  menu?: {
    group?: PublicMenuGroup;
    /** Overrides `label` (Adopt's entry reads "Meet the residents"). */
    label?: (t: Dictionary) => string;
    /** The nav key when it differs from the page key (Donate's entry is "care"). */
    navKey?: string;
  };
  /** In the footer: `help` is the Help column, `foot` the small links at the bottom. */
  footer?: { column: "help" | "foot"; order: number };
  /** Omitted = not in the sitemap (About is not, today). `order` is the sitemap's own order. */
  sitemap?: { order: number; changeFrequency: ChangeFrequency; priority: number };
};

/** Group headings, in menu order. */
export const PUBLIC_MENU_GROUPS: { key: PublicMenuGroup; label: (t: Dictionary) => string }[] = [
  { key: "adopt", label: (t) => t.adopt.adoptNav },
  { key: "get-involved", label: (t) => t.publicNav.getInvolved },
  { key: "services", label: (t) => t.publicNav.services },
];

/**
 * Menu order is list order within a group; footer order is `footer.order`;
 * sitemap order is `sitemap.order`.
 */
export const PUBLIC_PAGES: PublicPage[] = [
  {
    key: "home",
    href: "/",
    label: (t) => t.publicNav.home,
    neverHidden: true,
    footer: { column: "help", order: 1 },
    sitemap: { order: 1, changeFrequency: "weekly", priority: 1 },
  },
  {
    key: "adopt",
    href: "/adopt",
    label: (t) => t.adopt.adoptNav,
    menu: { group: "adopt", label: (t) => t.publicNav.meetResidents },
    footer: { column: "help", order: 2 },
    sitemap: { order: 2, changeFrequency: "daily", priority: 0.9 },
  },
  {
    key: "adopt-international",
    href: "/adopt/international",
    label: (t) => t.adopt.internationalNav,
    menu: { group: "adopt" },
    footer: { column: "help", order: 3 },
    sitemap: { order: 9, changeFrequency: "monthly", priority: 0.5 },
  },
  {
    key: "foster",
    href: "/foster",
    label: (t) => t.adopt.fosterNav,
    menu: { group: "get-involved" },
    footer: { column: "help", order: 4 },
    sitemap: { order: 7, changeFrequency: "monthly", priority: 0.6 },
  },
  {
    key: "volunteer",
    href: "/volunteer",
    label: (t) => t.adopt.volunteerNav,
    menu: { group: "get-involved" },
    footer: { column: "help", order: 5 },
    sitemap: { order: 8, changeFrequency: "monthly", priority: 0.6 },
  },
  {
    key: "donate",
    href: "/donate",
    label: (t) => t.adopt.donateNav,
    menu: { group: "get-involved", label: (t) => t.publicNav.care, navKey: "care" },
    footer: { column: "help", order: 8 },
    sitemap: { order: 6, changeFrequency: "monthly", priority: 0.8 },
  },
  {
    key: "appeals",
    href: "/appeals",
    label: (t) => t.appeals.navLabel,
    menu: { group: "get-involved" },
    footer: { column: "help", order: 9 },
    sitemap: { order: 3, changeFrequency: "daily", priority: 0.8 },
  },
  {
    key: "friends",
    href: "/friends",
    label: (t) => t.shelterFriends.navLabel,
    menu: { group: "get-involved" },
    footer: { column: "help", order: 6 },
    sitemap: { order: 10, changeFrequency: "monthly", priority: 0.5 },
  },
  {
    key: "friends-join",
    href: "/friends/join",
    label: (t) => t.publicNav.becomeFriend,
    menu: { group: "get-involved" },
    footer: { column: "help", order: 7 },
    sitemap: { order: 11, changeFrequency: "yearly", priority: 0.3 },
  },
  {
    key: "desexing",
    href: "/services/desexing",
    label: (t) => t.desexing.navLabel,
    menu: { group: "services" },
    footer: { column: "help", order: 10 },
    sitemap: { order: 4, changeFrequency: "weekly", priority: 0.6 },
  },
  {
    key: "our-work",
    href: "/our-work",
    label: (t) => t.adopt.ourWorkNav,
    menu: {},
    sitemap: { order: 5, changeFrequency: "weekly", priority: 0.8 },
  },
  {
    key: "about",
    href: "/about",
    label: (t) => t.publicNav.about,
    menu: {},
  },
  {
    key: "privacy",
    href: "/privacy",
    label: (t) => t.privacy.nav,
    neverHidden: true,
    footer: { column: "foot", order: 1 },
    sitemap: { order: 12, changeFrequency: "yearly", priority: 0.1 },
  },
];

/** The pages the sitemap lists, in its order. */
export function sitemapPages(): (PublicPage & { sitemap: NonNullable<PublicPage["sitemap"]> })[] {
  return PUBLIC_PAGES.filter((p): p is PublicPage & { sitemap: NonNullable<PublicPage["sitemap"]> } => !!p.sitemap).sort(
    (a, b) => a.sitemap.order - b.sitemap.order,
  );
}

/** A page's address, for the places that link to it by their own words (the home page). */
export function pageHref(key: PublicSection): string {
  const page = PUBLIC_PAGES.find((p) => p.key === key);
  if (!page) throw new Error(`Unknown public page: ${key}`);
  return page.href;
}

/** The footer's pages for one column, in footer order. */
export function footerPages(column: "help" | "foot"): PublicPage[] {
  return PUBLIC_PAGES.filter((p) => p.footer?.column === column).sort(
    (a, b) => a.footer!.order - b.footer!.order,
  );
}
