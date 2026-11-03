/**
 * Which live database refusals can a shelter worker meet? Classification for
 * docs/decisions/2026-11-03-sql-refusal-english-count.md, kept as data and grouped by REASON,
 * the shape of english-in-ts-classes.mjs. Rules are tried in order; first match wins. Each
 * function (not each message) is classified, and its messages inherit the class.
 *
 *   "user"       a src file calls the function and forwards the error's message to the screen.
 *   "maybe"      reachable, caller not settled: a trigger (fires on ANY write to its table, the writers are
 *                not traced), only called from other SQL, or a caller file that both forwards and masks.
 *   "masked"     a src file calls it but only through databaseFailure()/unexpectedFailure() or never reads
 *                .message, so the English goes to the server log and the person sees dictionary words.
 *   "developer"  nothing in src/ or worker/ names it and no trigger fires it.
 *
 * Input per function: { isTrigger, srcCallers: [{rel, forwardsMessage, masksMessage}], sqlCallers: [name] }
 */
export const CLASSES = [
  { id: "trigger", reads: "maybe", why: "A trigger function fires on any write to its table, from any app path or a hand-run script. Which writers hit each guard is not traced.", match: (f) => f.isTrigger },
  { id: "called-and-forwarded", reads: "user", why: "A src file calls it by name and passes error.message (or a value derived from it) into what the person sees. Every caller forwards.", match: (f) => f.srcCallers.length > 0 && f.srcCallers.every((c) => c.forwardsMessage && !c.masksMessage) },
  { id: "called-forwarded-and-masked", reads: "maybe", why: "A calling file both forwards a message somewhere and masks another, or only some callers forward; which one this rpc takes is not traced.", match: (f) => f.srcCallers.some((c) => c.forwardsMessage) },
  { id: "called-and-masked", reads: "masked", why: "Callers never forward .message: the English reaches the log, not the screen.", match: (f) => f.srcCallers.length > 0 },
  { id: "sql-only-caller", reads: "maybe", why: "No src file names it, but another live SQL function calls it; the message surfaces through that function.", match: (f) => f.sqlCallers.length > 0 },
  { id: "uncalled", reads: "developer", why: "No src/worker file names it, no trigger, no SQL caller. A person cannot reach it through the app.", match: () => true },
];

export function classify(f) {
  return CLASSES.find((c) => c.match(f));
}
