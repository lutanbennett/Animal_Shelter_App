# Feature test plan — cut-release-0-19-0

## Header

| | |
|---|---|
| Feature | Cut release `0.19.0`, **major**: move the eight `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-19-0` @ `C:\Development\Animal_Shelter_cut-release-0-19-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-04 |
| Carries a migration? | no — `0142` and `0143` ship in this release and were applied to production first. See §3 |
| Tested at SHA | `0cd139b0` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.19.0` entry holding the eight notes written by #354–#363, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — five notes are role-tagged, three untagged. **`major: true`, so every admin with an email is mailed** — verified in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) the release record; (c) the outstanding manual verification on nine of the eleven PRs, which stays on their plans

**Decided in chat by Lutan, 2026-10-04: `0.19.0`, major.** Asked before cutting.
**Two more new logins** — 2IC and Head of Maintenance — on top of the Head of
Medical from `0.18.0`. Three new roles in two releases, and the shelter's staff
meet different screens at their next sign-in whether or not they read the mail.

### Mailed in this order

1. The **2IC** login and her four big buttons (`admin, management`)
2. The **Head of Maintenance** login and her one button (`admin, management`)
3. The Head of Medical's three further jobs, pictures first
4. The medication list asking which round — Morning, Lunch or Evening
5. Recording a delivery as short steps on a phone (`admin, management, staff`)
6. The Enclosures **Map** beside the List (`admin, management, staff, volunteer`)
7. Icon buttons for the repeating actions on a resident's page
8. A refused save keeping what you typed

The two new logins lead because they are the change a person cannot miss. The
order is a judgement and is on the manual list.

### What is in the release

`node scripts/release-prs.mjs 701136c2 0cd139b0` — eleven PRs, exit 0, fifteen
added migration/test-plan files accounted for: #353–#363.

### Nine of the eleven plans are unsigned

Put to Lutan before the cut; he chose to ship and record the gap. Two carry
partial evidence and one is a judgement only he can make:

| PR | Outstanding |
|---|---|
| `icon-buttons` | **Lutan to approve the look**, and run its table. The icons replace word links on every resident record, so this is a visual judgement nobody else can make |
| `2ic-delivery-steps` | items 1–7; **Claude drove part of it on dev** |
| `medical-jobs-app` | five items; likewise partly driven |
| `medical-round-screens` | six items |
| `maintenance-role` | five items |
| `2ic-role` | five items |
| `facility-map-read-only` | items 1–4, on a phone |
| `dry-run-findings-rest` | six items |
| `release-records-0-17-0-18` | mine from earlier today: both accounts, and a public-page check |

`schema-medical-jobs` and `facility-map-schema` are honest `n/a:` — no UI surface.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `0cd139b0` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 271s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] Newest release version matches `package.json` — both `0.19.0`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 8 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.18.0")` returns `["0.19.0"]`** — the call that makes the deploy mail admins
- [x] **The date was read from the local clock** — `2026-10-04`. Third release of the day, so it joins `0.17.0` and `0.18.0` in one record file
- [x] The register parses the way `deploy.mjs` loads it — `0.19.0` / `2026-10-04` / `major: true` / 8 notes, under type stripping
- [x] Order intact — `0.19.0 > 0.18.0 > 0.17.0`, file order still matching a re-sort by `compareVersions` across all 28 entries
- [x] **The cut was verified against the pre-cut register through the parsed module** — `carried across unchanged: 8 of 8`, `text lost: 0`, `text invented: 0`
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **The notes render clean** — `notes rendering badly: 0`
- [x] `node scripts/check-release-guards.mjs` — all ok, exit 0

### The cut script's own tally is wrong again, and it does not matter

It printed `object form: 0, string form: 8`, while the verification pass reports
the pre-cut forms as `object,object,string,string,string,object,object,string`.
This is defect 1 from `0.18.0`'s plan, unfixed: the tally counts a single-line
object as a string.

It is worth stating plainly rather than quietly ignoring, because the two
numbers disagree in the same output and a reader could take either. **The
verification pass is authoritative**: it reads the parsed register through
`noteText` and `noteRoles` rather than counting lines, which is exactly why the
check and the summary are separate steps. The tally is a log line; it has never
been evidence for anything.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `--env production --status` reviewed — two pending: `0142_facility_maps.sql`, `0143_2ic_role.sql`
- [x] `--env production --dry-run` reviewed — both `… ok`. No red this time; unlike `0.18.0`'s `0136`, neither depends on the other
- [x] Applied to **dev** and recorded in `schema_migrations` — by #360 and #362 before this release
- [x] File is re-runnable — read rather than assumed
- [x] Existing rows still read correctly after the change — `0142` adds map tables; `0143` adds a role and its permission cells
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in the schema PRs
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — **already executed**, before any deploy, and `0143` required it: its `-- consumer:` header names `src/lib/permissions/jobs.ts`, `src/lib/home/tiles.ts`, the stocktake, deliveries and purchasing pages and the photo route, all of which ship here. `0142` is `-- consumer: none`

`--drift` afterwards, both databases: `No drift: production matches origin/main`
(zero in each direction) and `No drift: test matches origin/main`.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR; `/releases` reads the register and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input; the guard script covers the malformed-register cases
- [ ] Boundary cases checked — n/a: no input. Version ordering across 28 entries is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all eight, **and the email** | not driven — register parse checked instead |
| management | `/releases` | all eight | not driven |
| staff | `/releases` | six | not driven |
| vet | `/releases` | four | not driven |
| volunteer | `/releases` | five | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed; the tags are data carried across unaltered, asserted by text match in §2. **Note:** the new 2IC and Head of Maintenance roles are not in this table because `/releases` tags predate them; what those roles see is #362's and #359's unsigned work, not this PR's
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
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All eight were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the eight-note comparison through the parsed module, the role-tag check by text, `majorReleasesSince("0.18.0")`, and `0143`'s consumers being files that ship in this release

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a *for this PR*: nothing here derives a date at runtime. **Note for the release manager:** note 4 is about the medication list choosing Morning, Lunch or Evening "to suit the time of day", which is a clock-dependent behaviour shipping in this release; its own plan (`medical-round-screens`) owns that check
- [ ] **Boundary or banding change** — n/a: no boundary in this PR. The round windows in note 4 are #357's
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**, which worked on `0.18.0` after three releases of missing it. Remember the log is UTF-16: `tr -d '\000'` before grepping
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form; **for the release, yes**: `0143`'s consumers ship here and it was applied first
- [x] `--env production --dry-run` run and clean — both files `… ok`
- [ ] For a **destructive or rewriting** migration only — n/a: `0142` adds tables, `0143` adds a role and its cells
- [x] Apply plan stated — §3; already executed

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref 701136c2`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0142` or `0143`.** `0142` is inert. `0143` adds a role and permission cells: rolling the code back leaves a role in the database that nothing offers a login for, which is harmless, and is the opposite case to `0.18.0` where the policies narrowed what existing roles could see. **The mail cannot be un-sent**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut script's closing tally miscounts single-line object notes, and printed `object form: 0` for a register that has four of them | accepted, second release running, and explained in §2: it is a log line, never evidence. Worth fixing when the script is next touched, and deliberately not fixed inside a release cut |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.19.0` title, and the order the eight notes will be mailed in — leading with the two new logins is a judgement about what a person cannot miss | `src/lib/releases.ts`, the `0.19.0` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, a judgement about text about to be mailed

Manual verification by: pending: the `0.19.0` title and the mailed order of the eight notes

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §3
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-04 — all eleven plans read; the nine unsigned lines were put to Lutan with `icon-buttons` named as the one only he can judge, and he chose to ship and record the gap
