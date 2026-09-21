import {
  COMPATIBILITY_VALUES,
  ENERGY_LEVELS,
  type Compatibility,
  type EnergyLevel,
} from "@/lib/i18n/enum-labels";

/**
 * The adoption recommendation columns (0060) as the intake and edit
 * actions write them, read from the fields AdoptionProfileFields renders.
 * Anything outside the vocabulary is treated as unset rather than
 * rejected — the selects can't produce it, so it's not worth an error.
 */
export function readAdoptionProfile(formData: FormData) {
  const str = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const compat = (name: string): Compatibility | null => {
    const value = str(name);
    return value && COMPATIBILITY_VALUES.includes(value as Compatibility)
      ? (value as Compatibility)
      : null;
  };
  const energy = str("energyLevel");
  const desexed = str("isDesexed");

  return {
    colour: str("colour"),
    is_desexed: desexed === "yes" ? true : desexed === "no" ? false : null,
    good_with_dogs: compat("goodWithDogs"),
    good_with_cats: compat("goodWithCats"),
    good_with_children: compat("goodWithChildren"),
    energy_level:
      energy && ENERGY_LEVELS.includes(energy as EnergyLevel)
        ? (energy as EnergyLevel)
        : null,
  };
}
