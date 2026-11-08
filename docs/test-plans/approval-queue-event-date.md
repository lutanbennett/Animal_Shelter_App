# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Approval queue shows an event's date; event title seen on screen; two photo-path strings corrected |
| Backlog item | `docs/backlog.md` → `#n5j3w`, `#v2p7k`, `#p4w9z` |
| Branch / worktree | `claude/approval-queue-event-date` @ `C:\Development\Animal_Shelter_approval-queue-event-date` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | f268b059 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the Event photos tab of Photos to approve shows the event's date under its title (read from the `waiting_event_titles()` row already fetched), the title is seen on screen by an `approve_photos`-only login, and two strings stop naming a role / describing the pre-`#40oz4` save
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/photos/approval.ts`, `src/app/photos/approve/EventPhotoQueue.tsx`, `src/lib/i18n/dictionaries/en.ts` + `th.ts`, `src/lib/releases.ts`, `docs/`; no route, worker or migration
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — no card's access changes; the date is drawn for any login the page already admits (`photos.approve`, carried by `approve_photos` and `approve_website`); Admin sees it through the bypass; signed-out public unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `0334` untouched; the sign-in refusal "Ask an administrator to assign you a role" (`en.ts`, `noRolePassword`) is outside the photo path and left for the planner (PR body)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 216s
=== gates: lint exited 0 after 522s
=== gates: test exited 0 after 96s
=== gates: build exited 0 after 566s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

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

- [x] Happy path works end to end — event created and photo uploaded by a `run_fundraising_events`-only login; queue opened by click-through with an `approve_photos`-only login; seen on screen: "Approval-queue date check (dev)", "Event date: 14 Dec 2026", the photo, Approve / Private only / Remove. Screenshotted. Thai: "วันที่จัดงาน: 14 ธ.ค. 2569"
- [x] Data persists — reload the page and the change is still there — the queue is read fresh on every load; the waiting photo was still listed after the language switch's refresh
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the change is a read-only label; the card's Approve/Remove actions are unchanged and were not pressed (the photo is left waiting on dev)
- [x] Empty state renders sensibly (no rows yet) — unchanged: `EventPhotoQueue` returns null with no photos, and the date line is drawn only when `eventDate` is set, so a deleted event (null title and date) shows "A fundraising event" with no empty date line (read in the code)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input on this surface
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `formatDate` handles a yyyy-mm-dd date in both locales (Buddhist-era year in Thai, seen); a missing event yields null and no line

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Photos to approve | sees everything (bypass) | n/a: not driven; the page and component are unchanged in what they gate, and admin passes `photos.approve` in `can.ts` |
| exactly `approve_photos` | Photos to approve → Event photos | title and date of the waiting event photo | seen on screen, screenshotted |
| exactly `run_fundraising_events` | Management → Fundraising events; adds a photo | cannot open Photos to approve | no sidebar entry; page asks `requirePermission("photos.approve")`, which this card does not carry |
| signed out | nothing | refused | n/a: page unchanged; it redirects at `requirePermission` as before |

- [x] Every login above tested — the two card logins driven; admin and signed-out reasoned from unchanged gates and said so in their rows
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — the page's server gate is `requirePermission("photos.approve")` (read); the `run_fundraising_events` login's sidebar offered no entry

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: nav not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a date label beside a title needs no instruction; the manual does not quote either corrected string
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: dictionary strings, not translatable content; Thai written by Claude and unreviewed, as across the app
- [ ] Mobile viewport (375px) — n/a: one short text line added inside an existing card that already wraps; not resized
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — upload POST 200, image GETs 200; the aborted `_rsc` requests are the language switch's refreshes cancelling each other

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/photos/approve` (all four photo tabs listed with counts), `/management/events`, `/management/events/new`, the event's own page with its photo panel
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: the shared files touched are the two dictionaries, and only three keys changed; the event pages above load from the same dictionaries and rendered correctly in both languages
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync reported already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: README does not describe the approval queue's labels
- [x] **Release notes.** Would a shelter user notice this change? Yes: an untagged line in `unreleased` covers the date and both strings (untagged because the three changes reach three different audiences, and an untagged note widens rather than narrows)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — what was seen is what the decision file says; the photo not drawing in the first screenshot was measured (rAF never fired, lazy image loaded 200 once eager) before being called a pane fault

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the event date is a date-only string formatted by `formatDate`, which reads it as a local date; no "today" is derived
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: only the gates block is pasted, and it is the run's own output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; `0334` is already on production (0.43.6)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: code-only label and copy change; the ordinary Pi `--ref` rebuild reverts it fully, with no schema to leave behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none: the date and both languages were seen on screen; the Thai wording is unreviewed like the rest of the app, which is not a check this PR owes | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

### Manual verification

A person signs the line below; the one that is filled says there was nothing to look at.

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: nothing left for a person to look at; the change was driven and seen on screen in the browser pane

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the next release cut

Result: pass

Release manager acknowledgement: pending: the next release cut
