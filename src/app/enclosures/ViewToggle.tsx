"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** List / Map, as plain links so the address says which and Back returns to it (`?view=map`). */
export function ViewToggle({ map }: { map: boolean }) {
  const { t } = useI18n();
  const m = t.enclosures.map;
  const base = "flex min-h-11 items-center px-4 text-sm font-medium";
  const on = "bg-primary/15 text-foreground";
  const off = "bg-surface text-muted hover:bg-surface-hover hover:text-foreground";
  return (
    <nav aria-label={m.viewLabel} className="flex overflow-hidden rounded-lg border border-border">
      <Link href="/enclosures" aria-current={map ? undefined : "page"} className={`${base} ${map ? off : on}`}>
        {m.viewList}
      </Link>
      <Link href="/enclosures?view=map" aria-current={map ? "page" : undefined} className={`${base} border-l border-border ${map ? on : off}`}>
        {m.viewMap}
      </Link>
    </nav>
  );
}
