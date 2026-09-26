import Image from "next/image";
import Link from "next/link";
import { hasAppAccess, loadCurrentRole } from "@/lib/auth/app-access";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { lineLink, loadSiteContent, socialLinks, visitingHoursLines } from "@/lib/site/content";
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
import { SpringMotion } from "./SpringMotion";

export type PublicSection =
  | "home"
  | "adopt"
  | "our-work"
  | "foster"
  | "volunteer"
  | "donate"
  | "friends";

/**
 * Header for the public pages (docs/design/, part 1 of the redesign). Four
 * entries — Adopt · Get involved ▾ · Our work · About & contact — then the
 * language toggle and Donate, the one thing every page of a shelter site
 * asks for. Below a laptop's width the entries move into a full-screen
 * menu (PublicNav.tsx) and only Donate stays beside the menu button.
 *
 * It also carries data-public-site, which is what switches the page to the
 * public site's light theme (globals.css, "Public site").
 *
 * `current` marks the section the visitor is in, so its link reads as
 * where they are rather than a way out.
 */
export async function PublicHeader({ current }: { current?: PublicSection }) {
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const [
    {
      data: { user },
    },
    showFriends,
    site,
  ] = await Promise.all([supabase.auth.getUser(), hasPublicFriends(), loadSiteContent(supabase)]);
  // Staff get "Open the app". A public viewer (src/lib/auth/app-access.ts)
  // is a visitor here with nothing to open — only a way to sign out. A
  // visitor who isn't signed in sees neither: Staff login is in the footer.
  const staff = user ? hasAppAccess(await loadCurrentRole(supabase)) : false;
  const n = t.publicNav;

  const link = (key: PublicSection, href: string, label: string): PublicNavLink => ({
    key,
    href,
    label,
    current: key === current,
  });
  const entries: PublicNavEntry[] = [
    { kind: "link", link: link("adopt", "/adopt", t.adopt.adoptNav) },
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
      ],
    },
    { kind: "link", link: link("our-work", "/our-work", t.adopt.ourWorkNav) },
    // No About page yet: the footer is where the shelter's address and
    // contact details are, on every page. The homepage (part 2) can point
    // this at its story instead.
    { kind: "link", link: { key: "about", href: "#contact", label: n.about, current: false } },
  ];
  const donate = link("donate", "/donate", t.adopt.donateNav);

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

  const line = lineLink(site?.contact_line);
  const phone = site?.contact_phone?.trim();
  const hours = visitingHoursLines(locale, site);
  const social = socialLinks(site);
  const f = t.publicFooter;
  // The phone menu's "Talk to us" buttons, each only when set: LINE first,
  // as the shelter's main channel, then Call, Messenger and WhatsApp.
  const talkLinks: PublicTalkLink[] = [
    ...(line ? [{ kind: "line" as const, href: line.href, label: n.line }] : []),
    ...(phone
      ? [{ kind: "phone" as const, href: `tel:${phone.replace(/\s+/g, "")}`, label: n.call }]
      : []),
    ...(social.messenger
      ? [{ kind: "messenger" as const, href: social.messenger, label: n.messenger }]
      : []),
    ...(social.whatsapp
      ? [{ kind: "whatsapp" as const, href: social.whatsapp, label: n.whatsapp }]
      : []),
  ];
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
        <span className="sm:hidden">{n.shortName}</span>
        <span className="hidden sm:inline">{t.header.appName}</span>
      </span>
    </Link>
  );
  const donateClass =
    "flex items-center whitespace-nowrap rounded-full bg-site-action font-bold text-site-on-action hover:bg-site-action-hover";

  return (
    <header data-public-site className="border-b border-site-line bg-site-paper font-site text-site-ink">
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 lg:h-[88px] lg:px-8 xl:px-16">
        <SpringMotion />
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
            brand={brand}
            donate={donate}
            languageLabel={n.language}
            language={<LanguageSwitcher tone="site" />}
            account={account}
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
    </header>
  );
}
