import type { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/locales";
import { localLabel } from "@/lib/translations/labels";
import { todayIso } from "@/lib/format";
import { loadPlaceOrder } from "@/lib/enclosures/order";
import { roundsFor, type RoundKey } from "@/lib/rounds/suggest";
import type { DietServings } from "@/lib/diets/servings";
import {
  feedDogs,
  groupByPlace,
  type FeedingDiet,
  type FeedingDog,
  type FedDog,
  type ZoneGroup,
  type DietBlock,
} from "@/lib/diets/feeding-build";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type FeedingList = {
  today: string;
  round: RoundKey;
  zones: ZoneGroup[];
  /** In hospital, fostered, outreach, or with no enclosure on record: fed, but not from a zone's batch. */
  apart: { dogs: FedDog[]; blocks: DietBlock[] };
  error: string | null;
};

type Num = number | string | null;
const num = (v: Num) => (v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * Operations → Feeding list (docs/decisions/2026-10-23-feeding-list.md): for one meal, what each zone's
 * batch needs, diet by diet, and what each dog is plated. Read-only; nothing is recorded as fed.
 *
 * Reads the diets and their lines, the picker view of ingredient names, the residents' current diet
 * rows and rounds, and where each resident lives: all of it already readable by the audience of
 * /medical/diets (medical.diet Read with every clinic's residents), so no view or migration is added.
 * Deceased and Adopted are dropped here, as the special-diet list does. A diet with no meal ticked is in
 * every round and flagged, never dropped.
 */
export async function loadFeedingList(supabase: Supabase, round: RoundKey, locale: Locale): Promise<FeedingList> {
  const today = todayIso();
  const [diets, lines, ingredients, residentDiets, dietRounds, residents, states, enclosures, zones, placements, order] =
    await Promise.all([
      supabase
        .from("diets")
        .select("id, name, name_th, is_standard, servings_small, servings_medium, servings_large")
        .returns<
          { id: string; name: string; name_th: string | null; is_standard: boolean; servings_small: Num; servings_medium: Num; servings_large: Num }[]
        >(),
      supabase
        .from("diet_ingredients")
        .select("diet_id, diet_type_id, serving_unit, qty_per_serving")
        .returns<{ diet_id: string; diet_type_id: string; serving_unit: string | null; qty_per_serving: Num }[]>(),
      supabase
        .from("picker_diet_types")
        .select("id, name, name_th, unit")
        .returns<{ id: string; name: string; name_th: string | null; unit: string }[]>(),
      supabase
        .from("resident_diets")
        .select("id, resident_id, diet_id, meals_per_day, portion_factor, notes")
        .lte("start_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .returns<
          { id: string; resident_id: string; diet_id: string; meals_per_day: number | null; portion_factor: Num; notes: string | null }[]
        >(),
      supabase
        .from("resident_diet_rounds")
        .select("resident_diet_id, rounds(key)")
        .returns<{ resident_diet_id: string; rounds: { key: string } | { key: string }[] | null }[]>(),
      supabase
        .from("residents")
        .select("id, name, thai_name, size, profile_photo_drive_file_id")
        .returns<{ id: string; name: string; thai_name: string | null; size: string | null; profile_photo_drive_file_id: string | null }[]>(),
      supabase
        .from("resident_current_state")
        .select("resident_id, current_status, current_enclosure_id")
        .returns<{ resident_id: string; current_status: string | null; current_enclosure_id: string | null }[]>(),
      supabase
        .from("enclosures")
        .select("id, name, name_th, zone_id")
        .returns<{ id: string; name: string; name_th: string | null; zone_id: string }[]>(),
      supabase
        .from("zones")
        .select("id, name, name_th, colour")
        .returns<{ id: string; name: string; name_th: string | null; colour: string | null }[]>(),
      // Where residents live, as the medication list reads it (0136). A login that cannot open resident
      // records (the Head of Medical) gets nothing from resident_current_state but everything from here.
      supabase
        .from("medication_list_residents")
        .select("id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th, zone_colour")
        .returns<
          { id: string; current_status: string | null; enclosure_id: string | null; enclosure_name: string | null; enclosure_name_th: string | null; zone_name: string | null; zone_name_th: string | null; zone_colour: string | null }[]
        >(),
      loadPlaceOrder(supabase),
    ]);

  const error =
    diets.error?.message ??
    lines.error?.message ??
    ingredients.error?.message ??
    residentDiets.error?.message ??
    dietRounds.error?.message ??
    residents.error?.message ??
    states.error?.message ??
    enclosures.error?.message ??
    zones.error?.message ??
    placements.error?.message ??
    null;
  const empty = { dogs: [], blocks: [] };
  if (error) return { today, round, zones: [], apart: empty, error };

  const ingredientById = new Map((ingredients.data ?? []).map((i) => [i.id, i]));
  const dietById = new Map<string, FeedingDiet>();
  for (const d of diets.data ?? []) {
    const servings: DietServings = {
      small: Number(d.servings_small),
      medium: Number(d.servings_medium),
      large: Number(d.servings_large),
    };
    dietById.set(d.id, { id: d.id, name: localLabel(locale, d.name, d.name_th), isStandard: d.is_standard, servings, lines: [] });
  }
  for (const l of lines.data ?? []) {
    const diet = dietById.get(l.diet_id);
    const ingredient = ingredientById.get(l.diet_type_id);
    const qty = num(l.qty_per_serving);
    if (!diet || !ingredient || qty == null) continue;
    diet.lines.push({
      ingredientId: l.diet_type_id,
      name: localLabel(locale, ingredient.name, ingredient.name_th),
      unit: l.serving_unit?.trim() || ingredient.unit,
      qtyPerServing: qty,
    });
  }

  const foodRounds: readonly string[] = roundsFor("food");
  const roundsOf = new Map<string, string[]>();
  for (const row of dietRounds.data ?? []) {
    const joined = Array.isArray(row.rounds) ? row.rounds : row.rounds ? [row.rounds] : [];
    const list = roundsOf.get(row.resident_diet_id) ?? [];
    for (const j of joined) if (foodRounds.includes(j.key)) list.push(j.key);
    roundsOf.set(row.resident_diet_id, list);
  }

  const residentById = new Map((residents.data ?? []).map((r) => [r.id, r]));
  const stateById = new Map((states.data ?? []).map((s) => [s.resident_id, s]));
  const enclosureById = new Map((enclosures.data ?? []).map((e) => [e.id, e]));
  const zoneById = new Map((zones.data ?? []).map((z) => [z.id, z]));
  const viewById = new Map((placements.data ?? []).map((p) => [p.id, p]));

  const dogs: FeedingDog[] = [];
  for (const rd of residentDiets.data ?? []) {
    const r = residentById.get(rd.resident_id);
    const view = viewById.get(rd.resident_id);
    const state = stateById.get(rd.resident_id);
    const status = view?.current_status ?? state?.current_status ?? null;
    if (!r || status === "Deceased" || status === "Adopted") continue;
    const enclosure = state?.current_enclosure_id ? enclosureById.get(state.current_enclosure_id) : undefined;
    const zone = enclosure ? zoneById.get(enclosure.zone_id) : undefined;
    let place: FeedingDog["place"] = null;
    if (status === "Resident") {
      if (view?.enclosure_name && view.zone_name)
        place = {
          zone: { name: view.zone_name, nameTh: view.zone_name_th, colour: view.zone_colour },
          enclosure: { id: view.enclosure_id, name: view.enclosure_name, nameTh: view.enclosure_name_th },
        };
      else if (enclosure && zone)
        place = {
          zone: { name: zone.name, nameTh: zone.name_th, colour: zone.colour },
          enclosure: { id: enclosure.id, name: enclosure.name, nameTh: enclosure.name_th },
        };
    }
    dogs.push({
      id: r.id,
      name: r.name,
      thaiName: r.thai_name,
      photoFileId: r.profile_photo_drive_file_id,
      size: r.size,
      status,
      place,
      dietId: rd.diet_id,
      mealsPerDay: rd.meals_per_day,
      portionFactor: num(rd.portion_factor),
      rounds: roundsOf.get(rd.id) ?? [],
      notes: rd.notes?.trim() || null,
    });
  }

  const fed = feedDogs(dogs, dietById, round);
  const placed = groupByPlace(fed, order);
  return { today, round, zones: placed.zones, apart: placed.apart, error: null };
}
