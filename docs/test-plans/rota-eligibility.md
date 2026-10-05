# Feature test plan

## Header

| | |
|---|---|
| Feature | rota-eligibility: `app_users` exposes the role key, and the rota's eligibility (picker, save-time check, `/my`) asks the key instead of the borrowed enum, so a configured role (the 2IC) can be given a page-linked recurring job such as the weekly stocktake |
| Backlog item | `docs/backlog.md` → "A configured role's rota eligibility: the picker and `/my` ask the enum role, not the role's key" (ticked; the "Also found, not fixed" pair is `role-gaps-sweep`'s and stays open) |
| Branch / worktree | `claude/rota-eligibility` @ `C:\Development\Animal_Shelter_rota-eligibility` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-05 |
| Carries a migration? | yes: `0146_app_users_role_key.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `app_users` gains `role_key`, and `canDoJob`, `loadEligibility`, the picker, the save-time check and `/my` ask it, with the check script gaining the 2IC
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0146_app_users_role_key.sql`, `src/lib/recurring-jobs/eligibility.ts` and `eligibility-load.ts`, `src/lib/auth/app-users.ts`, `src/lib/i18n/enum-labels.ts`, `src/app/management/recurring-jobs/` (page, actions, form, view), `src/app/my/page.tsx`, `scripts/check-recurring-job-eligibility.mjs`, `src/lib/releases.ts`, docs. No `worker/`
- [x] Roles affected identified: the 2IC (can now be given page-linked jobs); admin, management, staff, volunteer unchanged by construction (key equals enum for the built-in roles); vet still refused; Head of Medical and Head of Maintenance judged by their own cells once those exist
- [x] Anything explicitly **out of scope** written down: the cells themselves (`director-draft-roles`), the Head of Medical's label photo and the maintenance board's photos and Delete job (`role-gaps-sweep`), the `legacy_role` call, the marking-done path (untouched)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0145`), and no other in-flight branch carries one: the commit hook's check printed "`0146_app_users_role_key.sql` against origin/main `06247485`"; the brief named this stream as the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 145 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0146_app_users_role_key.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): two `create or replace view` statements; the column is appended last so the replace holds
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: nothing was read back from the view as a signed-in login; the dry-run built the view and the app compiled against it, but no session selected `role_key`
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: the migration adds one derived column and no constraint or default; the fallback for a null `role_id` was not exercised
- [x] Down-migration written, or the reason one is not needed is stated: not needed, additive: re-run `0126`'s `create or replace view private.app_users` and `0086`'s `public.app_users` to drop the column; nothing but this PR's code reads it
- [x] Production apply plan stated for the release manager: apply `0146` to production from the main checkout after the merge, `--dry-run` first, **before** the deploy, because the Recurring jobs page and `/my` now select `role_key`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven as a real login in this session; the round trip (assign the weekly stocktake to the 2IC, open her `/my`, see the link) is the first row of Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: no new stored data; the assignment path is unchanged
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete behaviour changed; only who the picker offers and who the save-time check accepts
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new list
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the existing "cannot do this job" refusal is the same message, now computed from the key
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): `check-recurring-job-eligibility.mjs` cases N1–N3 (no role, public viewer, unknown key) and F1–F3 (missing answers never grant) hold, run against the real exported functions

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | any page-linked job | eligible for all | passed in the script (E and K cases), by the cell data |
| management | any page-linked job but `/admin` | as before | passed in the script |
| staff | stocktake, maintenance, deliveries, enclosures, contacts | as before | passed in the script |
| vet | no recurring job | refused | passed (V1–V4) |
| volunteer | stocktake, enclosures, contacts; not maintenance | as before | passed (K7, K8) |
| 2IC | stocktake, deliveries, maintenance, `/management/purchasing`; not contacts, medications, admin | her own cells decide | passed in the script (K1–K6) |
| signed out | nothing | unchanged | n/a: no route changed |

- [x] Every role above tested: in the script, against the real exported functions and the seeded cells; not as a signed-in login
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route or policy changed; `canDoJob` is a picker and display rule, and the pages' own guards are untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual wording changed; the Recurring jobs topic already says who is listed by page
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no string added; a configured role's label is its key set out as words (decisions file)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout changed; the label in the picker is a different word, not a longer one
- [ ] Browser console clean — no errors or React warnings — n/a: the browser was not driven
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the browser was not driven

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `check-permission-parity` **1,930 match / 0 mismatch** (the same 1,930 as #375; the known-tightening lines unchanged), `check-permission-catalogue` all ok, `check-policy-role-names` green, `check-home-screens` all ok, `check-permission-tables` ended in its `HARNESS-OK` assertion line
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `eligibility.ts` and `app-users.ts` are shared; their other readers (the maintenance assignee picker, `loadAssignableUsers`) still typecheck and build, and were not loaded in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch: the script and gates were run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-05-rota-eligibility.md`
- [x] `README.md` still accurate: it does not describe this at this level
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: a page-linked weekly job can now be given to the 2IC and keeps its link on her My tasks
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The script and parity results are tool output. Reasoned, and said so: that the `/management` fixture row was already red on `main` is measured (run in the main checkout); its cause (`contacts.directory` held by staff and volunteers) is read from the cell data and not separately proved

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no date logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no boundary or banding changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates line above is pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Yes, and the order matters: the Recurring jobs page and `/my` select `app_users.role_key`, so a build deployed before `0146` is applied fails to read the team for Management. Apply `0146` to production first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; one view column
- [x] Apply plan stated: `0146_app_users_role_key.sql` to production, from the main checkout, `--dry-run` first, before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**: reverting the merge without the migration is safe (the old code ignores the extra column). Reverting the migration while this code is live breaks the Recurring jobs page and the recurring section of `/my` for every role

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `check-recurring-job-eligibility.mjs` case `L canDoJob(/management)` was already failing on a clean `main` (staff and volunteers hold `contacts.directory`, so the landing opens for them) | fixed: listed in the script as moved by the cells (`MOVED_BY_CELLS`), fixture file unchanged |
| 2 | Low | The picker labels a configured role by its key set out as words ("Second in command"), because its configured name is in `roles`, which only Admin reads | accepted: the decisions file says so |
| 3 | Low | The 2IC cannot be given a job linked to `/contacts` (she holds no contacts cell) | accepted: that is her cells (`director-draft-roles`' to decide), not the bridge |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The round trip, as a real login:** from Management → Recurring jobs, give the weekly stocktake to the 2IC (she must appear in the picker), save, then sign in as her and open `/my` and confirm the stocktake is there **with its link**, and that it opens. Then try a job linked to `/maintenance` and `/management/medications` and confirm the second is refused. The whole feature is this | dev, `http://localhost:3009`, then production |
| 2 | The picker's wording for the 2IC's row ("— Second in command") reads acceptably | dev, 375 px |
| 3 | The Head of Medical and Head of Maintenance behave the same once `director-draft-roles` writes their cells | dev, after that stream |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; the person who looks ticks this

Manual verification by: pending: the round trip in Left for manual verification row 1, as a real 2IC login

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not ticked until the manual round trip is done
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over after the manual round trip is signed

Result: pass with accepted defects

Release manager acknowledgement: pending
