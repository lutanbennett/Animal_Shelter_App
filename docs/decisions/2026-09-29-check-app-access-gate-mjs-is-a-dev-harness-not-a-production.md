# 2026-09-29 — `check-app-access-gate.mjs` is a dev harness, not a production release check

Every cut plan since `0.5.0` has named `check-public-views.mjs --env production`
**and** `check-app-access-gate.mjs` together as the post-apply pair, and each plan
copied the pairing from the one before it. Only the first of the two can run
against production. `scripts/check-app-access-gate.mjs` is a one-transaction
rollback harness on **dev**: it creates throwaway logins, applies the
`app_access_gate` migration inside `begin`, asserts what each login can read, and
ends in a deliberate `raise exception` carrying the evidence so nothing can
commit. Its header says "against DEV only" twice and it takes no `--env`.

- **The cost was a phantom outstanding risk.** `0.8.0`'s record reported both
  checks as never run "in the release that redefined two public views"
  (`docs/releases/2026-09-27.md`), `0.8.1`'s plan repeated it, and `0.9.0`'s plan
  named it again as a production step deferred to the release manager. Half of
  that complaint could never be closed, so it read as an open risk across three
  releases while being impossible to act on. The `0.8.1` record
  (`docs/releases/2026-09-28.md`) withdraws it and says why.
- **What the pair actually is:** `check-public-views.mjs --env production` after
  every production apply — that one is real and was run for `0.8.1` (124 ok) and
  again after `0108`/`0109` (125 ok, 2 skip, 0 fail). `check-app-access-gate.mjs`
  on dev, when an `app_access_gate` migration or the `public_viewer` role changes
  — not once per release. `decisions.md` already described it correctly as "a
  rollback harness on dev"; the cut plans simply never read that.
- **Do not add an `--env` to it.** The harness works by never committing, and its
  assertions need to create logins and apply a migration inside the transaction.
  Pointing that at production would mean writing throwaway auth rows there and
  trusting a rollback for the cleanup. The dev run is the check; production's
  equivalent evidence is `check-public-views.mjs`.
