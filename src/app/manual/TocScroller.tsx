"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The desktop contents list's own scroll box. The list is longer than most
 * windows, so it scrolls separately from the sections beside it; this keeps
 * the entry for the section in the address bar's #anchor visible in it and
 * marked as current — on first load (a bookmarked or shared link) and
 * whenever the anchor changes (a click here or anywhere else).
 *
 * It moves only its own scrollTop. scrollIntoView() would also scroll the
 * page, fighting the browser's own jump to the anchor.
 */
export function TocScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;

    function sync() {
      if (!box) return;
      for (const el of box.querySelectorAll("[aria-current]")) {
        el.removeAttribute("aria-current");
      }
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const link = box.querySelector<HTMLAnchorElement>(
        `a[href="#${CSS.escape(id)}"]`,
      );
      if (!link) return;
      link.setAttribute("aria-current", "location");

      const boxRect = box.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const margin = 16;
      if (linkRect.top < boxRect.top + margin) {
        box.scrollTop += linkRect.top - boxRect.top - margin;
      } else if (linkRect.bottom > boxRect.bottom - margin) {
        box.scrollTop += linkRect.bottom - boxRect.bottom + margin;
      }
    }

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div
      ref={ref}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
    >
      {children}
    </div>
  );
}
