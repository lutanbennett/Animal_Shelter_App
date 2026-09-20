"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { moveResident } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import {
  EnclosurePicker,
  capacityWarningLevel,
} from "@/components/EnclosurePicker";
import { CapacityWarningDialog } from "@/components/CapacityWarningDialog";

export type CurrentLocation = {
  enclosureId: string | null;
  enclosureName: string | null;
  zoneName: string | null;
  since: string | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const textareaClass = `${inputClass} field-sizing-content`;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function MoveResidentForm({
  residentId,
  current,
  zones,
  enclosures,
}: {
  residentId: string;
  current: CurrentLocation;
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
}) {
  const { t, locale } = useI18n();
  const m = t.residents.move;
  const [state, formAction, pending] = useActionState(
    moveResident.bind(null, residentId),
    undefined,
  );
  const [enclosureId, setEnclosureId] = useState("");
  const [warningFor, setWarningFor] = useState<EnclosureOption | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Set once the warning has been accepted so the re-submit goes through.
  const confirmedRef = useRef(false);

  const target = enclosures.find((e) => e.id === enclosureId) ?? null;

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
          <h2 className="mb-1 text-sm font-medium text-muted">{m.currentLocation}</h2>
          <p className="text-base font-semibold text-foreground">
            {[current.enclosureName, current.zoneName].filter(Boolean).join(" · ") ||
              t.common.dash}
          </p>
          {current.since && (
            <p className="text-xs text-muted">
              {t.residents.hub.since(formatDate(current.since, locale))}
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="text-base font-semibold text-foreground">
            {m.moveTo}
          </legend>
          <EnclosurePicker
            zones={zones}
            enclosures={enclosures}
            value={enclosureId}
            onChange={(id) => {
              setEnclosureId(id);
              confirmedRef.current = false;
            }}
            currentEnclosureId={current.enclosureId}
            allowCurrent={false}
            required
            idPrefix="move"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="moveDate" className="text-sm font-medium text-muted">
                {m.fields.moveDate} <span className="text-danger">*</span>
              </label>
              <input
                id="moveDate"
                name="moveDate"
                type="date"
                required
                max={todayIso()}
                defaultValue={todayIso()}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium text-muted">
              {t.common.notes}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder={m.fields.notesPlaceholder}
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
            {pending ? m.moving : m.moveButton}
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
