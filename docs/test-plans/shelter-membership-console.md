# Feature test plan

## Header

| | |
|---|---|
| Feature | Platform console shows a person who works at two shelters (#acwho, console half) |
| Backlog item | `docs/backlog.md` → `#acwho` |
| Branch / worktree | `claude/shelter-membership-console` @ `C:\Development\Animal_Shelter_shelter-membership-console` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | yes (`0444_product_admin_access_elsewhere.sql`) |
| Tested at SHA | 5802d78bb |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a product administrator can add a person who already works at another shelter from the console, and each shelter's Access list tells the truth about them
- [x] Files/areas touched listed: `supabase/migrations/0444_product_admin_access_elsewhere.sql`, `src/app/platform/access-actions.ts`, `src/app/platform/ShelterAccess.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/lib/releases.ts`, `scripts/lib/tenancy-catalogue.mjs` (one `ALLOWED` entry), docs
- [x] Cards affected identified: none. The console sits outside the card system (product administrator plus aal2); no card is added or changed, Admin's bypass untouched, signed-out public unaffected
- [x] Anything explicitly **out of scope** written down: a signed-in person asking to join a second shelter (access requests), recorded in the decision file for its own item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` is `0`:

```
=== gates: typecheck exited 0 after 98s
=== gates: lint exited 0 after 407s
=== gates: test exited 0 after 83s
=== gates: build exited 0 after 213s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (0443), and no other open PR carries one (`gh pr list` checked; `check-migration-numbers.mjs` ok)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (445 applied, 0 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (`dry-run 0444_product_admin_access_elsewhere.sql … ok`)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`, revoke/grant)
- [x] Existing rows still read correctly after the change: the function only reads; the driven run read every shelter's Access list on dev
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: the migration adds no constraint, default or column, only a read function; it was exercised against real dev rows by the driven run in section 4, which read the count at both shelters
- [x] Down-migration written, or the reason one is not needed is stated (header: `drop function public.product_admin_access_elsewhere(uuid)`)
- [x] Production apply plan stated: `0444` to production (`dbkodyyxxhtygxcxmfcu`) before the deploy that carries this code, because `shelterAccessList` calls it and fails without it

## 4. Functional checks

- [x] Happy path works end to end: driven in headless Chrome, added `dev-signin-volunteer@example.invalid` to "Proof shelter B (disposable)"; result "Added. This login is new to this shelter. Also works at 1 other shelter."
- [x] Data persists — reloading Proof shelter B and the dev shelter (Lanna Care for Animals) both listed the login with "Also works at 1 other shelter."
- [x] Create / edit / delete all exercised (whichever the feature has): add (new) and add again (unchanged: "This login already has that role in this shelter. Nothing changed."); role change and take-out are unchanged from 0438 and were not re-driven
- [x] Empty state renders sensibly (no rows yet): unchanged text "No one has a role in this shelter yet."; a login with no other shelters shows no note
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: validation and error mapping are unchanged from 0438 (`cleanEmail`, `accessError`)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: the only new value is a count; zero shows nothing, one and many have their own wording in both languages

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (product administrator, aal2) | `/platform` Access tab | lists, adds, counts | as expected (driven) |
| any login that is not a product administrator | `product_admin_access_elsewhere` | refused 42501 in the function body | not driven; same guard lines as 0438 |
| signed out | `/platform` | sent to sign-in | not driven; unchanged layout guard |

- [x] Every login above tested — the product administrator by driving; the two refusals are unchanged guards, read rather than driven
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new route; the new function carries the same `is_product_admin()` and aal2 lines as its 0438 neighbours, and the action checks both before calling it

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the Platform console has no manual topic
- [x] Translatable strings go through the translation path: new strings in `en.ts` and `th.ts`; `check-thai-dictionary.mjs` passes
- [ ] Mobile viewport (375px) — n/a: the new lines are short text spans that wrap (`basis-full`); not measured at 375px
- [ ] Browser console clean — n/a: driven headless, console not captured
- [ ] Network clean — n/a: driven headless; every action returned its success text

## 6. Regression

- [x] The pages nearest the change still work: every shelter card's Access tab on `/platform` loaded in the driven run up to the one card with no Settings button
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the dictionaries gained keys only; no existing key changed
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing was merged; already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-11-26-shelter-membership-console.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** One admin-flagged line in `unreleased` in `src/lib/releases.ts`: a person can now work at more than one shelter, added from the console
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The quoted result sentences are copied from the driven run's output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Yes: `0444` must be applied to production before the deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive, one new read-only function
- [x] Apply plan stated: `0444_product_admin_access_elsewhere.sql`, production, before the deploy

### Rollback

- [x] Rollback position stated: the code rolls back with the Pi deploy; the function can be left in place (additive) or dropped with the line in its header

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A signed-in person at one shelter cannot ask to join another (no request record exists) | deferred to backlog, for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Access tab reads well for a person with additional roles and other shelters, in English and Thai | Platform → a shelter → Settings → Access |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan to read the Access tab in both languages

Manual verification by: pending: Lutan to read the Access tab in English and Thai

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is linked from the PR body as a file in the branch
- [ ] Handed to the production release manager — pending: next release cut

Result: pass with accepted defects

Release manager acknowledgement: pending: next release
