"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useMobileNav } from "./MobileNavContext";

type NavItem = {
  href: string;
  label: string;
  /** Small pill after the label, e.g. "Demo". */
  badge?: string;
  children?: { href: string; label: string }[];
};

/**
 * The user's open/closed choices for the grouped sections (Management,
 * Admin), keyed by the parent href, with the page they were on when they
 * chose. Kept in sessionStorage so a refresh or a navigation doesn't undo
 * the choice; a new tab starts collapsed again. Read through
 * useSyncExternalStore so the server render and hydration both see
 * "nothing chosen yet" and the stored choices apply right after.
 */
type GroupChoice = { open: boolean; path: string };
type GroupChoices = Record<string, GroupChoice>;

const CHOICES_KEY = "nav-expanded";
const listeners = new Set<() => void>();
// Mirrors sessionStorage so toggling still works where storage is blocked
// (private mode); the choice then just lasts until reload.
let cached: string | null = null;

function readChoices(): string {
  if (cached === null) {
    try {
      cached = sessionStorage.getItem(CHOICES_KEY) ?? "";
    } catch {
      cached = "";
    }
  }
  return cached;
}

function writeChoices(value: GroupChoices) {
  cached = JSON.stringify(value);
  try {
    sessionStorage.setItem(CHOICES_KEY, cached);
  } catch {
    // See `cached`.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

function parseChoices(raw: string): GroupChoices {
  try {
    return raw ? (JSON.parse(raw) as GroupChoices) : {};
  } catch {
    return {};
  }
}

export function NavLinks({
  isAdmin,
  canManage,
}: {
  isAdmin: boolean;
  /** Admin or management: shows the Management section. */
  canManage: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { open, setOpen } = useMobileNav();

  const rawChoices = useSyncExternalStore(subscribe, readChoices, () => "");
  const choices = useMemo(() => parseChoices(rawChoices), [rawChoices]);

  // Collapsed until chosen otherwise, except that landing inside a group
  // reveals it — a refresh on /admin/zones must still show where you are.
  // A collapse made on the current page is honoured over that, so the
  // chevron doesn't fight the user; moving to another page in the group
  // opens it again. "Inside" is measured against the group's own children
  // rather than its href, so /admin/security — which now lives in the
  // footer group — doesn't spring the Admin group open.
  const isGroupOpen = (item: NavItem) => {
    const inside = !!item.children?.some((child) =>
      pathname.startsWith(child.href),
    );
    const choice = choices[item.href];
    if (!choice) return inside;
    return choice.open || (inside && choice.path !== pathname);
  };

  const toggleGroup = (item: NavItem) => {
    writeChoices({
      ...choices,
      [item.href]: { open: !isGroupOpen(item), path: pathname },
    });
  };

  const mainItems: NavItem[] = [
    { href: "/residents", label: t.nav.residents },
    { href: "/enclosures", label: t.nav.enclosures },
    { href: "/maintenance", label: t.nav.maintenance },
    { href: "/projects", label: t.nav.projects },
    { href: "/vets", label: t.nav.vets },
    { href: "/contacts", label: t.nav.contacts },
    // The full-page assistant; the same conversation also opens as a
    // slide-over from the header, on every screen.
    { href: "/assistant", label: t.nav.assistant },
    // Operational management (reports, contacts) lives under Management;
    // Admin keeps the system-level configuration (website, zones,
    // enclosures, immunization and procedure types).
    ...(canManage
      ? [
          {
            href: "/management",
            label: t.nav.management,
            children: [
              { href: "/management/dashboard", label: t.nav.dashboard },
              { href: "/management/contacts", label: t.nav.contacts },
              { href: "/management/vets", label: t.nav.vets },
              { href: "/management/medications", label: t.nav.medications },
              { href: "/management/diets", label: t.nav.diets },
              { href: "/management/cashflow", label: t.nav.cashflow },
              { href: "/management/translations", label: t.nav.translations },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: t.nav.admin,
            children: [
              { href: "/admin/website", label: t.nav.website },
              { href: "/admin/enclosures", label: t.nav.enclosures },
              { href: "/admin/zones", label: t.nav.zones },
              {
                href: "/admin/immunization-types",
                label: t.nav.immunizationTypes,
              },
              {
                href: "/admin/procedure-types",
                label: t.nav.procedureTypes,
              },
              {
                href: "/admin/blood-test-types",
                label: t.nav.bloodTestTypes,
              },
            ],
          },
        ]
      : []),
  ];

  // Pinned to the bottom of the sidebar instead of sitting in the flow:
  // the pages you reach for now and then rather than while working
  // (customer request 2026-09-22). Security is admin-only but belongs with
  // the other occasional links rather than inside the Admin group, which
  // keeps the rest of the system configuration.
  const footerItems: NavItem[] = [
    { href: "/manual", label: t.nav.manual },
    { href: "/releases", label: t.nav.releaseNotes },
    { href: "/account/password", label: t.nav.changePassword },
    ...(isAdmin ? [{ href: "/admin/security", label: t.nav.security }] : []),
  ];

  // Rendered twice (sidebar and drawer), so the ids the chevrons point at
  // carry a prefix to stay unique.
  const renderLinks = (idPrefix: string, list: NavItem[]) =>
    list.map((item) => {
      const isActive = pathname.startsWith(item.href);
      const isOpen = !!item.children && isGroupOpen(item);
      const childrenId = item.children
        ? `${idPrefix}-group-${item.href.slice(1)}`
        : undefined;

      return (
        <div key={item.href} className="flex flex-col gap-1">
          <div className="flex items-stretch gap-1">
            <Link
              href={item.href}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
                isActive && !item.children
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {item.label}
              {item.badge && (
                <span className="ml-2 rounded-full border border-current px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide">
                  {item.badge}
                </span>
              )}
            </Link>
            {item.children && (
              // The label navigates to the landing page; only the chevron
              // opens and closes the group.
              <button
                type="button"
                onClick={() => toggleGroup(item)}
                aria-expanded={isOpen}
                aria-controls={childrenId}
                aria-label={item.label}
                className="flex w-8 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-hover hover:text-foreground"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
          {item.children && isOpen && (
            <div
              id={childrenId}
              className="ml-3 flex flex-col gap-1 border-l border-border pl-3"
            >
              {item.children.map((child) => {
                const childActive = pathname.startsWith(child.href);

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`rounded px-3 py-2 text-sm font-medium ${
                      childActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    });

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <nav className="hidden w-48 shrink-0 flex-col gap-1 border-r border-border bg-surface p-4 md:flex">
        {renderLinks("sidebar", mainItems)}
        {/* mt-auto pushes the group to the bottom of the sidebar — but the
            sidebar is a flex item stretched to the height of the page, not
            the window, so on a long list (residents) that bottom is
            thousands of pixels down. sticky keeps it against the bottom of
            the window until the real bottom scrolls into view, matching the
            bottom-4 to the nav's own p-4 so it doesn't jump when it lands.
            bg-surface is for the case where the links themselves overflow
            the window and would otherwise show through. */}
        <div className="sticky bottom-4 mt-auto flex flex-col gap-1 border-t border-border bg-surface pt-3">
          {renderLinks("sidebar-footer", footerItems)}
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
            {renderLinks("drawer", mainItems)}
            {/* The drawer scrolls, so the same group simply comes last
                behind a divider instead of being pinned to the bottom. */}
            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
              {renderLinks("drawer-footer", footerItems)}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
