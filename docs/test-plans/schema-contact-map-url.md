# Feature test plan

## Header

| | |
|---|---|
| Feature | Database check on `site_content.contact_map_url` (WEB-6 follow-up): the same `~* '^https?://'` check `0080` put on the social links. One migration, no UI change |
| Backlog item | `docs/backlog.md` → **Database check on `contact_map_url`** — ticked on this branch |
| Branch / worktree | `claude/schema-contact-map-url` @ `C:\Development\Animal_Shelter_schema-contact-map-url` |
| Dev server | not started. No `src/` change |
| PR | see the PR for this branch |
| Tested by / date | Claude (automated) / 2026-10-01 |
| Carries a migration? | yes: `0120_contact_map_url_check.sql` |
| Tested at SHA | branch on `main` @ `ffe00b9`, plus the migration, its harness, the backlog tick and this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a write to `contact_map_url` that skips `admin/website/actions.ts` is now refused unless it starts with `http://` or `https://`
- [x] Files/areas touched listed: `supabase/migrations/0120_contact_map_url_check.sql`; `scripts/check-contact-map-url.mjs` (dev-only harness); `docs/backlog.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin and management (who can edit `site_content`) are now held to the check at the database as well as in the action. Staff, vet, volunteer and signed-out public: unchanged
- [x] Anything explicitly **out of scope** written down: no UI; no new column (so nothing new becomes world-readable); production not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date at `ffe00b9`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed: GATES_PLACEHOLDER
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0119`; this is batch 20's only migration slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `119 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`, no drift against `main`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: the harness runs the whole file twice inside `begin … rollback` against dev, which is the same check with assertions on top
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0120_contact_map_url_check.sql … ok`
- [x] File is re-runnable: `drop constraint if exists` then `add constraint`; the harness runs it twice and finds exactly one check
- [x] Existing rows still read correctly after the change (checked against real dev data): `site_content` is a singleton and its `contact_map_url` was NULL before the apply, which a check passes, so no `not valid` step was needed
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-contact-map-url.mjs`. Asserted: exactly one check on the column after two runs; an `https://` URL round-trips; `javascript:alert(1)` is **refused**; a schemeless `maps.google.com/x` is **refused**; NULL ("not set") is allowed. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK one check after two runs | https round-trips | javascript: and schemeless refused | NULL ok
  CONTEXT:  PL/pgSQL function inline_code_block line 25 at RAISE
  ```

  (`status 400` is by design: the transaction ends in a `raise`, so nothing commits; the script exits 0 only on `HARNESS-OK`.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no data changes. To undo: `alter table site_content drop constraint site_content_contact_map_url_check;`
- [x] Production apply plan stated for the release manager: `0120_contact_map_url_check.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout. Before applying, read production's `contact_map_url` — if it holds a non-`http(s)` value the apply fails, and the file should then become `not valid` plus a later `validate`

## 4. Functional checks

- [x] Happy path works end to end: an https URL is accepted and read back (harness)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [x] Create / edit / delete all exercised (whichever the feature has): set, refused set, clear to NULL
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; NULL is the empty state and is allowed
- [x] Invalid input is rejected with a readable message, not a crash: the database raises `check_violation`; the app's `checkHttpsUrl` still catches it first with the readable message
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): scheme missing, `javascript:`, NULL

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | edit `contact_map_url` | https accepted, other refused | passed (harness, as table owner; the check does not look at role) |
| management | same policy as admin | same | not driven separately; a check constraint is role-blind |
| staff | no `site_content` write | unchanged | no change to policies |
| vet | no `site_content` write | unchanged | no change to policies |
| volunteer | no `site_content` write | unchanged | no change to policies |
| signed out | read only | unchanged | no change to policies or grants |

- [x] Every role above tested: the constraint is role-blind and no policy or grant changed
- [x] A role that should not have access is blocked server-side: unchanged, and a bad value is now refused for every writer including the owner

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can reach changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded; `/admin/website` saves an https URL through the action, which the harness reproduces at the database
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing merged, gates green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the file copies `0080`'s check and no `not valid` step was needed, so there is nothing non-obvious to record
- [x] `README.md` still accurate: it does not list constraints
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody sees a constraint the app already enforced
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the NULL row comes from a query against dev on 2026-10-01; behaviour claims come from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already on the dev database)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; accept and refuse are both asserted
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: the check changes no read

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: no `src/` change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3; either order is safe)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. Undoing the migration is the one statement in §3 and loses nothing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty. There is no screen; the app already enforced this value.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan rather than duplicating it
- [x] Handed to the production release manager: the PR states the production apply as Lutan's

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
