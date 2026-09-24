"use client";

import { useEffect } from "react";

/**
 * Opens the release a `/releases#v0.2.0` link points at. Each release is a
 * `<details>`, closed unless it is the newest, and a link to a closed one
 * would land on a row with its notes hidden. Runs on mount (a link opened
 * cold, or from another page) and on `hashchange` (an anchor clicked while
 * already here — the only case that fires it). Renders nothing, so the page
 * itself stays a server component.
 */
export function OpenReleaseFromHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!(target instanceof HTMLDetailsElement)) return;
      target.open = true;
      target.scrollIntoView({ block: "start" });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  return null;
}
