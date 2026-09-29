"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { MICROCHIP_LENGTH } from "@/lib/residents/microchip";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * Chip number and implant date, shared by the intake wizard's Health step
 * and Edit resident. Spaces and dashes are fine to type or paste; the
 * action strips them (lib/residents/microchip.ts). Optional: null is normal.
 */
export function MicrochipFields({
  number,
  implantedOn,
  idPrefix = "",
}: {
  number?: string | null;
  implantedOn?: string | null;
  idPrefix?: string;
}) {
  const { t } = useI18n();
  const f = t.residents.new.fields;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}microchipNumber`} className="text-sm font-medium text-muted">
          {f.microchipNumber}
        </label>
        <input
          id={`${idPrefix}microchipNumber`}
          name="microchipNumber"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={MICROCHIP_LENGTH + 6}
          defaultValue={number ?? ""}
          aria-describedby={`${idPrefix}microchipNumber-hint`}
          className={`${inputClass} font-mono`}
        />
        <p id={`${idPrefix}microchipNumber-hint`} className="text-xs text-muted">
          {f.microchipNumberHint}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}microchipImplantedOn`} className="text-sm font-medium text-muted">
          {f.microchipImplantedOn}
        </label>
        <input
          id={`${idPrefix}microchipImplantedOn`}
          name="microchipImplantedOn"
          type="date"
          defaultValue={implantedOn ?? ""}
          className={inputClass}
        />
      </div>
    </div>
  );
}
