"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const PREV_KEY = "lca:prev-page";
const LAST_KEY = "lca:last-page";

/**
 * Remembers, per browser tab, the public page the visitor was on before this
 * one, so BackLink can tell "came from the list" from "arrived from outside".
 * Rendered by PublicHeader, so every public page runs it. It renders nothing.
 *
 * sessionStorage is per tab and empty for a visitor who has just arrived from
 * Facebook or a search result, which is exactly the case BackLink must not
 * send back through history. Any failure (storage blocked, private window)
 * leaves it empty, and empty means "link to the list".
 */
export function NavTrail() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const here = window.location.pathname + window.location.search;
      const last = sessionStorage.getItem(LAST_KEY);
      // A reload of this same page keeps what was already known about it.
      if (last !== here) {
        if (last) sessionStorage.setItem(PREV_KEY, last);
        else sessionStorage.removeItem(PREV_KEY);
        sessionStorage.setItem(LAST_KEY, here);
      }
    } catch {
      // No storage: BackLink falls back to its plain link.
    }
  }, [pathname]);
  return null;
}

/**
 * "← All dogs and cats" at the top of a detail page. It is a real link to the
 * list, so it works with no script and for a visitor who arrived from outside
 * the site. When this tab's previous public page was that same list, a click
 * goes back in history instead, so the visitor's filters and scroll position
 * are still there. Fails safe: anything uncertain follows the link to the
 * list, never history.back() into whatever came before the site.
 */
export function BackLink({
  href,
  className,
  children,
}: {
  /** The list this page belongs to, e.g. "/adopt". */
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        try {
          const prev = sessionStorage.getItem(PREV_KEY);
          if (prev && window.history.length > 1) {
            const path = prev.split("?")[0].replace(/\/$/, "");
            if (path === href) {
              event.preventDefault();
              window.history.back();
            }
          }
        } catch {
          // Follow the link.
        }
      }}
    >
      <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
      {children}
    </Link>
  );
}
