/**
 * PostgREST `or` expression for "not dead".
 *
 * Deceased residents are history: the residents list hides them unless asked,
 * and the vet-visit / immunization pickers never offer them. `current_status`
 * is null for a resident whose placement hasn't been written yet, and a plain
 * `neq` would drop those rows too (SQL `<>` is null-unsafe), so the null case
 * is spelled out.
 */
export const NOT_DECEASED =
  "current_status.neq.Deceased,current_status.is.null";

/** The status value itself, for the matching "only the dead" filter. */
export const DECEASED = "Deceased";
