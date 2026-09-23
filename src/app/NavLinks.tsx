"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { NAV_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useMobileNav } from "./MobileNavContext";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Small pill after the label, e.g. "Demo". */
  badge?: string;
};

/**
 * The link the current page belongs to: the longest href that is the path
 * or a parent of it. Longest wins so that /admin/security lights up
 * Security in the footer rather than Settings as well, and a segment
 * boundary is required so /vets never claims /vetsomething.
 */
function activeHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

export function NavLinks({
  isAdmin,
  canManage,
}: {
  isAdmin: boolean;
  /** Admin or management: shows the Management link. */
  canManage: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { open, setOpen } = useMobileNav();

  // Grouped by how often each link is reached for (agreed with the user
  // 2026-09-23): the daily field pages, then the people and project
  // reference lists, then the assistant, then the role-gated sections.
  // Management and Settings are single links now — their landing pages are
  // tile grids of everything inside them, so the sidebar no longer repeats
  // those children under chevrons.
  const groups: NavItem[][] = [
    [
      { href: "/residents", label: t.nav.residents, icon: NAV_ICONS.residents },
      {
        href: "/enclosures",
        label: t.nav.enclosures,
        icon: NAV_ICONS.enclosures,
      },
      {
        href: "/maintenance",
        label: t.nav.maintenance,
        icon: NAV_ICONS.maintenance,
      },
    ],
    [
      { href: "/vets", label: t.nav.vets, icon: NAV_ICONS.vets },
      { href: "/contacts", label: t.nav.contacts, icon: NAV_ICONS.contacts },
      { href: "/projects", label: t.nav.projects, icon: NAV_ICONS.projects },
    ],
    // The full-page assistant; the same conversation also opens as a
    // slide-over from the header, on every screen.
    [{ href: "/assistant", label: t.nav.assistant, icon: NAV_ICONS.assistant }],
    [
      ...(canManage
        ? [
            {
              href: "/management",
              label: t.nav.management,
              icon: NAV_ICONS.management,
            },
          ]
        : []),
      // "Settings" is the menu's name for the /admin pages; the URL and the
      // admin role keep their names (docs/decisions.md, 2026-09-23).
      ...(isAdmin
        ? [{ href: "/admin", label: t.nav.settings, icon: NAV_ICONS.settings }]
        : []),
    ],
  ].filter((group) => group.length > 0);

  // Pinned to the bottom of the sidebar instead of sitting in the flow:
  // the pages you reach for now and then rather than while working
  // (customer request 2026-09-22). Security is admin-only but belongs with
  // the other occasional links; it is also a tile on the Settings page.
  const footerItems: NavItem[] = [
    { href: "/manual", label: t.nav.manual, icon: NAV_ICONS.manual },
    {
      href: "/releases",
      label: t.nav.releaseNotes,
      icon: NAV_ICONS.releaseNotes,
    },
    {
      href: "/account/password",
      label: t.nav.changePassword,
      icon: NAV_ICONS.changePassword,
    },
    ...(isAdmin
      ? [
          {
            href: "/admin/security",
            label: t.nav.security,
            icon: NAV_ICONS.security,
          },
        ]
      : []),
  ];

  const current = activeHref(pathname, [...groups.flat(), ...footerItems]);

  const renderLinks = (list: NavItem[]) =>
    list.map((item) => {
      const Icon = item.icon;
      const isActive = item.href === current;

      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="min-w-0">
            {item.label}
            {item.badge && (
              <span className="ml-2 rounded-full border border-current px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide">
                {item.badge}
              </span>
            )}
          </span>
        </Link>
      );
    });

  // A thin rule between groups, none before the first.
  const renderGroups = () =>
    groups.map((group, index) => (
      <div
        key={group[0].href}
        className={`flex flex-col gap-1 ${
          index > 0 ? "mt-1 border-t border-border pt-2" : ""
        }`}
      >
        {renderLinks(group)}
      </div>
    ));

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <nav className="hidden w-48 shrink-0 flex-col gap-1 border-r border-border bg-surface p-4 md:flex">
        {renderGroups()}
        {/* mt-auto pushes the group to the bottom of the sidebar — but the
            sidebar is a flex item stretched to the height of the page, not
            the window, so on a long list (residents) that bottom is
            thousands of pixels down. sticky keeps it against the bottom of
            the window until the real bottom scrolls into view, matching the
            bottom-4 to the nav's own p-4 so it doesn't jump when it lands.
            A pinned group floats over whatever links share the window with
            it, so it is only pinned on a window tall enough for the header,
            the whole list and the group together — an admin's needs ~690px
            (measured 2026-09-23), which a 768px laptop screen does not
            leave the page. Shorter than that it simply follows the list
            behind its divider, as it does in the drawer. */}
        <div className="mt-2 flex flex-col gap-1 border-t border-border bg-surface pt-3 [@media(min-height:44rem)]:sticky [@media(min-height:44rem)]:bottom-4 [@media(min-height:44rem)]:mt-auto">
          {renderLinks(footerItems)}
        </div>
      </nav>

      {/* Mobile: hamburger-toggled drawer, only mounted while open */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav
            id="mobile-nav"
            aria-label={t.nav.menu}
            className="absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col gap-1 overflow-y-auto border-r border-border bg-surface p-4 shadow-xl"
          >
            {renderGroups()}
            {/* The drawer scrolls, so the same group simply comes last
                behind a divider instead of being pinned to the bottom. */}
            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
              {renderLinks(footerItems)}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
