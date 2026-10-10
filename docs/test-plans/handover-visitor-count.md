# Feature test plan — handover-visitor-count

## Header

| | |
|---|---|
| Feature | Correct `docs/release-handover.md` after `0.25.0`: the Cloudflare visitor-count item is a **known bug**, not an outstanding check; the husk it tells you to clear is already cleared; and the lesson the bug teaches is written up as lesson 7 |
| Backlog item | none directly — the bug itself is the first item under **Next up** on the `backlog` branch, logged 2026-10-10 |
| Branch / worktree | `claude/handover-visitor-count` @ `C:\Development\Animal_Shelter_handover-visitor-count` |
| Dev server | not started — documentation only |
| PR | opened from this branch |
| Tested by / date | Claude (production release manager session) / 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `origin/main` at the time this branch was cut, read from the remote after a fetch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — Lutan asked whether the handover was up to date; it was not, because it was merged before he found the visitor-count bug. One file, four passages
- [x] Files/areas touched listed — `docs/release-handover.md` only, plus this plan. No code, no migration, no release data
- [x] Roles affected identified — none. Nothing here is served to anyone; `docs/` is not bundled
- [x] Anything explicitly **out of scope** written down — (a) **fixing the bug**, which means adding a production secret and is a live-configuration change for Lutan to confirm first; (b) the backlog item, already filed on the `backlog` branch; (c) the `0.25.0` release record, which is a record of what happened at the time and is deliberately **not** rewritten — the correction belongs in the handover, which is the living document

**The risk here is a stale handover being trusted**, which is exactly what this
PR removes. A handover that lists a known bug as "a cheap check worth doing"
sends the next release manager to re-derive a diagnosis that already exists.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — nothing to merge; `git merge-base HEAD origin/main` equals `origin/main`, read from the remote after a fetch
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — pasted in §2 of the commit message
- [ ] CI green on the PR (runs the same three) — **deliberately unticked on the commit that opens the PR**: CI has not run and this line cannot honestly be ticked in advance. Completed in a follow-up commit, as on both of this release's earlier PRs
- [ ] `node scripts/check-release-guards.mjs` — n/a: this PR touches no release data. `unreleased` is empty and `package.json` is `0.25.0`, both untouched

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration. Next free number remains `0178`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply. Both databases read `177 applied, 0 pending, No drift` as of the `0.25.0` verification
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [x] Existing rows still read correctly after the change — n/a as a data question, but the **factual** claims in the new text were measured rather than reasoned: the absence of `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` was read off the production Pi on 2026-10-10 by listing key **names** in `.env.production.local`, `.env.local` and `.env.deploy.production`. **No secret value was read or printed**
- [ ] Constraints and defaults exercised against real rows — n/a: no constraint, default or database object in this PR; it edits one markdown file
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: the revert is a git revert of one documentation file
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — the handover's purpose is to be read cold. The four corrected passages now agree with what is true: the tile is broken, the diagnosis is in the backlog, the husk is gone, and the lesson is stated once in its own section
- [ ] Data persists — n/a: documentation; git is its persistence
- [ ] Create / edit / delete all exercised — n/a: the handover has no screen and no create, edit or delete path; git is the only way it changes
- [x] Empty state renders sensibly (no rows yet) — the **In flight** section still correctly says nothing was left open by the release; this PR does not change that, because the bug is a backlog item and not an in-flight branch
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the lesson was inserted **before** the existing "Things that look alarming" section, which renumbered it from 7 to 8. Checked that the lesson headings now run 1–8 with no duplicate and no gap, and that both cross-references to lesson 5 still point at the phone-width section

### Role access matrix

Not applicable: nothing in this PR is served to any role, and no route, gate or
permission is touched.

- [x] Every role above tested — n/a, as above
- [ ] A role that should not have access is blocked server-side — n/a: no route in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The handover is an internal document
- [ ] Translatable strings go through the translation path — n/a: internal English-only documentation
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no request path changed

## 6. Regression

- [x] The pages nearest the change still work — no page reads `docs/`. The build passing is the only coupling and it passed
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is read by people, not code. Checked that the amendment note at the top and lesson 7 do not contradict the **Outstanding verification** table, which is where the same fact also appears
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in; one documentation file is touched and no other stream is editing it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: nothing is completed by this PR. The bug it describes is **open**, and was filed on the `backlog` branch rather than here, as the rules require
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. The one judgement made — correct the handover but leave the `0.25.0` record alone — follows the rule already written in the record's own preamble: a release record says what happened at the time, and the handover is the living document
- [x] `README.md` still accurate — unchanged, and it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: internal documentation, no user-visible change. **Note that the release note which is *wrong* — `0.25.0`'s visitor-count line — is not corrected here**: it has already been mailed and cannot be unsent, so correcting it is a decision for `0.26.0`'s notes and is written into the handover as such
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the absence of both Cloudflare values on the Pi was measured, by name, on the live machine; the lesson-numbering check was read back from the file

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR ships nothing. `0.25.0` is live at `590a9d35` and is unaffected
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy follows this PR. It is documentation merged after the release

### On the deployed build

- [ ] Deployed to test — n/a: documentation. Test and production both serve `0.25.0` @ `590a9d35` and are untouched by this
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR reaches a browser
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: nothing in this PR derives a time. The dates in the text are literal strings
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary, threshold or band in this PR. The one ordering question, where the new lesson sits among the numbered ones, is checked in §4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**

### Deploy safety

- [ ] `deploy: production → Supabase project` line read and the ref matches production — n/a: no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy
- [x] Any new secret or env var exists in the production Cloudflare environment — **this PR adds none, and that is the point.** The two values the visitor-count tile needs are missing on the Pi; adding them is a live-configuration change, out of scope here and named as such in §1

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration in this PR, destructive or otherwise. The nightly backup remains the position of record
- [ ] Apply plan stated — n/a: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — a git revert of one documentation file, affecting nothing that runs. It would not undo the backlog item, which lives on the `backlog` branch, and it would not change the fact the handover describes: the tile is still broken either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **The Website visitors tile is broken on production and `0.25.0` mailed every admin that it works.** The two Cloudflare values are absent from the Pi's environment and from both files it is built from, so the tile renders its designed *Not set up* state. #518 fixed the plumbing; nobody checked that the values existed anywhere the Pi could read them | **logged on the `backlog` branch as the first item under Next up**, with the measurement, the root cause and the fix. **Not fixed here**: it needs a production secret added, which is a live-configuration change for Lutan to confirm. The false release note is named in the item and in the handover, for `0.26.0` to correct if the fix does not land first |
| 2 | low | **The handover was out of date within the hour of being merged** — it listed the bug above as a cheap outstanding *check*, and told the next release manager to clear a husk that had already been cleared | **fixed in this PR**, which is what it is for |
| 3 | low | **Settings → System status cannot distinguish "no key set" from "key set but the API refused"** — both render the same grey message, which is why this looked finished rather than broken | **captured in the backlog item as part of the fix**, since it is the reason the failure was invisible. Not a change in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the amended handover reads correctly cold, and that lesson 7 is the lesson actually worth carrying | `docs/release-handover.md` |
| 2 | Whether the two Cloudflare values exist as Worker secrets at all, and whether the token is still valid — the backlog item's fix branches on this | `npx.cmd wrangler secret list --env production`, Lutan |
| 3 | The decision `0.26.0` has to make: fix the tile before anyone notices, or carry a correcting release note | `0.26.0`'s cut, Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looks may tick this line, so it stays unticked

Manual verification by: pending: the three items under Left for manual verification — the amended handover read cold, whether the Cloudflare secrets exist at all, and the correcting-note decision for `0.26.0`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; defect 1 was reported by Lutan and is logged rather than silently absorbed

Result: pass with accepted defects

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-10
