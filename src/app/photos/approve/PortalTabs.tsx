"use client";

import { useState, type ReactNode } from "react";

export type PortalTab = { key: string; label: string; count: number; content: ReactNode };

/**
 * The portal's tabs. Which tabs exist is decided by the server page from the login's cards, so this only draws what it is
 * handed; a tab nobody may use is never in the list.
 */
export function PortalTabs({ tabs }: { tabs: PortalTab[] }) {
  const firstBusy = tabs.find((x) => x.count > 0) ?? tabs[0];
  const [active, setActive] = useState(firstBusy?.key);
  if (tabs.length === 0) return null;
  const current = tabs.find((x) => x.key === active) ?? tabs[0];
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={tab.key === current.key}
            onClick={() => setActive(tab.key)}
            className={`min-h-11 px-4 py-2 text-sm font-medium md:min-h-9 ${
              tab.key === current.key ? "border-b-2 border-primary text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && <span className="ml-2 rounded-full bg-primary/10 px-2 text-xs">{tab.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current.content}</div>
    </div>
  );
}
