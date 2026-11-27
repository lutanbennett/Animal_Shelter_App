# Feature test plan

## Header

| | |
|---|---|
| Feature | A refused password-reset link no longer blames Google; aal2 refusal on a password save gets plain words |
| Backlog item | `docs/backlog.md` → `#rcgle` |
| Branch / worktree | `claude/reset-error-wording` @ `C:\Development\Animal_Shelter_reset-error-wording` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | f57df0907 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/login/LoginForm.tsx`, new `src/lib/auth/link-error.ts` (+ test), `src/app/account/password/actions.ts`, both dictionaries, `src/lib/releases.ts`
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — no card; the login page is signed-out, the password page is any signed-in login
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — aal2 rule, admin-assisted reset, mailer and expiry settings, callback route all unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 14s
=== gates: lint exited 0 after 240s
=== gates: test exited 0 after 44s
=== gates: build exited 0 after 56s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — headless Chrome on :3006: the live production fragment (`otp_expired`) shows the spent-link message and a *Send me a new link* button; the address becomes `/login`
- [x] Data persists — reload the page and the change is still there — reloading after the fragment is cleared shows no message, as intended
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: message only, nothing is created or deleted
- [x] Empty state renders sensibly (no rows yet) — `/login?error=google` with no fragment still shows the Google wording and no new-link button
- [x] Invalid input is rejected with a readable message, not a crash — an unknown code with a hostile `error_description` shows only our generic line; the description is never rendered
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — unit tests: empty hash, non-error hash, `error` without `error_code`
- [ ] aal2 refusal on a password save shows the new wording — pending: needs a login with an enrolled authenticator arriving through a reset link; not driven, mapping read from the code only

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | `/login` with each error fragment | right message per cause | as expected |

- [ ] Every login above tested — n/a: no access change; only the signed-out login page was exercised
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access is granted or denied by this change

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: error wording only, no manual topic covers it
- [x] Translatable strings go through the translation path, checked at `/management/translations` — added to both `en.ts` and `th.ts`; typecheck enforces the shape
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: one paragraph and one full-width link inside the existing form column
- [ ] Browser console clean — no errors or React warnings — n/a: not captured in the headless run
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/login` with and without `?error=google`
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: only dictionaries were added to, by new keys
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Two lines added to `unreleased`.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing time-dependent
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: public pages untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — code only; `deploy-pi.sh --ref <previous sha>` reverts it fully, nothing in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A real reset email on production: clicking a spent link shows the new message and the button | `lannacareforanimals.org/login/forgot` |
| 2 | Saving a new password with an authenticator enrolled shows the Security wording | `/account/password` after a reset |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the two rows in Left for manual verification

Manual verification by: pending: a real reset email and an authenticator-enrolled password save

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [ ] Checklist pasted into the PR — n/a: the PR links this file
- [ ] Handed to the production release manager — pending: next release

Result: pass

Release manager acknowledgement: pending: next release
