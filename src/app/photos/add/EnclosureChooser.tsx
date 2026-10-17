"use client";

import { useState } from "react";
import { placeName } from "@/lib/enclosures/names";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { EnclosureChoices } from "@/lib/photos/pending";

export type PickedEnclosure = { id: string; label: string };

/**
 * "I don't know who: tag the enclosure." Zone first, then the enclosures in that zone, the same order as everywhere
 * else, as big tap targets rather than dropdowns: this is the likely path for a volunteer on a phone. The enclosures
 * this person tagged last come first, because a walk round one zone files several photos in one place.
 */
export function EnclosureChooser({
  choices,
  recentIds,
  onPick,
}: {
  choices: EnclosureChoices;
  recentIds: string[];
  onPick: (e: PickedEnclosure) => void;
}) {
  const { t, locale } = useI18n();
  const a = t.addPhotos.enclosure;
  const [zoneId, setZoneId] = useState<string | null>(null);
  const zone = choices.zones.find((z) => z.id === zoneId) ?? null;
  const labelOf = (e: { name: string; nameTh: string | null }) => placeName(locale, e.name, e.nameTh);
  const all = choices.zones.flatMap((z) => z.enclosures);
  const recent = recentIds.map((id) => all.find((e) => e.id === id)).filter((e): e is (typeof all)[number] => !!e);
  const chip =
    "min-h-11 rounded-full border border-border bg-surface px-4 text-left text-base font-medium text-foreground break-words";

  if (choices.zones.length === 0) return <p className="text-sm text-muted">{a.none}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{a.help}</p>
      {recent.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{a.recent}</h3>
          <div className="flex flex-wrap gap-2">
            {recent.map((e) => (
              <button key={e.id} type="button" className={chip} onClick={() => onPick({ id: e.id, label: labelOf(e) })}>
                {labelOf(e)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{a.zone}</h3>
        <div className="flex flex-wrap gap-2">
          {choices.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              aria-pressed={z.id === zoneId}
              onClick={() => setZoneId(z.id === zoneId ? null : z.id)}
              className={`${chip} ${z.id === zoneId ? "border-2 border-primary bg-primary/10" : ""}`}
            >
              {z.colour && <span aria-hidden className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ backgroundColor: z.colour }} />}
              {labelOf(z)}
            </button>
          ))}
        </div>
      </div>
      {zone && (
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{a.which(labelOf(zone))}</h3>
          <div className="flex flex-wrap gap-2">
            {zone.enclosures.map((e) => (
              <button key={e.id} type="button" className={chip} onClick={() => onPick({ id: e.id, label: labelOf(e) })}>
                {labelOf(e)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
