import "server-only";
import { getLocale } from "./get-locale";
import { getDictionary } from "./get-dictionary";
import { loadUnitList } from "@/lib/unit-list-server";
import { unitNameMap } from "@/lib/unit-list";
import { shelterNames } from "@/lib/shelter-settings";
import { fillShelterNames } from "./shelter-prose";

/**
 * Convenience for server components and server actions: current locale + its dictionary.
 * `t.enums.unitNames` is filled from the units table (Settings → Units), so a unit added on screen
 * prints by its own name everywhere with no dictionary edit.
 */
export async function getT() {
  const locale = await getLocale();
  const t = fillShelterNames(getDictionary(locale), await shelterNames());
  const unitNames = unitNameMap(await loadUnitList(), locale);
  return { t: { ...t, enums: { ...t.enums, unitNames } }, locale };
}
