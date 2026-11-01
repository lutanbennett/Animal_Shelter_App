# The translation engine's output is checked for links (2026-11-01)

**Fault.** The engine added five markdown links to a Thai row that the English did not have. `sameLinks()`
refused the save at approve time, correctly, but only after the row had reached the waiting list, and with a
message that talked about translating an address.

**Change.**
1. `checkOutput()` (worker/translate-engines.mjs) now compares `linkTargets(source)` with `linkTargets(out)`
   for every tier and rejects on any difference, naming the added and dropped addresses. It catches a dropped
   link as well as an invented one. A rejection is retried/given up like any other `OutputRejected`.
2. `translations.errors.linksDiffer` (en and th) is now a function of the added and removed addresses;
   `approveTranslation` computes them from the same `linkTargets()`. `sameLinks()` is untouched and still the
   last line of defence.
3. `scripts/draft-label-thai.mjs`: the closing line says how many drafts landed (or that none did), and a
   malformed `--access-token` exits 2 up front instead of 91 identical PGRST301 lines.

**Shared parser, decided: no second copy and no move.** `parseLinks()`/`linkTargets()` are pure and import
nothing, so they could move, but the worker already imports `.ts` straight from `src/` under Node's type
stripping (`worker/index.mjs`, `origin.mjs`, `release-mail.mjs`). `translate-engines.mjs` imports
`../src/lib/site/links.ts` directly. One implementation, so the engine check and the approve-time guard
cannot drift.

**Not done / not touched.** No Thai written, nothing approved, `worker/translations.mjs` untouched.
Found, not fixed: the engine's prompt does not tell the model to keep links as written; that would reduce
rejections but is a separate change.
