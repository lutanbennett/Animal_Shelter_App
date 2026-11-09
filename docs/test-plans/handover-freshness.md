# Feature test plan

## Header

| | |
|---|---|
| Feature | Three stale lines in `docs/release-handover.md` corrected, and the next-migration number removed entirely in favour of the command, having been wrong twice in two days |
| Backlog item | `docs/backlog.md` → none. A handover correction is the same class of bookkeeping as the handover itself, which carries no item; the pattern is recorded in `docs/decisions/2026-11-09-handover-numbers-are-not-lines.md` instead |
| Branch / worktree | `claude/handover-freshness` @ `C:\Development\Animal_Shelter_handover-freshness` |
| Dev server | not started — see §4 |
| PR | [#1437](https://github.com/lutanbennett/Animal_Shelter_App/pull/1437) |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | `63f7dc44` — the gates ran against this commit, and nothing but this plan changed afterwards |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — Lutan asked *"Is the handover up to date"*, was given the three measurements below, and said *"Can you update the handover and merge it"*
- [x] Files/areas touched listed — `docs/release-handover.md` (four passages) and a new `docs/decisions/2026-11-09-handover-numbers-are-not-lines.md`. No `src/`, no `scripts/`, no `worker/`, no `supabase/migrations/`, no `README.md`
- [x] Cards affected identified — none. No permission, page or control is touched and nothing reads either file at runtime. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **(a) The 150-line ceiling is still breached.** `docs/release-procedure.md` rule 4 treats 150 as the limit; the file arrived at **163** and leaves this change at **165**, even after the number line and the restore bullet were tightened to pay for the corrections. Trimming the dated FIXED/SUPERSEDED paragraphs is the next edition writer's job at the next cut, for the reason yesterday's rule 2 gives: deleting a wrong line loses the reason somebody believed it. **Found, not fixed, for the second time today.** **(b) Two claims deliberately NOT re-measured and left as inherited:** the Pi's `guard-release` warning (needs the Pi) and the `audit:prod` figures (needs an install and a run). Both are named in the decision file so the next edition knows they are inherited rather than confirmed. **(c) UAT's migration count** was not read, because it needs a window without the other account's shell `SUPABASE_ACCESS_TOKEN`; the file now says so rather than carrying the old figure

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a: the worktree was branched from origin/main at 96f2b50b minutes before this commit, so there was nothing to merge in`
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run unpiped, so each exit code is the gate's own:

```
=== gates: typecheck exited 0 after 58s
=== gates: lint exited 0 after 133s
=== gates: test exited 0 after 30s
=== gates: build exited 0 after 142s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR, though --status was run read-only against both databases to measure the figures this PR corrects`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change — `n/a: no migration in this PR`
- [ ] Constraints and defaults exercised against real rows — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR. Note for the release manager, since this PR measured it: production has 4 pending migrations (0343-0346) and dev has 0. That is the normal state between a merge and a release, not a finding`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: two markdown documents, no code path`
- [ ] Data persists — `n/a: no data`
- [ ] Create / edit / delete all exercised — `n/a: no UI`
- [ ] Empty state renders sensibly — `n/a: no UI`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

`n/a: no card, page or control is affected. Both files are repository documentation and neither is served by the app.`

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| — | — | — | `n/a: documentation only` |

- [ ] Every login above tested — `n/a: no surface to test, per the note above`
- [ ] A login that should not have access is blocked server-side — `n/a: no surface`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: nothing in src/ touched`
- [ ] Manual updated — `n/a: nothing a shelter user sees changed; this is a release manager's handover`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — not pages but claims, and this PR exists because claims were not re-measured, so every figure written in was measured first. **The migration number:** `git ls-tree -r origin/main --name-only -- supabase/migrations | sort | tail -4` ends at `0346_approval_default_null.sql`, so the next free number is `0347` — which is why the file now prints that command instead of a number. **The counts:** `node scripts/apply-migrations.mjs --status --env production` returned *344 applied, 4 pending* naming `0343`-`0346`, and the same script against dev returned *348 applied, 0 pending*, both against `origin/main a55d8852`. **UAT has moved:** `curl https://uat.lannacare.org/api/version` answered `{"version":"0.43.6", …}`, which is what falsifies the closing `nslookup` sentence
- [x] Any shared file touched checked from a second, unrelated page — none touched. Neither file is read by any script: `grep -rl release-handover src/ scripts/ worker/` finds nothing, and unlike this morning's PR this one does not touch `docs/test-plan-template.md`, so no script reads anything it changes
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `96f2b50b`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: no backlog item, per the header`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-09-handover-numbers-are-not-lines.md`. Two things worth keeping. **Print the command, not the number:** yesterday's rule already said a number is a measurement rather than a line to copy, and the correction made under it still printed one, which was wrong again within hours. **Decay is not only in the "a job is outstanding" direction:** of today's three, one was a plain fact, one was a *reassuring* count claiming two databases agreed, and only the third pointed the way yesterday's pass was searching. Searching for "still never" finds one class and misses the rest
- [x] `README.md` still accurate — not touched by this PR, and checked: it carries no next-migration number and no database counts
- [ ] **Release notes.** — `n/a: nobody outside the release process reads either file. No shelter user could notice this change, and the PR touches no src/, components/, manual/, i18n/ or worker/ path`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the whole substance of this PR. Every figure is sourced in §6, and the two claims that could **not** be measured from here are named as inherited rather than restated as fact

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test — `n/a: changes no deployable artifact; the Worker and Pi builds do not include docs/`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: nothing deployed changes`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date or time logic`
- [ ] Boundary or banding change covers both edges — `n/a: no boundary, threshold or band`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in §2 is that run's own closing lines, and the figures in §6 are the scripts' own words
- [ ] Public pages re-checked after a cache purge — `n/a: no public page changes`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `n/a: this PR triggers no deploy`
- [ ] `strip-baked-env` seen in the deploy output — `n/a: this PR triggers no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: no new secret or env var`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — `n/a: no migration`
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [ ] Production backup fresh for a destructive migration — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR's merge restores the previous text of the handover and removes the new decision file, completely: no schema, no deployed artifact, no setting. What a revert would restore is a wrong migration number, a wrong pair of database counts and a false sentence about UAT, so a reverter should re-measure all three rather than trust the restored text

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **The next-migration number has now been wrong twice in two days**, the second time under a rule written specifically to stop it, because that rule's own correction still printed a number | fixed by printing no number at all — only the command. A line that cannot stay correct for a day should not exist |
| 2 | medium | *"Both databases hold 339 migrations and neither drifts"* was a **reassuring** falsehood: production is at 344 with 4 pending and dev at 348, so they differ by four. Yesterday's analysis of decay direction would not have flagged it, and that is why it survived | fixed, and the direction claim widened in the decision file |
| 3 | low | The closing *"read the live state"* paragraph carried a false checkable assertion inside a lesson about checking things. The passages a reader trusts most are the ones nobody re-checks | fixed in place, and its moral widened to *never accept "it's done" — or "it's not done"* |
| 4 | low | `docs/release-handover.md` is 165 lines against a stated limit of 150 | accepted — §1's note gives the reason. Second time today this has been recorded rather than fixed, which is itself a signal for the next cut |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Every claim written was measured and each measurement is named in §6. There is no screen, wording or device for a person to look at separately from reading the corrected file |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: two documentation files with no surface a person could look at; every claim in them was verified from the live state and listed in §6

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — the handover is the release manager's own document, corrected in place and dated, so the next cut reads it rather than being told about it

Result: pass with accepted defects

Release manager acknowledgement: n/a: this PR carries nothing to deploy and corrects the release manager's own handover
