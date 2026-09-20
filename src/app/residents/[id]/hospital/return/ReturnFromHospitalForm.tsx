"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { returnFromHospital } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import {
  EnclosurePicker,
  capacityWarningLevel,
} from "@/components/EnclosurePicker";
import { CapacityWarningDialog } from "@/components/CapacityWarningDialog";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const textareaClass = `${inputClass} field-sizing-content`;

export function ReturnFromHospitalForm({
  residentId,
  admittedOn,
  previousEnclosure,
  hadPreviousEnclosure,
  zones,
  enclosures,
  today,
}: {
  residentId: string;
  /** Start of the hospital placement, i.e. the date admitted. */
  admittedOn: string | null;
  /**
   * Where the resident was before hospital, pre-selected in the picker;
   * null when nothing was recorded or that enclosure can't be chosen any
   * more (deleted, or a Lifecycle status rather than a physical enclosure).
   */
  previousEnclosure: EnclosureOption | null;
  /** True when a previous enclosure was recorded, even if it's unavailable now. */
  hadPreviousEnclosure: boolean;
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  /** YYYY-MM-DD, server-computed so the max attribute matches the server's check. */
  today: string;
}) {
  const { t, locale } = useI18n();
  const r = t.residents.hospitalReturn;
  const [state, formAction, pending] = useActionState(
    returnFromHospital.bind(null, residentId),
    undefined,
  );
  const [enclosureId, setEnclosureId] = useState(previousEnclosure?.id ?? "");
  const [warningFor, setWarningFor] = useState<EnclosureOption | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Set once the warning has been accepted so the re-submit goes through.
  const confirmedRef = useRef(false);

  const target = enclosures.find((e) => e.id === enclosureId) ?? null;

  // The previous enclosure is the default; say so, or say why there isn't
  // one, so the picker doesn't look like an unexplained empty field.
  const pickerHint = previousEnclosure
    ? r.defaultHint(previousEnclosure.name)
    : hadPreviousEnclosure
      ? r.previousUnavailable
      : r.noPrevious;

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(e) => {
          if (confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }
          if (target && capacityWarningLevel(target)) {
            e.preventDefault();
            setWarningFor(target);
          }
        }}
        className="flex max-w-2xl flex-col gap-6"
      >
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-1 text-sm font-medium text-muted">
            {t.residents.move.currentLocation}
          </h2>
          <p className="text-base font-semibold text-foreground">
            {t.residents.hub.inHospital}
          </p>
          <p className="text-xs text-muted">
            {admittedOn
              ? r.inHospitalSince(formatDate(admittedOn, locale))
              : t.residents.hub.inHospitalDetail}
          </p>
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="text-base font-semibold text-foreground">
            {r.returnTo}
          </legend>
          <p className="text-sm text-muted">{pickerHint}</p>
          <EnclosurePicker
            zones={zones}
            enclosures={enclosures}
            value={enclosureId}
            onChange={(id) => {
              setEnclosureId(id);
              confirmedRef.current = false;
            }}
            required
            idPrefix="return"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="date" className="text-sm font-medium text-muted">
                {r.fields.date} <span className="text-danger">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                min={admittedOn?.slice(0, 10)}
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
              placeholder={r.fields.notesPlaceholder}
              className={textareaClass}
            />
          </div>
        </fieldset>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !enclosureId}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? r.returning : r.returnButton}
          </button>
          <Link
            href={`/residents/${residentId}`}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t.common.cancel}
          </Link>
        </div>
      </form>

      <CapacityWarningDialog
        enclosure={warningFor}
        pending={pending}
        onCancel={() => setWarningFor(null)}
        onConfirm={() => {
          setWarningFor(null);
          confirmedRef.current = true;
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
