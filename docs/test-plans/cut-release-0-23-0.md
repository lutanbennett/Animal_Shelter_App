# Feature test plan — cut-release-0-23-0

## Header

| | |
|---|---|
| Feature | Cut release `0.23.0`, **major**: move the eleven `unreleased` notes into a new register entry, order them for the admin mail, and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-23-0` @ `C:\Development\Animal_Shelter_cut-release-0-23-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-09 |
| Carries a migration? | no — but **seven** migrations ship in this release and are all still pending on production. See §3 |
| Tested at SHA | `7c980390` (`main` tip at the cut, confirmed against `origin/main`) plus this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.23.0` entry holding the eleven notes written by the release's PRs, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all eleven notes are untagged, so every signed-in role sees every one of them.** `major: true`, so **every admin is mailed**, which §2 asserts rather than assumes
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's one job; (b) the release record, its own PR after the deploy; (c) the fifteen unsigned feature plans, which keep their own `pending:` signatures and are not copied here; (d) PR #490's planner handover, merged before the cut and inside the range, but with nothing a shelter user sees

**Decided in chat by Lutan, 2026-10-09: `0.23.0`, major.** Asked before cutting
with the argument for each side put to him, as §4 of the runbook requires, and in
one round together with the silent-failure question, the unsigned plans and
whether to wait for PR #490.

The case for major, which he took: **three roles gain whole sections they never
had, and a menu entry is renamed.** Management → Donations issues receipts,
Management → Translations is new, Operations → Outreach visits is new, and the
menu's "Shelter Operations" is now "Operations" — so someone who knows where the
daily work lives will go looking for it under the old name. The case against,
which he heard: nothing is removed and every old link still opens. Same shape as
`0.21.0` and `0.22.0`.

**Risk in this PR is confined to losing or altering a note**, which no gate reads,
hence the mechanical comparison in §2 rather than reading the entry over.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: nothing to merge. The worktree was created from `origin/main` minutes earlier and `git merge-base HEAD origin/main` returned `7c980390`, equal to both. Confirmed against the remote rather than a local ref read earlier, which is `0.22.0`'s defect 3
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed:

```
=== gates: build exited 0 after 205s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — all seven green on PR #491 at `ab55f85f`: `check` 1m53s, `public-views` 1m28s, `test-plan`, `audit`, `migration-numbers`, `new-policy-role-names`, `script-integrity`. Ticked after reading the run, not before it
- [x] `node scripts/check-release-guards.mjs` — exit 0, all fifteen cases, including "a cut release with nothing unreleased passes" and "unreleased notes are a problem"

**The cut was verified mechanically, not read over**, as the runbook requires.
Sixteen assertions from one script that exits non-zero on any failure, comparing
the new entry against `origin/main:src/lib/releases.ts` note by note. Its actual
output, unedited:

```
ok    new entry is first  — version=0.23.0
ok    date is today  — 2026-10-09
ok    major is true  — true
ok    title is a non-empty string  — Donation receipts, one place to translate everything, and outreach visits recorded on a phone
ok    unreleased is now empty  — len=0
ok    note count matches what unreleased held  — 11 of 11
ok    carried across unchanged  — carried 11 of 11, lost 0, invented 0, repeated 0
ok    order is the intended permutation  — got [3,4,0,7,6,8,9,1,10,5,2], intended [3,4,0,7,6,8,9,1,10,5,2]
ok    role tags changed: 0  — 0 changed
ok    previous entries byte-identical  — 35 entries, 0 changed
ok    package.json equals newest entry  — 0.23.0 vs 0.23.0
ok    latestRelease is the new entry  — 0.23.0
ok    file order matches compareVersions
ok    majorReleasesSince("0.22.0") is exactly the new version  — [0.23.0]
ok    every note renders as text  — 0 bad
ok    no note is an empty or placeholder line

ALL ASSERTIONS PASSED
```

Lines were **moved, never retyped** — the script lifts each note's own source
line and re-indents it, so the text cannot drift. The order was changed at the
cut, as `0.22.0`'s was, because the notes left `unreleased` in whatever order
their PRs happened to add them, which put a privacy narrowing and a Thai PDF fix
above the three new sections. A major release is mailed, so the entry is also
what every admin reads first.

**No note was given a role tag.** Three were candidates — the donation receipts
(Admin and Management), the carer phone-number change (staff and Management) and
the recurring-job titles (Management) — and all three were deliberately left
untagged, on `0.22.0`'s reasoning: an untagged line is never filtered out, a
wrong tag hides a line from the people it is for, and a tag invented at the cut
is a change to a note its own PR did not write.

## 3. Schema and data

This PR carries no migration, so every line below is `n/a`. The section is kept
rather than skipped because **seven migrations ship in this release**, and where
they are applied is this plan's business even though none of them is in this diff.

- [ ] Migration number is one above the highest on `main` — n/a: this PR adds no migration. The seven in the release are `0165` to `0171`, each numbered by its own PR, and `0171` is the highest on `main`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing in this PR to apply. The production status, dry run and apply are release steps, recorded in §8 and in the release record
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: as the line above
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration here. Dev already holds all seven, applied by their own branches under the schema-first rule
- [ ] File is re-runnable — n/a: no file in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR changes no data and no schema; it edits two source files
- [ ] Constraints and defaults exercised against real rows — n/a: no constraints or defaults in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. The revert for this PR is a git revert of two files
- [x] Production apply plan stated for the release manager — **stated here**: `0165` to `0171` in one run of `node scripts/apply-migrations.mjs --env production`, from the main checkout, **after** this cut is merged and pulled and **before** either deploy, per `0.20.0`'s correction (merge, pull, apply, deploy). `0170` narrows read policies that live code reads, so the ordering is not cosmetic — see §8 and **Defects**

## 4. Functional checks

- [x] Happy path works end to end — the register is data read by `/releases` and by `worker/release-mail.mjs`; `majorReleasesSince("0.22.0")` returning exactly `["0.23.0"]` is the happy path for the mail, and it is asserted in §2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved by a user. The data is source, and git is its persistence
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete screen exists for the register
- [x] Empty state renders sensibly (no rows yet) — `unreleased` is now empty, which is its correct state after a cut; `/releases` renders from `releases`, which gained an entry rather than losing one
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input. The guard that stands in for this is `check-release-guards.mjs`, which refuses a deploy with notes still in `unreleased` or a `package.json` that disagrees, and it passed
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — eleven notes is the longest entry in the register's history (the previous high was eight, `0.22.0`); the file still sorts descending under `compareVersions` against a neighbour dated one day earlier, and `latestRelease` resolves to `0.23.0`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all eleven notes, and is mailed on deploy | pass — all notes untagged; `majorReleasesSince` asserts the mail |
| management | `/releases` | sees all eleven | pass — untagged |
| staff | `/releases` | sees all eleven | pass — untagged |
| vet | `/releases` | sees all eleven | pass — untagged |
| volunteer | `/releases` | sees all eleven | pass — untagged |
| signed out | `/releases` | unchanged by this PR | pass — no route or gate touched |

- [x] Every role above tested — tested as the data question it is: every note is a plain string, so `noteRoles` returns undefined for all eleven and no role filters any of them out. Asserted as "role tags changed: 0"
- [ ] A role that should not have access is blocked server-side — n/a: this PR adds no route and changes no permission. `/releases` keeps the gate it had

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: `src/lib/manual/` not touched. The release notes are not a manual topic
- [ ] Translatable strings go through the translation path — n/a: release notes are English-only in the register, as every previous entry is
- [ ] Mobile viewport (375px) — n/a: no layout changed. `/releases` already renders longer entries than this one
- [ ] Browser console clean — n/a: no browser check was run; this is a data-only PR, and the build is the check that the file parses
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no request path changed

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` both read this file and both are compiled by the build, which passed. The register's 35 previous entries are asserted byte-identical, so nothing older can have changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file was touched. `releases.ts` is read by `/releases`, `/api/releases/current` and `worker/release-mail.mjs`, all three in the build
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in; the branch and `origin/main` were the same commit at the cut

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: a release cut is not a backlog item. The release's own features ticked theirs in their own PRs
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious here. The note order and the untagged decision are recorded above and in the commit message, and both follow rules already written down in `docs/release-procedure.md` §4 and `0.22.0`'s record
- [x] `README.md` still accurate — unchanged by this PR, and it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: this PR is the release notes. It moves the eleven lines the release's own PRs wrote out of `unreleased` into the `0.23.0` entry and adds none of its own, so `unreleased` is correctly empty afterwards
- [x] Commit messages say why, not just what — the cut commit records the major call and whose it was, why the order was changed, and the sixteen assertions
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every claim in the cut commit is a line of the verification script's output, pasted in §2. The permutation, the counts and the byte-identical comparison are measurements, not readings

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `7c980390` was `origin/main` at the cut; `git status -sb` is re-read against the remote immediately before the deploy is handed over, per `0.21.0`'s lesson
- [ ] Deployed SHA matches the tested SHA — deferred: Claude, at the deploy. `deploy.mjs` prints the target project and the short SHA, and both Pi builds are pinned with `--ref`; it goes in the release record

### On the deployed build

- [ ] Deployed to test — deferred: Claude, after the merge. Test gets the same commit as production
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Claude, via `docs/release-smoke-test.md`
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: nothing in this PR derives a time. The entry's date is a literal string, `2026-10-09`, displayed rather than computed
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary, threshold or band in this PR. The one ordering question, where the new entry sorts, is asserted across the whole file in §2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Both blocks in §2 are pasted from the scripts' own output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: Claude, as part of the release verification; the edge-cache check is done in a real browser, not with curl

### Deploy safety

- [ ] `deploy: production → Supabase project` line read and the ref matches production — deferred: Lutan runs the production deploy with `| tee`, Claude reads the log
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: Claude, from the same log
- [ ] Any new secret or env var exists in the production Cloudflare environment — n/a: this PR adds none, and neither does the release: the donation receipts reuse the existing Drive credentials

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, it contains neither. **But the release does**, and it matters: `0170_close_the_over_grants` narrows the `contacts` read policy while the code that reads the new `picker_contacts` view ships in the same release. The apply must therefore come **before** the deploys, and the window between them is a known, accepted defect — see **Defects**
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Claude, immediately before the apply, on all seven files. If it reports a failure on `0171`, which corrects `0170`, that is the per-file rollback trap and the correct action is still to apply — read both files before concluding otherwise
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: none of the seven rewrites or drops data. `0170` and `0171` change policies and add a view, `0167` rewrites policy bodies in place, and the rest add tables, columns and a trigger
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated in §3: all seven in one run, main checkout, after the merge and pull, before either deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 7b7341df` there, a rebuild of `0.22.0`. `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration**, and this release's are not all purely additive: `0170` and `0171` narrow read policies and `0167` rewrites 54 of them. Rolling the code back alone would leave `0.22.0`'s code reading the `contacts` table it no longer may, so the carer picker would stay empty. A code-only rollback is therefore **not** sufficient here: `0170`'s own header carries its undo recipe, and that would have to be run too

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **The staff carer picker returns no rows between the production apply of `0170` and the Pi finishing its build.** Live `0.22.0` code reads `contacts` directly (`src/lib/contacts/carers.ts` at `7b7341df`); `0170` narrows that table to `contacts.browse`, which staff do not hold, and the new code reads `picker_contacts` instead. An empty picker looks like "no carers", not like an error | **accepted, on Lutan's explicit call of 2026-10-09**, put to him before the cut as its own question rather than inside the count of unsigned plans. Mitigation agreed: apply the migrations and start the Pi production build in the same breath, so the window is as short as the build allows. Affects only a staff login adding a carer during a rehome or foster in those minutes; Management and Admin hold `contacts.browse` and are unaffected |
| 2 | low | Fifteen of the release's 22 feature plans are `pending:` | **accepted and recorded**, on Lutan's call, after the silent-failure question was asked and answered. Each keeps its own `pending:` signature; none is copied here |
| 3 | low | The first run of the cut script failed on line endings — it searched for an LF-terminated marker in a CRLF file, and `grep` and `awk` in Git Bash both reported no CR, which made the file look like LF | **fixed before the cut was committed.** The script now detects the file's own ending and writes it back unchanged. Recorded because two shell tools disagreed with Node about the same bytes |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the mail's first note is the Donations one — read in the delivered message, not inferred from the register | The admin mail for `0.23.0`, inbox |
| 2 | That the eleven notes read as a shelter user would want them, in this order | `/releases` on production, signed in |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looks may tick this line, so it stays unticked; the signature below names what is outstanding

Manual verification by: pending: the two items under Left for manual verification — the mail's first note, read in the delivered message, and the eleven notes on `/releases`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager, and defect 1 was put to Lutan before the cut and accepted by him

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session)  Date: 2026-10-09
