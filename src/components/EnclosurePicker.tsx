"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import {
  OCCUPANCY_TONE,
  occupancyLevel,
  type OccupancyLevel,
} from "@/lib/enclosures/occupancy";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import type { StatCardTone } from "@/components/StatCard";

const TEXT_CLASSES: Record<StatCardTone, string> = {
  success: "text-success",
  warning: "text-primary",
  danger: "text-danger",
  neutral: "text-muted",
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

/**
 * How full the enclosure would be once one more resident moves in, when
 * that's worth a warning; null when there's room or no capacity is set.
 */
export function capacityWarningLevel(
  enclosure: EnclosureOption,
): Exclude<OccupancyLevel, "ok" | "unknown"> | null {
  const level = occupancyLevel(enclosure.residentCount + 1, enclosure.capacity);
  return level === "ok" || level === "unknown" ? null : level;
}

/**
 * Zone → enclosure dependent dropdowns. The enclosure list is scoped to the
 * chosen zone (there are well over a hundred enclosures), and the chosen
 * enclosure's occupancy is shown underneath so a full one isn't a surprise
 * at submit time. Only the enclosure id is submitted, as `name`.
 */
export function EnclosurePicker({
  zones,
  enclosures,
  value,
  onChange,
  name = "enclosureId",
  currentEnclosureId = null,
  allowCurrent = true,
  required = false,
  idPrefix = "enclosure-picker",
}: {
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  /** Selected enclosure id, or "" for none. */
  value: string;
  onChange: (enclosureId: string) => void;
  name?: string;
  /** Where the resident is now — labelled, and disabled unless `allowCurrent`. */
  currentEnclosureId?: string | null;
  allowCurrent?: boolean;
  required?: boolean;
  idPrefix?: string;
}) {
  const { t, locale } = useI18n();
  const m = t.residents.move;
  const [zoneId, setZoneId] = useState(
    () => enclosures.find((e) => e.id === value)?.zoneId ?? "",
  );

  const enclosuresInZone = enclosures.filter((e) => e.zoneId === zoneId);
  const selected = enclosures.find((e) => e.id === value) ?? null;
  const level = selected
    ? occupancyLevel(selected.residentCount, selected.capacity)
    : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-zone`} className="text-sm font-medium text-muted">
          {t.common.zone} {required && <span className="text-danger">*</span>}
        </label>
        <select
          id={`${idPrefix}-zone`}
          value={zoneId}
          onChange={(e) => {
            setZoneId(e.target.value);
            onChange("");
          }}
          className={inputClass}
        >
          <option value="">{m.selectZone}</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {placeName(locale, z.name, z.name_th)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}-enclosure`}
          className="text-sm font-medium text-muted"
        >
          {t.common.enclosure} {required && <span className="text-danger">*</span>}
        </label>
        <select
          id={`${idPrefix}-enclosure`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!zoneId}
          className={inputClass}
        >
          <option value="">
            {zoneId ? m.selectEnclosure : m.selectZoneFirst}
          </option>
          {enclosuresInZone.map((e) => {
            const isCurrent = e.id === currentEnclosureId;
            return (
              <option key={e.id} value={e.id} disabled={isCurrent && !allowCurrent}>
                {placeName(locale, e.name, e.name_th)}
                {isCurrent ? ` ${m.currentSuffix}` : ""}
                {e.capacity != null && e.capacity > 0
                  ? ` — ${t.enclosures.occupancy(e.residentCount, e.capacity)}`
                  : ""}
              </option>
            );
          })}
        </select>
        {selected && level && (
          <span className={`text-xs ${TEXT_CLASSES[OCCUPANCY_TONE[level]]}`}>
            {level === "unknown"
              ? `${t.enclosures.residentsCount(selected.residentCount)} · ${t.enclosures.noCapacity}`
              : `${t.enclosures.occupancy(selected.residentCount, selected.capacity ?? 0)} · ${t.enclosures.levels[level]}`}
          </span>
        )}
      </div>
    </div>
  );
}
