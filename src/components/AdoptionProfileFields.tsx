"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  COMPATIBILITY_VALUES,
  ENERGY_LEVELS,
  compatibilityLabel,
  energyLevelLabel,
} from "@/lib/i18n/enum-labels";

export type AdoptionProfile = {
  colour: string | null;
  is_desexed: boolean | null;
  good_with_dogs: string | null;
  good_with_cats: string | null;
  good_with_children: string | null;
  energy_level: string | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * The adoption recommendation fields (0060), shared by the intake and
 * edit forms so they read alike: colour, desexed, good with dogs / cats /
 * children, energy level. All optional — a blank means "nobody has said"
 * and the public profile shows nothing for it. Field names are what
 * readAdoptionProfile() in lib/residents/adoption-profile.ts expects.
 */
export function AdoptionProfileFields({
  value,
  idPrefix = "",
}: {
  value?: AdoptionProfile | null;
  idPrefix?: string;
}) {
  const { t } = useI18n();
  const f = t.residents.new.fields;
  const id = (name: string) => `${idPrefix}${name}`;

  const compat = (name: string, label: string, current: string | null | undefined) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={id(name)} className="text-sm font-medium text-muted">
        {label}
      </label>
      <select id={id(name)} name={name} defaultValue={current ?? ""} className={inputClass}>
        <option value="">{f.notSet}</option>
        {COMPATIBILITY_VALUES.map((v) => (
          <option key={v} value={v}>
            {compatibilityLabel(t, v)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={id("colour")} className="text-sm font-medium text-muted">
          {f.colour}
        </label>
        <input
          id={id("colour")}
          name="colour"
          defaultValue={value?.colour ?? ""}
          placeholder={f.colourHint}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id("isDesexed")} className="text-sm font-medium text-muted">
          {f.desexed}
        </label>
        <select
          id={id("isDesexed")}
          name="isDesexed"
          defaultValue={value?.is_desexed == null ? "" : value.is_desexed ? "yes" : "no"}
          className={inputClass}
        >
          <option value="">{f.desexedUnknown}</option>
          <option value="yes">{t.common.yes}</option>
          <option value="no">{t.common.no}</option>
        </select>
      </div>
      {compat("goodWithDogs", f.goodWithDogs, value?.good_with_dogs)}
      {compat("goodWithCats", f.goodWithCats, value?.good_with_cats)}
      {compat("goodWithChildren", f.goodWithChildren, value?.good_with_children)}
      <div className="flex flex-col gap-1">
        <label htmlFor={id("energyLevel")} className="text-sm font-medium text-muted">
          {f.energyLevel}
        </label>
        <select
          id={id("energyLevel")}
          name="energyLevel"
          defaultValue={value?.energy_level ?? ""}
          className={inputClass}
        >
          <option value="">{f.notSet}</option>
          {ENERGY_LEVELS.map((v) => (
            <option key={v} value={v}>
              {energyLevelLabel(t, v)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
