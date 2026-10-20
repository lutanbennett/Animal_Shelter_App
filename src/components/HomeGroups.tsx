"use client";

import { useSyncExternalStore } from "react";
import { HomeTiles } from "@/components/HomeTiles";
import type { HomeTile } from "@/lib/home/tiles";

export type HomeGroupView = { key: string; heading: string; sub?: string; tabLabel: string; tiles: HomeTile[] };

const STORE_KEY = "home-group";
const STORE_EVENT = "home-group-change";

function subscribe(cb: () => void) {
  window.addEventListener(STORE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(STORE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): { day: string; key: string } | null {
  try {
    return raw ? (JSON.parse(raw) as { day: string; key: string }) : null;
  } catch {
    return null;
  }
}

/**
 * The home of a login that holds more than one role: one group per role, main role first. On a phone a switch at the
 * top shows one group at a time, opening on the main role; the choice is kept for the day on this device (a different
 * day, or a role that is no longer held, falls back to the main role). From `sm` the groups simply stack. Layout only.
 */
export function HomeGroups({ groups, today, label }: { groups: HomeGroupView[]; today: string; label: string }) {
  // The remembered choice lives in this device's storage; the server (and a blocked store) answer null, so the main role shows.
  const raw = useSyncExternalStore(subscribe, readStored, () => null);
  const saved = parse(raw);
  const active = saved && saved.day === today && groups.some((g) => g.key === saved.key) ? saved.key : groups[0].key;

  function choose(key: string) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ day: today, key }));
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {
      /* the choice just isn't remembered */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={label} className="grid gap-2 sm:hidden" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={active === g.key}
            onClick={() => choose(g.key)}
            className={`min-h-11 min-w-0 rounded-lg border px-2 py-2 text-sm font-medium [overflow-wrap:anywhere] ${
              active === g.key ? "border-primary bg-primary text-white" : "border-border bg-surface text-foreground"
            }`}
          >
            {g.tabLabel}
          </button>
        ))}
      </div>
      {groups.map((g) => (
        <section key={g.key} role="tabpanel" aria-label={g.heading} className={`flex flex-col gap-3 ${active === g.key ? "" : "max-sm:hidden"}`}>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{g.heading}</h2>
            {g.sub ? <p className="text-sm text-muted">{g.sub}</p> : null}
          </div>
          <HomeTiles tiles={g.tiles} />
        </section>
      ))}
    </div>
  );
}
