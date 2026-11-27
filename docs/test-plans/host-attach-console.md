# Feature test plan

## Header

| | |
|---|---|
| Feature | Console button to mark a shelter's address for attaching at the next deploy (#hstau step 3) |
| Backlog item | `docs/backlog.md` → `#hstau` (retitled, not ticked: two things stay open) |
| Branch / worktree | `claude/host-attach-console` @ `C:\Development\Animal_Shelter_host-attach-console` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 6e0f79395 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Touched: `src/app/platform/actions.ts` (new `setShelterHostAttach`), `src/app/platform/ProductAdminPanel.tsx` (two buttons, a note, a status line), `src/lib/i18n/dictionaries/en.ts` and `th.ts` (five strings each), `src/lib/releases.ts`, `docs/backlog.md`, a decision file. No card changes: the console is gated by the product-administrator list plus aal2, exactly as its neighbouring host buttons. Shelter Admin and the signed-out public are unaffected. Out of scope: showing which addresses are marked (needs a migration, specified in the decision file), a live Cloudflare read, `#hsttk`, and `scripts/deploy.mjs`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` run on this branch; every gate exited 0, closing lines pasted below exactly as printed

```
=== gates: typecheck exited 0 after 164s
=== gates: lint exited 0 after 311s
=== gates: test exited 0 after 52s
=== gates: build exited 0 after 174s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the function it calls was proven in 0447's own PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; 0445 to 0447 ship with their own PRs

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet) — n/a: the buttons are drawn only inside an existing address row; a shelter with none shows the unchanged "no addresses" line
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no free input; the host comes from the listed row, and a vanished host maps 22023 to the existing noSuchHost message
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: a boolean flag on an existing row has no boundary

Driven with `playwright-core` on dev at aal2 as a product administrator, on the disposable `rehearsal-2026-11-20.example.invalid`: flag read back through the Management API `false`; Attach at next deploy pressed, confirmation shown, flag `true`; Stop attaching pressed, confirmation shown, flag `false`. The read-back is from the database, not the page, because the page cannot show the flag (see Defects).

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| product administrator at aal2 (not a card: the PADMIN list) | buttons drawn and work | yes | pass, driven |
| product administrator at aal1 | buttons hidden (`canWrite` false), as Remove | yes | by reading: same `canWrite` gate as Remove |
| signed out | `/platform` not reachable | yes | unchanged page gate |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails)

Server side: the action re-checks `isProductAdmin()` and `hasTwoStep()`, and the function raises 42501 itself.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the product console has no manual topic; the note on the page explains the buttons
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the strings are in the en and th dictionaries (typecheck requires both); the translations page was not opened
- [ ] Mobile viewport (375px) — pending: Lutan to glance at the Website tab on a phone; the buttons sit in the same flex-wrap row as the existing ones
- [ ] Browser console clean — no errors or React warnings — n/a: not captured in the driven run; the press and both confirmations worked
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not captured; the server action succeeded both times, proven by the database read-back

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: only the two dictionaries are shared, and they gained keys only; typecheck proves both languages carry them
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: `/platform` list and the Rehearsal shelter's Website tab loaded and its existing buttons rendered beside the new ones.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not ticked on purpose; the item is retitled with the two things still open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: README does not describe the console's host buttons
- [x] **Release notes.** Would a shelter user notice this change, or would an Admin or a product administrator notice something appear, move or disappear?
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** — n/a: no boundary or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code calls 0447, which must be on production first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, for 0445 to 0447
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager, 0445 to 0447 before the deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The console cannot show which addresses are marked; `product_admin_shelters()` does not return the flag. Both buttons are always drawn and the page says so | accepted; migration specified in the decision file, for the planner |

## Left for manual verification

| What | Who |
|---|---|
| The Website tab on a phone (375px) | Lutan |

## Sign-off

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-27
Manual verification by: pending: Lutan, the phone-width glance above

Result: pass with accepted defects
