/**
 * Named CALL positions rule 3 reads: a function by name, and which of its
 * arguments a person reads.
 *
 * Rule 3's other positions are shapes (the value of `error:`, the argument of
 * `NextResponse.json`, a `return` in an `actions.ts`). This one cannot be a
 * shape: `driveErrorMessage(err, "…")` passes the sentence a worker reads as
 * an ordinary second argument, which looks like every other argument in the
 * tree. Widening rule 3 to "the second argument of any call" would flood the
 * report, so the positions are named one at a time, as
 * docs/decisions/2026-11-02-date-messages-and-which-english-counts.md §4 chose.
 *
 * Kept as DATA in its own module so the next position is a one-line change
 * here rather than a change to the check, and so the matcher can be tested
 * without running the check over the real tree
 * (scripts/english-in-ts-positions.test.mjs). The table deliberately holds one
 * entry: see docs/decisions/2026-11-12-rule3-drive-error-fallback.md.
 *
 * `args` are ZERO-BASED argument indexes, so the second argument is 1.
 */
export const NAMED_ARG_POSITIONS = [
  {
    callee: "driveErrorMessage",
    args: [1],
    why:
      "The `fallback` sentence of driveErrorMessage(err, fallback) (src/lib/google/drive-errors.ts). " +
      "It replaces the generic Drive sentence and is returned to the caller as the error or warning a " +
      "screen draws, so a worker reads it verbatim. Traced 2026-11-06 " +
      "(docs/decisions/2026-11-06-english-strings-classification.md).",
  },
];

/**
 * The argument indexes to read for a call, or null if the call is not a named
 * position. `callee` is the call expression's own text, so a call reached
 * through an object (`errors.driveErrorMessage(...)`) matches on its last
 * segment; anything with a call or index in it (`f()(...)`, `a[b](...)`) does
 * not, because its name is not statically known.
 */
export function namedArgPositions(callee) {
  if (typeof callee !== "string" || /[()[\]]/.test(callee)) return null;
  const name = callee.split(".").pop();
  const hit = NAMED_ARG_POSITIONS.find((p) => p.callee === name);
  return hit ? hit.args : null;
}
