"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useMobileNav } from "./MobileNavContext";

type NavItem = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { open, setOpen } = useMobileNav();

  const items: NavItem[] = [
    { href: "/residents", label: t.nav.residents },
    { href: "/enclosures", label: t.nav.enclosures },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: t.nav.admin,
            children: [
              { href: "/admin/website", label: t.nav.website },
              { href: "/admin/security", label: t.nav.security },
              { href: "/admin/enclosures", label: t.nav.enclosures },
              { href: "/admin/zones", label: t.nav.zones },
              {
                href: "/admin/immunization-types",
                label: t.nav.immunizationTypes,
              },
            ],
          },
        ]
      : []),
  ];

  const links = items.map((item) => {
    const isActive =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

    return (
      <div key={item.href} className="flex flex-col gap-1">
        <Link
          href={item.href}
          className={`rounded px-3 py-2 text-sm font-medium ${
            isActive && !item.children
              ? "bg-primary text-primary-foreground"
              : "text-muted hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
        {item.children && (
          <div className="ml-3 flex flex-col gap-1 border-l border-border pl-3">
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
        {links}
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
            {links}
          </nav>
        </div>
      )}
    </>
  );
}
