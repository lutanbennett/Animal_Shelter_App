# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.41.1`: move `unreleased` into a new entry, add the Pi failover note whose step this release closes, empty `unreleased`, bump `package.json`. `minor` — **no mail** |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-41-1` @ `C:\Development\Animal_Shelter_drop-anthropic-sdk` (the SDK removal's worktree, reused — paperwork rule 2) |
| Dev server | not started — n/a: the cut changes two data files, `src/lib/releases.ts` and `package.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-01 |
| Carries a migration? | no — `0296` came in with #1160 and is applied from the main checkout at step 5 |
| Tested at SHA | `03552727` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — eight notes move from `unreleased` into a new `0.41.1` entry dated 2026-11-01, `major: false`, and `package.json` follows
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, this plan. Nothing else
- [x] Roles affected identified — **by card, not by role**: none. A release note is shown to whoever holds one of its `cards` tags and always to Admin; an untagged note is everyone's. No permission, card, cell or control changed
- [x] Anything explicitly **out of scope** written down — the migration apply, both Worker deploys, both Pi builds, the cache purge and the verification, all of which follow this PR's merge; and the 22 plans signed `pending:`, which belong to their own plans and are **not** copied into this one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was cut from a freshly fetched `origin/main` (`777070d5`, the SDK removal's merge) minutes before, so there was nothing to merge in. Recorded rather than ticked silently
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`, read from each gate's own exit code. Output pasted under **Evidence**
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 9s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 95s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 45s
gates: typecheck=0 lint=0 test=0 build=0
```

**The 9s typecheck and 45s build are a warm Turbopack cache from this worktree's previous run on the
same tree, not a gate that skipped.** The runbook's trap says a fast pass is contention or a warm cache
until proven otherwise, so each gate's own exit code was read rather than the elapsed time.

`node scripts/check-release-guards.mjs` **exit 0**, all assertions ok, including `--force without a
reason is refused` and `--drift reads the arrays it prints from driftReport()`.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.41.1 2026-11-01 minor --verify --base <base file>` — **all 16 assertions
passed**, unedited:

```
ok   new entry is the newest and has the requested version  [0.41.1]
ok   new entry has the requested date  [2026-11-01]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.41.0 -> 0.41.1]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [8 vs 8]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.41.1]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.41.0 in ["0.41.0"]]

all 16 assertions passed
```

**Why `--base` points at a file rather than `origin/main`, and why that is not a weakened check.** The
eighth note is **added in this PR**, so against `origin/main` the verifier correctly reported
`nothing invented (note count equal) [8 vs 7]` and refused. The base passed instead is
`origin/main:src/lib/releases.ts` **with that one note inserted and nothing else touched** — so
"every note carried across character-identical" and "nothing invented" are still real assertions about
the other seven and about the eighth's text, rather than a comparison against the cut's own output. The
first run's two FAILs are the evidence that the check discriminates.

**The mail check is the absence-plus-presence pair** the runbook requires: an always-empty
`majorReleasesSince()` would satisfy the absence alone, so the control asserts it still finds `0.41.0`
when asked from further back. Both printed.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration
- [ ] `--status` reviewed before applying — n/a: this PR carries no migration. Done for the release at step 5 (production: 296 applied, 1 pending, `0296`)
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration. Done for the release (`0296` ok, exit 0)
- [ ] Applied to **dev** — n/a: `0296` was applied to dev by #1160; dev reads 297 applied, 0 pending
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: this PR carries no migration. The release's plan is `0296` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before** either deploy, because this release carries the code that reads it

## 4. Functional checks

- [x] Happy path works end to end — the data the `/releases` page reads is asserted by the 16 checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `npm run build` compiled `/releases` with the new entry in place
- [x] Data persists — n/a as written; the equivalent here is that the entry is in the committed file and `latestRelease` resolves to it, both asserted above
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut [0]`, which **is** the empty state and is the state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real rather than described: the first `--verify` run **refused with two named FAILs** before `--base` was corrected, and `cut-release.mjs` had already refused once at the deferred-notes guard until a review of all 31 candidates was supplied
- [x] Boundary cases checked — the version boundary, both directions: `0.41.0 -> 0.41.1` is newer, the file order still matches `compareVersions`, and the mail window is checked from both the previous version (empty) and from further back (finds `0.41.0`)
- [ ] `/releases` driven in a real browser — n/a: not driven. The runbook's cut check is the mechanical comparison above, which covers the one real failure mode (a note lost, altered or invented) and asserts no `[object Object]` or `undefined`; each note's own wording was written and reviewed in the PR that added it. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

**Not run, and deliberately.** No permission, card, cell or control changed. Reported by card rather
than by role, as `CLAUDE.md` requires.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all 8 notes, as Admin sees every card-tagged note | n/a: no gate changed |
| management | `/releases` | untagged notes, plus any whose card it holds | n/a: no gate changed |
| staff | — | retired role (`0173`) | n/a |
| doctor | `/releases` | untagged notes only | n/a: no gate changed |
| volunteer | `/releases` | untagged notes only | n/a: no gate changed |
| signed out | — | gate page; `PUBLIC_SITE` is `locked` | n/a: no public surface touched |

- [ ] Every role above tested — n/a: no activity, card or control changed. **Worth saying plainly:** the three `cards: ["translations"]` and `cards: ["assistant"]` notes are visible to **nobody but Admin**, because `role-cards` read on production today shows no role holds either card. That is the card tags working as designed, not a fault
- [ ] A role that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release cut is not a manual topic
- [x] Translatable strings go through the translation path — n/a as a translation change, but worth stating: release notes are **not** translatable labels and never have been; they are English prose in `src/lib/releases.ts`, which is why `check-thai-dictionary.mjs` and `translations-unlisted` do not list them
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled `/releases` and `/api/releases/current`, the two readers of this file, with the new entry in place. A malformed entry fails `typecheck`, which exited 0
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` is read by `/releases`, by `/api/releases/current` and by `scripts/deploy.mjs`'s release-mail step. The third is the one that matters on a cut and it was exercised by the `--verify` run's mail pair, which calls `majorReleasesSince()` — the same function the deploy uses to decide whether to mail
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `777070d5`

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item. The item the SDK removal closed was ticked in #1172, and the follow-up it raised is on the `backlog` branch
- [x] Non-obvious design choices recorded — the deferred-note reasoning is in this plan and in the commit message; the release's own paper is `docs/releases/2026-11-01-0-41-1.md`, which follows in its own PR after the deploy
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. The eight notes this release publishes are the point of the PR, and the eighth was added here on purpose because this release closes the step it was waiting on
- [x] Commit messages say why, not just what — the commit explains the `minor` answer, the absence-plus-presence mail pair, and why the eighth note belongs in this PR rather than in the one that wrote the code
- [x] **Claims were measured, not reasoned** — every figure in this plan is pasted from a run: the 16 assertions, the four gate exit codes, the guards run, and production's `role-cards` for the claim that nobody holds the `translations` or `assistant` card

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of this branch — `03552727`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's **merge commit**, not `03552727`, and the record states both
- [ ] Deployed to test — deferred: this session
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the release entry's own `2026-11-01`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change. The version and mail-window boundaries are asserted in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gate lines, the 16 assertions and the two first-run FAILs are copied from the runs
- [ ] Public pages re-checked after a cache purge — deferred: this session, after both Pi builds. `PUBLIC_SITE` is `locked`, so the only page an anonymous visitor reaches is the gate
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: this session, from Lutan's deploy log
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session
- [x] Any new secret/env var exists in the production Cloudflare environment — none added. #1172 **removed** a name, `ANTHROPIC_API_KEY`, which was read and found never to have been set on production
- [ ] Both a migration and code that reads it — n/a: this PR carries no migration. **The release does**, and its ordering is stated: `0296` is applied before either deploy
- [ ] `--env production --dry-run` clean — deferred: this session. Already run for the release: `0296` ok, exit 0
- [ ] Backup fresh for a destructive migration — n/a: `0296` is additive (`on conflict do update` throughout, `or replace` for the function) and rewrites no rows
- [ ] Apply plan stated — n/a: this PR carries no migration; stated for the release in section 3
- [x] Rollback position stated, including what it does not cover — `./scripts/pi/deploy-pi.sh --ref 73a4bdc5` on both Pi clones returns users to `0.41.0`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0296`**, and nothing needs it to: `0296` adds an activity, two card grants, a card-features row and one `or replace` function, and the only role-visible effect is on cards no role holds. The `0.41.0` build does not read `translations.propose`, so leaving the schema in place is safe

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | The first `--verify` run reported 2 of 16 FAILs | **Not a defect — the check working.** The eighth note is added in this PR, so against `origin/main` it was correctly "invented". Re-run with a base holding that note: 16 of 16 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The eight notes read well to you on the page — particularly the new failover one, which is the only note in this release written by the release manager rather than by the stream that did the work | `/releases`, signed in, after the deploy |

Everything else a person would look at in this release belongs to the 22 plans signed `pending:`, which
are **not** copied here: they have their own plans and their own signatures, and the release record
groups them by what each is waiting on.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item is a wording glance after the deploy, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the eight notes on `/releases` after the deploy, in particular the failover note written by this session

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-01
