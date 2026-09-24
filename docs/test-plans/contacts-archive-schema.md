# Feature test plan

## Header

| | |
|---|---|
| Feature | `contacts.archived_at` / `archived_by` / `archive_reason`: archive contacts instead of deleting them, schema half only |
| Backlog item | `docs/backlog.md` → Management → **Archive contacts instead of deleting them** (ticked on the feature PR, not this one) |
| Branch / worktree | `claude/contacts-archive-schema` @ `C:\Development\Animal_Shelter_contacts-archive-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | #86 |
| Tested by / date | Claude (automated) / 2026-09-24 |
| Carries a migration? | yes: `0075_contacts_archive.sql` |
| Tested at SHA | branch on `main` @ `c50a13b`; the migration, harness, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration puts nullable `archived_at timestamptz`, `archived_by uuid` and `archive_reason text` on `contacts`, so the feature PR has somewhere to record an archive
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0075_contacts_archive.sql`; `scripts/check-contacts-archive.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. None yet, because no code reads or writes the columns. The existing row policies on `contacts` apply to them unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the Archive/Restore actions, the hidden-by-default lists, the pickers, the placement refusal and search are all the `claude/contacts-archive` stream, which also picks up the `refresh()` one-liner for `src/app/management/contacts/actions.ts`. The backlog tick belongs to the feature PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date", exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 400s

  gates: typecheck=0 lint=0 build=0
  ```

  That run began before `scripts/check-contacts-archive.mjs` existed, so `npm run lint` was run again afterwards over the final tree: exit 0.
- [x] CI green on the PR (runs the same three): `check` and `test-plan` both pass on #86 (run 35955936539, at `c11fe81`)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0074_vet_doctor_name.sql`; `gh pr list` shows no open PR touching `supabase/migrations/`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `76 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`, then `76 applied, 1 pending` with the file in place
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0075_contacts_archive.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0075_contacts_archive.sql … ok`; `--status` afterwards shows `77 applied, 0 pending`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness executes the whole file twice in one transaction, after the real apply, so three runs in total against the same schema
- [x] Existing rows still read correctly after the change (checked against real dev data): harness step A found all 4 dev contacts present and none back-filled
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-contacts-archive.mjs`, against a real dev carer with placement history (the contact `deleteContact` refuses). Asserted: (A) no existing row back-filled; (B) three nullable columns of the right types, `archived_by` FK to `auth.users` with `on delete set null`; (C) an archive round-trips at microsecond precision across a `+07` offset, and `archived_by` / `archive_reason` may be null while archived; (D) the check constraint rejects a restore that leaves `archive_reason`, a restore that leaves `archived_by`, and a live insert carrying a reason; (E) a full restore and a plain insert succeed. A separate negative control (`raise exception` in a `do` block) confirmed a failing assertion surfaces as a 400. Output, unedited (run after the apply):

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK existing rows=4 back-filled=0 | shape: 3 nullable columns, archived_by FK on delete set null | archive round-trip (carer with placement history: t), who/why optional | constraint rejects restore leaving reason, restore leaving archived_by, live row with reason | full restore and plain insert ok | file ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 63 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; the script exits 0 only on `HARNESS-OK`.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive; undoing it is `drop constraint contacts_archive_fields_consistent` then the three `drop column`s, and nothing in data depends on it until the feature PR ships
- [x] Production apply plan stated for the release manager (which file, which project, when): `0075_contacts_archive.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan, `node scripts/apply-migrations.mjs --env production --dry-run` then without, from the main checkout, **before** the `contacts-archive` feature is deployed (that code will select these columns)

## 4. Functional checks

- [x] Happy path works end to end: harness steps C and E are the archive and restore writes the feature will make
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; archive, restore and insert exercised in the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: at the schema level the invalid state is a half-restore, which the constraint rejects as `check_violation` (step D); the app's message is the feature PR's job
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): null `archived_by` and `archive_reason` while archived, microsecond timestamp across a timezone offset

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | — | — |
| management | n/a: no route or policy changed | — | — |
| staff | n/a: no route or policy changed | — | — |
| vet | n/a: no route or policy changed | — | — |
| volunteer | n/a: no route or policy changed | — | — |
| signed out | n/a: no route or policy changed | — | — |

- [ ] Every role above tested — n/a: no route, grant or RLS policy changed; the columns use the existing row policies
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature PR documents archiving
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded, because nothing in `src/` selects these columns. The harness showed every existing `contacts` row is still present and unchanged, and that an insert without the columns still works (step E)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in, and the build is green on this tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the brief puts the tick on the feature PR, which is when the item is actually done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: who/why exist only while archived, so restore clears all three; both optional; `archived_by` is `on delete set null`
- [x] `README.md` still accurate: it does not list columns
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: three columns no screen reads yet; the feature PR adds the line when staff can archive a contact
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned:** the constraint's rejections, optional who/why, the set-null FK and no back-fill all come from the harness run above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; `archived_at` is a stored instant
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or page reads `contacts`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, but the follow-on `contacts-archive` feature will, so production must have 0075 **before** that feature deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive nullable columns; no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. The columns are additive and safe to leave in place; to remove them, drop the constraint, then the columns. Once the feature ships, dropping them un-archives every archived contact and loses who archived each one and why

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: nothing in this change has a surface a person needs to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager: the PR states that Lutan applies it to production, before the feature deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
