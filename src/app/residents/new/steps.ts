/**
 * The intake wizard's steps. Shared by the page (which reads `?step=`) and
 * the form, so it lives outside the "use client" module — a server
 * component can't call a function exported from one.
 *
 * The order puts the required answers first and the optional prose last:
 * a volunteer standing at the gate can stop after Arrival and still have a
 * registrable resident. Review is always last and has no fields of its own.
 */
export const INTAKE_STEPS = [
  "who",
  "arrival",
  "health",
  "adoption",
  "story",
  "review",
] as const;

export type IntakeStepId = (typeof INTAKE_STEPS)[number];

/** Index of the Review step; every step before it holds fields. */
export const REVIEW_STEP = INTAKE_STEPS.length - 1;

/**
 * `?step=` is the 1-based step number, so a refresh (or a phone locking
 * itself) doesn't drop the user back to the first question. Only the place
 * is in the URL — the answers live in the form, so a refresh still clears
 * them. Anything unparseable starts at step 1.
 */
export function parseStepParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > INTAKE_STEPS.length) return 0;
  return n - 1;
}
