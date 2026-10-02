# Feature test plan — cut-release-0-15-0

## Header

| | |
|---|---|
| Feature | Cut release `0.15.0`, **major**: move the three `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-15-0` @ `C:\Development\Animal_Shelter_cut-release-0-15-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-02 |
| Carries a migration? | no — but `0129_medication_label.sql` is **pending on production** and ships in this release. See §3 |
| Tested at SHA | `41b84c3` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.15.0` entry holding the three notes written by PRs #300, #301 and #305, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — notes 1 and 2 are tagged `admin`, as the PRs that wrote them tagged them; **note 3 is untagged, on Lutan's instruction in chat** (below), so every signed-in user sees it. `major: true`, so **every admin with an email is mailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploys, Lutan's go; (b) applying `0129` (§3); (c) the release record, written after the deploy; (d) the outstanding manual verification on three of the five PRs in this release, which is theirs and not closed by this PR (below)

### What is in the release

`node scripts/release-prs.mjs 86c683d HEAD` — five PRs, exit 0, six added migration/test-plan files all accounted for:

```
Release range 86c683d..HEAD
PRs in this release: 5

- #300  claude/signup-bounds-two-step  (157b9b5)
- #301  claude/audit-undo  (6298076)
- #303  claude/script-exec-bits-guard  (41b84c3)
- #304  claude/schema-medication-label  (3228952)
- #305  claude/origin-write-fallback  (f1a46ca)

Checked 6 added migration/test-plan file(s) against the list.
```

`#302` is absent on purpose: it **is** `86c683d`, the previous release's own deployed SHA, so it shipped in `0.14.0`. Confirmed with `git merge-base --is-ancestor`, not inferred from the numbering.

### Three of the five PRs carry an unsigned manual-verification line

Every one of the five has a complete, internally consistent plan and a signed
**Automated checks by** line. Three say `Manual verification by: pending`, and the
template's rule for that state is "nothing ships on a `pending:` — the release
manager's pre-deploy pass is what holds that line, not CI". So it is raised here
rather than discovered later:

| PR | Plan | What is outstanding |
|---|---|---|
| #300 | `signup-bounds-two-step` | 5 items: Deny on a real no-role login, the two-tab stale-page case, newest-first order in English and Thai, the Supabase console sign-up restriction (WEB-3), and the admin-role-before-enrolment decision |
| #301 | `audit-undo` | 4 items: the Undo button driven in a browser, the changed-since refusal, the slot-taken message, and the Thai text. `Result: pass with accepted defects` — two, both low, both reasoned (no "Undone" label; residents not undoable) |
| #305 | `origin-write-fallback` | 2 items: the release-note wording, and the `systemctl stop cloudflared` drill, which **can only be run after this is deployed** |

`#303` (`n/a: no UI or visual surface`) and `#304` (`n/a: no UI surface`) need nobody to look.

### Decided in chat by Lutan, 2026-10-02

Asked before the merge, with the three unsigned plans and their outstanding
items set out as above:

1. **Ship, and record the gap.** `0.15.0` goes out with #300, #301 and #305
   unsigned for manual verification, and the release record states it as a gap
   rather than leaving it implied — the shape `0.14.0`'s record used for the
   same thing. The eleven outstanding items are not closed by this decision and
   are not re-homed into this plan; they stay on their own plans, where their
   owners' signatures still belong. #305's drill could not have been done first
   in any case: it tests the deployed build.
2. **Widen note 3 to everyone.** It was tagged `admin` by #305; writes
   surviving the Pi being off is behaviour every signed-in user gets, so the
   tag is dropped and the note reads to all roles, as `0.14.0`'s forced sign-out
   note did. Applied here before the merge, and the register re-verified after:
   text unchanged at 287 characters, `roles=undefined`.
3. **Deploys.** Lutan runs `npm run deploy:prod`. This session applies `0129`
   to production, deploys test, builds on the Pi over SSH, restarts the Pi
   service and writes the record.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked rather than assumed: the branch was created from `origin/main` at `41b84c3` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed — **re-run on the tree that ships**, after note 3 was untagged, rather than kept from the first run:

```
=== gates: build exited 0 after 123s

gates: typecheck=0 lint=0 build=0
```

  The first run, before the untagging, ended the same way (`build exited 0 after 185s`). Both are recorded because the second is the one that applies to the shipped commit, and a note's object-to-string form is exactly the sort of change a reader would assume needed no re-run.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] Newest release version matches `package.json` — both `0.15.0`, read back from the parsed register rather than from the diff
- [x] `unreleased` is empty — emptied by this PR; it held exactly 3 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.14.0")` returns `["0.15.0"]`** — the check that makes the deploy mail admins, verified rather than inferred
- [x] **The date was read from the local clock** — `2026-10-02`, matching the entry
- [x] The register parses the way `deploy.mjs` loads it — `0.15.0` / `2026-10-02` / `major: true` / 3 notes, under Node's type stripping
- [x] Order intact — `0.15.0 > 0.14.0 > 0.13.0`, the register's file order still matching a re-sort by `compareVersions` across all 23 entries
- [x] **The cut was verified against the pre-cut register**, not read over: all three notes compared against `origin/main:src/lib/releases.ts` — `carried across unchanged: 3 of 3`, `text lost: 0 text invented: 0`, 463 / 258 / 287 characters. **Re-run after note 3 was untagged**, because that edit touches the same lines the comparison reads: still 3 of 3 unchanged, note 3's text identical at 287 characters and `roles=undefined`, notes 1 and 2 still `["admin"]`
- [x] **The notes render clean** — `noteText` on each: no `[object Object]`, no `undefined`
- [x] `node scripts/check-release-guards.mjs` — 15 cases, all ok: a cut release with nothing unreleased passes, and both "unreleased notes" and "a migration the database lacks" still refuse

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --status --env production` reviewed — **`0129_medication_label.sql` is pending on production**: `128 applied, 1 pending`, and `Applied here, no file on origin/main: 0`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: owed for the release, against production, before the deploy — it is in §8's apply plan, not this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0129` (applied by #304)
- [x] File is re-runnable — read rather than assumed: `0129` is `add column if not exists` throughout, and carries a `-- consumer:` header
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database; #304's own plan exercised the column against dev rows in a `begin … rollback` harness
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in #304
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR. #304's reason stands: an unread nullable column is harmless to leave
- [x] Production apply plan stated — `0129_medication_label.sql` to `dbkodyyxxhtygxcxmfcu`, **before the deploy**. Nothing in this release reads the column (its `-- consumer:` header names the upload action, the table, the stocktake sheet and the photo proxy, all of which are the still-unbuilt feature half), so the ordering is not a correctness requirement this time — but the deploy guard refuses a commit whose database lacks a migration on `main`, so it is a requirement anyway, and that is the stricter of the two

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR. `/releases` reads the register, and what it will read was verified by parsing it in §2 rather than by loading the page
- [ ] Data persists — n/a: the change *is* data, committed to git; there is no write path
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface. `unreleased` being empty is the normal post-cut state and `/releases` does not render it
- [ ] Invalid input is rejected with a readable message — n/a: no input; the guard script covers the malformed-register cases
- [ ] Boundary cases checked — n/a: no input. The version ordering across 23 entries is the nearest thing and is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all three notes, and the `0.15.0` mail | not driven — register parse checked instead |
| management | `/releases` | note 3 only (notes 1–2 tagged `admin`) | not driven |
| staff | `/releases` | note 3 only | not driven |
| vet | `/releases` | note 3 only | not driven |
| volunteer | `/releases` | note 3 only | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed. The behaviour behind the tags (`noteRoles`) is #62's, unchanged here; what this PR changed is one note's data, and the expected column above follows from `roles=undefined` on note 3, read back from the parsed register in §2
- [ ] A role that should not have access is blocked server-side — n/a: no new access path; `/releases` is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe the register; the three features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and `/api/releases/current`'s route with the new register; both are in the build output
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is imported by `/releases`, the Worker's `/api/releases/current` and `deploy.mjs`. All three consume it through the exports checked in §2, and the third was exercised directly: the register loaded under type stripping, which is how `deploy.mjs` reads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; the cut procedure is `src/lib/releases.ts`'s header and is unchanged
- [x] `README.md` still accurate — it describes the register and the cut, not the version; nothing in it goes stale on a cut
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All three were written by the PRs that made each change (#301, #300, #305) and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages were measured, not reasoned** — the three claims this plan makes that could have been guessed were each run: the note comparison against `origin/main`, `majorReleasesSince("0.14.0")`, and `0129`'s pending state on production

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager (this session), after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The entry's `date` is a literal, read from the local clock at cut time and checked in §2
- [ ] **Boundary or banding change** — n/a: no boundary, band or threshold in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited script output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this release adds none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR, and nothing in the release reads `0129`'s column
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, before the deploy
- [ ] For a **destructive or rewriting** migration only — n/a: `0129` is two additive nullable columns
- [x] Apply plan stated — §3: `0129_medication_label.sql`, `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 86c683d` there, a rebuild of a few minutes; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0129`**, and neither needs to: two additive nullable columns nothing reads are safe to leave behind a rolled-back build. Rolling back also un-publishes the three notes from `/releases` but **cannot un-send the admin mail**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found in the cut | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.15.0` title reads well to a shelter admin, and is the right summary of the three notes. It is Claude's wording, not carried across from a PR, and it is the one line of this cut nobody else has written | `src/lib/releases.ts`, the `0.15.0` entry |

The two items that stood here before — note 3's role tag, and whether to ship
with three unsigned plans — were put to Lutan in chat and decided; they are
recorded in §1 rather than left open here. The eleven items outstanding on
#300, #301 and #305 are deliberately **not** listed in this table: they belong
to those plans and to their signatures, and copying them here would give them a
second home that signing this plan would appear to close.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is left and it is Lutan's; the line below stays `pending` until he has read the title

Manual verification by: pending: the `0.15.0` title wording. The other two items this plan raised were decided by Lutan in chat on 2026-10-02 and are recorded in §1; this line is not signed, because reading the title is still a separate look and the signature is his to give

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and quotes §1; the file is the record
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass

Release manager acknowledgement: Claude (release manager session), 2026-10-02 — the five PRs' plans were read in full; the three unsigned manual-verification lines were raised in §1 rather than absorbed, and Lutan's decision to ship on them goes into the release record as a stated gap
