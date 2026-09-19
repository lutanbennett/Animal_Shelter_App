"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

type NavItem = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();

  const items: NavItem[] = [
    { href: "/residents", label: t.nav.residents },
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

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-1 border-r border-border bg-surface p-4">
      {items.map((item) => {
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
      })}
    </nav>
  );
}
