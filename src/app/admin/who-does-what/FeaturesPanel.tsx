"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RowActionButton } from "@/components/RowAction";
import type { ActionResult } from "@/lib/action-result";
import { addFeature, moveFeature, removeFeature, renameFeature, setCardFeature } from "./actions";

/**
 * The Features panel: the areas the Available cards are sectioned by (features, 0255). Admin adds, renames (English and
 * Thai), reorders and deletes them, and files each card under one. A card's feature is one mapping for every role. Deleting
 * a feature leaves its cards under Not yet sorted. None of it changes what any role can do.
 * docs/decisions/2026-10-24-who-does-what-features-app.md
 */
export type PanelFeature = { id: string; name: string; nameTh: string };
export type PanelCard = { key: string; label: string; feature: string | null };

const field = "min-h-11 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground";

export function FeaturesPanel({ features, cards, canEdit, locked }: { features: PanelFeature[]; cards: PanelCard[]; canEdit: boolean; locked: boolean }) {
  const { t } = useI18n();
  const fc = t.admin.whoDoesWhat.features;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const known = new Set(features.map((f) => f.id));

  function run(step: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await step();
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="features-h" className="flex flex-col gap-3">
      <h2 id="features-h" className="text-lg font-semibold text-foreground">
        {fc.panelHeading}
      </h2>
      <p className="text-sm text-muted [overflow-wrap:anywhere]">{fc.panelIntro}</p>
      {locked && (
        <p role="note" className="text-sm text-foreground">
          {fc.lockedNote}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
      {features.length === 0 && <p className="text-sm text-foreground">{fc.noFeatures}</p>}
      <ol className="flex flex-col gap-3">
        {features.map((f, i) => (
          <FeatureRow key={f.id} feature={f} first={i === 0} last={i === features.length - 1} canEdit={canEdit} pending={pending} run={run} />
        ))}
      </ol>
      {canEdit && <AddFeatureForm pending={pending} onAdded={() => router.refresh()} />}
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-foreground">{fc.cardsHeading}</summary>
        <p className="mb-2 text-muted">{fc.cardsIntro}</p>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {cards.map((c) => (
            <li key={c.key} className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-surface p-2">
              <span className="text-foreground [overflow-wrap:anywhere]">{c.label}</span>
              <select
                aria-label={fc.featureFor(c.label)}
                value={c.feature && known.has(c.feature) ? c.feature : ""}
                disabled={!canEdit || pending}
                onChange={(e) => run(() => setCardFeature(c.key, e.target.value || null))}
                className={field}
              >
                <option value="">{fc.unsorted}</option>
                {features.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function FeatureRow({
  feature,
  first,
  last,
  canEdit,
  pending,
  run,
}: {
  feature: PanelFeature;
  first: boolean;
  last: boolean;
  canEdit: boolean;
  pending: boolean;
  run: (step: () => Promise<ActionResult>) => void;
}) {
  const { t } = useI18n();
  const fc = t.admin.whoDoesWhat.features;
  const [name, setName] = useState(feature.name);
  const [nameTh, setNameTh] = useState(feature.nameTh);
  const dirty = name !== feature.name || nameTh !== feature.nameTh;
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          {fc.name}
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          {fc.nameTh}
          <input value={nameTh} onChange={(e) => setNameTh(e.target.value)} disabled={!canEdit} lang="th" className={field} />
        </label>
      </div>
      {canEdit && (
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            aria-label={fc.saveFor(feature.name)}
            disabled={pending || !dirty || !name.trim()}
            onClick={() => run(() => renameFeature(feature.id, name, nameTh))}
            className="min-h-11 rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {fc.save}
          </button>
          {!first && <RowActionButton icon={ArrowUp} label={fc.moveUpFor(feature.name)} disabled={pending} onClick={() => run(() => moveFeature(feature.id, "up"))} />}
          {!last && <RowActionButton icon={ArrowDown} label={fc.moveDownFor(feature.name)} disabled={pending} onClick={() => run(() => moveFeature(feature.id, "down"))} />}
          <RowActionButton icon={X} tone="danger" label={fc.removeFor(feature.name)} disabled={pending} onClick={() => run(() => removeFeature(feature.id))} />
        </div>
      )}
    </li>
  );
}

function AddFeatureForm({ pending, onAdded }: { pending: boolean; onAdded: () => void }) {
  const { t } = useI18n();
  const fc = t.admin.whoDoesWhat.features;
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [busy, startAdd] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <details className="text-sm">
      <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-foreground">{fc.addHeading}</summary>
      <form
        className="flex max-w-xl flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const added = name.trim();
          setResult(null);
          startAdd(async () => {
            const r = await addFeature(name, nameTh);
            if (r.ok) {
              setName("");
              setNameTh("");
              setResult({ ok: true, text: fc.added(added) });
              onAdded();
            } else setResult({ ok: false, text: r.error });
          });
        }}
      >
        <label className="flex flex-col gap-1 text-foreground">
          {fc.name}
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-foreground">
          {fc.nameTh}
          <input value={nameTh} onChange={(e) => setNameTh(e.target.value)} lang="th" className={field} />
          <span className="text-xs text-muted">{fc.nameThOptional}</span>
        </label>
        <button type="submit" disabled={pending || busy || !name.trim()} className="min-h-11 self-start rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {fc.add}
        </button>
        {!name.trim() && <p className="text-sm text-muted">{fc.nameNeeded}</p>}
        {result && (
          <p role={result.ok ? "status" : "alert"} className={`text-sm [overflow-wrap:anywhere] ${result.ok ? "text-foreground" : "text-danger"}`}>
            {result.text}
          </p>
        )}
      </form>
    </details>
  );
}
