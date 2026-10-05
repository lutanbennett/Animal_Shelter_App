# Feature test plan — cut-release-0-19-1

## Header

| | |
|---|---|
| Feature | Cut release `0.19.1`, **minor**: move the four `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-19-1` @ `C:\Development\Animal_Shelter_cut-release-0-19-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-05 |
| Carries a migration? | no — `0144` and `0145` ship in this release and were applied to production first. See §3 |
| Tested at SHA | `29e74360` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.19.1` entry holding the four notes written by #367, #368, #371 and #372, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all four notes are tagged `admin` or `admin, management`.** Nobody below management would notice anything in this release. `major: false`, so **no admin is mailed** — verified in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) the release record; (c) the outstanding manual verification on eight of the nine PRs, which stays on their plans

**Decided in chat by Lutan, 2026-10-05: `0.19.1`, minor.** Asked before cutting.
The argument both ways was put to him: the four notes are admin and management
polish plus one new admin page, which is thin for a major — but the audience for
a release mail *is* admins, so the facility map editor would have been a
defensible thing to announce. He chose minor, after three majors in two days.

### Mailed in this order — except nothing is mailed

1. The **Settings → Facility map** editor, where an admin places enclosures on the shelter's plans (`admin`)
2. The **Management home on a phone**, now a short screen rather than every page (`admin, management`)
3. **Icon buttons** on the Management pages (`admin, management`)
4. **Icon buttons** on the Settings pages (`admin`)

The new capability leads; the two icon-button notes are the same change to two
areas and sit together at the end. The order affects `/releases` only.

### What is in the release

`node scripts/release-prs.mjs f93a7fe5 29e74360` — nine PRs, exit 0, eleven
added migration/test-plan files accounted for: #365–#373.

### Eight of the nine plans are unsigned

Put to Lutan before the cut; he chose to ship and record the gap. **Three want
him specifically**, which is unusual density for one release:

| PR | Outstanding |
|---|---|
| `icon-buttons-management` | **Lutan to approve the look**, and run its table |
| `icon-buttons-admin` | the same, on the Settings pages |
| `facility-map-editor` | items 1–6. **The only new capability in the release**, and nobody has drawn a map |
| `management-phone-home` | says plainly that the Director's phone home has not been looked at |
| `perm-convert-residents` | a person opening the resident pages as staff |
| `perm-convert-orphans` | a person opening the pages as management |
| `load-residents` | the backlog row it names |
| `release-record-0-19-0` | mine from this morning |

`phone-width-check` is an honest `n/a:` — its output is text with an exit code.

Worth stating for the record manager: **three new roles shipped in `0.18.0` and
`0.19.0` and none has yet had a role pass by a person**, and this release adds
two more permission conversions on top.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `29e74360` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 132s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything. Stated because two PRs ago this plan's predecessor was committed failing after the checker's output and exit code were swallowed by `| head -3`
- [x] Newest release version matches `package.json` — both `0.19.1`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 4 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.19.0")` returns `[]`** — the call that decides whether admins are mailed. For a minor it must return nothing, and this is what proves `major: false` took effect rather than being typed
- [x] **The date was read from the local clock** — `2026-10-05`, the day after the three releases in `2026-10-04.md`, so this one starts a new record file
- [x] The register parses the way `deploy.mjs` loads it — `0.19.1` / `2026-10-05` / `major: false` / 4 notes, under type stripping
- [x] Order intact — `0.19.1 > 0.19.0 > 0.18.0`, file order still matching a re-sort by `compareVersions` across all 29 entries
- [x] **The cut was verified against the pre-cut register through the parsed module** — `carried across unchanged: 4 of 4`, `text lost: 0`, `text invented: 0`
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **The notes render clean** — `notes rendering badly: 0`
- [x] `node scripts/check-release-guards.mjs` — all ok, exit 0

### The cut script's tally was right this time, and that is luck

It printed `object form: 0, string form: 4` and the verification pass reports
the forms as `object,object,object,object` — so the tally is still wrong, it
simply happens to be wrong in a way that is harder to notice when every note
takes the same shape. This is `0.18.0`'s defect 1, third release running,
unfixed inside a release cut on purpose.

The verification pass remains what the ticks rest on. The tally has never been
evidence, and this release is a good illustration of why a number that is
usually right is not the same as a number that is checked.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `--env production --status` reviewed — two pending: `0144_perm_convert_residents.sql`, `0145_perm_convert_orphans.sql`
- [x] `--env production --dry-run` reviewed — both `… ok`, neither depending on the other
- [x] Applied to **dev** and recorded in `schema_migrations` — by #366 and #370 before this release
- [x] File is re-runnable — read rather than assumed
- [x] Existing rows still read correctly after the change — both convert permission checks; neither rewrites data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in the schema PRs
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — **already executed**, before any deploy. `0144` required it: its `-- consumer:` header names the resident create, edit, move and adoption-update actions, the resident page and `who-and-where.ts`, all shipping here. `0145` is `-- consumer: none`

`--drift` afterwards, both databases: `No drift: production matches origin/main`
and `No drift: test matches origin/main`, zero in each direction.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR; `/releases` reads the register and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input; the guard script covers the malformed-register cases
- [ ] Boundary cases checked — n/a: no input. Version ordering across 29 entries is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all four, **and no email** | not driven — register parse checked instead |
| management | `/releases` | two — the Management home and the Management icon buttons | not driven |
| staff | `/releases` | none from `0.19.1` | not driven |
| vet | `/releases` | none | not driven |
| volunteer | `/releases` | none | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed; the tags are data carried across unaltered, asserted by text match in §2. **Three roles see nothing at all from this release**, which is the clearest statement of how narrow it is
- [ ] A role that should not have access is blocked server-side — n/a: no new access path in this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change in this PR
- [ ] Manual updated — n/a: the manual does not describe the register; the features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no UI change in this PR
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and the Worker's `/api/releases/current` with the new register
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, the Worker and `deploy.mjs`; the third was exercised directly by loading the register under type stripping
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one choice here, the note order, is recorded in §1
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All four were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the four-note comparison through the parsed module, the role-tag check by text, `majorReleasesSince("0.19.0")` returning `[]`, and `0144`'s consumers being files that ship here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime. The entry's `date` is a literal read from the local clock and checked in §2
- [ ] **Boundary or banding change** — n/a: no boundary in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**, which has worked twice running. The log is UTF-16: `tr -d '\000'` before grepping
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new
- [ ] **The deploy prints no release mail** — deferred: release manager. For a minor it should say `no major release new to production (was 0.19.0), so no email`, which is the deploy-side confirmation of §2's `majorReleasesSince` check

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form; **for the release, yes**: `0144`'s consumers ship here and it was applied first
- [x] `--env production --dry-run` run and clean — both files `… ok`
- [ ] For a **destructive or rewriting** migration only — n/a: both convert permission checks
- [x] Apply plan stated — §3; already executed

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref f93a7fe5`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0144` or `0145`.** Both convert resident and orphan-page permission checks to the new scheme, so rolling the code back leaves converted checks under code that may expect the old ones — the same asymmetry as `0.18.0`, and resident pages would be where it showed. **Nothing to un-send this time**: a minor mails nobody

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut script's tally still miscounts note forms — third release running. It happens to read correctly here only because every note is the same shape | accepted inside the cut, explained in §2. Worth fixing when the script is next touched outside a release |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.19.1` title and the order of the four notes on `/releases` — no mail goes out, so this is the only place they appear | `src/lib/releases.ts`, the `0.19.1` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's

Manual verification by: pending: the `0.19.1` title and the note order on `/releases`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §3
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-05 — all nine plans read; the eight unsigned lines were put to Lutan with the three that want him by name, and he chose to ship and record the gap
