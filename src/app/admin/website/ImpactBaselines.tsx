"use client";

import { useState, useTransition } from "react";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useWriteCall, useWriteForm } from "@/lib/use-write-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { todayIso } from "@/lib/format";
import { LIVE_TILE_MIN, type ImpactBaselineRow, type ShelterStats } from "@/lib/site/impact";
import { setStatisticShown, updateImpactBaseline } from "./actions";
import { DateInput } from "@/components/DateInput";

/**
 * The starting numbers behind the homepage's impact band (0156). The shelter
 * existed before the app, so each public figure is a number nobody recorded
 * plus what the app has counted since the date entered here. Changing one
 * changes a public claim, so saving asks first, and the change is in
 * Settings → Recent changes.
 */
export type LiveSwitchRow = { key: string; show_on_website: boolean };

/** The live counts, in the order the band draws them; labels come from the band's own dictionary. */
const LIVE_STATS = [
  { key: "in_care", label: "inCare" },
  { key: "adopted_this_year", label: "adoptedThisYear" },
  { key: "in_foster", label: "inFoster" },
  { key: "in_treatment", label: "inVetCare" },
] as const;

export function ImpactBaselines({
  rows,
  liveSwitches,
  liveStats,
  canEdit,
}: {
  rows: ImpactBaselineRow[];
  liveSwitches: LiveSwitchRow[];
  liveStats: ShelterStats | null;
  /** website.content at edit, the activity setStatisticShown asks: without it no tick is drawn. */
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const i = t.admin.website.impact;
  return (
    <section className="flex flex-col gap-4 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{i.heading}</h2>
        <p className="text-sm text-muted">{i.subtitle}</p>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <BaselineForm key={row.key} row={row} canEdit={canEdit} />
        ))}
      </div>
      <LiveCounts switches={liveSwitches} stats={liveStats} canEdit={canEdit} />
      <p className="text-xs text-muted">{i.hint}</p>
    </section>
  );
}

/**
 * One tick: show this statistic on the public homepage. Changing it changes a public claim, so it
 * asks first like a baseline save; the table's audit trigger puts it in Settings -> Recent changes.
 * Drawn only for a login that can edit the website (the same activity the action asks).
 */
function StatisticSwitch({
  kind,
  statKey,
  shown,
  name,
  canEdit,
}: {
  kind: "figure" | "live";
  statKey: string;
  shown: boolean;
  name: string;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const i = t.admin.website.impact;
  const [pending, startTransition] = useTransition();
  const save = useWriteCall();
  const [error, setError] = useState<string | null>(null);
  if (!canEdit) return null;

  async function toggle(next: boolean) {
    setError(null);
    // Ask outside the transition: a dialog opened from inside one cannot render until it ends.
    const ok = await confirm({ body: (next ? i.switchOnConfirm : i.switchOffConfirm).replace("{name}", name) });
    if (!ok) return;
    startTransition(async () => {
      const result = await save((requestId) => setStatisticShown(kind, statKey, next, requestId));
      if (!result.ok && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={shown}
          disabled={pending}
          onChange={(e) => void toggle(e.currentTarget.checked)}
          className="h-4 w-4"
        />
        {i.showOnWebsite}
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

/** The four live counts: a switch each. The numbers themselves are counted, never typed. */
function LiveCounts({
  switches,
  stats,
  canEdit,
}: {
  switches: LiveSwitchRow[];
  stats: ShelterStats | null;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const i = t.admin.website.impact;
  const s = t.home.stats;
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{i.liveHeading}</h3>
        <p className="text-xs text-muted">{i.liveSubtitle.replace("{min}", String(LIVE_TILE_MIN))}</p>
      </div>
      {LIVE_STATS.map(({ key, label }) => {
        const row = switches.find((r) => r.key === key);
        if (!row) return null;
        // public_shelter_stats gives NULL for a switched-off count, so the number is only known while on.
        const count = stats ? stats[key] : null;
        return (
          <div key={key} className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{s[label]}</p>
            <StatisticSwitch kind="live" statKey={key} shown={row.show_on_website} name={s[label]} canEdit={canEdit} />
            {!row.show_on_website && <p className="text-xs text-muted">{i.switchedOff}</p>}
            {row.show_on_website && count !== null && count < LIVE_TILE_MIN && (
              <p className="text-xs text-muted">
                {i.belowMin.replace("{count}", String(count)).replaceAll("{min}", String(LIVE_TILE_MIN))}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BaselineForm({ row, canEdit }: { row: ImpactBaselineRow; canEdit: boolean }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const i = t.admin.website.impact;
  const [state, onSubmit, pending] = useWriteForm(updateImpactBaseline, undefined);
  // What the live count adds after the date (public_impact_figures, 0156 and 0169); every other
  // figure is the baseline alone.
  const countedNote =
    row.key === "animals_rehomed"
      ? i.countedNote
      : row.key === "community_dogs"
        ? i.outingsNote
        : row.key === "villages_sterilised"
          ? i.outingsSterilisedNote
          : i.baselineOnlyNote;

  if (!canEdit) return null;
  return (
    <form
      onSubmit={(e) => {
        // First pass asks; the re-submit goes straight through.
        if ((e.currentTarget as HTMLFormElement).dataset.confirmed === "1") {
          (e.currentTarget as HTMLFormElement).dataset.confirmed = "";
          onSubmit(e);
          return;
        }
        const form = e.currentTarget;
        e.preventDefault();
        void confirm({ body: i.confirm }).then((ok) => {
          if (!ok) return;
          form.dataset.confirmed = "1";
          form.requestSubmit();
        });
      }}
      className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0"
    >
      <input type="hidden" name="key" value={row.key} />
      <div>
        <h3 className="text-sm font-semibold text-foreground">{row.label}</h3>
        <p className="text-xs text-muted">{countedNote}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {i.countLabel}
          <input
            name="baseline_count"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={row.baseline_count ?? ""}
            placeholder={i.countPlaceholder}
            className="w-32 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {i.dateLabel}
          <DateInput
            name="baseline_date"
            max={todayIso()}
            defaultValue={row.baseline_date ?? ""}
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {i.sinceYearLabel}
          <input
            name="since_year"
            type="number"
            min={1990}
            max={2100}
            step={1}
            inputMode="numeric"
            defaultValue={row.since_year ?? ""}
            placeholder={i.sinceYearPlaceholder}
            className="w-32 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={pending}>
          {pending ? t.common.saving : t.common.saveChanges}
        </ActionButton>
      </div>
      <StatisticSwitch kind="figure" statKey={row.key} shown={row.show_on_website} name={row.label} canEdit={canEdit} />
      {!row.show_on_website && <p className="text-xs text-muted">{i.switchedOff}</p>}
      <p className="text-xs text-muted">{i.sinceYearHelp}</p>
      {row.baseline_count === null && <p className="text-xs text-muted">{i.notShown}</p>}
      {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
      {state && state.ok && <p className="text-sm text-success">{state.success}</p>}
    </form>
  );
}
