import {
  COMPATIBILITY_VALUES,
  ENERGY_LEVELS,
  type Compatibility,
  type EnergyLevel,
} from "@/lib/i18n/enum-labels";

/**
 * Length limits for the resident page's prose (0094 leaves length to the
 * form). The hook sits under the name as one line on a phone — the
 * mockup's example is 58 characters, so 120 allows a long sentence but not
 * a paragraph. The ideal home is "a short paragraph": 600 is about five
 * sentences, beyond which it is the story.
 */
export const HOOK_LINE_MAX = 120;
export const IDEAL_HOME_MAX = 600;

/**
 * The hook line and ideal home (0094) as the edit action writes them, or
 * which one is too long. The hook is one line, so any line breaks pasted
 * into it are folded to spaces.
 */
export function readAdoptionCopy(
  formData: FormData,
):
  | { hook_line: string | null; ideal_home: string | null }
  | { tooLong: "hookLine" | "idealHome" } {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const hook = text("hookLine")?.replace(/\s+/g, " ") ?? null;
  const idealHome = text("idealHome");
  if (hook && hook.length > HOOK_LINE_MAX) return { tooLong: "hookLine" };
  if (idealHome && idealHome.length > IDEAL_HOME_MAX) return { tooLong: "idealHome" };
  return { hook_line: hook, ideal_home: idealHome };
}

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
