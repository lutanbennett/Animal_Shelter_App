# Who does what save: send `p_bundle: null` (2026-10-25)

Release `0.40.2` broke every add, remove and move of a card on Who does what. #915 changed `apply()` to call
`set_role_cards` with `{ p_role, p_cards }`; `0257` kept the function at `(p_role, p_cards, p_bundle)`, where `p_bundle` is
ignored but has no default. PostgREST finds functions by input names, so the two-input call was `PGRST202` and
`databaseFailure()` showed the generic message. Each change was right alone; nobody drove a save with both in.

**Fix:** `apply()` sends `p_bundle: null`. No migration: dropping the input (or defaulting it) would be a schema PR first,
and a dropped input breaks any caller still sending it. It goes with the `role_extras` cleanup, which removes the
app's `p_bundle: null` in the same change.

**Measured, not reasoned (dev, anonymous call so nothing could be written):** the old shape answers `PGRST202`; the new
shape reaches the function and answers `42501 permission denied`.

**Guard:** `scripts/check-rpc-inputs.test.mjs` (runs in `npm test`). Offline: it reads the migrations in order (the last
definition of a function wins), finds every `supabase.rpc("name", { ... })` call in `src/` with an inline object, and fails
if an input without a default is missing or an unknown one is sent. Before the fix it flagged this call; it also flagged
`issue_donation_receipt` until line comments inside the object were stripped (a parser fault, not a real mismatch).
Limits: it compares against the migration files, not dev's live functions, and skips calls that pass a variable instead of an
object literal. A live comparison would need dev credentials in CI, which was judged out of proportion.
