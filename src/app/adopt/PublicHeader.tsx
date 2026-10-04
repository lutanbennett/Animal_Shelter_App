import Image from "next/image";
import Link from "next/link";
import { hasAppAccess, loadCurrentRole } from "@/lib/auth/app-access";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { preferredChannels, talkChannels } from "@/lib/site/channels";
import { loadSiteContent, socialLinks, visitingHoursLines } from "@/lib/site/content";
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

export type PublicSection =
  | "home"
  | "adopt"
  | "our-work"
  | "foster"
  | "volunteer"
  | "donate"
  | "friends"
  | "friends-join"
  | "adopt-international";

/**
 * One step of the trail under the header. No `href` on the last (the page the
 * visitor is on) or on a step that is only a heading, like Get involved.
 */
export type PublicCrumb = { label: string; href?: string };

/**
 * Header for the public pages (docs/design/, part 1 of the redesign). Four
 * entries — Adopt ▾ · Get involved ▾ · Our work · About & contact (and
 * Services ▾ once it has something in it) — then the language toggle and
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
    site,
  ] = await Promise.all([supabase.auth.getUser(), hasPublicFriends(), loadSiteContent(supabase)]);
  // Staff get "Open the app". A public viewer (src/lib/auth/app-access.ts)
  // is a visitor here with nothing to open — only a way to sign out. A
  // visitor who isn't signed in sees neither here: Staff login is in the footer and, on a phone, the menu.
  const staff = user ? hasAppAccess(await loadCurrentRole(supabase)) : false;
  const n = t.publicNav;

  const link = (key: PublicSection, href: string, label: string): PublicNavLink => ({
    key,
    href,
    label,
    current: key === current,
  });
  const allEntries: PublicNavEntry[] = [
    // The animals, and adopting one from abroad (Lutan, 2026-09-27): an
    // international adoption is adoption, not a service.
    {
      kind: "group",
      key: "adopt",
      label: t.adopt.adoptNav,
      links: [
        link("adopt", "/adopt", n.meetResidents),
        link("adopt-international", "/adopt/international", t.adopt.internationalNav),
      ],
    },
    {
      kind: "group",
      key: "get-involved",
      label: n.getInvolved,
      links: [
        link("foster", "/foster", t.adopt.fosterNav),
        link("volunteer", "/volunteer", t.adopt.volunteerNav),
        // No sponsor flow yet — that waits on the /donate item. Until then
        // it's the Donate page, which says how to give; never marked
        // current, because Donate is.
        { key: "sponsor", href: "/donate", label: n.sponsor, current: false },
        // Shelter Friends is listed once there is someone to thank — or
        // while the visitor is on /friends itself, so the page stays marked.
        ...(showFriends || current === "friends"
          ? [link("friends", "/friends", t.shelterFriends.navLabel)]
          : []),
        // A way for a business to help, so here rather than under Services
        // (Lutan, 2026-09-27) — and always, since it is how the first
        // Friend arrives.
        link("friends-join", "/friends/join", n.becomeFriend),
      ],
    },
    // What the shelter offers the public, as opposed to ways to help it
    // (Lutan, 2026-09-27). Empty since Pet relocation came off the site —
    // relocation is not a shelter service — so hidden below until desexing
    // drives give it an entry.
    {
      kind: "group",
      key: "services",
      label: n.services,
      links: [],
    },
    { kind: "link", link: link("our-work", "/our-work", t.adopt.ourWorkNav) },
    // No About page yet: the footer is where the shelter's address and
    // contact details are, on every page. The homepage (part 2) can point
    // this at its story instead.
    { kind: "link", link: { key: "about", href: "#contact", label: n.about, current: false } },
  ];
  // A group with nothing in it is left out rather than shown as an empty menu.
  const entries = allEntries.filter((entry) => entry.kind === "link" || entry.links.length > 0);
  const donate = link("donate", "/donate", t.adopt.donateNav);
  const home: PublicNavLink = { key: "home", href: "/", label: n.home, current: current === "home" };

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
      <Link
        href="/login"
        className="flex min-h-11 items-center whitespace-nowrap text-[15px] font-semibold text-site-ink-muted underline-offset-4 hover:text-site-ink hover:underline"
      >
        {t.publicFooter.staffLogin}
      </Link>
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
          src="/lca-logo.jpg"
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
          <Link
            href={donate.href}
            aria-current={donate.current ? "page" : undefined}
            className={`${donateClass} h-12 px-[26px] text-[17px]`}
          >
            {donate.label}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={donate.href}
            aria-current={donate.current ? "page" : undefined}
            className={`${donateClass} h-11 px-[18px] text-base`}
          >
            {donate.label}
          </Link>
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
