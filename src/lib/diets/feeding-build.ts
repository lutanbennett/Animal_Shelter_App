import { dayAmount, perMealAmount, type DietServings } from "@/lib/diets/servings";
import type { PlaceOrder } from "@/lib/enclosures/order";

/**
 * The arithmetic of the Feeding list, kept apart from the database so it can be tested on its own.
 *
 * A dog's amount of an ingredient in ONE meal is
 *   qty per serving x the diet's servings for the dog's size x the dog's portion factor / meals per day
 * (diets/servings.ts, 0250). A zone's batch is the SUM of those, unrounded: rounding each dog first would
 * make the batch wrong (Lutan, 2026-10-22: "Fractions are not a problem… a 3/4 egg would never be an issue
 * at those volumes"). Nothing here rounds; the page rounds once, when it prints (formatAmount).
 */

export type FeedingLine = {
  ingredientId: string;
  /** Already in the reader's language. */
  name: string;
  /** The unit the amount is in: the line's serving unit, else the ingredient's own. */
  unit: string;
  qtyPerServing: number;
};

export type FeedingDiet = {
  id: string;
  name: string;
  isStandard: boolean;
  servings: DietServings;
  lines: FeedingLine[];
};

export type FeedingPlace = {
  zone: { name: string; nameTh: string | null; colour: string | null };
  enclosure: { id: string | null; name: string; nameTh: string | null };
};

export type FeedingDog = {
  id: string;
  name: string;
  thaiName: string | null;
  photoFileId: string | null;
  size: string | null;
  status: string | null;
  /** Null for a dog with no enclosure, or not a current Resident (hospital, foster, outreach). */
  place: FeedingPlace | null;
  dietId: string;
  mealsPerDay: number | null;
  portionFactor: number | null;
  /** The food rounds the diet is fed in; empty means none is ticked (shown in every round, flagged). */
  rounds: readonly string[];
  notes: string | null;
};

export type DogLine = { ingredientId: string; name: string; unit: string; amount: number };

export type FedDog = FeedingDog & {
  diet: { id: string; name: string; isStandard: boolean };
  /** No round ticked on the diet: the dog is in every round and the page says so. */
  noRound: boolean;
  /** This dog's share of one meal. */
  lines: DogLine[];
};

export type TotalLine = { ingredientId: string; name: string; unit: string; total: number };

export type DietBlock = {
  diet: { id: string; name: string; isStandard: boolean };
  dogCount: number;
  lines: TotalLine[];
};

const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** Every dog fed in this round, each with their share of one meal. */
export function feedDogs(dogs: readonly FeedingDog[], diets: ReadonlyMap<string, FeedingDiet>, round: string): FedDog[] {
  const fed: FedDog[] = [];
  for (const dog of dogs) {
    const diet = diets.get(dog.dietId);
    if (!diet) continue;
    const noRound = dog.rounds.length === 0;
    if (!noRound && !dog.rounds.includes(round)) continue;
    fed.push({
      ...dog,
      diet: { id: diet.id, name: diet.name, isStandard: diet.isStandard },
      noRound,
      lines: diet.lines.map((l) => ({
        ingredientId: l.ingredientId,
        name: l.name,
        unit: l.unit,
        amount: perMealAmount(dayAmount(l.qtyPerServing, diet.servings, dog.size, dog.portionFactor), dog.mealsPerDay),
      })),
    });
  }
  return fed;
}

/**
 * The dogs' meals added up, one block per diet: Standard first, then the special diets by name. A special
 * diet is never merged into the Standard pile. Totals are unrounded sums.
 */
export function blocksFor(dogs: readonly FedDog[]): DietBlock[] {
  const blocks = new Map<string, DietBlock & { sums: Map<string, TotalLine> }>();
  for (const dog of dogs) {
    let block = blocks.get(dog.diet.id);
    if (!block) {
      block = { diet: dog.diet, dogCount: 0, lines: [], sums: new Map() };
      blocks.set(dog.diet.id, block);
    }
    block.dogCount += 1;
    for (const l of dog.lines) {
      const key = `${l.ingredientId}|${l.unit}`;
      const sum = block.sums.get(key);
      if (sum) sum.total += l.amount;
      else block.sums.set(key, { ingredientId: l.ingredientId, name: l.name, unit: l.unit, total: l.amount });
    }
  }
  return [...blocks.values()]
    .map(({ sums, ...block }) => ({ ...block, lines: [...sums.values()].sort((a, b) => natural.compare(a.name, b.name)) }))
    .sort((a, b) => Number(b.diet.isStandard) - Number(a.diet.isStandard) || natural.compare(a.diet.name, b.diet.name));
}

export type EnclosureGroup = {
  enclosure: { id: string | null; name: string; nameTh: string | null };
  dogs: FedDog[];
  blocks: DietBlock[];
};

export type ZoneGroup = {
  zone: { name: string; nameTh: string | null; colour: string | null };
  dogs: FedDog[];
  blocks: DietBlock[];
  enclosures: EnclosureGroup[];
};

/** Zones then enclosures in the shelter's walking order; dogs with no place are kept apart, never dropped. */
export function groupByPlace(fed: readonly FedDog[], order: PlaceOrder) {
  const zones = new Map<string, ZoneGroup>();
  const apart: FedDog[] = [];
  for (const dog of fed) {
    if (!dog.place) {
      apart.push(dog);
      continue;
    }
    const { zone, enclosure } = dog.place;
    let z = zones.get(zone.name);
    if (!z) {
      z = { zone, dogs: [], blocks: [], enclosures: [] };
      zones.set(zone.name, z);
    }
    z.dogs.push(dog);
    let e = z.enclosures.find((x) => x.enclosure.name === enclosure.name);
    if (!e) {
      e = { enclosure, dogs: [], blocks: [] };
      z.enclosures.push(e);
    }
    e.dogs.push(dog);
  }
  const sortedZones = [...zones.values()].sort((a, b) => order.compareZones(a.zone.name, b.zone.name));
  for (const z of sortedZones) {
    z.blocks = blocksFor(z.dogs);
    z.enclosures.sort((a, b) => order.compareEnclosures(a.enclosure, b.enclosure));
    for (const e of z.enclosures) {
      e.dogs.sort((a, b) => natural.compare(a.name, b.name));
      e.blocks = blocksFor(e.dogs);
    }
  }
  apart.sort((a, b) => natural.compare(a.name, b.name));
  return { zones: sortedZones, apart: { dogs: apart, blocks: blocksFor(apart) } };
}
