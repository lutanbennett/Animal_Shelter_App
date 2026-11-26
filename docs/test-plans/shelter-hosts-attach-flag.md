# Feature test plan

## Header

| | |
|---|---|
| Feature | `shelter_hosts.attach_to_worker` column (#hstau schema half) |
| Backlog item | `docs/backlog.md` → #hstau (step 1 of 3; not ticked) |
| Branch / worktree | `claude/shelter-hosts-attach-flag` @ `C:\Development\Animal_Shelter_shelter-hosts-attach-flag` |
| Dev server | not needed: schema only |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | yes |
| Tested at SHA | SHA_PLACEHOLDER |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: no card, policy or function changes; nothing reads the column yet
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One column, `supabase/migrations/0445_shelter_hosts_attach_to_worker.sql`, plus its decision file. Out of scope: `scripts/deploy.mjs` and any console code (the app half, next batch).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, every exit code `0`.

GATES_PLACEHOLDER

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no code reads the column; existing rows gain a not-null false default and nothing else
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: one additive boolean with a default and no constraint or policy; the apply itself proves the default fills every row
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

Apply plan: `0445` to production with the release that carries it, before or after the deploy (nothing reads it). Undo: `alter table public.shelter_hosts drop column attach_to_worker;` (in the file's header).

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this column yet
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: a not-null boolean has no boundary

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| none tested | no policy changed | unchanged | not applicable |

- [ ] Every login above tested — n/a: no policy, page or function changed
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no policy, page or function changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing user-visible
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: additive column with a default; no page changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: step 1 of 3; #hstau stays open for the app half
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: schema only; nothing reads the column until the deploy half ships, so nobody would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no time logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only evidence is the gates block, pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: migration only, no reader
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive column
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**

Additive column; safe to leave on any code rollback. The drop statement is in the file header.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 0 | none | none found | not applicable |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 0 | nothing: no surface to look at | not applicable |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: schema only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: pending: next release
