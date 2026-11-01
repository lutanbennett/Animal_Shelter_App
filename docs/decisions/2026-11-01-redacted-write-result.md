# 2026-11-01 — The wrapper can store a redacted result; `/admin/security` and `/admin/security/verify` are wrapped and listed

Stream `redacted-write-result` (batch 14, stream 31). Closes the item "`/admin/security` and `/admin/security/verify` cannot go on `WRAPPED_WRITE_PATHS` until the wrapper can store a redacted result", ruled open by `2026-11-01-write-paths-tail-b.md` section 3.

## What was built

- `runWriteAction()` takes a fifth, optional argument `options?: { storedAs(success) }`. When given, and only when the body returned a **success**, `finish_write_request()` is handed `storedAs(success)` instead of the success. The person who pressed still receives the real result.
- A refusal is never passed through `storedAs`: it holds no secret, and a replay of a refused save should be refused the same way.
- `createUser` and `issueTemporaryPassword` store a refusal in plain words (`secretShownOnce`); `startTwoStepSetup` stores `setupAlreadyStarted`.
- All sixteen writes in `security/actions.ts` and both in `security/verify/actions.ts` now go through `runWriteAction()` (the fourteen non-secret ones unchanged in behaviour, claimed as they were). The five client components send a request id (`useWriteForm` for the two forms, a new `useSecurityWrite()` for the rows' direct calls). Both addresses are on `WRAPPED_WRITE_PATHS`.
- No migration, no constant changed, no check weakened: every `refuseUnlessAdmin` / `hasAdminRole` / two-step test runs inside the body, exactly where it was.

## Existing callers are unaffected, and how that is known

The new parameter is last and optional. With it absent, the stored value is `result` itself, the same object as before (`options?.storedAs` is the only new branch, and it is taken only when the caller passes it). The unit test "without storedAs the stored result is the whole result, as before" pins that for the generic path; the existing eleven wrapper tests (claim, replay, in_flight, refusal stored, finish failure, redirect pass-through) pass unchanged; `check-wrapped-write-paths.mjs --all` reports every one of the 149 listed addresses complete. Typecheck is clean, so no other call site broke.

## What the redacted result is (and what was rejected)

Chosen: **the caller supplies what to store**, normally a refusal in the person's words. A replay is handed that stored value verbatim by the unchanged `claim_write_request()`, so it needs no new column, no new RPC branch and no per-secret knowledge in the wrapper.

Rejected:
- *An empty `{ok:true}` result.* A replay would report success with no password, and the UI would render "created" with a blank temporary password the admin might pass on.
- *A `redacted: true` flag or a separate column.* Needs a migration (`0298`) for no gain; the stored refusal already says everything a retrying person needs.
- *A field list to strip.* A new secret-bearing field added later would be stored by default; here the caller must write the replacement answer, so forgetting `storedAs` is the only way to leak and the test plan's checklist covers it.

## Deliverable 4: what a REPLAY of `startTwoStepSetup` means

**Decision: a replay is refused outright, in plain words, and the body is not re-run.** (It is the generic replay machinery doing it, fed a stored refusal.)

Why not return the stored answer: a stored answer cannot contain the secret, so the person would be handed a success with no key. Why not re-run: set-up is stateful. The body deletes every unverified factor and enrols a fresh one; a replay re-running it would destroy the factor whose QR code is on the screen and show a different one, while the first answer (lost) may already have been scanned. Refusing is the only answer that is true: "setup was already started by that press; the key is shown once; reload and press Start again." Pressing Start again from the reloaded page sends a **new** id, runs the body once and issues a fresh key, which is the correct recovery.

Same reasoning for `createUser` / `issueTemporaryPassword`: the replay says the action was already done, the password is shown once and not kept, and the admin should issue a new temporary password if they still need one. Recovery is one button, and nothing is written twice.

Left open: nothing in the wrapper. What a person sees when the first answer is lost in transit is the refusal above rather than the secret; that is the price of not keeping a secret at rest, and it is deliberate.

## Found, not fixed

- `confirmTwoStep` is now claimed too (the page cannot be listed unless every write is). A code is single-use, so a replay returning the stored `{ok:true}` is what stops a retried confirm from reading "wrong code". It cannot be driven here (aal2, no authenticator).
- Nothing else on these pages ungated or unwrapped.

## Not drivable here

Both screens demand the second step; `dev-signin.mjs` is aal1 only. Proven by harness: the redacted path (secret never reaches an rpc call), the replay, an ordinary write unchanged, the list and the check. The manual presses are in the PR and the test plan.

## Measured

`node scripts/check-wrapped-write-paths.mjs --all`, on branch `claude/redacted-write-result` (not merged `main`): before (HEAD `47bc71d6`) 147 addresses listed, 2 held out (these two); after, 149 listed, every one complete.
