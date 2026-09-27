"use client";

import { useEffect } from "react";

/**
 * Makes the topics the role filter tucked away findable. The server renders
 * them `hidden` with data-until-found; React 19 only writes `hidden` as a
 * boolean, so this upgrades them to hidden="until-found" after hydration.
 * The browser then reveals one itself when Find on page matches text in it
 * or an #anchor points into it — so "can I do this?" gets a greyed answer
 * rather than no match. A browser without until-found keeps them plainly
 * hidden, and this reveals an anchored one by hand instead, as it does on
 * first load, when the jump to the anchor has already missed.
 */
export function UntilFound() {
  useEffect(() => {
    if ("onbeforematch" in document.body) {
      for (const el of document.querySelectorAll("[data-until-found][hidden]")) {
        el.setAttribute("hidden", "until-found");
      }
    }

    function revealAnchor() {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target?.closest("[hidden]")) return;
      for (let el: HTMLElement | null = target; el; el = el.parentElement) {
        el.removeAttribute("hidden");
      }
      target.scrollIntoView();
    }

    revealAnchor();
    window.addEventListener("hashchange", revealAnchor);
    return () => window.removeEventListener("hashchange", revealAnchor);
  }, []);

  return null;
}
