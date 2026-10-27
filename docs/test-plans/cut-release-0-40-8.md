# Feature test plan — cut release `0.40.8`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.8` — move the two `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-8` @ `C:\Development\Animal_Shelter_cut-release-0-40-8` — a fresh worktree. Reason recorded rather than assumed: the ten leftovers on the board are merged batch-1/2/3 folders whose sessions may still hold them, and `worktree.mjs new` was run from the main checkout at `main` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` — **not started; this PR has no runtime surface** |
| PR | #1007 |
| Tested by / date | Claude Opus 5 (Daily Planner session, acting as release manager) / 2026-10-27 |
| Carries a migration? | **no** — this PR is `src/lib/releases.ts` and `package.json` only. The release it cuts carries **none**: `0270`–`0274` are already applied to production (274 applied, 0 pending, read 2026-10-27) |
| Tested at SHA | `d7b1c6e1`, the cut commit on this branch, whose parent is `origin/main` at the cut |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two `ReleaseNote`s move from `unreleased` into a new `0.40.8` entry dated 2026-10-27 with `major: false`, and `package.json`'s version follows it
- [x] Files/areas touched listed — `src/lib/releases.ts` and `package.json` (one line). No route, no component, no `worker/`, no migration. `git diff --stat HEAD~1 HEAD` reads exactly **two files, 11 insertions, 3 deletions**
- [x] Roles affected identified — **both** notes are tagged by **card** (`donations_receipts`, `website_photos`), so each is shown to whoever holds that card, and always to Admin, which sits outside the card system. Neither uses the older `roles:` form, which is closed to new notes because a role read by name breaks the moment a shelter renames it (`CLAUDE.md`, "No code may fall back to a role BY NAME"). **Nobody's access changes in this PR**
- [x] Anything explicitly **out of scope** written down — **`major: false` is the whole of the mail decision** and is asserted in both directions in section 2. The deploy this cut unblocks is **not** in scope here: it is Lutan's, by his instruction of 2026-10-02, and its own evidence is section 8. The dependency bump that fix depends on shipped separately as #1005

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` minutes before the cut, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed — **four gates, all four numbers read.** Unedited, exactly as captured:

```
=== gates: build exited 0 after 320s

gates: typecheck=0 lint=0 test=0 build=0

[exited with code 0]
```

  **Said plainly rather than implied: the three per-stage lines above `build` are not shown because
  the command was backgrounded through `tail -8`, which truncated them.** What is pasted is the real,
  unedited tail, and the closing summary line carries all four exit codes — which is the assertion
  this box makes. The run's own exit code was **0**.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs` — exit **0**, all 16 assertions ok, including `a cut release with nothing unreleased passes` and `unreleased notes are a problem`. **The exit code was read from the command itself (`GUARDS_EXIT: 0`), not through the pipe** — the trap this runbook names
- [x] **The cut was verified mechanically rather than read over**, which is the one failure mode a cut has and which no gate can see. Unedited output of `node scripts/cut-release.mjs 0.40.8 2026-10-27 minor --verify`:

```
ok   new entry is the newest and has the requested version  [0.40.8]
ok   new entry has the requested date  [2026-10-27]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.7 -> 0.40.8]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.8]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]

all 16 assertions passed
```

  **The mail assertion is the one that matters and it is asserted in both directions**: absence for
  this cut, and a control proving the check is not vacuous by still finding `0.40.0` from further
  back. A green absence check with no control would pass even if the function were broken.

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration in this PR, and the release it cuts carries none — `0270`–`0274` were applied to production earlier on 2026-10-27 (`apply-migrations.mjs --status --env production`: 274 applied, 0 pending, nothing on `main` unapplied)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime surface. The only consumers are `latestRelease` and `majorReleasesSince()`, both asserted in section 2
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete all exercised — n/a: no write path
- [ ] Empty state renders sensibly — n/a: no UI in this PR. `unreleased` being empty **is** the intended end state and is asserted
- [ ] Invalid input is rejected with a readable message — n/a: no user input. The script's own refusals are covered by `check-release-guards.mjs`, including `--force without a reason is refused`
- [ ] Boundary cases checked — n/a: no user input. Version ordering is asserted (`releases are in compareVersions order, newest first`)

### Role access matrix

- [ ] Every role above tested — n/a: this PR changes no access. Both notes are card-tagged, so who sees each line follows the cards; **no role is named anywhere in the diff**
- [ ] A role that should not have access is blocked server-side — n/a: no route added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: a release cut adds no feature to document
- [ ] Translatable strings go through the translation path — n/a: release notes are not translatable strings; they are data in `releases.ts`
- [ ] Mobile viewport (375px) — n/a: no UI in this PR
- [ ] Browser console clean — n/a: no UI in this PR
- [ ] Network clean — n/a: no UI in this PR

## 6. Regression

- [x] The pages nearest the change still work — **asserted rather than browsed**: `every earlier entry present and unchanged` and `latestRelease is the new entry` cover what `/releases` and the release mail read. The build gate compiled every page that imports `releases.ts`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `src/lib/releases.ts` is shared, and the honest statement is that it was **not** loaded from a page. The reason it is `n/a` rather than `pending`: its two consumers are both asserted directly in section 2, which is stronger than loading one page, and this PR adds no new field or shape for a consumer to misread
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` minutes earlier

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut has no backlog item (`docs/release-procedure.md` step 4)
- [ ] Non-obvious design choices added to `docs/decisions/` — n/a: nothing non-obvious was decided here. The one judgement, minor versus major, is **Lutan's** and is recorded on this plan and in the commit message
- [x] `README.md` still accurate — unchanged by this PR
- [ ] **Release notes.** — n/a: this PR *is* the release note mechanism. It moves existing notes rather than adding one, and `unreleased` is deliberately empty afterwards — which `cut-release.mjs --verify` asserts. Adding a line here would be inventing a note the checker would then flag as not carried across
- [x] Commit messages say why, not just what — the cut commit says why it exists now: `deploy.mjs` refuses while `unreleased` has lines, and that deploy carries the cron fix
- [x] **Claims in commit messages were measured, not reasoned** — the cron diagnosis quoted in the PR body was verified by reading `942ea49f` (`next` 16.3.8 → 16.4.2, dated 2026-10-23) rather than inferred, and the trigger-was-firing claim comes from the heartbeat #999 added, not from argument

## 8. Pre-production gate

`test.lannacare.org` runs the **dev** database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [x] Tested SHA recorded in the header — `d7b1c6e1`, this branch's cut commit
- [ ] Deployed SHA matches the tested SHA — deferred: Lutan (the production deploy is his). `deploy.mjs` prints the target project and the short SHA; that line is to be read, not assumed

### On the deployed build

- [ ] Deployed to test — deferred: Lutan. The production Worker deploy is his by his instruction of 2026-10-02
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan (needs his deploy first)
- [ ] Timezone-sensitive behaviour proved — n/a: this PR adds no date logic. The entry's `date` is a literal string asserted to equal `2026-10-27`
- [ ] Boundary or banding change — n/a: no threshold, band or cutoff in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — both blocks in section 2 are verbatim, and the one place the capture was incomplete is stated in that section rather than tidied over
- [ ] Public pages re-checked after a cache purge — deferred: Lutan (needs his deploy first)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: Lutan. The planner reads the line back after his deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: Lutan (read from his deploy output)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none

### Migration ordering — *skip if no migration*

- [ ] n/a: no migration in this PR or in the release it cuts

## Left for manual verification

| what | who | why it could not be signed here |
|---|---|---|
| The production Worker deploy, and that `deploy.mjs` names the production project and the tested SHA | **Lutan** | The production Worker deploy is his, by his instruction of 2026-10-02. Never Claude's |
| That the 15-minute cron resumes — `check-production.mjs calendar-cron` reads `healthy` | **Planner, after his deploy** | Needs the deployed build. The first run comes on the quarter hour, so a gap of a few minutes after the deploy is not a failure |
| That the six waiting vet visits clear and the status-alert mail resumes | **Planner, after the cron runs** | Downstream of the cron. To be checked, not assumed |

## Result

Result: pass

Everything this PR can be judged on is green: 16/16 cut assertions including the mail absence and
its control, 16/16 release guards at exit 0, and four gates at zero. What is outstanding is not a
defect in this change — it is the deploy, which is Lutan's by standing instruction, and the
observations that can only be made on the deployed build. Those are in the table above with a named
owner rather than ticked.

Automated checks by: Claude Opus 5  Date: 2026-10-27
Manual verification by: pending: Lutan's production deploy, then the planner reads `calendar-cron` back
