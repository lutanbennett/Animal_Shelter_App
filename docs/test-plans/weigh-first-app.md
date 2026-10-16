# Test plan: weigh-first-app

Evidence: gates `typecheck=0 lint=0 test=0 build=0` (pasted in §2). Two harnesses, because
the rule lives in two places: `scripts/check-weigh-first.mjs` — 63 assertions in one rolled-back
transaction on dev, each login's own JWT — and 17 node tests (`weigh-first.test.mjs`,
`residents.test.mjs`) run under the local zone and again under `TZ=UTC`. Driven in the browser at
375 px on dev as the **Head of Medical** (a disposable account made for this run) and as **Admin**,
in English and Thai. Scope note: `groupByPlace()` is shared, so the new "Away from the shelter"
group also appears on `/photos/add` and `/medical/photos`; both were loaded and checked.

## Header

| | |
|---|---|
| Feature | weigh-first-app |
| Backlog item | `docs/backlog.md` → Record Weight: put the residents who saw a vet yesterday or today, and have no weight since, at the top; then everyone by enclosure |
| Branch / worktree | `claude/weigh-first-app-3636d4` @ `C:\Development\Animal_Shelter_App\.claude\worktrees\weigh-first-app-3636d4` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | pending |
| Tested by / date | Claude, 2026-10-16 |
| Carries a migration? | no — the schema half shipped as `0207` on 2026-10-15 |
| Tested at SHA | b0f935b3 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Record Weight opens on the residents a vet saw yesterday or today with no weight since, then everyone by enclosure with the off-site animals in one group at the end
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/medical/weight/page.tsx`, new `src/app/medical/weight/WeighFirstList.tsx`, new `src/lib/medical/weigh-first.ts`, `src/lib/medical/residents.ts` (shared: `groupByPlace`), `src/app/medical/ResidentPicker.tsx` (shared), both dictionaries, `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`, new `scripts/check-weigh-first.mjs`, two new test files. **No `supabase/migrations/`, no `worker/`**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — see the matrix in §4. The list is returned only to logins holding `medical.weight` at edit: head_of_medical, admin, management
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the weight form, the keypad and the save action are untouched; no migration is carried; the NFC name-card item (`docs/backlog.md`) is a separate open item and is not addressed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merge `b0f935b3`, no conflicts; brought in `0208`, `0209` and two decision files from other streams)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 8s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 72s
=== gates: test — npm test
=== gates: test exited 0 after 3s
=== gates: build — npm run build
=== gates: build exited 0 after 36s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature. This is the app half of a feature
whose schema half already merged, so this PR carries no migration file at all — `git diff --stat
origin/main...HEAD` lists no `supabase/migrations/` path.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; the schema half is `0207`, already merged and applied
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR, so there is nothing to apply
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR, so there is nothing to dry-run
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0207` was applied to dev with its own schema PR, and this branch read `weigh_first_visits()` on dev successfully, which is the evidence it is live there
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration file in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: as a migration gate there is nothing to re-read, and the equivalent was done anyway: the page was driven against real dev rows, and `check-weigh-first.mjs` asserts against inserted-and-rolled-back rows in the real schema
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: as a migration gate, since no file is applied here; the harness that gate asks for was written anyway and run: `scripts/check-weigh-first.mjs` is exactly that harness against `weigh_first_visits()`. It asserts the window at its four defining instants, that cancelled and archived visits are excluded, that only three columns come back, that the function answers only logins holding `medical.weight` at edit, and that the Head of Medical still cannot read `clinic_visits`. 63 assertions, 0 failures
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR; nothing to reverse in the database
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR. `0207` has its own apply plan in `docs/test-plans/calendar-and-weigh-schema.md`; note under §8 that `0207` must be live in production before this code is deployed

## 4. Functional checks

- [x] Happy path works end to end — as the Head of Medical at 375 px, three seeded visits appeared under "Weigh these first" in the right order (yesterday 09:30, today 01:00, today 11:15), each with photo, name, R-code, place and "Novel, yesterday 09:30" / "Novel, today 01:00"
- [x] Data persists — reload the page and the change is still there — saved 12.4 kg for Nu-Daeng; the saved line showed, the row left the list, and it was still gone after a fresh navigation to `/medical/weight`
- [x] Create / edit / delete all exercised (whichever the feature has) — the feature is a read; the write it reacts to is saving a weight, done three times, each one removing its resident from the list. There is nothing on this surface to edit or delete
- [x] Empty state renders sensibly (no rows yet) — after the third weight the section showed one line, "Nobody is waiting. Everyone the vet saw yesterday or today has been weighed.", not an empty box. Separately, with a search running that matches nobody in the list, the section renders **nothing** rather than that line, which would be false
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR adds no input. The only field on the page is the weight keypad, which is unchanged; the search box takes any text and simply matches nothing
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — dates are the real boundary here and are covered at both layers (§2 harnesses): window opens/closes to the second, 01:00 Bangkok, cancelled, archived, two days ago, tomorrow. Missing optional field: a visit with no clinic on record still renders a row (`visitNoClinic`), asserted in `weigh-first.test.mjs`. Long text: the longest dev resident name ("ZZ Width f3b491a1 Hospital Patient", with an enclosure name to match) wrapped without overflow at 375 px

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/medical/weight` | sees the list, and may read `clinic_visits` anyway | pass — same three rows as the Head of Medical, browser at 375 px; `clinic_visits` readable (harness) |
| management | `/medical/weight` | sees the list; may read `clinic_visits` anyway | pass — `weigh_first_visits()` returns its rows and `clinic_visits` is readable (harness, 2 probes × all cases). Not driven in the browser; the page is the same code path Admin exercised |
| head_of_medical | `/medical/weight` | sees the list; must NOT reach the visit or the resident's record | pass — browser at 375 px, English and Thai. Every link in the section is `/medical/weight?resident=…` (read from the DOM). `/residents/<id>` redirects to the public card `/r/<id>`; `/residents/<id>/clinic-visits` → `/no-access`; `clinic_visits` unreadable (harness) |
| staff | — | retired by `0173`, cannot be made | n/a — no such role exists to test |
| doctor | `/medical/weight` | gets nothing from the function | pass — harness: 0 rows for every case |
| volunteer | `/medical/weight` | gets nothing from the function | pass — harness: 0 rows for every case |
| signed out | `/medical/weight` | bounced to the login page | pass — the page calls `requirePermission("medical.weight")` before any read, and the signed-out tab was sent to `/login` |

- [x] Every role above tested — at the data layer for all of them (harness covers head_of_medical, admin, management, volunteer, doctor and a login with no role at all); in the browser for Admin and the Head of Medical
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — URLs hit directly, not judged by hidden nav: `/residents/<id>/clinic-visits` returned `/no-access` and `/residents/<id>` returned the public card. The function itself refuses in SQL via `has_permission('medical.weight','edit')`, which is why a volunteer and a doctor get zero rows rather than a hidden button

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: `NavLinks.tsx` is not touched. The page is reached from the Record Weight home tile, which already existed and is unchanged
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new topic "Record Weight on a phone" (id `record-weight`), saying who is at the top and why, with its acceptance-matrix entry added as `acceptance-matrix.mjs --check` requires (`ok — 81 manual topics`)
- [x] Translatable strings go through the translation path, checked at `/management/translations` — every new string is a dictionary key in both `en.ts` and `th.ts` (`weighFirst.*`, `picker.offSite`, `weight.everyone`); nothing is hard-coded in the components. The page was read end to end in Thai: "ชั่งตัวเหล่านี้ก่อน", the intro, "ไม่มีตัวที่ต้องชั่ง …", "ทั้งหมดตามคอก", "อยู่ภายนอกศูนย์", and a row reading "Novel, เมื่อวาน 14:45". `/management/translations` holds free text written by staff, which this PR adds none of
- [x] Mobile viewport (375px) — no overflow, controls reachable — the whole pass was run at 375×812. Rows are full-width with an 80 px photo; the longest dev name wraps; no horizontal scroll
- [x] Browser console clean — no errors or React warnings — no app errors on `/medical/weight`. Two unrelated entries, both checked: a `getComputedStyle` TypeError from the preview pane's own injected script (`<anonymous>:1`), and 404s on two Drive photo ids, which **reproduce identically on `main`** (`curl :3000` vs `:3007` — see Defects)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — all requests on `/medical/weight` returned 200 except the two pre-existing Drive photo 404s above

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/medical/weight` resident form (saved three readings), `/medical/photos` (the other `ResidentPicker` page), `/photos/add`, `/home`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `groupByPlace()` and `ResidentPicker` are shared, so `/medical/photos` was **loaded** and its headings read from the live DOM: the zones in order, then "Not in an enclosure", then "Away from the shelter" last, and no "Weigh these first" section (which belongs only to the weight page). `/photos/add` was loaded and rendered its own empty state
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought `0208`, `0209`, `check-cards-schema.mjs` and `check-permission-parity.mjs` changes; gates ran green on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked with a note saying what was built and that part (2) was already in place
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-16-weigh-these-first.md`: why the comparison stays in TypeScript, why the latest visit is the one tested, the `formatDateTime` zone trap, the `before`-slot layout, and that `/photos/add` changes too
- [x] `README.md` still accurate — read; it describes the app and its workflow at a level this change does not alter, and names no page layout
- [x] **Release notes.** Would a shelter user notice this change? — ticked, and `unreleased` in `src/lib/releases.ts` gained a line in this PR written for a shelter user. The Head of Medical notices it the moment she opens the tile. Nothing is outstanding before a user sees it: no deploy step, no hand edit, no setting — `0207` is already on `main` and applied to dev
- [x] Commit messages say why, not just what — three commits: the feature (why the access had to stay narrow), the harnesses (why the window is asserted at instants rather than at the run's hour), the grouping tests (why Unassigned must not land in the off-site group)
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the timezone claims are the ones that needed this. "01:00 Bangkok counts as today" is asserted in SQL and in node, not argued; the test states its own premise (`new Date(visitAt).toISOString()` is the 15th) so the case cannot silently stop discriminating. The claim that `formatDateTime` would print the wrong time was checked against `dateParts()` in `src/lib/format.ts`, which reads `d.getHours()` in the runtime's zone — that is why `shelterTime()` is used instead. The harness prints the Bangkok and UTC dates at run time so a reader can see that today's run (both 2026-10-16) could not have told a UTC window from a Bangkok one by the clock alone, and that the boundary instants are what carry it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — partly done here, partly deferred. *Does the logic handle the boundary?* Yes, and by assertion: `loadWeighFirst` takes an injectable `now`, and `weigh-first.test.mjs` runs the real exported function at 06:00 and 17:00 Thai against a visit at 01:00 Bangkok, then the whole suite again under `TZ=UTC` (10 pass, 10 pass). `check-weigh-first.mjs` asserts the SQL window at its four defining instants. Nothing is re-typed into either test. *Does the deployed build behave as the source does?* Only `test.lannacare.org` during 00:00–07:00 Thai answers that — deferred: release manager
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: as a deploy gate, and the substance is satisfied above: the item named the 01:00 case, and the harness additionally asserts both edges of the window to the second (opens, opens minus 1s, closes, closes plus 1s) plus two days ago and tomorrow
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates block in §2 is the script's own closing line as printed; the harness counts quoted here are its own output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR. **But the ordering still matters and the release manager must know it:** this code calls `weigh_first_visits()`, shipped by `0207`. `0207` must be applied to production **before** this build is deployed there, or the page's top section will error for everyone. `apply-migrations.mjs --status --env production` is the check
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR, and `0207` is additive
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager

### Rollback

- [x] Rollback position stated, **including what it does not cover** — this PR is app code only, so the rollback is the ordinary one: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, with `npx wrangler rollback --env production` reverting only the Worker fallback. **What it does not cover:** nothing in the database, because this PR changes nothing there. `0207` stays whether this is rolled back or not, which is harmless — it is additive and, with this code gone, simply unread. The three weight readings saved during this run are on **dev**, not production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | cosmetic, not caused here | Two residents' profile photos 404 from `/api/photos/<driveId>` on dev — the Drive files are gone. Reproduced identically on `main` (`curl localhost:3000` and `:3007` both 404 for the same two ids, 200 for a third), so it is dev data rot, not this change | accepted — pre-existing, outside this PR's scope; the tile falls back to the paw-print placeholder, which is the designed behaviour for a resident with no photo |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the wording reads right to the Head of Medical herself — "Weigh these first", "Seen by a vet yesterday or today, with no weight recorded since", "Away from the shelter", and the Thai of each. A phrase that is clear to a developer and odd to her is exactly what no automated check can catch | `/medical/weight` on her own phone, in Thai |
| 2 | The list on a real phone in the kennels rather than an emulated 375 px viewport — thumb reach to the rows and whether the photo size is right with the scales in your hands | `/medical/weight` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: the two rows above — the wording read by the Head of Medical, and the list on a real phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: read when the release is cut
