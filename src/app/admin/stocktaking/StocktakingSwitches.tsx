"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { StocktakingSwitches as Switches } from "@/lib/management/stocktaking-switches";
import { setStocktakingSwitch, type StocktakingArea } from "./actions";

const AREAS: StocktakingArea[] = ["food", "medical"];

/** The two switches, one card each. The page has already checked Admin and 2-step; the action checks again. */
export function StocktakingSwitches({ switches }: { switches: Switches }) {
  const { t } = useI18n();
  const s = t.admin.stocktaking;
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<StocktakingArea | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function change(area: StocktakingArea, enabled: boolean) {
    setBusy(area);
    setMessage(null);
    startTransition(async () => {
      const result = await setStocktakingSwitch(area, enabled);
      setBusy(null);
      setMessage(
        result.ok
          ? { type: "success", text: s.saved(s[area].title.toLowerCase(), enabled) }
          : { type: "error", text: result.error },
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {AREAS.map((area) => {
          const on = switches[area];
          return (
            <li key={area} className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">{s[area].title}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    on ? "bg-primary/10 text-foreground" : "bg-warning/20 text-foreground"
                  }`}
                >
                  {on ? s.on : s.off}
                </span>
              </div>
              <p className="text-sm text-muted">{s[area].what}</p>
              <p className="text-sm text-muted">{on ? s.whenOn : s.whenOff}</p>
              <button
                type="button"
                disabled={pending}
                onClick={() => change(area, !on)}
                className="inline-flex min-h-12 items-center justify-center self-start rounded border border-border bg-background px-4 text-base font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
              >
                {busy === area ? s.saving : on ? s.turnOff : s.turnOn}
              </button>
            </li>
          );
        })}
      </ul>
      {message && (
        <p role="status" className={`text-sm ${message.type === "error" ? "text-danger" : "text-foreground"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
