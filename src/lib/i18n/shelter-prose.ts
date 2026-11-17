import type { ShelterNames } from "@/lib/shelter-names-default";

/**
 * The dictionaries name the shelter through two placeholders, filled when a dictionary is handed to a reader:
 *   {shelter}      the shelter's full name   (shelters.display_name, 0400)
 *   {shelterShort} the shelter's short name  (shelters.short_name, 0400)
 * A placeholder, not concatenation, so a Thai sentence can put the name where Thai wants it.
 *
 * It fills on the CLIENT side of the boundary (I18nProvider) and in getT() on the server, exactly where the
 * dictionary is already assembled, so the 600-odd readers are untouched and no function crosses a client boundary
 * (#el9zw): a function entry is wrapped here, in the process that uses it, and only plain strings (the two names)
 * are passed as props. With no shelter, or the default names, the output is byte-for-byte the old literal text.
 */
export function fillShelterNames<T>(dictionary: T, names: ShelterNames): T {
  const fill = (s: string) => s.split("{shelter}").join(names.displayName).split("{shelterShort}").join(names.shortName);
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return v.includes("{shelter") ? fill(v) : v;
    if (typeof v === "function") {
      const f = v as (...a: unknown[]) => unknown;
      return (...a: unknown[]) => {
        const r = f(...a);
        return typeof r === "string" && r.includes("{shelter") ? fill(r) : r;
      };
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[k] = walk(x);
      return out;
    }
    return v;
  };
  return walk(dictionary) as T;
}
