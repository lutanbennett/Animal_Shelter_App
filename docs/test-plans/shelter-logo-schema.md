# Feature test plan — shelter-logo-schema

## Header

| | |
|---|---|
| Feature | Schema half of #shlog: `site_content.logo_drive_file_id`, `set_shelter_logo()`, the public view and public-file tests, and two scoping fixes found on the way |
| Backlog item | `docs/backlog.md` → #shlog (left open; `shelter-logo-upload` is the app half) |
| Branch / worktree | `claude/shelter-logo-schema` @ `C:\Development\Animal_Shelter_shelter-logo-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | yes — `0429_shelter_logo.sql`, `0430_public_site_content_scoped.sql`, `0431_set_shelter_logo_scoped.sql` |
| Tested at SHA | `97a59fd82` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a column and a write for each shelter's own logo, with the read scoped to the request's shelter
- [x] Files/areas touched listed — three migrations, `supabase/harness/shelter_logo.sql`, `docs/hard-coded-security-registry.json` (three declarations), decision file, this plan
- [x] Roles affected identified — none by role: no screen reads the column yet; the write asks the existing `website.gallery` activity
- [x] Anything explicitly **out of scope** written down — all of `src/`, `PublicHeader.tsx`, `src/app/platform/` and `set_hero_photo()` are untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates ("Already up to date")
- [x] `node scripts/gates.mjs` ends with the four exit codes below, read from the output file:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0429`–`0431` against highest `0428`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 430 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok` for each file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0429`, `0430`, `0431 … ok`
- [x] File is re-runnable — `add column if not exists`, `create or replace`
- [x] Existing rows still read correctly after the change — new nullable column; the view keeps every column and order
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`supabase/harness/shelter_logo.sql`), ending `HARNESS OK shlog schema`: A's header reads A's logo; B's header reads none and `is_public_drive_file` refuses A's file; no header reads zero rows; the write touches only the request's shelter; blank clears; a login with no card and anon are refused
- [x] Down-migration written, or the reason one is not needed is stated — in each file's header
- [x] Production apply plan stated for the release manager — 0429–0431 with the next release, additive; **0430 narrows the view to the request's shelter (header or trusted caller)**, see the decision file §5

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads the column yet
- [ ] Data persists — n/a: no UI surface; asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; set and clear are in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the refusal key is the hero's existing `photo.website_not_allowed`
- [ ] Boundary cases checked — n/a: no UI surface; blank, other shelter and no header are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| signed out (anon) | own shelter's logo id via the view | nothing of another shelter; `set_shelter_logo` refused | pass — harness |
| signed in, no `website.gallery` | `set_shelter_logo` | refused 42501 | pass — harness |
| signed in, `website.gallery` | `set_shelter_logo` on own shelter | writes only that shelter's row | pass — harness |

- [ ] Every role above tested — n/a: access classes, not app roles; no card or grant changed (`check-card-grants` ok)
- [x] A role that should not have access is blocked server-side — card-less login and anon refused in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing in `src/` changed; 0430 narrows what the public view returns without a header, and the Worker end to end was not exercised
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: #shlog stays open by brief; the app half has not started
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-shelter-logo-schema.md`
- [x] `README.md` still accurate — it does not list columns
- [ ] **Release notes.** — n/a: nothing a shelter user would notice; no screen reads the column
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the leak (6 rows with and without a header) and the all-shelters write were reproduced; the Worker and the photo proxy on a PNG were not run (said so in the decision file)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager for deploy output; the gates line above is unedited
- [ ] Public pages re-checked after a cache purge — pending: after 0430 reaches production, confirm the public home still reads its content (the view now needs the shelter header)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the app half follows
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive; the view change only narrows reads
- [x] Apply plan stated — with the next release; 0430 needs the production Worker to be sending `x-shelter-id` (0392's policies already depend on it)

### Rollback

- [x] Rollback position stated — nothing reads the column; each header lists the undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `public_site_content` was owner-run: anon read every shelter's row, with or without a header | fixed — 0430 |
| 2 | high | `set_shelter_logo` (modelled on `set_hero_photo`) updated every shelter's row | fixed — 0431, caught by the harness |
| 3 | medium | `set_hero_photo()` has defect 2 and was not changed (not this item's file) | deferred to backlog — for the planner to file, in the PR body |
| 4 | info | `check-hard-coded-security` named three new anon grants and a definer function | fixed — declared in the registry under the public-site precedent; check not edited |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads the column yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
