# Test plan — photo-proxy-public-schema

## Header

| | |
|---|---|
| Feature | `0084_is_public_drive_file.sql` adds `is_public_drive_file(text)`: yes only for Drive files a `public_*` view or `site_content(_photos)` shows. It is security invoker and granted to anon, authenticated and service_role. `check-public-views.mjs` allow-lists it and asks it about a real public photo and a real blood-test file. Nothing calls it yet |
| Backlog item | `docs/backlog.md` → Architecture → "The photo proxy serves any known Drive file to a signed-out visitor, internal attachments included." (schema half; the feature half closes it) |
| Branch / worktree | `claude/photo-proxy-public-schema` @ `C:\Development\Animal_Shelter_photo-proxy-public-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | opened from this branch (number in the PR itself) |
| Tested by / date | Claude, 2026-09-25 |
| Carries a migration? | yes — `0084_is_public_drive_file.sql` |
| Tested at SHA | `5acfd97` (the change; `sync` found `origin/main` @ `4dc8e10` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a companion to `is_known_drive_file` that answers yes only for files the public site shows, which the proxy can ask for a signed-out visitor. The brief limits this branch to the migration and the guard. The route change, the session check and the cache key are the feature half
- [x] Files/areas touched listed: `supabase/migrations/0084_is_public_drive_file.sql`; `scripts/check-public-views.mjs`; `scripts/check-public-drive-file.mjs` (new rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: none today. Anon, authenticated and service_role gain EXECUTE on a read-only function that reveals nothing anon cannot already select from the public views
- [x] Anything explicitly **out of scope** written down: `/api/photos/[fileId]` still calls `is_known_drive_file` and still streams internal attachments to anyone with the id. The edge cache is still keyed by URL alone, with `Cache-Control: public`. All of that is the feature half, `claude/photo-proxy-session-check` (batch 3). The backlog item is deliberately **not** ticked here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 88s
=== gates: lint exited 0 after 280s
=== gates: build exited 0 after 764s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #124, run 36128667050 — `check` pass (1m2s), `migration-numbers` pass (6s), `test-plan` pass (12s)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0084_is_public_drive_file.sql (against origin/main 4dc8e10, highest 0083_stock_on_hand.sql)`; `gh pr list --state open` returned `[]`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 83 applied, 1 pending.` / `pending: 0084_is_public_drive_file.sql (not on origin/main)`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 83 applied, 1 pending.
dry-run 0084_is_public_drive_file.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 83 applied, 1 pending.
applying 0084_is_public_drive_file.sql … ok
```

- [x] File is re-runnable: `create or replace function`, idempotent `revoke`/`grant`, `comment on`. The harness runs the whole file twice inside its transaction
- [x] Existing rows still read correctly after the change (checked against real dev data): nothing existing is altered. The harness's case D checks real rows: every Drive id in the public views comes back public, and no real blood-test or procedure file does
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-public-drive-file.mjs`. It adds one fixture of each public kind and each internal kind, then asks each one as anon (`set local role anon`) and as a real admin (`role authenticated` with a JWT `sub`). What it asserts:
  - A. Public files get yes from both callers.
  - B. Internal files get no from both, though `is_known_drive_file` knows every one of them.
  - C. Hiding the resident, unpublishing the project and archiving the Friend's contact each withdraw that file.
  - D. The real-row checks above.
  - E. EXECUTE is held by the three API roles and not by PUBLIC, and the function is not security definer.

  Output, unedited:

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK public (resident photo, hidden resident's profile photo via cards, project photo, site hero + gallery, published logo) yes to anon and admin | internal (blood test, procedure, maintenance attachment + photo, hidden resident's other photo, private project photo, legacy project_photos, unpublished logo, unknown id) no to both | hiding resident / unpublishing project / archiving contact withdraws each | real rows: 0 blood-test/procedure files public, every public-view id public | EXECUTE anon+authenticated+service_role, not PUBLIC, invoker | file ran twice
CONTEXT:  PL/pgSQL function inline_code_block line 98 at RAISE
```

  I ran two negative controls, editing the migration file temporarily and restoring it afterwards. Removing the `public_resident_cards` branch failed with `FAIL A anon: h0084resHiddenProfile should be public`. Adding an `attachments` branch failed with `42501: permission denied for table attachments`. So invoker rights stop the function widening to an internal table
- [x] Down-migration written, or the reason one is not needed is stated: none written. It adds one function and changes no data. The inverse is `drop function if exists is_public_drive_file(text);`, and nothing calls the function yet
- [x] Production apply plan stated for the release manager: **needs Lutan's go**. From the main checkout: `node scripts/apply-migrations.mjs --env production --status`, then `--dry-run`, then apply, then `node scripts/check-public-views.mjs --env production`. It must be applied to production **before** the feature half deploys, because the switched route will call this function. On its own it is independent of any deploy

## 4. Functional checks

**The function tells the two kinds of file apart when called with the anon key** (real dev rows; the ids are cut to six characters by the probe):

```
anon  is_known_drive_file  public resident photo  1KJTyi…  HTTP 200  true
anon  is_public_drive_file public resident photo  1KJTyi…  HTTP 200  true
anon  is_known_drive_file  blood_test attachment  1i9h97…  HTTP 200  true
anon  is_public_drive_file blood_test attachment  1i9h97…  HTTP 200  false
```

- [x] Happy path works end to end: the table above, plus harness cases A–C
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, and the function writes nothing
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code calls this function yet; the harness toggles the data it reads (case C)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; an unknown id answers `false` (harness case B, `h0084noSuchFile`)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; any text is a valid question and a non-matching one answers `false`
- [x] Boundary cases checked: both sides of each visibility flag (case C). The hidden resident's profile photo is public through `public_resident_cards`, but their other photos are not (cases A/B)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `is_public_drive_file` | same answer as anon | pass: harness, a real admin via `authenticated` + JWT `sub`, cases A and B |
| management | same, via `authenticated` | same answer as anon | pass: the grant is to `authenticated`, and the function reads only owner-rights views and `using (true)` tables, so the app role cannot change the answer |
| staff | same | same | pass: same reasoning as management |
| vet | same | same | pass: same reasoning as management |
| volunteer | same | same | pass: same reasoning as management |
| signed out | `is_public_drive_file` | yes for public files, no for internal | pass: anon-key probe above; `check-public-views.mjs` 112 ok / 0 FAIL |

- [ ] Every role above tested — n/a: anon and admin were exercised directly. The other four were not, because the function reads nothing whose visibility depends on the caller's role. That is the point of making it invoker over those objects
- [ ] A role that should not have access is blocked server-side — n/a: every API role is meant to reach this function. What it must not do is say yes for an internal file, and case B covers that for anon and for a signed-in caller

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface, no code calls this function yet
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface, no code calls this function yet
- [ ] Network clean — n/a: no UI surface; the function's own HTTP answers are in §4

## 6. Regression

- [x] The pages nearest the change still work. `check-public-views.mjs` against dev after the apply exited 0: 112 ok, 0 FAIL. Every public view and table still answers anon, every other function is still refused, and `is_known_drive_file`, which the live proxy calls, is still anon-callable. The new lines, unedited:

```
ok    is_known_drive_file(): anon can EXECUTE — HTTP 200
ok    is_public_drive_file(): anon can EXECUTE — HTTP 200
ok    is_public_drive_file(): yes for a public resident photo — true
ok    is_public_drive_file(): no for a blood-test/procedure file — false
```

- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared source file touched; `check-public-views.mjs` is a standalone script and was run
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync merged nothing (`Already up to date.`)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: schema half only; the brief says the feature half (`claude/photo-proxy-session-check`) ticks it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-25 — Public Drive files are the ones the public views show". It covers:
  - reading "public" from the views rather than restating it
  - the list being wider than the item guessed (`public_recent_adoptions`, and `public_resident_cards` making every resident's profile photo public)
  - why the function is invoker, not definer
  - the explicit grants
- [ ] `README.md` still accurate — n/a: the README does not document the photo proxy's functions; the go-live check paragraph needs no change for one more allow-listed function
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing calls the new function yet, so no page or photo behaves any differently
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The public-source list comes from reading every view anon may read and the pages that use them. The public/internal answers come from the harness and the anon-key probe. "Invoker cannot widen to `attachments`" comes from the negative control, and "the cards branch matters" from the other one. Production was **not** checked

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL and scripts, already applied to the dev database)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date. `public_recent_adoptions`' 90-day window is unchanged and only read
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; both sides of each visibility flag are covered in §3 case C
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** One abbreviation, named where it happens: the probe's six-character id cut in §4
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page reads anything this migration changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No. The code that reads it is the feature half, which must not deploy to production before `0084` is applied there (§3 apply plan)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production is his go; this worktree has no production credentials)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive, one new function
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. `drop function if exists is_public_drive_file(text);` in a new migration removes it, together with its `PUBLIC_FUNCTIONS` entry and the two behaviour checks in `check-public-views.mjs`. That is safe only while no deployed route calls it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium (pre-existing) | The photo proxy streams any known Drive file, internal attachments included, to a signed-out visitor with its id, and its edge cache is keyed by URL alone | deferred to the feature half, `claude/photo-proxy-session-check` (already on the backlog; this PR supplies its schema) |

## Left for manual verification

Empty: nothing has a surface a person could look at until the route calls the function.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-25

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty

Manual verification by: n/a: no UI surface, no code calls this function yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — summarised in the PR description, with a pointer to this file
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
