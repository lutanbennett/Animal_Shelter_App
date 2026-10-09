"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { setOutreachWriterLevel } from "./outreach-writers";

export type OutreachWriterRole = { key: string; name: string; nameTh: string | null; level: 0 | 1 | 2 };

/**
 * Settings → Security: who may write outreach visit notes (0169). One choice
 * per role, saved as soon as it is picked; the cell behind it is the only
 * thing any page or policy asks.
 */
export function OutreachWriters({ roles }: { roles: OutreachWriterRole[] }) {
  const { t, locale } = useI18n();
  const w = t.outreach.writers;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <section className="flex max-w-2xl flex-col gap-4 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{w.heading}</h2>
        <p className="text-sm text-muted">{w.subtitle}</p>
      </div>
      {roles.length === 0 ? (
        <p className="text-sm text-muted">{w.noRoles}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {roles.map((role) => (
            <li key={role.key} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="text-sm font-medium text-foreground">
                {(locale === "th" && role.nameTh) || role.name}
              </span>
              <select
                aria-label={`${w.heading}: ${(locale === "th" && role.nameTh) || role.name}`}
                defaultValue={String(role.level)}
                disabled={pending}
                onChange={(e) => {
                  const level = Number(e.target.value) as 0 | 1 | 2;
                  setMessage(null);
                  startTransition(async () => {
                    const result = await setOutreachWriterLevel(role.key, level);
                    setMessage(result.ok ? { ok: true, text: w.saved } : { ok: false, text: result.error });
                    router.refresh();
                  });
                }}
                className="min-h-11 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:min-h-0"
              >
                <option value="0">{w.levels.none}</option>
                <option value="1">{w.levels.read}</option>
                <option value="2">{w.levels.edit}</option>
              </select>
            </li>
          ))}
        </ul>
      )}
      {message && <p className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
    </section>
  );
}
