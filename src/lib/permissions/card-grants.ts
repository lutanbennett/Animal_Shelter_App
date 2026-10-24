import { createAdminClient } from "@/lib/supabase/admin";
import { isActivityKey, type ActivityKey, type Level } from "./catalogue";
import { isCardKey, type CardKey } from "./cards";

/**
 * What a card requires, as the database holds it (card_grants and card_includes, 0257). The database recomputes every
 * role's role_permissions from these two tables, so this is the copy that is true; the `bundle` and `includes` in cards.ts
 * are the SEED the tables were filled from, kept for the checks and for new cards, and are not read to say what a card gives
 * (docs/decisions/2026-10-24-cards-grants-app.md).
 *
 * Read fresh on every call, never kept in memory: an Admin edit must show on the next page load, and a stale copy is the
 * one way this screen could disagree with the database. A failed read throws; it never falls back to the seed, because a
 * screen that quietly shows the seed while the database says otherwise is the fault this removes.
 * Server only (service role, after the page's own guard, like the rest of Who does what).
 */
export type CardGrants = {
  /** A card's own activities at the level it needs, not counting what its included cards give. */
  own: ReadonlyMap<CardKey, readonly { activity: ActivityKey; level: Level }[]>;
  /** The cards a card includes directly. */
  includes: ReadonlyMap<CardKey, readonly CardKey[]>;
};

export async function loadCardGrants(): Promise<CardGrants> {
  const admin = createAdminClient();
  const [g, i] = await Promise.all([
    admin.from("card_grants").select("card, activity, level"),
    admin.from("card_includes").select("card, included_card"),
  ]);
  const error = g.error ?? i.error;
  if (error) throw new Error(`Card grants: ${error.message}`);
  return buildCardGrants(g.data ?? [], i.data ?? []);
}

/** Pure: the two tables' rows to the maps above. Rows for a card or activity this build does not know are left out. */
export function buildCardGrants(
  grantRows: readonly { card: unknown; activity: unknown; level: unknown }[],
  includeRows: readonly { card: unknown; included_card: unknown }[],
): CardGrants {
  const own = new Map<CardKey, { activity: ActivityKey; level: Level }[]>();
  for (const r of grantRows) {
    if (!isCardKey(r.card) || typeof r.activity !== "string" || !isActivityKey(r.activity)) continue;
    const list = own.get(r.card) ?? [];
    list.push({ activity: r.activity, level: Number(r.level) >= 2 ? "edit" : "read" });
    own.set(r.card, list);
  }
  const includes = new Map<CardKey, CardKey[]>();
  for (const r of includeRows) {
    if (!isCardKey(r.card) || !isCardKey(r.included_card)) continue;
    includes.set(r.card, [...(includes.get(r.card) ?? []), r.included_card]);
  }
  return { own, includes };
}

/** The cards a card brings with it, transitively, not counting itself. */
export function includedBy(grants: CardGrants, key: CardKey): CardKey[] {
  const seen = new Set<CardKey>();
  const walk = (k: CardKey) => {
    for (const i of grants.includes.get(k) ?? []) {
      if (!seen.has(i)) {
        seen.add(i);
        walk(i);
      }
    }
  };
  walk(key);
  return [...seen];
}
