"use client";

import type { ChangeEventHandler } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { unitLabel } from "@/lib/i18n/enum-labels";
import { offeredUnits, unitKey, type UnitList } from "@/lib/unit-list";

/**
 * The unit picker for an ingredient or a medicine: the units table's live units tagged for that list
 * (Settings → Units). A row already on a unit that is archived or tagged for the other list still shows it,
 * so opening the row does not silently pick something else; saving it unchanged is allowed.
 */
export function UnitSelect({
  list,
  current,
  name,
  id,
  value,
  defaultValue,
  onChange,
  className,
  required,
  "aria-label": ariaLabel,
}: {
  list: UnitList;
  /** The unit the row has now, if any. */
  current?: string | null;
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  className?: string;
  required?: boolean;
  "aria-label"?: string;
}) {
  const { t, units } = useI18n();
  const offered = offeredUnits(units, list).map((u) => u.name);
  const extra = current && !offered.some((n) => unitKey(n) === unitKey(current)) ? [current] : [];
  return (
    <select
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      className={className}
      required={required}
      aria-label={ariaLabel}
    >
      {[...offered, ...extra].map((n) => (
        <option key={n} value={n}>
          {unitLabel(t, n)}
        </option>
      ))}
    </select>
  );
}
