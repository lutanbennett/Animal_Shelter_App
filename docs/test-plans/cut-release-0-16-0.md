# Feature test plan — cut-release-0-16-0

## Header

| | |
|---|---|
| Feature | Cut release `0.16.0`, **major**: move the seven `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 and `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-16-0` @ `C:\Development\Animal_Shelter_cut-release-0-16-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-03 |
| Carries a migration? | no — `0131` and `0132` ship in this release and were **already applied to production**. See §3 |
| Tested at SHA | `e0bf899d` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.16.0` entry holding the seven notes written by #318–#325, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — two notes are role-tagged (`admin, management` on the Medication list; `admin, management, staff` on the blood test) and five are untagged, so every signed-in user sees them. **`major: true`, so every admin with an email is mailed** — verified, not assumed, in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) the release record, written after; (c) the outstanding manual verification on eight of the ten PRs, which stays on their plans

**Decided in chat by Lutan, 2026-10-03: `0.16.0`, major.** Asked before cutting,
as the procedure requires. Seven notes including a security fix, and the largest
release since `0.14.0`.

### The note order was chosen, not inherited

`unreleased` held them in merge order. They are mailed in this one, leading with
the security fix exactly as `0.14.0` led with the forced sign-out — it is the
note an admin most needs to read, and the one that describes something that was
previously possible and no longer is:

1. **Changing your password now asks for your current password** (everyone)
2. New Medication list (`admin, management`)
3. Staff and managers can record a blood test (`admin, management, staff`)
4. Maintenance jobs moved on by tap (everyone)
5. Pages fit a phone screen (everyone)
6. Scan a chip finds the animal (everyone)
7. Midnight–7am date refusals fixed (everyone)

Reordering is the one edit a cut makes to the notes, so §2 checks the texts and
role tags survived it **matched by text rather than by position**.

### What is in the release

`node scripts/release-prs.mjs 3fb8816 e0bf899d` — ten PRs, exit 0, twelve added
migration/test-plan files all accounted for:

```
- #317  claude/release-record-0-15-1  (ee1e2cd)
- #318  claude/dry-run-bugs  (851ccd4)
- #319  claude/schema-blood-test-policies  (38a2e32)
- #320  claude/phone-width-fixes  (01129c4)
- #321  claude/uat-record-2026-10-02  (bcc1f3a)
- #322  claude/password-change-current  (d4e0521)
- #323  claude/roles-and-permissions-design  (b5c7c10)
- #324  claude/maintenance-phone-board  (54c618e)
- #325  claude/medication-list  (76289f2)
- #326  claude/permissions-schema  (e0bf899)
```

### Eight of the ten PRs carry an unsigned manual-verification line

All ten have complete plans and a signed **Automated checks by** line. #321 and
#326 are `n/a`. The rest are `pending`, and **Lutan was asked and chose to ship
and record the gap** — asked specifically because two of them are not like the
others:

| PR | What is outstanding | Why it matters here |
|---|---|---|
| #322 | the reset-link path, console/network, and two devices | **This release's security fix.** Its automated side passed; nobody has driven the reset-link path by hand |
| #320 | a person on a real phone, plus the public site and desktop | The fix is "pages fit a phone screen", and no real phone has seen it |
| #318 | five items, chiefly the 00:00–07:00 Thai-time run | Cannot be done at midday; it is the window the fix is about |
| #324 | items 1–3 at 375 px and desktop, both languages | — |
| #325 | the Medication list on a real phone on site, with the Director | — |
| #319 | attaching a real file as staff, saving as management | — |
| #323 | Lutan answering L2–L12; the Director confirming her table | A design document, not code |
| #317 | Lutan reading the `0.15.1` record | A record |

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked rather than assumed: the branch was created from `origin/main` at `e0bf899d` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 186s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] Newest release version matches `package.json` — both `0.16.0`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 7 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.15.1")` returns `["0.16.0"]`** — the call that makes the deploy mail admins. For `0.15.1` the same check had to return `[]`; here it must return the version, and does
- [x] **The date was read from the local clock** — `2026-10-03`, matching the entry and the same day as `0.15.1`
- [x] The register parses the way `deploy.mjs` loads it — `0.16.0` / `2026-10-03` / `major: true` / 7 notes, under Node's type stripping
- [x] Order intact — `0.16.0 > 0.15.1 > 0.15.0`, the register's file order still matching a re-sort by `compareVersions` across all 25 entries
- [x] **The cut was verified against the pre-cut register through the parsed module, not a regex.** Five of the seven notes are bare strings and two are the object form, so a `text:`-matching comparison would have silently checked two of seven. Both versions were imported — the pre-cut one straight from `origin/main` — and compared by `noteText`: `carried across unchanged: 7 of 7`, `text lost: 0`, `text invented: 0`, forms `object,string,string,string,object,string,string` before and `string,object,object,string,string,string,string` after, which is the reorder and nothing else
- [x] **Role tags survived the reorder** — matched by text rather than position, since the positions deliberately changed: `role tags changed: 0`
- [x] **The notes render clean** — `notes rendering badly: 0`; no `[object Object]`, no `undefined`
- [x] `node scripts/check-release-guards.mjs` — all ok, exit 0

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed — `0131_blood_test_write_policies.sql` and `0132_permission_tables.sql` were both pending and have since been applied
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` reviewed — both `… ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — by #319 and #326 before this release
- [x] File is re-runnable — both read rather than assumed
- [x] Existing rows still read correctly after the change — `0131` changes policies, not rows; `0132` adds tables. #326's own harness asserted every role × activity × level against the paper's table at run time
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in #319 and #326
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated — **already executed**, and the ordering mattered this time: `0131`'s `-- consumer:` header names `src/app/blood-tests/new/actions.ts` and the attachments route, and **the code that reads it ships in this release**, so it had to be applied before the deploy rather than merely before the next one. `0132` is `-- consumer: none`. `--drift production` afterwards: `No drift`, `132 file(s), 132 applied row(s)`, zero in each direction

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR. `/releases` reads the register, and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface; an empty `unreleased` is the normal post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input; the guard script covers the malformed-register cases
- [ ] Boundary cases checked — n/a: no input. Version ordering across 25 entries is the nearest thing and is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all seven notes, **and the email** | not driven — register parse checked instead |
| management | `/releases` | all seven — it is named in both tagged notes | not driven |
| staff | `/releases` | six — the five untagged plus the blood-test note | not driven |
| vet | `/releases` | the five untagged notes only | not driven |
| volunteer | `/releases` | the five untagged notes only | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed, and the tags are data carried across unaltered, which §2 asserts by text match
- [ ] A role that should not have access is blocked server-side — n/a: no new access path; `/releases` is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe the register; the features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no UI change in this PR
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and the Worker's `/api/releases/current` with the new register; both are in the build output
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, the Worker and `deploy.mjs`; all three go through the exports checked in §2, and the third was exercised directly by loading the register under type stripping
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one choice made here, the note order, is recorded in §1 where the release manager will read it
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All seven were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the four that could have been guessed were each run: the seven-note comparison through the parsed module, the role-tag check by text match, `majorReleasesSince("0.15.1")`, and both migrations' applied state and drift on production

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a *for this PR*: nothing here derives a date at runtime; the entry's `date` is a literal read from the local clock and checked in §2. **Note for the release manager:** #318 in this release fixes the 00:00–07:00 Thai-time refusals, and its own plan leaves that window unverified — it is the clearest candidate for a real check after the deploy
- [ ] **Boundary or banding change** — n/a: no boundary in this PR. #318's is the release's, and is on its plan
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited script output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager. **Missed in both `0.15.0` and `0.15.1`** because it scrolled out of the terminal buffer; worth capturing deliberately this time
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new. `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` was installed for `0.15.1` and is a build-time value, already present on both machines

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form: no migration in this PR. **For the release it is yes**, and it was handled: `0131` is read by code shipping here, so it was applied before any deploy
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — both files `… ok`
- [ ] For a **destructive or rewriting** migration only — n/a: `0131` replaces policies, `0132` adds tables; neither rewrites data
- [x] Apply plan stated — §3; already executed

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 3fb8816`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0131` or `0132`.** `0132` is inert (nothing reads it). `0131` grants staff and management the write policies the blood-test fix needs — rolling back the code leaves those policies in place, which is wider than `0.15.1` was, and that is a deliberate statement rather than an oversight. **The mail cannot be un-sent**, and this one tells people about a security fix

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found in the cut | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.16.0` title, and **the order the seven notes will be mailed in** — leading with the password change is a judgement, and this is the mail every admin reads | `src/lib/releases.ts`, the `0.16.0` entry |
| 2 | The wording of note 1 specifically. It describes a security hole that existed until today, and a wrong emphasis in a mailed note travels furthest — the same reason `0.14.0`'s note 1 was rewritten before its cut | same entry, note 1 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's, both judgements about text that is about to be mailed

Manual verification by: pending: the `0.16.0` title, the mailed order of the seven notes, and note 1's wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §2
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass

Release manager acknowledgement: Claude (release manager session), 2026-10-03 — all ten plans read in full; the eight unsigned lines were put to Lutan before the cut and he chose to ship and record the gap, with #322 and #320 named to him specifically
