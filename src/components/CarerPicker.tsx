"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { CarerOption } from "@/lib/contacts/carers";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * Carer selection for foster / adopt forms: a select over the existing
 * Carer contacts, or a small inline form to add one on the spot. The two
 * modes post different fields (`carerId` vs `newCarerName` & co.) and the
 * `carerMode` field says which one the server should read, so a stale
 * select value can't sneak through alongside a new carer.
 *
 * Only contacts of type Carer are offered (loadCarerOptions) — volunteers,
 * suppliers and donors share the table but can't be given a resident.
 * Inline creation stays alongside /admin/contacts so that staff standing
 * with a new foster carer can record the placement without an admin.
 */
export function CarerPicker({
  carers,
  value,
  onChange,
  currentCarerId,
  disabledCarerId,
}: {
  carers: CarerOption[];
  value: string;
  onChange: (id: string) => void;
  /** Labelled "(current carer)" in the list. */
  currentCarerId?: string | null;
  /** Can't be chosen — e.g. the current carer when moving to another. */
  disabledCarerId?: string | null;
}) {
  const { t } = useI18n();
  const r = t.residents.rehome;
  const [mode, setMode] = useState<"existing" | "new">(
    carers.length === 0 ? "new" : "existing",
  );

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="carerMode" value={mode} />

      {mode === "existing" ? (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="carerId" className="text-sm font-medium text-muted">
              {r.carer} <span className="text-danger">*</span>
            </label>
            <select
              id="carerId"
              name="carerId"
              required
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={inputClass}
            >
              <option value="">{r.selectCarer}</option>
              {carers.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  disabled={c.id === disabledCarerId}
                >
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                  {c.id === currentCarerId ? ` ${r.currentCarerSuffix}` : ""}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted">{r.carersOnlyHint}</p>
          <button
            type="button"
            onClick={() => setMode("new")}
            className="self-start text-sm font-medium text-primary hover:underline"
          >
            {r.addNewCarer}
          </button>
        </>
      ) : (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <legend className="px-1 text-sm font-medium text-muted">
            {r.addNewCarer}
          </legend>
          {carers.length === 0 && (
            <p className="text-sm text-muted">{r.noCarers}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="newCarerName" className="text-sm font-medium text-muted">
                {r.newCarer.name} <span className="text-danger">*</span>
              </label>
              <input
                id="newCarerName"
                name="newCarerName"
                type="text"
                required
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="newCarerPhone" className="text-sm font-medium text-muted">
                {r.newCarer.phone}
              </label>
              <input
                id="newCarerPhone"
                name="newCarerPhone"
                type="tel"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="newCarerLineId" className="text-sm font-medium text-muted">
                {r.newCarer.lineId}
              </label>
              <input
                id="newCarerLineId"
                name="newCarerLineId"
                type="text"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="newCarerEmail" className="text-sm font-medium text-muted">
                {r.newCarer.email}
              </label>
              <input
                id="newCarerEmail"
                name="newCarerEmail"
                type="email"
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-xs text-muted">{r.newCarer.hint}</p>
          {carers.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("existing")}
              className="self-start text-sm font-medium text-primary hover:underline"
            >
              {r.chooseExisting}
            </button>
          )}
        </fieldset>
      )}
    </div>
  );
}
