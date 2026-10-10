"use client";

import { useId } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ZONE_SWATCHES, swatchFor, zoneColour } from "@/lib/zones/palette";

/**
 * The palette as a row of radio buttons: No colour, then each swatch. Real
 * radios, so arrow keys move between them and a screen reader says "Blue,
 * radio button, 2 of 13"; the swatch name is also printed under the row for
 * staff who know the zone as "the blue one". Each target is 44 px.
 *
 * A zone holding a colour that is not in the palette (a swatch retuned since,
 * or one set by hand) keeps it as an extra "Other colour" choice, so editing
 * only the name does not lose it.
 */
export function ZoneColourPicker({
  value,
  onChange,
  name,
  legend,
}: {
  /** The stored colour, or "" for none. */
  value: string;
  onChange?: (value: string) => void;
  /** Set when the picker is inside a form that posts it. */
  name?: string;
  legend?: string;
}) {
  const { t } = useI18n();
  const z = t.admin.zones;
  const group = useId();
  const current = zoneColour(value) ?? "";
  const swatch = swatchFor(current);
  const offPalette = current && !swatch ? current : null;

  const choices: { value: string; label: string }[] = [
    { value: "", label: z.noColour },
    ...ZONE_SWATCHES.map((s) => ({ value: s.hex, label: z.swatches[s.key] })),
    ...(offPalette ? [{ value: offPalette, label: z.otherColour }] : []),
  ];
  const chosen = choices.find((c) => c.value === current) ?? choices[0];

  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="mb-1 text-sm font-medium text-muted">{legend ?? z.colour}</legend>
      <div className="flex flex-wrap gap-0.5">
        {choices.map((choice) => {
          const checked = choice.value === current;
          return (
            <label
              key={choice.value || "none"}
              title={choice.label}
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
            >
              <input
                type="radio"
                name={name ?? group}
                value={choice.value}
                checked={checked}
                onChange={() => onChange?.(choice.value)}
                aria-label={choice.label}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                  checked ? "border-foreground" : "border-[var(--zone-dot-ring,var(--border))]"
                }`}
                style={choice.value ? { backgroundColor: choice.value } : undefined}
              >
                {!choice.value && <span className="h-0.5 w-4 rotate-45 rounded bg-muted" />}
              </span>
              {checked && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0.5 rounded-full border-2 border-primary"
                />
              )}
            </label>
          );
        })}
      </div>
      <span className="text-xs text-muted" aria-live="polite">
        {chosen.label}
      </span>
    </fieldset>
  );
}
