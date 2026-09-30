"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SITE_PAGE_SLUGS } from "@/lib/site/pages";

export const WEBSITE_TABS = ["home", "contact", "pages", "gallery", "projects"] as const;
export type WebsiteTab = (typeof WEBSITE_TABS)[number];

function isTab(value: string | null): value is WebsiteTab {
  return (WEBSITE_TABS as readonly string[]).includes(value ?? "");
}

/**
 * Which tab the current address asks for: ?tab=…, else a #<page-slug> (or
 * #page-<slug>) means the Pages tab, else the first tab.
 */
function tabFromLocation(): WebsiteTab {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (isTab(tab)) return tab;
  const hash = decodeURIComponent(window.location.hash.slice(1)).replace(/^page-/, "");
  if ((SITE_PAGE_SLUGS as readonly string[]).includes(hash)) return "pages";
  return "home";
}

/**
 * The tab strip and its panels. Every panel stays mounted (the inactive
 * ones are `hidden`) so text typed in one tab is not lost by looking at
 * another. The chosen tab lives in the URL as ?tab=, pushed to history so
 * Back and a reload land where the person was.
 */
export function WebsiteTabs({
  labels,
  panels,
  ariaLabel,
  initial,
}: {
  /** ?tab= as the server saw it, so the right panel is in the first paint. */
  initial?: string;
  labels: Record<WebsiteTab, string>;
  panels: Record<WebsiteTab, ReactNode>;
  ariaLabel: string;
}) {
  const [active, setActive] = useState<WebsiteTab>(isTab(initial ?? null) ? (initial as WebsiteTab) : "home");

  useEffect(() => {
    const sync = () => setActive(tabFromLocation());
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const choose = useCallback((tab: WebsiteTab) => {
    setActive(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    url.hash = "";
    window.history.pushState(null, "", url);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1 overflow-x-auto border-b border-border"
        onKeyDown={(e) => {
          const i = WEBSITE_TABS.indexOf(active);
          const next =
            e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
          if (next === null) return;
          e.preventDefault();
          const tab = WEBSITE_TABS[(next + WEBSITE_TABS.length) % WEBSITE_TABS.length];
          choose(tab);
          document.getElementById(`website-tab-${tab}`)?.focus();
        }}
      >
        {WEBSITE_TABS.map((tab) => (
          <button
            key={tab}
            id={`website-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={active === tab}
            aria-controls={`website-panel-${tab}`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => choose(tab)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
              active === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {labels[tab]}
          </button>
        ))}
      </div>
      {WEBSITE_TABS.map((tab) => (
        <div
          key={tab}
          id={`website-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`website-tab-${tab}`}
          hidden={active !== tab}
          className="flex flex-col gap-6"
        >
          {panels[tab]}
        </div>
      ))}
    </div>
  );
}
