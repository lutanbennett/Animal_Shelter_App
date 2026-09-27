# Test plan — schema-vets-readonly

## Header

| | |
|---|---|
| Feature | A vet can read the clinic list but no longer edit it: `0105_vets_readonly_for_vets.sql` replaces `vet_rw_vets` (`for all`) with `vet_read_vets` (`for select`) |
| Backlog item | `docs/backlog.md` → "A vet can still edit the shelter's list of clinics through the database." |
| Branch / worktree | `claude/schema-vets-readonly` @ `C:\Development\Animal_Shelter_schema-vets-readonly` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch (number in the PR itself) |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | yes — `0105_vets_readonly_for_vets.sql` |
| Tested at SHA | `8ef6d5b` (the change; `sync` found `origin/main` @ `7c79650` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a vet's own session can no longer insert, update or delete a `vets` row through the Data API, and can still read every clinic for the vet visit forms — the item's "drop `vet_rw_vets` for a read-only policy"
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0105_vets_readonly_for_vets.sql`; `scripts/check-vets-readonly.mjs` (rollback harness); `docs/backlog.md` (tick); `docs/decisions.md`; this plan. No route, component, lib or `worker/` change
- [x] Roles affected identified: **vet** loses write on `vets`, keeps read. Admin (`admin_all_vets`), management (`management_rw_vets`), staff and volunteer (`*_read_vets`) policies untouched; signed-out public has no access to `vets` before or after
- [x] Anything explicitly **out of scope** written down: `vet_read_contacts`, `vet_read_enclosures`, `vet_read_zones` stay open, per the brief — they belong to the resident-level scope item. Checked rather than assumed: dropping them would blank enclosure, zone and carer names on `/residents`, the resident hub, its housing and adoption-updates sections and `/immunizations/new` (`resident_list_view` is `security_invoker` and joins `enclosures`/`zones` directly). Recorded in `docs/decisions.md`, 2026-09-27, and in the ticked backlog item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.` with `origin/main` @ `7c79650`; `migration numbers: ok — 0105_vets_readonly_for_vets.sql (against origin/main 7c79650, highest 0104_site_pages_international_adoption.sql)`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 13s
=== gates: lint exited 0 after 91s
=== gates: build exited 0 after 165s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0104_site_pages_international_adoption.sql`; no open PR touches `supabase/migrations/`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: dev at 104 applied, `0105_vets_readonly_for_vets.sql` the one pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 104 applied, 1 pending.
dry-run 0105_vets_readonly_for_vets.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 104 applied, 1 pending.
applying 0105_vets_readonly_for_vets.sql … ok
```

  `--status` afterwards: `This checkout: 105 applied, 0 pending.` / `Applied here, no file on origin/main: 1` / `0105_vets_readonly_for_vets.sql` — expected until this PR merges

- [x] File is re-runnable: `drop policy if exists` for both the old and the new name, then `create policy`; the harness runs the whole file twice
- [x] Existing rows still read correctly after the change (checked against real dev data): a vet, staff and volunteer each read all 7 dev clinics after the file (harness A, D)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-vets-readonly.mjs`, every write attempted **with a vet's own JWT** (`role: authenticated`, `sub` = a harness vet linked to a clinic through `user_roles.vet_id`), never the service role. Asserted: **0** before the file, while `vet_rw_vets` exists, the vet renames another clinic (1 row) — so the harness reaches RLS and the later refusals are the file's doing; **A** the vet reads every clinic; **B** the vet's insert is refused outright, and update of another clinic, of their own clinic and a blanket update all touch 0 rows, delete touches 0, and the name is unchanged; **C** the only vet policy on `vets` is `vet_read_vets`, `SELECT`; **D** management inserts, updates and deletes, admin updates, staff and volunteer read all and staff's update touches 0; **E** the service role still updates. Output, unedited — first run with the file pending on dev, then after the apply:

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK 0105_vets_readonly_for_vets.sql ran twice | pending on dev | 0: before the file a vet renamed another clinic (1 row) | A: vet reads 7/7 clinics | B: vet insert refused, update 0 (own, other, all), delete 0 | C: only vet_read_vets (SELECT) for vets | D: management insert/update/delete 1, admin update 1, staff+volunteer read all, staff update 0 | E: service role update 1
CONTEXT:  PL/pgSQL function inline_code_block line 79 at RAISE
```

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK 0105_vets_readonly_for_vets.sql ran twice | applied on dev | 0: skipped, file already applied on dev | A: vet reads 7/7 clinics | B: vet insert refused, update 0 (own, other, all), delete 0 | C: only vet_read_vets (SELECT) for vets | D: management insert/update/delete 1, admin update 1, staff+volunteer read all, staff update 0 | E: service role update 1
CONTEXT:  PL/pgSQL function inline_code_block line 79 at RAISE
```

- [x] Down-migration written, or the reason one is not needed is stated: none written. No data changes; the inverse is `0001`'s one line (`create policy vet_rw_vets on vets for all using (current_user_role() = 'vet')`), and nobody should want a vet editing clinics back
- [x] Production apply plan stated for the release manager: **needs Lutan's go**, from the main checkout after merge: `node scripts/apply-migrations.mjs --env production --status`, `--dry-run`, then apply to `dbkodyyxxhtygxcxmfcu`. Independent of any deploy — no code changes

## 4. Functional checks

- [x] Happy path works end to end: after the apply on dev, a vet's JWT reads every clinic (what `/vet-visits/new` and `/vet-visits/[id]/edit` select) and is refused every write (harness A, B)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI write path; the policy is persisted in dev's `pg_policies` (harness C, second run)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI; insert, update and delete on `vets` exercised per role in the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no page changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; a vet reaching the Data API gets PostgREST's RLS refusal
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the vet's **own** clinic (`user_roles.vet_id`) is refused as firmly as another clinic, and an update with no `where` touches 0 rows (harness B)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `vets` via Data API / `/management/vets` | read + write | pass (harness D: update 1) |
| management | `vets` via Data API / `/management/vets` | read + write | pass (harness D: insert, update, delete 1) |
| staff | `vets` via Data API | read only | pass (harness D: reads 7/7, update 0) |
| vet | `vets` via Data API with own JWT | read only | pass (harness A, B: reads 7/7, insert refused, update/delete 0) |
| volunteer | `vets` via Data API | read only | pass (harness D: reads 7/7) |
| signed out | `vets` | no access | n/a: no `anon` policy on `vets` before or after; this file does not touch grants |

- [x] Every role above tested: five app roles with their own JWT in the harness; signed out unchanged by this file
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): a vet's own JWT is refused by RLS in the database itself — the path the page guard from #182 does not cover

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual does not describe database policies, and nothing a user sees changes
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no client code changed
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: the reads behind `/vet-visits/new` and `/vet-visits/[id]/edit` (vet), `/vets` and `/vets/[id]` (staff, volunteer) and the writes behind `/management/vets` (management, admin) all asserted against real dev data in the harness
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` merged nothing new; gates run after it, all 0

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, with what was done and where the reads finding is recorded
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-27 — read kept for the vet visit forms, measured with a vet's JWT, and the three vet reads left open with what dropping them would blank
- [ ] `README.md` still accurate — n/a: README does not list RLS policies per role
- [ ] **Release notes.** — n/a: nobody would notice — no page changes; it closes a Data API path no shelter user reaches through the app, since #182 already refused a vet the clinic pages
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The rename-before / refusal-after, 7/7 reads and per-role counts are harness output above; the "blanks, does not error" claim for the three reads is from reading `resident_list_view`'s definition (`0058`, `security_invoker = on`, direct joins) and the vet-reachable page queries, and is stated as a reason to leave them, not a change made

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this change derives a date
- [ ] **Boundary or banding change covers both edges** — n/a: not a threshold; the own-clinic vs other-clinic edge is in harness B
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: `vets` is not read by any public page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code in this PR; the app never wrote `vets` as a vet, so apply order against any deploy does not matter
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, from the main checkout
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: a policy swap, no data touched
- [x] Apply plan stated: `0105_vets_readonly_for_vets.sql` → production `dbkodyyxxhtygxcxmfcu`, any time after merge, independent of the deploy (§3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: the Worker is unchanged by this PR, so `wrangler rollback` does nothing here. Reverting means re-creating `vet_rw_vets` in a new file (§3); nothing depends on its absence

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A vet's JWT still reads `contacts`, `enclosures` and `zones` through the Data API (the shelter's address book among them) | deferred to backlog — the resident-level scope item, per the brief; what it must move first is in decisions.md 2026-09-27 |

## Left for manual verification

None — no page changed, and every behaviour is asserted with each role's own JWT in the harness.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface — nothing a person could look at changes; the refusal is asserted with a vet's JWT in the harness

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 1 is deferred to the resident-level scope item by the brief, recorded above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
