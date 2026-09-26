"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Gap between blocks that come into view together (a row of cards). */
const STAGGER_MS = 80;
/** Past this many, the rest of a batch arrive with the last one. */
const MAX_STAGGER_STEPS = 5;

/**
 * Spring motion for the public pages: every element carrying data-reveal
 * rises and fades into place the first time it scrolls into view
 * (globals.css, "Spring motion"). Rendered by PublicHeader, so it runs on
 * the public pages and nowhere in the staff app.
 *
 * The server's HTML is the finished page. Only this script ever holds a
 * block back, and only one that is below the fold when it runs — so a
 * visitor without JavaScript, a crawler, and whatever is on screen at
 * load all see the content straight away, and a failed hydration leaves
 * nothing hidden. Reduced motion: it does nothing at all.
 */
export function SpringMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pending = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-state])"),
    ).filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    if (pending.length === 0) return;

    const settle = (event: TransitionEvent) => {
      const el = event.currentTarget as HTMLElement;
      if (event.target !== el || event.propertyName !== "transform") return;
      // Hand the element back to its own transitions (e.g. the hover lift).
      el.dataset.revealState = "done";
      el.style.removeProperty("--reveal-delay");
      el.removeEventListener("transitionend", settle);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Entries arrive in document order, so a row entering together
        // staggers left to right, top to bottom.
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            observer.unobserve(el);
            el.style.setProperty("--reveal-delay", `${Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
            el.addEventListener("transitionend", settle);
            el.dataset.revealState = "in";
          });
      },
      // The area reaches far above the viewport, so a block a jump (an
      // #anchor link, End, a fling) carries straight past still counts as
      // arrived — it is never left hidden above the visitor.
      { rootMargin: "100000px 0px -10% 0px" },
    );

    for (const el of pending) {
      el.dataset.revealState = "pending";
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      // Anything still waiting goes back to untouched: shown as it is,
      // never left hidden, and free to be picked up again by the next run
      // (a remount, or Strict Mode's second effect in development).
      for (const el of pending) {
        if (el.dataset.revealState === "pending") delete el.dataset.revealState;
        el.removeEventListener("transitionend", settle);
      }
    };
  }, [pathname]);

  return null;
}
