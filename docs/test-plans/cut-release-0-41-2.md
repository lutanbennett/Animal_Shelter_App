# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.41.2`: move `unreleased` into a new entry, add the two notes whose outstanding step this release closes, empty `unreleased`, bump `package.json`. `minor` — **no mail** |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-41-2` @ `C:\Development\Animal_Shelter_cut-release-0-41-2` |
| Dev server | not started — n/a: the cut changes two data files, `src/lib/releases.ts` and `package.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-02 |
| Carries a migration? | no — `0298`–`0301` came in with #1184, #1194 and #1204 and are applied from the main checkout at step 5 |
| Tested at SHA | `7b1908f9` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — eight notes sit in a new `0.41.2` entry dated 2026-11-02, `major: false`, and `package.json` follows
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, this plan. Nothing else
- [x] Roles affected identified — **by card, not by role**: none. A release note is shown to whoever holds one of its `cards` tags and always to Admin; an untagged note is everyone's. No permission, card, cell or control changed by this PR
- [x] Anything explicitly **out of scope** written down — the four production migrations, both Worker deploys, both Pi builds, the cache purge and the verification, all of which follow this PR's merge; and the 16 plans signed `pending:`, which belong to their own plans and are **not** copied into this one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was cut from a freshly fetched `origin/main` (`13905a09`) minutes before, so there was nothing to merge in. Recorded rather than ticked silently
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`, read from each gate's own exit code. Output pasted under **Evidence**
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

```
=== gates: build exited 0 after 120s

gates: typecheck=0 lint=0 test=0 build=0
```

**The four exit codes are read from `gates.mjs`'s own closing line, not from the command's status.**
This run was invoked as `node scripts/gates.mjs | tail -15`, so each gate's own
`exited 0 after` line for `typecheck`, `lint` and `test` scrolled out of the window and only `build`'s
survived — and the reported process exit was `tail`'s, which the runbook names as a trap in its own
right. The closing line carries all four numbers and is the script's own output, which is why it is the
line quoted. Stated rather than quietly presenting four timings that were not captured.

**The 120s build is a cold Turbopack cache**, not a gate that skipped: this worktree was created
minutes earlier by `worktree.mjs new`, so nothing was warm. The runbook's trap reads the other way —
a *fast* pass is contention or a warm cache until proven otherwise — and the check either way is each
gate's own exit code, which is what was read.

`node scripts/check-release-guards.mjs` **exit 0**, all 16 assertions ok, including `--force without a
reason is refused` and `--drift reads the arrays it prints from driftReport()`.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.41.2 2026-11-02 minor --verify --base <base file>` — **all 16 assertions
passed**, unedited:

```
ok   new entry is the newest and has the requested version  [0.41.2]
ok   new entry has the requested date  [2026-11-02]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.41.1 -> 0.41.2]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [8 vs 8]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.41.2]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.41.0 in ["0.41.0"]]

all 16 assertions passed
```

**Why `--base` points at a file rather than `origin/main`, and why that is not a weakened check.** Two
of the eight notes are **added in this PR**, so against `origin/main` the verifier would correctly report
them as invented and refuse. The base passed instead is `origin/main:src/lib/releases.ts` **with those two
notes inserted at the end of `unreleased` and nothing else touched** — so "every note carried across
character-identical" and "nothing invented" remain real assertions about the other six and about the two
new ones' text, rather than a comparison against the cut's own output. The runbook names this as expected
on a release that publishes a deferred note, and says to expect it again while the security rebuild runs.

**The mail check is the absence-plus-presence pair** the runbook requires: an always-empty
`majorReleasesSince()` would satisfy the absence alone, so the control asserts it still finds `0.41.0`
when asked from further back. Both printed.

### The two notes added in this cut, and why they belong here

`docs/decisions/2026-10-11-release-note-truth-rule.md`: a note goes in the PR that **closes** the
outstanding step it was waiting on. `node scripts/check-deferred-notes.mjs` listed 43 candidates over its
window and the full review was passed to `--deferred-reviewed`; two of them are closed by this release.

- **The desexing sign-up.** `docs/test-plans/desexing-anon-id.md` wrote `n/a: production is behind on 0292
  and 0297, so a note would promise something not live`. Production now reads `0297` as its latest applied
  file and `0292` went on in `0.41.0`, and **this release carries #1177's code**, so the public form is on
  `WRAPPED_WRITE_PATHS` for the first time. That is user-visible twice over: the save survives the Pi being
  off, and a replay is a quiet success instead of a false "full" or "rate limited" to a member of the
  public who had in fact signed up (`docs/decisions/2026-11-01-desexing-anon-id.md`). `0.41.1`'s own note
  named this screen as one of three deliberately held back, so the new note says two are left.
- **The "See the Thai queue" card.** `docs/test-plans/translations-view-card.md` wrote `n/a: 0298 is not
  yet on production, so a note would promise users a card that cannot be given out`. **`0298` is applied in
  this release at step 5**, so the card can be given out for the first time. Tagged
  `cards: ["who_does_what"]`, because the person who would act on it is the one handing out cards.

**Neither note is ticked on the §7 release-notes line below**, and that is correct rather than an
oversight: the checker holds that line to the diff, and a cut **empties** `unreleased`.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration
- [ ] `--status` reviewed before applying — n/a: this PR carries no migration. Done for the release at step 5 (production: 298 applied, 4 pending — `0298`, `0299`, `0300`, `0301`)
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration. Done for the release: all four **ok, exit 0**, with fourteen `-- consumer:` warnings, every one of them expected because this release carries the readers
- [ ] Applied to **dev** — n/a: all four were applied to dev by their own streams; dev reads 0 pending
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR. `0299`'s own plan records a `begin; … rollback;` harness on dev, `HARNESS-OK 0299 H1-H8`
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: this PR carries no migration. The release's plan is `0298`, `0299`, `0300` and `0301` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before either deploy**, because this release carries the code that reads all four

## 4. Functional checks

- [x] Happy path works end to end — the data the `/releases` page reads is asserted by the 16 checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `npm run build` compiled `/releases` with the new entry in place
- [x] Data persists — n/a as written; the equivalent here is that the entry is in the committed file and `latestRelease` resolves to it, both asserted above
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut [0]`, which **is** the empty state and is the state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real rather than described: `cut-release.mjs` **refused to write** at the deferred-notes guard until a review of all 43 candidates was supplied, and an earlier edit attempt failed its own anchor check rather than writing a half-change
- [x] Boundary cases checked — the version boundary, both directions: `0.41.1 -> 0.41.2` is newer, the file order still matches `compareVersions`, and the mail window is checked from both the previous version (empty) and from further back (finds `0.41.0`)
- [ ] `/releases` driven in a real browser — n/a: not driven. The runbook's cut check is the mechanical comparison above, which covers the one real failure mode (a note lost, altered or invented) and asserts no `[object Object]` or `undefined`; six of the eight notes' wording was written and reviewed in the PR that added it, and the other two are listed below for a wording glance. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

**Not run, and deliberately.** No permission, card, cell or control changed by this PR. Reported by card
rather than by role, as `CLAUDE.md` requires.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all 8 notes, as Admin sees every card-tagged note | n/a: no gate changed |
| management | `/releases` | untagged notes, plus any whose card it holds | n/a: no gate changed |
| doctor | `/releases` | untagged notes only | n/a: no gate changed |
| volunteer | `/releases` | untagged notes only | n/a: no gate changed |
| signed out | — | gate page; `PUBLIC_SITE` is `locked` | n/a: no public surface touched |

- [ ] Every role above tested — n/a: no activity, card or control changed. **Worth saying plainly, as transient context rather than a measurement:** the three `cards: ["who_does_what"]` notes reach whoever holds that card today, and the five untagged notes reach everyone. Nothing in this release's eight notes is tagged with a card that nobody holds
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
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `13905a09`

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item
- [x] Non-obvious design choices recorded — the deferred-note reasoning is in this plan and in the commit message; the release's own paper is `docs/releases/2026-11-02-0-41-2.md`, which follows in its own PR after the deploy
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. The eight notes this release publishes are the point of the PR, and two of them were added here on purpose because this release closes the steps they were waiting on
- [x] Commit messages say why, not just what — the commit explains the `minor` answer, the absence-plus-presence mail pair, and why the two notes belong in this PR rather than in the ones that wrote the code
- [x] **Claims were measured, not reasoned** — every figure in this plan is pasted from a run: the 16 cut assertions, the four gate exit codes, the guards run, production's `--status` and `--dry-run`, and `check-production.mjs`'s own output for the card checks

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of this branch — `7b1908f9`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's **merge commit**, not `7b1908f9`, and the record states both
- [ ] Deployed to test — deferred: this session
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the release entry's own `2026-11-02`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change. The version and mail-window boundaries are asserted in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gate lines, the 16 assertions and the guards run are copied from the runs
- [ ] Public pages re-checked after a cache purge — deferred: this session, after both Pi builds. `PUBLIC_SITE` is `locked`, so the only page an anonymous visitor reaches is the gate — **with one exception that matters this release**: `/services/desexing` is a public form, and its new behaviour is in a note
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: this session, from Lutan's deploy log
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session
- [x] Any new secret/env var exists in the production Cloudflare environment — none added or removed by this PR or by any PR in the release range
- [ ] Both a migration and code that reads it — n/a: this PR carries no migration. **The release does, all four of them**, and the ordering is stated: `0298`–`0301` are applied before either deploy
- [x] `--env production --dry-run` clean — already run for the release before this plan was written: all four **ok, exit 0**, output in section 3
- [ ] Backup fresh for a destructive migration — n/a: all four are additive or `or replace`. `0301` retires two activities from the catalogue, which removes rows from `card_grants`/`role_permissions` for access no card granted — `activities-grantable` read on production shows `audit.view` and `audit.undo` as Admin-only already, so no holder loses anything
- [x] Rollback position stated, including what it does not cover — `./scripts/pi/deploy-pi.sh --ref 97441fb7` on both Pi clones returns users to `0.41.1`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0298`–`0301`**, and nothing needs them to: `0298` adds a card nobody holds, `0299`/`0300` add a link table and tighten its owner check, and `0301` removes two activities that only Admin could ever reach. The `0.41.1` build does not read any of them

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | `cut-release.mjs` refused to write until all 43 deferred-note candidates were reviewed | **Not a defect — the guard working.** The review is in the commit message and in section 2 |
| 2 | none | Dev's `schema_migrations` holds a stale row for `0302_retire_audit_activities.sql`, the name the file had before #1204 renumbered it to `0301` | **Not a defect, and not production's problem.** Dev holds both rows and reads 0 pending; production will apply `0301`. Recorded so the next release manager does not read it as drift |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The two notes written by this session read well to you — the desexing one and the "See the Thai queue" one. The other six were written by the streams that did the work | `/releases`, signed in, after the deploy |
| 2 | The desexing sign-up form itself, since its note is the only one in this release that promises something to a member of the public | `lannacare.org/services/desexing`, after the deploy |

Everything else a person would look at in this release belongs to the 16 plans signed `pending:`, which
are **not** copied here: they have their own plans and their own signatures, and the release record
groups them by what each is waiting on.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: both items are post-deploy glances, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the eight notes on `/releases` after the deploy, in particular the two written by this session, and the desexing form

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-02
