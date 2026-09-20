"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { rehome } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { statusLabel } from "@/lib/i18n/enum-labels";
import type { CarerOption } from "@/lib/contacts/carers";
import type { RehomeKind } from "@/lib/placements/rehome";
import { CarerPicker } from "@/components/CarerPicker";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const textareaClass = `${inputClass} field-sizing-content`;

export type RehomeCurrent = {
  status: string | null;
  enclosureName: string | null;
  zoneName: string | null;
  carerName: string | null;
  since: string | null;
};

function kindButtonClass(active: boolean) {
  return `flex-1 rounded px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted hover:text-foreground"
  }`;
}

export function RehomeForm({
  residentId,
  current,
  carers,
  currentCarerId,
  defaultCarerId,
  fromHospitalCarerName,
  defaultKind,
  today,
}: {
  residentId: string;
  current: RehomeCurrent;
  carers: CarerOption[];
  /** The carer they're fostered with right now, if any. */
  currentCarerId: string | null;
  /** Pre-selected carer: the current one, or the one before hospital. */
  defaultCarerId: string | null;
  /** Set when the pre-selection comes from a foster interrupted by hospital. */
  fromHospitalCarerName: string | null;
  defaultKind: RehomeKind;
  /** YYYY-MM-DD, server-computed so the max attribute matches the server's check. */
  today: string;
}) {
  const { t, locale } = useI18n();
  const r = t.residents.rehome;
  const [state, formAction, pending] = useActionState(
    rehome.bind(null, residentId),
    undefined,
  );
  const [kind, setKind] = useState<RehomeKind>(defaultKind);
  const [carerId, setCarerId] = useState(defaultCarerId ?? "");

  const isFostered = current.status === "Fostered";
  // A foster can't be re-recorded with the same carer; while the kind is
  // foster the current carer drops out of the running. The selection is
  // only masked, not cleared, so flipping back to Adopt restores it.
  const disabledCarerId = isFostered && kind === "foster" ? currentCarerId : null;
  const effectiveCarerId = carerId === disabledCarerId ? "" : carerId;

  const currentLine = isFostered
    ? current.carerName
      ? t.residents.hub.fosteredWith(current.carerName)
      : t.residents.hub.fosteredNoCarer
    : current.status === "Hospitalised"
      ? t.residents.hub.inHospital
      : [current.enclosureName, current.zoneName].filter(Boolean).join(" · ") ||
        statusLabel(t, current.status);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-1 text-sm font-medium text-muted">
          {t.residents.move.currentLocation}
        </h2>
        <p className="text-base font-semibold text-foreground">{currentLine}</p>
        {current.since && (
          <p className="text-xs text-muted">
            {t.residents.hub.since(formatDate(current.since, locale))}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-base font-semibold text-foreground">
          {r.kind}
        </legend>
        <input type="hidden" name="kind" value={kind} />
        <div
          role="radiogroup"
          aria-label={r.kind}
          className="flex gap-1 rounded-lg border border-border bg-surface p-1"
        >
          {(["foster", "adopt"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={kindButtonClass(kind === k)}
            >
              {r.kinds[k]}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{r.kindHints[kind]}</p>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-foreground">
          {r.carer}
        </legend>
        {isFostered && kind === "foster" && (
          <p className="text-sm text-muted">{r.changeCarerHint}</p>
        )}
        {fromHospitalCarerName && (
          <p className="text-sm text-muted">
            {r.fromHospitalHint(fromHospitalCarerName)}
          </p>
        )}
        <CarerPicker
          carers={carers}
          value={effectiveCarerId}
          onChange={setCarerId}
          currentCarerId={currentCarerId}
          disabledCarerId={disabledCarerId}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="date" className="text-sm font-medium text-muted">
              {kind === "foster" ? r.fields.dateFoster : r.fields.dateAdopt}{" "}
              <span className="text-danger">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              min={current.since?.slice(0, 10)}
              max={today}
              defaultValue={today}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-muted">
            {r.fields.notes}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder={
              kind === "foster"
                ? r.fields.notesPlaceholderFoster
                : r.fields.notesPlaceholderAdopt
            }
            className={textareaClass}
          />
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? r.saving : r.buttons[kind]}
        </button>
        <Link
          href={`/residents/${residentId}`}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
