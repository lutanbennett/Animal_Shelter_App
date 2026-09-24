# Feature test plan

## Header

| | |
|---|---|
| Feature | Frequency options move from Management → Medications to their own page, Settings → Frequencies (`/admin/frequencies`) |
| Backlog item | `docs/backlog.md` → Management → **Move frequency options to Admin, apart from medication management.** |
| Branch / worktree | `claude/frequency-options-to-admin` @ `C:\Development\Animal_Shelter_frequency-options-to-admin` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | #108 |
| Tested by / date | Claude, 2026-09-24 (browser pane signed in by Lutan as admin) |
| Carries a migration? | no |
| Tested at SHA | `4129248` (code, browser-checked); gates run at `a687e0c` after merging `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the frequency create form, table and actions move to `/admin/frequencies` (shaped like `/admin/procedure-types`), and `/management/medications` becomes medications only. The item's RLS question was settled by Lutan as "leave it alone", so there is no migration
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — new `src/app/admin/frequencies/{page,actions}.ts(x)`; `CreateFrequencyForm.tsx` / `FrequenciesTable.tsx` moved there from `src/app/management/medications/`; frequency code removed from that folder's `page.tsx` and `actions.ts`; a tile in `src/app/admin/page.tsx`; `admin.frequencies` + `nav.frequencies` + a landing tile string added to both dictionaries, and the frequency keys removed from `management.medications`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `README.md`; `docs/`. `NavLinks.tsx` not touched (Settings pages are reached by its landing tiles). `FrequencyScheduleFields` / `parseSchedule` not touched. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin gains the page; management loses the frequency section of its Medications page. Staff and vet are affected only if the prescription form's frequency picker broke (checked, it did not). Volunteer and signed-out reach none of it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **the RLS half of the backlog item.** `management_rw_frequency` (0043) is unchanged, so management can still update, delete and merge frequencies directly against the database, though no page offers it any more. Lutan decided to leave it alone (in this session, 2026-09-24). The revoke SQL, if it is ever wanted, is in `docs/decisions.md` (2026-09-24). Also out: the manual screenshots (deferred for one full rerun), and moving any other page between Management and Settings (a separate backlog item)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: at `395c857`, bringing in #105 (0080 social URLs) and the enclosure public view. One conflict in `src/lib/releases.ts`, where both branches appended an `unreleased` line. Resolved by keeping both, main's first. Gates run after the merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [x] CI green on the PR (runs the same three) — `check` (1m50s) and `test-plan` both green on #108 at `c0f6d81`

```
=== gates: build exited 0 after 176s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

All driven in the in-app browser against `next dev` on :3008 (dev database), signed in as admin, mostly at the pane's own 590px width with **Show anyway** opened. A 1280px emulated viewport was tried first, but clicks did not register under it, so every write below was driven at 590px.

- [x] Happy path works end to end — created "ZZ test frequency" (4 × a day): the form shows `Created frequency "ZZ test frequency".`, the schedule fields reset, and the row appears at the top of the table (sorted by schedule). The server log shows `createFrequency` in `src/app/admin/frequencies/actions.ts`
- [x] Data persists — reload the page and the change is still there — after editing, a fresh navigation showed `ZZ renamed frequency · 6 × a day · 0 prescriptions`
- [x] Create / edit / delete all exercised (whichever the feature has) — create (above). Edit: renamed it and changed 4 → 6 a day, then Save. Merge: created "ZZ merge source" (5 × a day) and merged it into "ZZ renamed frequency". The confirm read `Merge "ZZ merge source" into "ZZ renamed frequency" (6 × a day)? 0 prescriptions will move…`, and after a reload the source row was gone. Delete: deleted "ZZ renamed frequency" (confirm `Delete frequency "ZZ renamed frequency"? This can't be undone.`), and the row left the table without a reload. `window.confirm` was stubbed to accept and record its text. Delete stays disabled on the six rows in use, with the tooltip `This frequency is on 31 prescriptions and can't be deleted…`
- [ ] Empty state renders sensibly (no rows yet) — n/a: dev has ten frequencies and emptying the table means deleting ones on prescriptions (blocked by design). The string (`No frequencies yet.`) and the markup that renders it came across unchanged from the medications page
- [x] Invalid input is rejected with a readable message, not a crash — 0 times a day is stopped by the browser, `Value must be greater than or equal to 1.`, and nothing is sent. An empty label is stopped by `required`, `Please fill in this field.`
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: zero is covered above, and the schedule validation (`parseSchedule`) and inputs are the shared, unchanged ones; this PR moves the page, not the rules

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/frequencies`, the Settings tile, `/management/medications` | page with create/edit/merge/delete; Medications without frequencies | **pass** — as in §4 above |
| management | `/management/medications`; **not** `/admin/frequencies` | Medications without the frequency section; `/admin/frequencies` refused by `requireAdminUser` | **pass** — checked by Lutan, signed in as management (manual item 1, reported in chat 2026-09-24) |
| staff | prescription form | frequency picker and "+ Add new frequency…" unchanged | not signed in as; the form, its page and `src/app/prescriptions/actions.ts` are untouched by this diff, and the picker was checked as admin |
| vet | prescription form | same as staff | not signed in as; same reason as staff |
| volunteer | none | nothing changes | not signed in as; no guard or nav entry changed for volunteers |
| signed out | none | `/admin/frequencies` → sign-in | **pass** — before signing in, `/admin/frequencies` redirected to `/login?next=%2Fadmin%2Ffrequencies` (server log) |

- [ ] Every role above tested — n/a: management, staff, vet and volunteer were not signed in as, because each needs its own password, which this session does not handle. Management's check is item 1 of Left for manual verification; the others have no changed surface (reasons in the table)
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: only signed-out was driven, and it is refused. A non-admin signed in has not been tried. The page uses the same `requireAdminUser()` as `/admin/procedure-types`, and the actions `assertAdminRole()`, but that is a read, not a run, so it is item 1 below

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: Settings pages have no entry of their own in `NavLinks.tsx`; they are reached through the Settings landing tiles. The new tile was checked on `/admin`: `/admin/frequencies | Frequencies · LARGER SCREEN · The "how often" choices…`. The Management tile for Medications is unchanged
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — a new **Frequencies** topic under Settings (`Settings → Frequencies`, Who: Admin) was read on `/manual`. "Managing medications and frequencies" became "Managing medications", with a pointer to the new page, and the admin role summary and the phone-notice list in Getting started now name frequencies
- [x] Translatable strings go through the translation path, checked at `/management/translations` — every new string is in `en.ts` and `th.ts` (the `Dictionary` type forces the same keys). Switching to ไทย showed the page fully in Thai (title ความถี่การให้ยา, the form, table headings, buttons, the larger-screen notice). Switched back to EN afterwards. `/management/translations` is for public free text and does not list UI strings, so there was nothing to see there
- [x] Mobile viewport (375px) — no overflow, controls reachable — at the pane's 590px width (below `md`, which is the breakpoint that matters here) the page shows the "Best on a larger screen" notice like Zones, Enclosures and Immunization Types, and the tile carries the Larger screen pill. Show anyway reveals the form and table. All the §4 writes were driven there
- [x] Browser console clean — no errors or React warnings — `read_console_messages` with errors only: none
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — server log: every GET/POST on `/admin/frequencies`, `/management/medications`, `/prescriptions/new`, `/admin` and `/manual` returned 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/management/medications`: 24 medication rows, with `Next 7 days` / `Next 30 days` forecast columns and no load errors; "frequency" appears nowhere on the page. `/prescriptions/new?residentId=…`: the picker lists all ten frequencies plus "+ Add new frequency…". A prescription (Synbiotic, 1 tablet, Weekly, from 2026-09-24, note "ZZ test prescription…") was saved on dev resident Angsumalin and shows under Current as `1 tablet(s) · Weekly`. Left in place: dev test data is disposable
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `/admin` loaded all eight tiles with their text from the edited dictionary. `/manual` loaded in full, with the other Settings topics (Procedure types, Blood test types) still present. `/residents/<id>/prescriptions` loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought 0080 and the enclosure public view. Only `releases.ts` overlapped (both lines kept), and the build after the merge passed

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked, saying the RLS half was not done
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-24: why the policy stayed, the exact revoke if it is wanted, why revoking management alone would not make the list admin-only, and why no `refresh()` was added
- [x] `README.md` still accurate — the admin role row now lists frequencies among the Settings pages
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — a manager who used to find frequencies on the Medications page won't any more, and the line says where they went
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the six frequency policies were read from the migrations (0001, 0027, 0043) and the inline add from `PrescriptionForm.tsx`. The `refresh()` note says that the merge observation was inconclusive rather than claiming a pass

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the forecast code is untouched
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates output, copied as printed; the rest is prose describing what was driven
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` restores the frequency section on Medications and removes the Settings page. No schema changed, so nothing is left behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `mergeFrequency` said "Choose a different **medication** to merge into." on a self-merge, because it borrowed the medications error | fixed: `admin.frequencies.errors.mergeSelf` names a frequency |
| 2 | low | `management_rw_frequency` still lets management write `frequency` directly although no page offers it | accepted: Lutan, in chat 2026-09-24 ("leave the RLS alone"), recorded in `docs/decisions.md` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as **management**: `/management/medications` shows medications with no frequency section, and opening `/admin/frequencies` directly by URL is refused (redirected), not merely missing from the tiles | `http://localhost:3008` or `test.lannacare.org` after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5), in the in-app browser signed in by Lutan  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — item 1 checked by Lutan as management, 2026-09-24

Manual verification by: Lutan Bennett — confirmed in chat; line written by Claude at their request  Date: 2026-09-24

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
