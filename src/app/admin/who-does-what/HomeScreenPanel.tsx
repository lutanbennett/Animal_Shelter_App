"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { addExtra } from "./actions";
import { addHomeTile, moveHomeTile, removeHomeTile } from "./home-tiles-actions";

/**
 * The Home screen panel (Admin, with the authenticator app, only; home-tiles-actions.ts refuses anyone else).
 * The role's tiles in order with up / down / Remove, and an Add that offers every page: one the role cannot open yet is
 * said so, with the single cell that would open it offered as a button. A tile whose cell was later removed stays in the
 * list, greyed, with why, because the home hides it and the panel must not pretend otherwise.
 * docs/decisions/2026-10-19-role-home-tiles-panel.md
 */
export type PanelTile = { path: string; label: string; hiddenWhy?: string };
export type PanelOption = {
  path: string;
  label: string;
  /** Present when the role cannot open the page yet: what is missing, in words. */
  missing?: string;
  /** The one cell that would open it, when giving a cell can (not for a clinic-scope rule or Bills). */
  grant?: { activity: string; level: number; activityLabel: string; levelLabel: string };
};

export function HomeScreenPanel({
  roleKey,
  roleName,
  tiles,
  options,
  derived,
  canEdit,
  locked,
  verifyHref,
}: {
  roleKey: string;
  roleName: string;
  tiles: PanelTile[];
  options: PanelOption[];
  /** No tiles are saved for this role: the list is the home it derives, and the first change saves it. */
  derived: boolean;
  canEdit: boolean;
  locked: boolean;
  verifyHref: string;
}) {
  const { t } = useI18n();
  const h = t.admin.whoDoesWhat.homeView;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const picked = options.find((o) => o.path === choice);

  function run(job: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const r = await job();
      if (!r.ok) setError(r.error);
      else setChoice("");
      router.refresh();
    });
  }

  const btn = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60";

  return (
    <section aria-labelledby="home-screen-h" className="flex flex-col gap-3">
      <h2 id="home-screen-h" className="text-lg font-semibold text-foreground">
        {h.heading(roleName)}
      </h2>
      <p className="text-sm text-muted [overflow-wrap:anywhere]">{h.intro}</p>
      {derived && <p className="text-sm text-foreground [overflow-wrap:anywhere]">{h.derivedNote}</p>}
      {!canEdit && !locked && <p className="text-sm text-muted">{h.readOnly}</p>}
      {locked && (
        <p className="text-sm text-foreground">
          {h.verifyPrompt}{" "}
          <Link href={verifyHref} className="font-medium text-primary underline">
            {h.verifyLink}
          </Link>
        </p>
      )}

      {tiles.length === 0 ? (
        <p className="text-sm text-foreground">{h.empty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {tiles.map((x, i) => (
            <li key={x.path} className={`flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-3 ${x.hiddenWhy ? "opacity-70" : ""}`}>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground [overflow-wrap:anywhere]">{x.label}</span>
                {x.hiddenWhy && <span className="block text-sm text-muted [overflow-wrap:anywhere]">{h.hidden(x.hiddenWhy)}</span>}
              </span>
              {canEdit && (
                <span className="flex gap-1">
                  <button type="button" disabled={pending || i === 0} aria-label={h.moveUp(x.label)} onClick={() => run(() => moveHomeTile(roleKey, x.path, "up"))} className={`${btn} border-border bg-surface text-foreground`}>
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button type="button" disabled={pending || i === tiles.length - 1} aria-label={h.moveDown(x.label)} onClick={() => run(() => moveHomeTile(roleKey, x.path, "down"))} className={`${btn} border-border bg-surface text-foreground`}>
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button type="button" disabled={pending} aria-label={h.removeFor(x.label)} onClick={() => run(() => removeHomeTile(roleKey, x.path))} className={`${btn} border-danger text-danger`}>
                    <X className="size-4" aria-hidden /> {h.remove}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {canEdit && options.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
          <label htmlFor="home-add" className="text-sm font-semibold text-foreground">
            {h.addHeading}
          </label>
          <select id="home-add" value={choice} onChange={(e) => setChoice(e.target.value)} className="min-h-11 rounded-md border border-border bg-background px-2 text-sm text-foreground">
            <option value="">{h.pick}</option>
            {options.map((o) => (
              <option key={o.path} value={o.path}>
                {o.label}
                {o.missing ? ` (${h.notYet})` : ""}
              </option>
            ))}
          </select>
          {picked && !picked.missing && (
            <div>
              <button type="button" disabled={pending} onClick={() => run(() => addHomeTile(roleKey, picked.path))} className={`${btn} border-primary bg-primary text-primary-foreground`}>
                {h.add}
              </button>
            </div>
          )}
          {picked?.missing && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-foreground [overflow-wrap:anywhere]">{h.cantOpen(roleName, picked.label, picked.missing)}</p>
              {picked.grant ? (
                <div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(async () => {
                        const g = await addExtra(roleKey, picked.grant!.activity, picked.grant!.level, h.grantReason(picked.label));
                        return g.ok ? addHomeTile(roleKey, picked.path) : g;
                      })
                    }
                    className={`${btn} border-primary bg-primary text-primary-foreground`}
                  >
                    {h.grantAndAdd(roleName, picked.grant.activityLabel, picked.grant.levelLabel)}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted">{h.cannotGrant}</p>
              )}
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </section>
  );
}
