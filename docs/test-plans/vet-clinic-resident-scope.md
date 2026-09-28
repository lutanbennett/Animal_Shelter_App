# Feature test plan

## Header

| | |
|---|---|
| Feature | A vet sees only the residents their own clinic treats, held in RLS (`0108`) |
| Backlog item | `docs/backlog.md` → Auth → "A vet should see only the residents their own clinic treats" (Pass 1, order 4) |
| Branch / worktree | `claude/vet-clinic-resident-scope` @ `C:\Development\Animal_Shelter_vet-clinic-resident-scope` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` |
| PR | opened from this branch; number added in the follow-up commit |
| Tested by / date | Claude, 2026-09-28 |
| Carries a migration? | yes — `0108_vet_resident_scope.sql` |
| Tested at SHA | `fc13689` (after syncing `origin/main` `ac8a722`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a vet account sees every resident its clinic holds a visit, prescription, procedure or blood test for, and no other, enforced by RLS so a typed `/residents/<id>` and the Data API hold too
- [x] Files/areas touched listed — `supabase/migrations/0108_vet_resident_scope.sql` (1 function, 14 policies on 11 tables, 5 views, `record_attachment`); `scripts/check-vet-resident-scope.mjs`; `src/app/residents/page.tsx` (clinic notice); `src/lib/vets/scope.ts` (comment); `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `docs/decisions.md`; `docs/backlog.md`
- [x] Roles affected identified — vet (scoped); admin, management, staff, volunteer unchanged (proved by harness F); signed-out public unchanged (policies are role-conditioned; the `public_*` views are not touched)
- [x] Anything explicitly **out of scope** written down — a vet's *writes* on another clinic's rows and the clinic of a visit they record (not RLS yet); a vet's read of `contacts` / `enclosures` / `zones` / `shelter_friends`. Both are backlog items on the `backlog` branch (`babbd4d`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (0.8.1 had moved `unreleased` into the release), resolved by keeping only this PR's line in `unreleased` (`fc13689`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 274s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: "ok — 0108_vet_resident_scope.sql (against origin/main ac8a722, highest 0107…)"; this batch's migration slot per the brief
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — "107 applied, 1 pending"
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0108_vet_resident_scope.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0108_vet_resident_scope.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — the harness runs it twice in one transaction, both before and after it was applied on dev
- [x] Existing rows still read correctly after the change (checked against real dev data) — Data API as a real vet login linked to Novel: 14 of 82 residents, exactly the 14 Novel has visits for, 0 outside; the four other roles still read all residents (harness F)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `node scripts/check-vet-resident-scope.mjs`, run before and after applying. Asserted: before the file a vet's JWT read another clinic's resident (the hole was real and the harness reaches RLS); after it the vet reads exactly its clinic's 3 harness residents out of all dev, a resident with only a cancelled visit included; another clinic's resident by id is 0 rows from `residents`, `resident_list_view`, `resident_current_state`, `current_placement`; 0 of that resident's rows from 11 clinical tables and views; a resident seen by both clinics shows both clinics' visits; a vet cannot insert a weight, book a visit (even at its own clinic) or record an attachment for an out-of-scope resident, updates and deletes touch 0 rows, while the same writes on an in-scope resident succeed; a vet with no clinic reads 0 through every path; admin, management, staff, volunteer and the service role read every resident; translations and `translation_queue` hide the out-of-scope resident's rows. Output after applying:

```
HARNESS-OK 0108_vet_resident_scope.sql ran twice | applied on dev | 0: skipped, file already applied on dev | A: vet reads 3 of 87 residents (seen, cancelled-only, mixed), same in both views | B: other and none by id: 0 from residents, resident_list_view, resident_current_state, current_placement | C: 0 of other's rows from 11 tables/views; mixed shows both clinics' visits (2) | D: other: weight/visit/attachment refused, update 0, delete 0; seen: weight 1, attachment 1 | E: unlinked vet reads 0 from residents, both views, current_placement, visits, weights | F: admin/management/staff/volunteer and service role read all 87 | G: vet reads 0 of other's 1 translation rows (table and queue); 1 of seen's
```

Before applying, check 0 read: `0: before the file the vet read other (1 row)`.

- [x] Down-migration written, or the reason one is not needed is stated — not written: 0108 only replaces policies, views and two functions, adds no column or data, and reverting means re-running the previous definitions (0001/0056/0086/0097 policies, 0086 views, 0097 `record_attachment`) plus `drop function current_vet_resident_ids()`. If the branch were abandoned that down-migration would be needed on dev before the number is reused
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0108_vet_resident_scope.sql` to production `dbkodyyxxhtygxcxmfcu` with `node scripts/apply-migrations.mjs --env production`, **before** the deploy that carries the `/residents` notice. **First**, every live vet account in production needs its clinic set under Settings → Security, or it opens to an empty Residents list

## 4. Functional checks

- [x] Happy path works end to end — browser pane, signed in as a dev vet login linked to Novel: `/residents` lists 11 living + 3 deceased-hidden, with "Showing the residents Novel has a vet visit, prescription, procedure or blood test for…"; the resident Angsumalin's Vet Appointments page shows Novel's visit and two Mae Wang visits; the Book vet visit resident picker offers the same 11 and not Doi (another clinic's resident)
- [x] Data persists — reload the page and the change is still there — the list reloaded (including at 375px) with the same 11 / 3
- [x] Create / edit / delete all exercised (whichever the feature has) — the feature adds no form; a vet's insert / update / delete on in-scope and out-of-scope residents exercised in the harness (check D)
- [x] Empty state renders sensibly (no rows yet) — the test vet's clinic cleared on dev: `/residents` shows "0 residents", "Your account isn't linked to a clinic yet, so no residents are shown. Ask a shelter admin to set your clinic in Settings → Security." and the table's "No residents match these filters." Clinic restored afterwards
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the feature adds no input; an out-of-scope id in a URL is covered in the role matrix (404 / "Resident not found.")
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the boundaries here are records rather than values: a resident with only a cancelled visit (visible), with visits at two clinics (visible, both shown), with no record (hidden), a vet with no clinic (sees none) — harness A, C, E

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every resident, table and view | unchanged | harness F: reads all 87 residents and `resident_current_state`, and the out-of-scope resident's weight |
| management | every resident | unchanged | harness F: same |
| staff | every resident | unchanged | harness F: same |
| vet | own clinic's residents only | scoped; out-of-scope id refused server-side | Browser: typed `/residents/ab0dcb4f-…` (Doi, Mae Wang only) → 404 "This page could not be found."; `/residents/ab0dcb4f-…/vet-appointments` → 404; `/weight/new?residentId=ab0dcb4f-…` → "Resident not found.". Data API (real sign-in over HTTP, supabase-js with the anon key and the vet's session): `residents` 14 rows, 0 outside Novel; `residents?id=eq.ab0dcb4f-…` 0 rows; `resident_current_state` for it 0; `vet_appointments` for it 0; an in-scope id 1 row |
| volunteer | every resident | unchanged | harness F: same as admin |
| signed out | nothing in the app | unchanged | not re-tested: 0108's conditions are all `current_user_role() = 'vet'`, or `is distinct from 'vet'` behind 0086's unchanged `has_app_access()` gate |

- [x] Every role above tested — admin, management, staff, volunteer, vet and unlinked vet through the harness's per-role JWTs; vet also in the browser and the real Data API; signed out reasoned in the table above
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — typed URL 404s and the Data API returns 0 rows, above

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the vet menu (My tasks, Residents) is #182's and unchanged
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `roleSummary.vet` no longer says "Can read resident details"; a vet note on "Finding a resident"; the Accounts and roles step says what a vet's clinic now decides. Read in the file, not at `/manual`: see Left for manual verification
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: new strings are UI dictionary entries (EN and TH both added), not translatable database fields
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/residents` as the vet at 375×812: `scrollWidth` 375 = `clientWidth`, notice wraps under the count
- [x] Browser console clean — no errors or React warnings — `read_console_messages` (errors only) empty after the vet pages above
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the only 404s are the deliberate out-of-scope resident pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — as the vet: `/residents`, a resident's Vet Appointments page, `/vet-visits/new` and its resident picker, `/weight/new`; other roles' reads through harness F
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `manual/en.ts` changed only in text; `src/lib/vets/scope.ts` changed only in a comment; `releases.ts` gained one data line. No code path another page loads changed. Staff-side pages are in Left for manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green at `fc13689`, after the merge; the only overlap was `releases.ts`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked with a Done note; two follow-ups committed to `backlog` (`babbd4d`)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-28, "A vet sees only their clinic's residents, held in RLS (`0108`)"
- [ ] `README.md` still accurate — n/a: the README does not describe role access
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — one line, tagged vet and admin
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — "13 records with no visit" and "80-odd residents" are from dev queries; the view hole was shown by the harness's check 0 and by the picker listing only Novel's residents after the file; "the other definer functions refuse a vet" was read from their bodies on dev (`pg_get_functiondef`)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; visibility does not depend on when a visit is
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; the permission edges (cancelled-only, two clinics, none, unlinked) are asserted in section 3
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the `gates:` and `HARNESS-OK` lines are pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — yes: `/residents` reads the scope only to name the clinic; it works against a database without 0108 (it would name the clinic over an unscoped list). Apply 0108 first anyway, after every production vet account has its clinic set
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no data is written or rewritten; policies, views and functions only
- [x] Apply plan stated — section 3, last line

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `wrangler rollback` reverts only the notice. 0108 stays applied and keeps scoping vets; undoing it needs the down-migration described in section 3. Leaving it is safe for every non-vet role (harness F)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A vet's JWT can still update or delete another clinic's rows on a resident they can see, and insert a visit with any `vet_id` | accepted: it predates this PR and is outside the item (which residents a vet sees); deferred to backlog ("A vet can still write another clinic's records…", `babbd4d`) |
| 2 | medium | A vet's JWT still reads every contact through the Data API (menu-gated only) | accepted: it predates this PR and is outside the item; deferred to backlog ("Should a vet read the shelter's address book at all?", `babbd4d`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a vet with a real clinic (Lutan's vet login, Novel): the Residents list is the clinic's, the line under the heading reads well, and a resident you expect is not missing | `/residents` on dev |
| 2 | Signed in as staff or admin: the Residents list, a resident hub and the vet-visit resident picker still show every resident | `/residents`, `/vet-visits/new` |
| 3 | The three changed manual passages read correctly in context | `/manual` → Residents → Finding a resident; Accounts and roles; the vet role summary |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has checked it yet

Manual verification by: pending: the three items above — a vet with a real clinic, a staff/admin regression look, and the manual passages

### Result

- [x] Open defects are either fixed or explicitly accepted above — both predate this PR and are accepted as outside the item, with backlog items; Lutan may overrule when reviewing
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
