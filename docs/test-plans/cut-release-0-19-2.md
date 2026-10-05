# Feature test plan — cut-release-0-19-2

## Header

| | |
|---|---|
| Feature | Cut release `0.19.2`, **minor**: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-19-2` @ `C:\Development\Animal_Shelter_cut-release-0-19-2` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-05 |
| Carries a migration? | no — **and neither does the release**: `146 applied, 0 pending`. The first release in this sequence with no schema change at all |
| Tested at SHA | `4047d208` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.19.2` entry holding the five notes written by #376–#380, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — two notes reach **every** signed-in role, the rest admin/management/staff or admin/management/volunteer. `major: false`, so **no admin is mailed** — verified in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) the release record, and `0.19.1`'s, which is also still owed and will be written with it; (c) the outstanding manual verification on all six PRs, which stays on their plans

**Decided in chat by Lutan, 2026-10-05: `0.19.2`, minor.** Asked before cutting.
Phone polish and tap targets reaching every role, plus one small capability —
a weekly job that links to a page can be given to the 2IC. Visible to everyone
on their phone, but not the sort of change a mail to admins would serve.

### Order on `/releases`

1. The weekly job that can go to the **2IC** (`admin, management, volunteer`)
2. The **English / Thai switch** as a full-size button on a phone, and on the sign-in screens (every role)
3. **Icon buttons** on Maintenance, Projects, Deliveries, Contacts, Vets and Enclosures (every role)
4. The **Rehome / foster** form and Medications and Diets no longer sliding sideways (`admin, management, staff`)
5. **Recurring jobs' Hand over** section no longer scrolling the page sideways (`admin, management`)

The one new capability leads; the two widest-reaching changes follow; the two
specific phone fixes close. Nothing is mailed, so this affects `/releases` only.

### What is in the release

`node scripts/release-prs.mjs e4aa06c9 4047d208` — six PRs, exit 0, seven added
migration/test-plan files accounted for: #375–#380.

### All six plans are unsigned, and one of them is the roles work

Put to Lutan before the cut; he chose to ship and record the gap, consistent
with the last six releases.

| PR | Outstanding |
|---|---|
| `icon-buttons-rest` | **Lutan to approve the look**, and run its table — the third icon-button PR in two releases |
| `sub-44px-controls` | **Lutan to look** at the signed-in header and the wizards |
| `phone-width-fixes` | a person on a real phone, and a look at the public site |
| `rota-eligibility` | the round trip in its handover table |
| `management-role` | nobody has watched the Director use these screens |
| `director-draft-roles` | the Director's look at each role on test |

The last two belong to the roles-and-permissions work, which Lutan confirmed on
2026-10-05 is **an active workstream** — so they are recorded here as work in
flight rather than raised again as a standing gap.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `4047d208` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 166s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything
- [x] Newest release version matches `package.json` — both `0.19.2`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.19.1")` returns `[]`** — the call that decides whether admins are mailed. For a minor it must return nothing
- [x] **The date was read from the local clock** — `2026-10-05`, the same day as `0.19.1`, so both join one record file
- [x] The register parses the way `deploy.mjs` loads it — `0.19.2` / `2026-10-05` / `major: false` / 5 notes, under type stripping
- [x] Order intact — `0.19.2 > 0.19.1 > 0.19.0`, file order still matching a re-sort by `compareVersions` across all 30 entries
- [x] **The cut was verified against the pre-cut register through the parsed module** — `carried across unchanged: 5 of 5`, `text lost: 0`, `text invented: 0`
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **The notes render clean** — `notes rendering badly: 0`
- [x] `node scripts/check-release-guards.mjs` — all ok, exit 0

The cut script's tally printed `string form: 5` for five objects — the same
miscount as the last three releases, harmless for the same reason: it is a log
line, and the verification pass that reads the parsed register is what the ticks
rest on.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR, **and none in the release**
- [x] `--env production --status` reviewed — `146 applied, 0 pending`, and `Against origin/main 4047d208: 146 file(s), 146 applied row(s)` with zero in each direction
- [ ] `--env production --dry-run` reviewed — n/a: nothing pending to dry-run
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this release
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the release touches pages and permissions code only
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [x] Production apply plan stated — **nothing to apply.** Worth saying explicitly rather than leaving blank: this is the first release in the sequence where the database is untouched, so the usual "apply before deploy" ordering has no content

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR; `/releases` reads the register and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input. Version ordering across 30 entries is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all five, **and no email** | not driven — register parse checked instead |
| management | `/releases` | all five | not driven |
| staff | `/releases` | three | not driven |
| vet | `/releases` | two — the language switch and the icon buttons | not driven |
| volunteer | `/releases` | three | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed; the tags are data carried across unaltered, asserted by text match in §2
- [ ] A role that should not have access is blocked server-side — n/a: no new access path in this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change in this PR
- [ ] Manual updated — n/a: the manual does not describe the register; the features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62). **Noted:** note 2 is about the English/Thai switch itself, which is the control rather than the copy
- [ ] Mobile viewport (375px) — n/a: no UI change in this PR. The release is largely *about* 375px, and that is #377's and #379's unsigned work
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
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All five were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the five-note comparison through the parsed module, the role-tag check by text, `majorReleasesSince("0.19.1")` returning `[]`, and the empty migration queue read from `--status` rather than assumed from "no schema PRs in the list"

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime
- [ ] **Boundary or banding change** — n/a: no boundary in this PR. The 44px tap-target floor in #379 is a threshold, and it is that plan's
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. `phone-width-fixes` mentions the public site, so this is worth more than a glance

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**, which has now worked three times running
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new
- [ ] **The deploy prints no release mail** — deferred: release manager. It should say `no major release new to production (was 0.19.1), so no email`, the deploy-side confirmation of §2's `majorReleasesSince` check
- [ ] **The working tree is clean before deploying** — deferred: release manager. Added because `0.19.1`'s deploy was refused for this: three untracked review spreadsheets had been left in the repo root, one of them open in Excel. `deploy.mjs` counts untracked files, correctly

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration anywhere in this release
- [ ] `--env production --dry-run` clean — n/a: nothing pending
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — §3: nothing to apply

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref e4aa06c9`; `npx wrangler rollback --env production` reverts only the Worker fallback. **This is the cleanest rollback of the sequence**: no migration shipped, so there is no schema left behind under rolled-back code, and no mail to un-send. The only asymmetry is the one inherited from `0.19.1` and earlier — the permission conversions already applied

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut script's tally still miscounts note forms, fourth release running | accepted inside the cut, as before. It is a log line; the verification pass is the evidence |
| 2 | low | Review spreadsheets left in the repo root block a production deploy, as happened to `0.19.1` | not this PR's to fix. A small PR ignoring root-level `.xlsx` and `~$` files was offered to Lutan and is not yet raised |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.19.2` title and the order of the five notes on `/releases` — no mail goes out, so this is the only place they appear | `src/lib/releases.ts`, the `0.19.2` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's

Manual verification by: pending: the `0.19.2` title and the note order on `/releases`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §3
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-05 — all six plans read; the unsigned lines were put to Lutan and he chose to ship and record the gap. The two belonging to the roles work are recorded as in flight, per his instruction of the same day
