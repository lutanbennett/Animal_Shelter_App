# Proof lines for items waiting on Lutan, and the shelter's day for `since:` (#prvln, #utcds)

## #utcds
`check-backlog-waiting.mjs` compared `since:` with the UTC date, so 00:00-07:00 Thailand a correctly dated tag read as "in the future".
It now uses `shelterToday()` / `sinceInFuture()` (`scripts/lib/backlog-waiting.mjs`, zone `Asia/Bangkok`), with the instant injectable.
Tests run the real exports against fixed instants (02:00 Thai = 19:00Z; both sides of 17:00Z; a future date) and pass under `TZ=UTC` too.
`validDate`'s round-trip is a shape check, not a clock comparison: nearby, not part of the fault.

Sweep, same fault (`new Date().toISOString().slice(0,10)` as "today"): **affected in principle, not changed (not asked, not date-compared against shelter data):** `audit-register.mjs:41` (compares advisory expiry dates to UTC today: off by a day for 7 hours, harmless), `check-residents-export.mjs:111`, `dev-adopter-signin.mjs:61` (writes a placement start date: could be a day early overnight), file-name stamps in `build-card-report`, `correct-*`, `fix-residents`, `drive-copy-tree`, `audit-contact-map-links`, `measure-permission-baseline`. **Cleared:** `resend-calendar-reasons.mjs` already adds 7h; `upload-blood-work.mjs` and `validDate` use `toISOString` only for round-trip checks; `src/lib/format.ts` is the app's own shelter clock.

## #prvln
His four examples: `#drvtk`, `#tstok`, `#drvcl`'s production Worker key, `#u2bo6`'s deploy. Each was asked of him though already done.
1. **Where it lives:** prose in the item body, `**Proof:** <one line>`, found by `PROOF_RE`. Not a tag key: a shell command inside an HTML comment needs escaping and makes the tag brittle (his own constraint).
2. **`decision by:lutan` is excluded.** His item says both "(and `decision by:lutan`)" and, under NOT IN SCOPE, that decisions "cannot be proved by a command and must not be made to look as if they can". A decision has no command to run, so requiring a proof line would invite a fake one. Only `waiting:lutan` needs one (`PROOF_STATES`).
3. **`/plan-day` running the proofs: not built.** Only the first half: the check reports items with no proof line. Executing arbitrary lines from a backlog is a larger job and a half-built runner claiming to verify would be worse than none. `#tstok` would not be caught by a command, and the item says so.

**Mode:** reports, does not fail, because the 10 current `waiting:lutan` items have no lines and the planner (not this stream) populates them. **To tighten:** set `PROOF_STRICT = true` in `scripts/check-backlog-waiting.mjs` (or run with `BACKLOG_PROOF_STRICT=1`). Not added to CI as a separate step; the existing CI step is non-failing on this.
