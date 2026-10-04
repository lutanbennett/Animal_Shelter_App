import type { ListedMedication, MedicationList } from "./load";

export type PickLine = {
  medicationId: string;
  name: string;
  doseUnit: string;
  labelFileId: string | null;
  /** How many doses to bag: one per prescription due in the round. */
  doses: number;
  /** Sum of the recorded amounts, in `doseUnit`. */
  total: number;
  /** Some dose has no amount recorded, so `total` is short. */
  amountMissing: boolean;
};

export type PickEnclosure = {
  enclosure: { name: string; nameTh: string | null };
  lines: PickLine[];
};
export type PickZone = {
  zone: { name: string; nameTh: string | null };
  lines: PickLine[];
  enclosures: PickEnclosure[];
};
export type PickList = {
  zones: PickZone[];
  /** Due today but with no round ticked: not in the totals, so say so rather than under-bag. */
  noRoundDoses: number;
};

const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function add(lines: Map<string, PickLine>, med: ListedMedication) {
  const key = `${med.medicationId}|${med.doseUnit}`;
  const line =
    lines.get(key) ??
    {
      medicationId: med.medicationId,
      name: med.name,
      doseUnit: med.doseUnit,
      labelFileId: med.labelFileId,
      doses: 0,
      total: 0,
      amountMissing: false,
    };
  line.doses += 1;
  if (med.quantity == null) line.amountMissing = true;
  else line.total += med.quantity;
  lines.set(key, line);
}

const sorted = (m: Map<string, PickLine>) => [...m.values()].sort((a, b) => natural.compare(a.name, b.name));

/**
 * The stock-room pick list: the same doses the by-resident list shows for the chosen round, summed
 * per zone and then per enclosure. A pure fold over `loadMedicationList`, so the two screens cannot
 * disagree about what is due. Only `place === "round"` counts: as-needed has no dose to count, and a
 * prescription with no round is reported in `noRoundDoses` instead of being silently left out.
 * Residents listed apart (hospital, foster) are not in an enclosure and are not bagged for here.
 */
export function buildPickList(list: MedicationList): PickList {
  let noRoundDoses = 0;
  const zones: PickZone[] = [];
  for (const z of list.zones) {
    const zoneLines = new Map<string, PickLine>();
    const enclosures: PickEnclosure[] = [];
    for (const e of z.enclosures) {
      const lines = new Map<string, PickLine>();
      for (const r of e.residents) {
        for (const med of r.medications) {
          if (med.place === "noRound") noRoundDoses += 1;
          if (med.place !== "round") continue;
          add(lines, med);
          add(zoneLines, med);
        }
      }
      if (lines.size) enclosures.push({ enclosure: e.enclosure, lines: sorted(lines) });
    }
    if (enclosures.length) zones.push({ zone: z.zone, lines: sorted(zoneLines), enclosures });
  }
  return { zones, noRoundDoses };
}
