"use client";

import { Menu, X } from "lucide-react";
import { useMobileNav } from "./MobileNavContext";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function MobileNavToggle() {
  const { open, toggle } = useMobileNav();
  const { t } = useI18n();
  const Icon = open ? X : Menu;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="mobile-nav"
      aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
      className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded text-foreground hover:bg-surface-hover md:hidden"
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
