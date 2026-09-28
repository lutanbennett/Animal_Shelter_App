# Feature test plan

## Header

| | |
|---|---|
| Feature | Each clinic's doctor list (`vet_doctors`, 0102) seen and corrected at Management → Vets → Doctors — rename, merge, mark as left, add, delete an unused entry — shown read-only on the clinic hub; booking passes `p_doctor_name` in one call; the visit forms suggest from the list |
| Backlog item | `docs/backlog.md` → Medical records → **Doctors belong to a vet: investigate a managed list rather than free text** (ticked here: this is the feature half) |
| Branch / worktree | `claude/vet-doctors-roster-screen` @ `C:\Development\Animal_Shelter_vet-doctors-roster-screen` |
| Dev server | `next dev` on `http://localhost:3010`, dev database |
| PR | opened from this branch; number in the PR itself |
| Tested by / date | Claude (automated) / 2026-09-28 |
| Carries a migration? | no — uses `0102` (#176), already on `main` and applied to dev |
| Tested at SHA | `4129e16` (feature commit, on `main` @ `531e199`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item's "feature half still to do" — the list per clinic (view, rename, deactivate, merge), the booking form passing `p_doctor_name` instead of its second write, suggestions from the list instead of harvested names, manual and release-notes line. The fourth part, choosing a vet account's clinic in `/admin/security`, had already shipped with the vet-scope work (see `src/lib/vets/scope.ts` and its `unreleased` line)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): new `src/app/management/vets/[id]/doctors/` (page, table, add form, actions); `src/app/management/vets/` (Doctors column); `src/app/vets/[id]/` (hub list); `src/app/vet-visits/new/actions.ts` (one RPC call); `src/lib/vets/doctors.ts` (suggestions from the list, look-alike matcher); both dictionaries; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `README.md`, `docs/decisions.md`, `docs/backlog.md`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. The roster page and its actions: admin and management only. The hub's read-only list: every shelter role (admin, management, staff, volunteer). Booking and the forms' suggestions: every booking role (admin, management, staff, vet). There is no `resident` role; signed-out is sent to sign in
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: linking a vet *account* to a particular doctor (waits for backlog item 4); any RLS change (0105 is untouched, and every booking role keeps write on `vet_doctors` because a typed name adds a row); the look-alike hint does not match across scripts ("Ploy" / "พลอย"); the older Management tables still throw their errors rather than return them (see `docs/decisions.md`, 2026-09-28)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.` at `531e199`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 325s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; `0102` was applied to dev by #176
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the pages were read against dev's real clinics too (Management → Vets lists Mae Wang with its 1 doctor from the 0102 backfill, every other clinic "None yet")
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; `0102`'s own harness `scripts/check-vet-doctors.mjs` (#176) covers the trigger, merge and rename propagation at the database, and §4 drives them from the page
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR. The code reads `vet_doctors`, `vet_appointments.doctor_id`, `merge_vet_doctors` and the 7-argument `schedule_bulk_appointments`, all from `0102`, so production must have `0102` before this deploys (§8)

## 4. Functional checks

All in the built-in browser against `next dev` on :3010 and the dev database, signed in with the dev test login (admin). A disposable clinic, **[roster] Test Clinic** (`7617527f…`), was made for this with nine completed visits across three residents typed as "Dr Somchai" ×2, "Somchai", "somchai", "Dr. Ploy", "หมอพลอย" and "Dr Anan" ×3. The trigger gave five doctors, with "somchai" linked to "Somchai" (case ignored, as 0102 says). Left on dev (disposable).

- [x] Happy path works end to end: Management → Vets shows a Doctors column ("5 doctors" for the test clinic, "1 doctor" for Mae Wang, "None yet" elsewhere) linking to the clinic's list; the list shows each doctor's visits and latest date, and marks "Dr Somchai" / "Somchai" as "Possibly the same person as …" with a note above the table
- [x] Data persists — reload the page and the change is still there: after each operation the page was reloaded and the rows read back from the database with a service-role script (below)
- [x] Create / edit / delete all exercised (whichever the feature has):
  - **Merge** "Somchai" → "Dr Somchai" (the target was preselected from the look-alike hint). Confirm text as captured: `Merge "Somchai" into "Dr Somchai"? … The 2 visits recorded with "Somchai" will show "Dr Somchai" instead, past ones included. "Somchai" is removed from the list. This can't be undone.` Database afterwards: all four visits dated 1–4 Aug carry `doctor_id 80e3e043` and `doctor_name "Dr Somchai"`; "Somchai" is gone from `vet_doctors`
  - **Rename** "Dr. Ploy" → "Dr Ploy": the field shows "Saving changes the doctor on 1 recorded visit to "Dr Ploy", past visits included." before saving, and asks with the count. Database afterwards: the 5 Aug visit reads `"Dr Ploy"` under the same `doctor_id ebca76de`
  - **Mark as left** on "หมอพลอย": it moves under "No longer at the clinic (1)" with a Left badge; Back at the clinic is offered
  - **Merge a left doctor**: "หมอพลอย" → "Dr Ploy"; Dr Ploy then shows 2 visits
  - **Add** "  Dr   Roster   New " → stored as "Dr Roster New" (spaces collapsed), 0 visits; **Delete** it → confirm "Remove "Dr Roster New" from the list?", row gone. Delete is disabled with a reason on every doctor who has visits
  - **Booking** two residents (B1, Butter) at the test clinic with Doctor "Dr Booked New": one RPC call; both visits came back with `doctor_id 4daa64ee`, and "Dr Booked New" was added to the list
- [x] Empty state renders sensibly (no rows yet): every real clinic but Mae Wang shows "None yet" in the Doctors column; the hub's Doctors section and the roster table each have their own empty text (read from the source and the dictionaries — no dev clinic with visits was opened empty in the browser)
- [x] Invalid input is rejected with a readable message, not a crash: renaming "หมอพลอย" to "dr ploy", and "Dr Anan" to "DR  SOMCHAI", both refused with `"… is already on this vet's list. If it is the same person, use Merge… instead of renaming."`, the row staying in edit mode. The second run was after the actions were changed to return errors rather than throw them. Cancel clears the message. Empty names are refused by `required` and by the action
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a doctor with 0 visits (merge hint and confirm say "has no visits"; Delete enabled); a merge target that has left (offered as "Name (left)"); singular wording for 1 visit in rename and merge (fixed during testing — see Defects); the look-alike matcher run on "Dr Somchai", "Somchai", "Dr. Somchai", "น.สพ. สมชาย", "สมชาย", "หมอสมชาย", "สพ.ญ.พลอย", "Dr Ploy", "Ploy", a bare "Dr", "Doctor Who" and "Dr Somchai K." — it groups the three Latin Somchais, the three Thai ones, and Dr Ploy / Ploy, and nothing else

The suggestions: with the test clinic chosen on Book vet visit, the Doctor datalist offered `["Dr Anan", "Dr Ploy", "Dr Somchai"]` — "หมอพลอย", marked as left, was not offered, and neither was the merged-away "Somchai".

### Role access matrix

One live dev account per role, requested directly with a session minted by `auth.admin.generateLink` + `verifyOtp` (no passwords), output as printed. `REDIRECT->/no-access` is the redirect `requireRole` streams into the response; `ROSTER-CONTENT` / `MANAGE-LINK` are text searches of the returned HTML:

```
vet        /management/vets/<vet>/doctors     200 200 h1=- REDIRECT->/no-access
vet        /vets/<vet>                        200 200 h1=- REDIRECT->/no-access
vet        /management/vets                   200 200 h1=- REDIRECT->/no-access
management /management/vets/<vet>/doctors     200 roster page h1=Doctors at [roster] Test Clinic ROSTER-CONTENT CLINIC-NAME
management /vets/<vet>                        200 hub with manage link h1=[roster] Test Clinic MANAGE-LINK CLINIC-NAME
management /management/vets                   200 has Doctors h1=Vets CLINIC-NAME
staff      /management/vets/<vet>/doctors     200 200 h1=- REDIRECT->/no-access
staff      /vets/<vet>                        200 has Doctors h1=[roster] Test Clinic CLINIC-NAME
staff      /management/vets                   200 200 h1=- REDIRECT->/no-access
signed out /management/vets/<vet>/doctors     307 -> /login?next=%2Fmanagement%2Fvets%2F7617527f-f89d-426c-857b-7dab87b32bea%2Fdoctors 
signed out /vets/<vet>                        307 -> /login?next=%2Fvets%2F7617527f-f89d-426c-857b-7dab87b32bea 
signed out /management/vets                   307 -> /login?next=%2Fmanagement%2Fvets
```

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | roster page, hub, Vets table | full | as expected — every operation in §4 was driven as admin |
| management | roster page, hub with Manage the doctor list, Vets table with Doctors | full | as expected (output above) |
| staff | hub, read-only list | roster page and Vets table refused; no manage link on the hub | as expected (output above) |
| vet | nothing here | all three refused (`/vets` is `isShelterRole`) | as expected (output above) |
| volunteer | hub, read-only list | roster page refused | not driven: dev has no live volunteer account. Same `requireManagementUser` / `canManage` path as staff, and RLS gives volunteers select on `vet_doctors` |
| signed out | nothing | sent to sign in | as expected (output above) |

- [ ] Every role above tested — n/a: volunteer not driven, as dev has no live volunteer account; its refusal is the same `canManage` check that refused staff above
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): staff and vet requesting `/management/vets/<id>/doctors` get the no-access redirect and none of the page's content. The four actions each start with `assertManagementRole()`, the same check every Management action uses; they were not called directly as staff

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the page is reached from Management → Vets and from the hub, both checked
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: new topic "A clinic's doctors" under Management; the booking topic now says suggestions come from the clinic's list and a new name is added; the Vets topic mentions the hub's doctor list. Typecheck and build accept the file; loaded at `/manual#vet-doctors` as admin: the topic, its path, the Admin / Management chips, six steps and the warning callout render
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: that page is for public website text; these are app strings, added to both `en.ts` and `th.ts` (typechecked against the `Dictionary` type), and the roster page was loaded in Thai
- [x] Mobile viewport (375px) — no overflow, controls reachable: at 375 px the hub scrolls no wider than the screen (scrollWidth 375) with the Doctors section wrapping, and the roster page shows the "Best on a larger screen" notice first like every Management table (scrollWidth 375)
- [x] Browser console clean — no errors or React warnings: the only error logged was the 500 from the first rename-clash run, when the action still threw; after the change to returned errors the clash comes back as a normal response
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: `preview_logs` at error level shows only that same thrown clash

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): Management → Vets (table and its new column, existing clinics), `/vets/<id>` hub (stats, chart, residents and visits lists unchanged; visits show the corrected doctor names), Book vet visit (booking two residents with a doctor), Residents list (where a bulk booking lands)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page: the dictionaries are read by every page, and the Residents list and Management → Vets were loaded after the change, in English and (the roster page) in Thai
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (`Already up to date.`)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-28: why a Management page and not a hub section, stating reach before a rename or merge, look-alikes pointed out not merged, mark as left not delete, suggestions from the list, one-call booking, returned errors
- [x] `README.md` still accurate — `src/lib/vets/` entry now names `scope.ts` and `doctors.ts`
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line describing the doctor list, where to find it, rename / merge / mark as left, and the hub's list
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The trigger's case matching, merge and rename propagation, and the booking link were read back from the database; the matcher's groups are from running it. One claim is from the Next docs rather than measured: that a thrown server-action message can be replaced in a production build. It is stated as the guide's reason, and the returned-error path was driven

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the last-visit dates are stored instants shown by the existing `formatDate`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no threshold; the access check was run on both sides (management allowed, staff and vet refused)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates and role lines are as printed; the confirm texts are as captured from the page
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: release manager — no migration here, but this code reads `0102` (#176): confirm `0102` is applied to production before this deploys, or the roster page, the hub and booking all fail
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR; `0102`'s plan is #176's

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — `npx wrangler rollback --env production` restores the old pages and the two-write booking in seconds. It does not undo renames or merges made on the page meanwhile: those are data corrections to `vet_doctors` and to visits' `doctor_name`, and stay corrected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Rename and merge texts read "all 1 visit" / "The 1 visit" | fixed — singular wording in both |
| 2 | low | Cancel after a refused rename left the red error under the row | fixed — Cancel clears the message |
| 3 | low | Thai titles with dots ("น.สพ.", "สพ.ญ.") were not recognised by the look-alike matcher | fixed — dots between Thai letters are dropped first; rerun groups the Thai spellings |
| 4 | medium | The roster actions threw their errors, which a production build may replace with a generic message, losing the rename clash's pointer to Merge | fixed — the four row actions return `{ error }`; retested |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With a real clinic's names (Novel, ~20 doctors, once visits carry them): the look-alike hints are useful rather than noisy, and merging reads clearly to someone who hasn't seen the page before | Management → Vets → Novel's Doctors |
| 2 | The Thai wording on the roster page, the hub's Doctors section and the confirm dialogs reads naturally | Roster page and hub, in ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the look-alike hints on a real clinic's names, and the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over when a release is cut

Result: pass

Release manager acknowledgement: pending
