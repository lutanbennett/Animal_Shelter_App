"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { isProductPage } from "@/lib/platform-features";

/**
 * The product pages' language control (#ptlng). One language per address, so this NAVIGATES to the same page's
 * other-language address (`/platform/about` <-> `/th/platform/about`) rather than flipping the locale cookie, which
 * would serve Thai at the English address and break hreflang/canonical. Drawn only on a product page: the other
 * platform pages (enquire, shelters, the console) have no Thai address to go to.
 */
export function ProductLanguageLinks() {
  const { locale } = useI18n();
  const pathname = usePathname() ?? "";
  const bare = pathname === "/th" || pathname.startsWith("/th/") ? pathname.slice(3) || "/" : pathname;
  if (!isProductPage(bare)) return null;
  const items = [
    { code: "en", label: "EN", href: bare },
    { code: "th", label: "ไทย", href: `/th${bare}` },
  ];
  return (
    <nav aria-label="Language / ภาษา" className="flex items-center overflow-hidden rounded-full border border-border text-xs font-medium">
      {items.map((i) => (
        <a
          key={i.code}
          href={i.href}
          hrefLang={i.code}
          lang={i.code}
          aria-current={locale === i.code ? "true" : undefined}
          className={`flex min-h-11 min-w-11 items-center justify-center px-3 md:min-h-9 ${locale === i.code ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"}`}
        >
          {i.label}
        </a>
      ))}
    </nav>
  );
}
