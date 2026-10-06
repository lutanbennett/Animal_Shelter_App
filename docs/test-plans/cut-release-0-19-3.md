# Feature test plan — cut-release-0-19-3

## Header

| | |
|---|---|
| Feature | Cut release `0.19.3`, **minor**: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-19-3` @ `C:\Development\Animal_Shelter_cut-release-0-19-3` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-06 |
| Carries a migration? | no — `0147`–`0150` ship in this release and were applied to production first. See §3 |
| Tested at SHA | `4df4558e` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.19.3` entry holding the five notes written by #387, #388, #389, #391 and #393, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — three notes reach every signed-in role, two are `admin, management`. `major: false`, so **no admin is mailed** — verified in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) the release record; (c) the outstanding manual verification on **all thirteen** PRs that carry a plan, which stays on their plans

**Decided in chat by Lutan, 2026-10-06: `0.19.3`, minor.** Asked before cutting,
with the argument for a major put to him: the permission conversion finished in
this release — `0150` calls itself "R5's sixth and last conversion" — and the
spreadsheet download is a new capability admins would use. Neither is
user-visible enough to mail about, and he chose minor.

### Order on `/releases`

1. **Download spreadsheet** on the Residents list, saving the residents you are looking at (everyone)
2. A project's **Thai title**, now easy to find and hard to forget (everyone)
3. Management → Purchasing folding "needs nothing" items into one line (`admin, management`)
4. The Purchasing phone screen naming items nobody has ever counted (`admin, management`)
5. The contact map at a sensible size on a computer (everyone)

The one new capability leads. Nothing is mailed, so this affects `/releases` only.

### What is in the release

`node scripts/release-prs.mjs 843569b2 4df4558e` — fourteen PRs, exit 0,
eighteen added migration/test-plan files accounted for: #382–#395.

Two of them close items raised from this seat: **#384** is the `setup-test.sh`
sudo guard logged on the `backlog` branch after `0.15.0`'s test clone was found
root-owned, and the stale "commit the record on whatever branch is to hand" line
in `docs/release-procedure.md` was corrected by another session in `6f726b3c`.

### Every plan in the release is unsigned

Thirteen PRs carry a plan and all thirteen say `pending:`. Put to Lutan before
the cut; he chose to ship and record the gap, as for the last seven releases.
Six want him by name — `residents-spreadsheet` (open a downloaded file),
`purchasing-accordion`, `purchasing-phone-never-counted`, `quick-wins`,
`project-thai-title` and `phone-width-44px`.

Four are the permission conversions, and two — `director-draft-apply` and
`home-screen-belongs-to-a-role` — belong to the roles work Lutan confirmed on
2026-10-05 is an active workstream, so they are recorded as work in flight
rather than raised again.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `4df4558e` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 150s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything
- [x] **CI will be judged on the run's own conclusion**, via `gh run view --json`, not on the PR's mergeable status — `0.19.2`'s cut PR reported `MERGEABLE` / `CLEAN` while no workflow had run at all
- [x] Newest release version matches `package.json` — both `0.19.3`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.19.2")` returns `[]`** — the call that decides whether admins are mailed
- [x] **The date was read from the local clock** — `2026-10-06`, a new day, so this release starts its own record file
- [x] The register parses the way `deploy.mjs` loads it — `0.19.3` / `2026-10-06` / `major: false` / 5 notes, under type stripping
- [x] Order intact — `0.19.3 > 0.19.2 > 0.19.1`, file order still matching a re-sort by `compareVersions` across all 31 entries
- [x] **The cut was verified against the pre-cut register through the parsed module** — `carried across unchanged: 5 of 5`, `text lost: 0`, `text invented: 0`, forms `string,object,object,string,string` before and `string,string,object,object,string` after, which is the reorder and nothing else
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **The notes render clean** — `notes rendering badly: 0`
- [x] `node scripts/check-release-guards.mjs` — all ok, exit 0

### The cut script refused a title containing an apostrophe

The first attempt used the title *"…and a project's Thai title…"*. The cut
script builds the entry as single-quoted JavaScript, so the apostrophe closed
the string and Node refused to parse the file:

```
SyntaxError: Unexpected identifier 's'
```

**Nothing was written** — the script failed before touching `releases.ts`, and
`git status` was checked to confirm it rather than assumed. The title was
reworded to "a Thai project title" and the cut re-run.

Worth recording for the next person generating a register entry: the title is
assembled in code, not typed into the file, so an apostrophe in it is a syntax
error rather than a quoting nuisance. A failure here is loud and harmless; the
dangerous version would be a script that silently dropped the character.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `--env production --status` reviewed — four pending: `0147`–`0150`
- [x] `--env production --dry-run` reviewed — **all four `… ok`**. No chained-dependency failure this time, unlike `0.18.0`'s `0136`; these four do not build on one another
- [x] Applied to **dev** and recorded in `schema_migrations` — by #385, #386, #390 and #394 before this release
- [x] File is re-runnable — read rather than assumed
- [x] Existing rows still read correctly after the change — the four convert RLS policies to `has_permission(…)`; no row is rewritten
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in the schema PRs
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — **already executed.** All four carry `-- consumer: none`, and `0150`'s body says so explicitly: *"No app code reads anything new, so nothing is ordered against a deploy."* Two independent statements agreeing, which is why the ordering claim is believable here rather than merely asserted

`--drift` afterwards, both databases: `No drift: production matches origin/main`
and `No drift: test matches origin/main`, zero in each direction.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR; `/releases` reads the register and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input. The nearest thing is §2's apostrophe, where the generator refused outright
- [ ] Boundary cases checked — n/a: no input. Version ordering across 31 entries is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all five, **and no email** | not driven — register parse checked instead |
| management | `/releases` | all five | not driven |
| staff | `/releases` | three | not driven |
| vet | `/releases` | three | not driven |
| volunteer | `/releases` | three | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed; the tags are data carried across unaltered, asserted by text match in §2
- [ ] A role that should not have access is blocked server-side — n/a: no new access path **in this PR**. The release as a whole finishes converting RLS policies, and that is the four `perm-convert-*` plans' unsigned work

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change in this PR
- [ ] Manual updated — n/a: the manual does not describe the register; the features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62). **Noted:** note 2 is about a project's Thai title, which is content the translation path handles, not the note
- [ ] Mobile viewport (375px) — n/a: no UI change in this PR
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and the Worker's `/api/releases/current` with the new register
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, the Worker and `deploy.mjs`; the third was exercised directly by loading the register under type stripping
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item. Two items raised from this seat were closed elsewhere in this release and are noted in §1
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one choice here, the note order, is recorded in §1
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All five were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the five-note comparison through the parsed module, the role-tag check by text, `majorReleasesSince("0.19.2")` returning `[]`, the four dry-runs read individually rather than as a batch, and the "nothing is ordered against a deploy" claim corroborated by both the headers and `0150`'s body

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime
- [ ] **Boundary or banding change** — n/a: no boundary in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] **The working tree is clean before deploying** — deferred: release manager. `0.19.1`'s deploy was refused for untracked review spreadsheets in the repo root, and the `.xlsx` gitignore follow-up has still not been raised
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**; the log is UTF-16, so `tr -d '\000'` before grepping
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new
- [ ] **The deploy prints no release mail** — deferred: release manager. It should say `no major release new to production (was 0.19.2), so no email`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form, and **n/a for the release too**: all four migrations are `consumer: none` and say nothing is ordered against the deploy. They were still applied first, because the deploy guard requires the database to hold every migration on `main`
- [x] `--env production --dry-run` run and clean — all four `… ok`
- [ ] For a **destructive or rewriting** migration only — n/a: policy conversions, no data rewritten
- [x] Apply plan stated — §3; already executed

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref 843569b2`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0147`–`0150`**, and this is the widest policy change yet left behind by a rollback: the conversion is now complete across people, stock, work and settings, so rolled-back code would run against fully converted RLS. The conversions are described as behaviour-preserving, which is the claim a rollback would test. Nothing to un-send: a minor mails nobody

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut script cannot take a title containing an apostrophe — it builds the entry as single-quoted JavaScript | accepted and worked around by rewording. Loud and harmless, and §2 records it so the next person does not debug it twice |
| 2 | low | The cut script's note-form tally is still wrong, fifth release running | accepted, as before: it is a log line, and the verification pass is the evidence |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.19.3` title and the order of the five notes on `/releases` — no mail goes out, so this is the only place they appear | `src/lib/releases.ts`, the `0.19.3` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's

Manual verification by: pending: the `0.19.3` title and the note order on `/releases`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §3
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-06 — all thirteen plans read; every one is unsigned and Lutan chose to ship and record the gap, with the six that want him by name listed in §1
