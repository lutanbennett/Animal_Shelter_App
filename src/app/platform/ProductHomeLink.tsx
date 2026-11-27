"use client";

import { usePathname } from "next/navigation";
import { CooperJaideeLockup } from "@/components/CooperJaideeLockup";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { PRODUCT_HOME } from "@/lib/platform-features";

/**
 * The product's name, top left, as the way back to the product home (#cnhom). The lockup is `role="img"` with its own label, so the
 * link carries its OWN label saying where it goes, and the lockup inside is hidden from the reader: one announcement, not the brand
 * twice with no destination. On the home page itself (either language) it is not a link: ProductNav already marks that page, and a
 * link to the page you are on would be a second "home". Thai follows the address (`/th/...`) or, on the console, the chosen language.
 */
export function ProductHomeLink({ name, homeLabel }: { name: string; homeLabel: string }) {
  const { locale } = useI18n();
  const pathname = usePathname() ?? "";
  const onTh = pathname === "/th" || pathname.startsWith("/th/");
  const bare = onTh ? pathname.slice(3) || "/" : pathname;
  if (bare === PRODUCT_HOME) return <CooperJaideeLockup label={name} />;
  const href = `${onTh || locale === "th" ? "/th" : ""}${PRODUCT_HOME}`;
  return (
    <a href={href} aria-label={homeLabel} className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <span aria-hidden="true">
        <CooperJaideeLockup label={name} />
      </span>
    </a>
  );
}
