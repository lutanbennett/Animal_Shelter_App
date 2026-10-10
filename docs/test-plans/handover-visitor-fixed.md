# Feature test plan — handover-visitor-fixed

## Header

| | |
|---|---|
| Feature | Update `docs/release-handover.md` again: the Website visitors tile is **fixed**, so the next release manager must not write a correcting release note. Records what remains open |
| Backlog item | `docs/backlog.md` → **Next up**, the visitor-count BUG item, ticked on the `backlog` branch 2026-10-10 |
| Branch / worktree | `claude/handover-visitor-fixed` @ `C:\Development\Animal_Shelter_handover-visitor-fixed` |
| Dev server | not started — documentation only |
| PR | opened from this branch |
| Tested by / date | Claude (production release manager session) / 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `origin/main` at the time this branch was cut, read from the remote after a fetch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — Lutan asked for the fix to be pushed to production; it was, and this corrects the handover, which until now told the next release manager the tile was broken and that `0.26.0` had to choose between fixing it and publishing a correcting note. Both are now wrong
- [x] Files/areas touched listed — `docs/release-handover.md` only (three passages), plus this plan. No code, no migration, no release data
- [x] Roles affected identified — none. Nothing here is served to anyone; `docs/` is not bundled
- [x] Anything explicitly **out of scope** written down — (a) **the fix itself**, which was a configuration change on the production Pi and carries no code, so it is not in any diff; (b) **test**, which still shows *Not set up* and is left on the backlog; (c) the grey-state ambiguity on the System status screen, also on the backlog; (d) the `0.25.0` record, which is a record of what was true at the time and is deliberately not rewritten

**The risk this removes is a real one and is the second time today:** a handover
that is wrong sends the next release manager to do work that is already done, or
worse, to publish a correcting release note for a note that is now true.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — nothing to merge; `git merge-base HEAD origin/main` equals `origin/main`, read from the remote after a fetch
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — pasted in the commit message
- [ ] CI green on the PR (runs the same three) — **deliberately unticked on the commit that opens the PR**, because CI has not run and this line cannot honestly be ticked in advance. Completed in a follow-up commit once the run is read, as on all three of this release's earlier PRs
- [ ] `node scripts/check-release-guards.mjs` — n/a: this PR touches no release data. `unreleased` is empty and `package.json` is `0.25.0`, both untouched

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. Next free number remains `0178`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply. Both databases read `177 applied, 0 pending, No drift` at the `0.25.0` verification and nothing has been applied since
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change — n/a as a database question, but the factual claims in the new text were **measured, not reasoned**. The token was verified against Cloudflare (`user/tokens/verify` → `status=active`) *before* anything was changed, and the app's own GraphQL query returned `5364` page views and `663` uniques over seven days, run **on the Pi itself against the Pi's own generated env**. No secret value was printed at any point; only key names and lengths
- [ ] Constraints and defaults exercised against real rows — n/a: no constraint, default or database object in this PR; it edits one markdown file
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. The revert for this PR is a git revert of one documentation file
- [x] Production apply plan stated for the release manager — n/a as a migration plan, but the **configuration** change this PR documents is recorded precisely so it can be undone: the two lines were appended to the production Pi's `.env.deploy.production`, which was backed up first as `.env.deploy.production.bak-20261010` with its `0600` mode unchanged, and the Pi was rebuilt with `scripts/pi/deploy-pi.sh --ref 590a9d35`

## 4. Functional checks

- [x] Happy path works end to end — **the fix was verified three independent ways**: the regenerated `.env.production.local` on the Pi carries both keys; the app's exact query run on the Pi returned real numbers; and **Lutan confirmed in chat that the tile is live**, which is the only check a script could not do
- [ ] Data persists — reload the page and the change is still there — n/a: this PR saves nothing. The configuration it documents does persist, because it is in `.env.deploy.production`, which `write-env.mjs` reads on every Pi deploy — which is precisely why the fix was made there rather than in the generated file
- [ ] Create / edit / delete all exercised — n/a: the handover has no screen and no create, edit or delete path; git is the only way it changes
- [x] Empty state renders sensibly (no rows yet) — the **In flight** section still correctly says nothing was left open by the release; this PR does not change that, because what remains is backlog items rather than in-flight branches
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input in this PR. The related weakness — that the System status screen cannot distinguish an unset key from a rejected one — is named on the backlog rather than fixed here
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the amendment note at the top grew from five lines to six, which overwrote the blank line before the next heading; caught and restored, and the heading structure re-read afterwards. Lesson 7 is confirmed still present and still correct, because **the lesson outlives the fix**

### Role access matrix

Not applicable: nothing in this PR is served to any role, and no route, gate or
permission is touched. The screen the fix affects, Settings → System status, is
Admin-only and unchanged by this diff.

- [x] Every role above tested — n/a, as above
- [ ] A role that should not have access is blocked server-side — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The handover is an internal document, not a manual topic
- [ ] Translatable strings go through the translation path — n/a: internal English-only documentation
- [ ] Mobile viewport (375px) — n/a: no UI in this PR
- [ ] Browser console clean — n/a: no UI in this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no request path changed by this PR. The one network call involved, to Cloudflare, returned HTTP 200 with no errors

## 6. Regression

- [x] The pages nearest the change still work — no page reads `docs/`. The build passing is the only coupling, and it passed. The **app** was rebuilt and restarted on the Pi as part of the fix, pinned to `590a9d35`, and `deploy-pi.sh` confirmed `lanna-care running` and the site served by the Pi
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is read by people. Checked that the three corrected passages agree with one another: the amendment note, the outstanding-verification row and point 9 now all say fixed, and none still asks for a correcting note
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in; one documentation file is touched and no other stream is editing it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — **ticked on the `backlog` branch**, with the measurement, the three-way verification, the pinned rebuild and the two things deliberately left open. It is on `backlog` rather than in this PR because the fix was configuration and had no PR of its own to carry the tick
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice was made. Copying a value the Worker already had onto the machine that serves the pages is the plain reading of `docs/decisions/2026-10-10-one-optional-secrets-list.md`, not a departure from it
- [x] `README.md` still accurate — unchanged, and it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no new note, and that is a deliberate decision Lutan made. The change is configuration only, with no code and no version bump, and `0.25.0`'s fifth note already describes the behaviour. The fix makes that note **true** rather than false, so a correcting line in `0.26.0` is now **not** wanted — which is exactly what this PR writes into the handover
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the token's validity, the returned counts and the key presence on the Pi were all read from live output; Lutan's confirmation is quoted as his, not inferred

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR ships nothing. The production Pi runs `590a9d35`, the `0.25.0` release commit, and the rebuild was **pinned** to it so the configuration fix could not carry unreviewed code
- [x] Deployed SHA matches the tested SHA — confirmed after the rebuild: the Pi's clone reports `590a9d35`, unchanged from before the fix, and `lannacare.org/api/version` still reports `0.25.0`

### On the deployed build

- [ ] Deployed to test — n/a: test was deliberately not changed, and this is named as a gap rather than done. The test Pi has neither value and there is no `.env.deploy.test` on the PC, so `test.lannacare.org` still shows *Not set up*. It is on the backlog. Lutan asked for production
- [x] Smoke-tested on `test.lannacare.org` — n/a as a smoke test of this change, since test is deliberately unchanged by it; test continues to serve `0.25.0` @ `590a9d35` exactly as it did after the release
- [x] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed. Settings → System status is Admin-only and behind sign-in, and is not edge-cached
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — **this one is real rather than `n/a`**: the query asks for a seven-day window built from `new Date()` on the server, so it is UTC-based while the shelter is UTC+7. That is pre-existing behaviour from #518 and is not changed here; it means the newest day is partial for part of every day, which is correct for a "last 7 days" figure and not a defect
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary, threshold or band in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**

### Deploy safety

- [x] `deploy: production → Supabase project` line read and the ref matches production — n/a as a Worker deploy, since none was run; the Pi's own equivalent was read instead: `write-env: .env.production.local → production (Supabase dbkodyyxxhtygxcxmfcu, site https://lannacare.org)`, which names the **production** project
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no Worker deploy. The Pi build's equivalent check was read instead: `actions-key (production): the build in .next carries that key`, fingerprint `cbd55beae8d8`, matching the release
- [x] Any new secret or env var exists in the production Cloudflare environment — **this is the change.** `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` now exist on the production Pi, copied from the PC's `.env.deploy.production` where they already were. Verified by name and by use; never printed

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR or in the fix it documents
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration. The **file** that was changed was backed up before the change, which is the equivalent care
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated in §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — for this PR, a git revert of one documentation file, affecting nothing that runs. **For the fix**: restore `.env.deploy.production.bak-20261010` on the Pi and re-run `deploy-pi.sh --ref 590a9d35`, which returns the tile to *Not set up*. It does **not** need a code rollback, because no code changed, and it does not touch the Worker, which already had both values

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **The Website visitors tile showed *Not set up* on production while `0.25.0` had mailed every admin that it works** — the two Cloudflare values existed on the PC but nowhere the Pi could read them | **fixed 2026-10-10, same day, configuration only.** Verified three ways including Lutan looking at the live tile. `0.25.0`'s note is now true, so no correcting note is wanted |
| 2 | low | **The handover was wrong for the second time in an hour** — it told the next release manager the tile was broken and that `0.26.0` had to choose between fixing it and publishing a correcting note | **fixed in this PR.** The underlying cause is that a handover written at release time cannot anticipate what the same day turns up; the amendment note at the top now says plainly that it has been amended twice |
| 3 | low | **`test.lannacare.org` still shows *Not set up*** — the test Pi has neither value and there is no `.env.deploy.test` on the PC | **deferred to the backlog**, named in the ticked item. Lutan asked for production. The token is zone-wide, so the same pair would serve test |
| 4 | low | **Settings → System status cannot distinguish "no key set" from "key set but the API refused"** — both render the same grey message | **deferred to the backlog**, named in the ticked item. This is the reason the failure survived a whole release looking finished, and it is what will hide the next one |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | ~~That the tile shows a number on production~~ — **done: Lutan confirmed in chat on 2026-10-10 that it is live.** Listed here only so the record shows which check closed it, and by whom | Settings → System status, production |
| 2 | That the twice-amended handover still reads correctly cold, and that lesson 7 is the lesson worth carrying now the bug behind it is fixed | `docs/release-handover.md` |
| 3 | Whether test should get the same pair, or stay showing *Not set up* until someone needs it | `test.lannacare.org`, Lutan's call |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, items 2 and 3 are outstanding, and only the person who looks may tick this line. **Item 1 was checked by Lutan**, which is recorded in the row itself rather than taken as a signature for the whole list

Manual verification by: pending: items 2 and 3 — the twice-amended handover read cold, and whether test should get the same pair. Item 1, the tile being live on production, was confirmed by Lutan in chat on 2026-10-10

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; defect 1 was reported by Lutan, fixed the same day, and confirmed by him

Result: pass with accepted defects

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-10
