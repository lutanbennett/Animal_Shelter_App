"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useKeptForm } from "@/lib/use-kept-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { todayIso } from "@/lib/format";
import type { ImpactBaselineRow } from "@/lib/site/impact";
import { updateImpactBaseline } from "./actions";

/**
 * The starting numbers behind the homepage's impact band (0156). The shelter
 * existed before the app, so each public figure is a number nobody recorded
 * plus what the app has counted since the date entered here. Changing one
 * changes a public claim, so saving asks first, and the change is in
 * Settings → Recent changes.
 */
export function ImpactBaselines({ rows }: { rows: ImpactBaselineRow[] }) {
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
          <BaselineForm key={`${row.key}-${row.set_at}`} row={row} />
        ))}
      </div>
      <p className="text-xs text-muted">{i.hint}</p>
    </section>
  );
}

function BaselineForm({ row }: { row: ImpactBaselineRow }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const i = t.admin.website.impact;
  const [state, onSubmit, pending] = useKeptForm(updateImpactBaseline, undefined);
  const counted = row.key === "animals_rehomed";

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
        <p className="text-xs text-muted">{counted ? i.countedNote : i.baselineOnlyNote}</p>
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
          <input
            name="baseline_date"
            type="date"
            max={todayIso()}
            defaultValue={row.baseline_date ?? ""}
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={pending}>
          {pending ? t.common.saving : t.common.saveChanges}
        </ActionButton>
      </div>
      {row.baseline_count === null && <p className="text-xs text-muted">{i.notShown}</p>}
      {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
      {state && state.ok && <p className="text-sm text-success">{state.success}</p>}
    </form>
  );
}
