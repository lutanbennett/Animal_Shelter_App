import Image from "next/image";
import Link from "next/link";
import { loadSessionRole } from "@/lib/auth/app-access";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { getT } from "@/lib/i18n/get-t";
import { staffLoginHref } from "@/lib/site-hosts";
import { getSiteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { hasPublicShopLinks } from "@/lib/shop/shop-links";
import { hasLiveAppeals } from "@/lib/appeals/public";
import { preferredChannels, talkChannels } from "@/lib/site/channels";
import { loadSiteContent, socialLinks, visitingHoursLines } from "@/lib/site/content";
import {
  hiddenPagesOf,
  isPageHidden,
  PUBLIC_MENU_GROUPS,
  PUBLIC_PAGES,
  type PublicPage,
  type PublicSection,
} from "@/lib/public-pages";
import { canSeeHiddenPages } from "@/lib/public-page-access";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { SignOutButton } from "../login/SignOutButton";
import {
  PublicMobileMenu,
  PublicNavGroup,
  type PublicFollowLink,
  type PublicNavEntry,
  type PublicNavLink,
  type PublicTalkLink,
} from "./PublicNav";
import { NavTrail } from "./BackLink";
import { SpringMotion } from "./SpringMotion";

export type { PublicSection };

/**
 * One step of the trail under the header. No `href` on the last (the page the
 * visitor is on) or on a step that is only a heading, like Get involved.
 */
export type PublicCrumb = { label: string; href?: string };

/**
 * Header for the public pages (docs/design/, part 1 of the redesign). Four
 * entries — Adopt ▾ · Get involved ▾ · Our work · About & contact (and
 * Services ▾, which holds desexing drives) — then the language toggle and
 * Donate, the one thing every page of a shelter site asks for. Below a laptop's width the entries move into a full-screen
 * menu (PublicNav.tsx) and only Donate stays beside the menu button.
 *
 * It also carries data-public-site, which is what switches the page to the
 * public site's light theme (globals.css, "Public site").
 *
 * `current` marks the section the visitor is in, so its link reads as
 * where they are rather than a way out.
 *
 * `trail` is the breadcrumb under the bar, without Home, which is always the
 * first step: [{ label: "Adopt", href: "/adopt" }, { label: "Panda" }]. It is
 * shown from a tablet up; on a phone the menu's Home entry and a detail
 * page's back link do that job. Pages with no trail (the home page) show none.
 */
export async function PublicHeader({
  current,
  trail,
}: {
  current?: PublicSection;
  trail?: PublicCrumb[];
}) {
  const [{ t, locale }, supabase, origin] = await Promise.all([
    getT(),
    createClient(),
    trail ? getSiteOrigin() : null,
  ]);
  const [
    {
      data: { user },
    },
    showFriends,
    showShop,
    liveAppeals,
    site,
  ] = await Promise.all([
    supabase.auth.getUser(),
    hasPublicFriends(),
    hasPublicShopLinks(supabase),
    hasLiveAppeals(),
    loadSiteContent(supabase),
  ]);
  // Staff get "Open the app". A public viewer (src/lib/auth/app-access.ts)
  // is a visitor here with nothing to open — only a way to sign out. A
  // Signed-in states: with the addresses split (docs/decisions/2026-10-21-domain-split-followups.md)
  // a public-address visitor has no session, so `staff`/`user` can only be true while one
  // address serves everything. Kept, not removed: that is today's state everywhere.
  // visitor who isn't signed in sees neither here: Staff login is in the footer and, on a phone, the menu.
  const staff = user ? (await loadSessionRole(supabase))?.entersApp === true : false;
  const n = t.publicNav;
  // Hidden pages (Admin → Website) leave the menu, the Donate button included. A website editor
  // who is looking at a hidden page is told so, because only they can get here.
  const hidden = hiddenPagesOf(site?.hidden_public_pages);
  const showHiddenBanner = !!current && isPageHidden(current, hidden) && (await canSeeHiddenPages());

  // The menu comes from the one list of pages (src/lib/public-pages.ts): groups in
  // their order, a top-level link where it stands among them. Two pages carry a
  // rule the list cannot: Appeals is always listed (with none live it follows
  // Donate, and /appeals says nothing is open), Shelter Friends only once there is
  // someone to thank (or while the visitor is on /friends, so the page stays
  // marked), and Donate's entry ("care") is there only while no appeal is live
  // — with one, the Appeals entry is the sponsorship page.
  const pageLink = (page: PublicPage, navKey?: string): PublicNavLink => ({
    key: navKey ?? page.key,
    href: page.href,
    label: (page.menu?.label ?? page.label)(t),
    current: page.key === current,
  });
  const showAppeals = liveAppeals || current === "appeals";
  const menuPages = PUBLIC_PAGES.filter((p) => {
    if (!p.menu || isPageHidden(p.key, hidden)) return false;
    if (p.key === "donate") return !showAppeals;
    if (p.key === "friends") return showFriends || current === "friends";
    return true;
  });
  const allEntries: PublicNavEntry[] = [];
  for (const page of menuPages) {
    const group = page.menu?.group;
    if (!group) {
      allEntries.push({ kind: "link", link: pageLink(page) });
      continue;
    }
    let entry = allEntries.find((e) => e.kind === "group" && e.key === group);
    if (!entry) {
      const heading = PUBLIC_MENU_GROUPS.find((g) => g.key === group)!;
      entry = { kind: "group", key: group, label: heading.label(t), links: [] };
      allEntries.push(entry);
    }
    if (entry.kind === "group") {
      // "care" is never the current page: Donate is, through the button beside the menu.
      entry.links.push(
        page.key === "donate" ? { ...pageLink(page, page.menu?.navKey), current: false } : pageLink(page),
      );
    }
  }
  // Shop for the shelter (0285) is not on the page list (the database's hide switch has no key for it),
  // so it joins Get involved here, once it has an entry to show and only while that section is showing.
  if (showShop) {
    const group = allEntries.find((e) => e.kind === "group" && e.key === "get-involved");
    if (group?.kind === "group") {
      group.links.push({ key: "shop", href: "/shop", label: t.shop.navLabel, current: false });
    }
  }
  // A group with nothing in it is left out rather than shown as an empty menu.
  const entries = allEntries.filter((entry) => entry.kind === "link" || entry.links.length > 0);
  const donatePage = PUBLIC_PAGES.find((p) => p.key === "donate")!;
  const donate: PublicNavLink | null = isPageHidden("donate", hidden)
    ? null
    : { ...pageLink(donatePage, "donate"), label: donatePage.label(t) };
  const home: PublicNavLink = pageLink(PUBLIC_PAGES.find((p) => p.key === "home")!);

  const account = user ? (
    staff ? (
      <Link
        href={DEFAULT_SIGNED_IN_PATH}
        className="flex min-h-11 items-center whitespace-nowrap text-[15px] font-semibold text-site-ink-muted underline-offset-4 hover:text-site-ink hover:underline"
      >
        {t.adopt.openApp}
      </Link>
    ) : (
      <SignOutButton className="flex min-h-11 items-center whitespace-nowrap text-[15px] font-semibold text-site-ink-muted underline-offset-4 hover:text-site-ink hover:underline" />
    )
  ) : null;
  // In the phone menu a signed-out visitor gets a quiet Staff login too: the
  // footer link is ~6.7 screens down on a phone (dry run F-16). Same slot and
  // weight as Open the app — below the language toggle, never beside Adopt
  // or Donate. Laptops keep the footer link, which is a short scroll there.
  const mobileAccount =
    account ?? (
      <a
        href={staffLoginHref()}
        className="flex min-h-11 items-center whitespace-nowrap text-[15px] font-semibold text-site-ink-muted underline-offset-4 hover:text-site-ink hover:underline"
      >
        {t.publicFooter.staffLogin}
      </a>
    );

  const hours = visitingHoursLines(locale, site);
  const social = socialLinks(site);
  const f = t.publicFooter;
  // The phone menu's "Talk to us" buttons, in the shelter's order (LINE
  // first unless they chose otherwise); only channels with a value appear.
  const talkLabels = {
    line: n.line,
    phone: n.call,
    messenger: n.messenger,
    whatsapp: n.whatsapp,
    instagram: t.contactChannels.name.instagram,
    email: t.contactChannels.name.email,
  };
  const talkLinks: PublicTalkLink[] = talkChannels(preferredChannels(site), { email: false }).map(
    (c) => ({ kind: c.channel, href: c.href, label: talkLabels[c.channel] }),
  );
  // Follow us: X sits with Facebook and Instagram — a follow link, not a
  // way to talk to the shelter.
  const followLinks: PublicFollowLink[] = [
    ...(social.facebook
      ? [{ kind: "facebook" as const, href: social.facebook, label: f.facebook }]
      : []),
    ...(social.instagram
      ? [{ kind: "instagram" as const, href: social.instagram, label: f.instagram }]
      : []),
    ...(social.x ? [{ kind: "x" as const, href: social.x, label: f.x }] : []),
  ];

  const brand = (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 text-site-ink lg:gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-1 ring-site-line lg:h-12 lg:w-12">
        <Image
          src="/lca-logo-160.jpg"
          alt=""
          width={40}
          height={40}
          className="object-contain"
          priority={current === "home"}
        />
      </span>
      <span className="font-display text-[17px] font-bold leading-tight xl:text-[22px]">
        {/* The short name on a phone, and on a small laptop where the five
            menu entries leave the full one wrapping onto three lines. */}
        <span className="whitespace-nowrap sm:hidden lg:inline xl:hidden">{n.shortName}</span>
        <span className="hidden sm:inline lg:hidden xl:inline">{t.header.appName}</span>
      </span>
    </Link>
  );
  const donateClass =
    "flex items-center whitespace-nowrap rounded-full bg-site-action font-bold text-site-on-action hover:bg-site-action-hover";

  return (
    <header data-public-site className="border-b border-site-line bg-site-paper font-site text-site-ink">
      {showHiddenBanner && (
        <p role="note" className="bg-site-sand px-4 py-2 text-center text-[15px] font-semibold text-site-ink">
          {n.hiddenBanner}
        </p>
      )}
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 lg:h-[88px] lg:px-8 xl:px-16">
        <SpringMotion />
        <NavTrail />
        {brand}

        <nav aria-label={n.label} className="hidden items-center gap-6 text-[17px] font-semibold lg:flex xl:gap-8">
          {entries.map((entry) =>
            entry.kind === "link" ? (
              <Link
                key={entry.link.key}
                href={entry.link.href}
                aria-current={entry.link.current ? "page" : undefined}
                className={`flex min-h-11 items-center whitespace-nowrap hover:text-site-action ${
                  entry.link.current ? "text-site-action" : ""
                }`}
              >
                {entry.link.label}
              </Link>
            ) : (
              <PublicNavGroup key={entry.key} label={entry.label} links={entry.links} />
            ),
          )}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <LanguageSwitcher tone="site" />
          {account}
          {donate && (
            <Link
              href={donate.href}
              aria-current={donate.current ? "page" : undefined}
              className={`${donateClass} h-12 px-[26px] text-[17px]`}
            >
              {donate.label}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {donate && (
            <Link
              href={donate.href}
              aria-current={donate.current ? "page" : undefined}
              className={`${donateClass} h-11 px-[18px] text-base`}
            >
              {donate.label}
            </Link>
          )}
          <PublicMobileMenu
            entries={entries}
            home={home}
            brand={brand}
            donate={donate}
            languageLabel={n.language}
            language={<LanguageSwitcher tone="site" />}
            account={mobileAccount}
            talk={{
              title: n.talkToUs,
              links: talkLinks,
              note: hours.length > 0 ? hours.join(" · ") : null,
              followTitle: n.followUs,
              follow: followLinks,
            }}
            labels={{
              open: t.nav.openMenu,
              close: t.nav.closeMenu,
              menu: t.header.appName,
              nav: n.label,
            }}
          />
        </div>
      </div>

      {trail && trail.length > 0 && (
        <Breadcrumb trail={[{ label: n.home, href: "/" }, ...trail]} label={n.breadcrumb} origin={origin} />
      )}
    </header>
  );
}

/**
 * Home › Adopt › Panda: each step a link, the last plain text marked
 * aria-current="page". Search engines get the same path as schema.org
 * BreadcrumbList data; a step with no link (a heading such as Get involved)
 * is left out of it, since a list item needs a URL.
 */
function Breadcrumb({
  trail,
  label,
  origin,
}: {
  trail: PublicCrumb[];
  label: string;
  origin: URL | null;
}) {
  const last = trail.length - 1;
  const linked = trail.filter((crumb, i) => i === last || crumb.href);
  const data =
    origin &&
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: linked.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.label,
        // The current page has no href here; its address is the page's own.
        ...(crumb.href ? { item: new URL(crumb.href, origin).href } : {}),
      })),
    }).replace(/</g, "\u003c");
  return (
    <nav
      aria-label={label}
      className="mx-auto hidden w-full max-w-[1440px] px-4 pb-2 text-[15px] text-site-ink-muted sm:block lg:px-8 xl:px-16"
    >
      <ol className="flex flex-wrap items-center gap-x-2">
        {trail.map((crumb, i) => (
          <li key={i} className="flex items-center gap-x-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            {i === last ? (
              <span aria-current="page" className="font-semibold text-site-ink">
                {crumb.label}
              </span>
            ) : crumb.href ? (
              <Link
                href={crumb.href}
                className="flex min-h-9 items-center underline-offset-4 hover:text-site-action hover:underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
      {data && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: data }} />}
    </nav>
  );
}
