# Feature test plan

## Header

| | |
|---|---|
| Feature | Correct `docs/release-handover.md`: four statements that said a job was outstanding after it had been done, and a migration number five behind |
| Backlog item | `docs/backlog.md` → none. A handover correction is the same class of bookkeeping as the handover itself, which carries no item; the pattern behind it is recorded in `docs/decisions/2026-11-09-handover-stale-undone-lines.md` instead |
| Branch / worktree | `claude/release-handover-fix` @ `C:\Development\Animal_Shelter_release-handover-fix` |
| Dev server | not started — see §2 |
| PR | #1420 |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | `598ada28` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Lutan asked *"is the handover up to date"*, was told which four lines were not, and said *"Yes, fix it"*
- [x] Files/areas touched listed — `docs/release-handover.md` (five passages) and a new `docs/decisions/2026-11-09-handover-stale-undone-lines.md`. No routes, no `worker/`, no `supabase/migrations/`, no shared libs, no `src/`
- [x] Cards affected identified — none. The change touches no permission, no page and no control; nothing reads either file at runtime. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — *"The restore drill has still never been exercised"* was left exactly as it stands. `#rg7pv` merged the same day and rehearses a restore of **privileges**, which is not what the release records have meant by the drill since 2026-10-19; replacing an unverified claim with another unverified claim is the fault being fixed, in reverse. Named in the decision file so the next edition can settle it with evidence. Also out of scope: `docs/planner-handover.md`, checked and found current (edition `726`, written 2026-11-09, already records all three UAT jobs ticked)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`; the worktree was branched from `origin/main` at `6ee70899` minutes earlier)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 10s
=== gates: lint exited 0 after 130s
=== gates: test exited 0 after 25s
=== gates: build exited 0 after 55s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `--status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `--dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly — `n/a: no migration in this PR`
- [ ] Constraints and defaults exercised against real rows — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed — `n/a: no migration in this PR`
- [ ] Production apply plan stated — `n/a: no migration in this PR`

Note, since this PR exists partly to correct it: the migration number the handover now carries was
read with `git ls-tree -r origin/main --name-only -- supabase/migrations`, whose highest file is
`0342_profile_photo_positive_test.sql`. The file says `0343` and tells the reader to run that command
rather than trust the line.

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: two markdown documents, no code path`
- [ ] Data persists — `n/a: no data`
- [ ] Create / edit / delete all exercised — `n/a: no UI`
- [ ] Empty state renders sensibly — `n/a: no UI`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

`n/a: no card, page or control is affected, so there is nothing for a login to be able or unable to
reach. Both files are repository documentation and are not served by the app.`

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| — | — | — | `n/a: documentation only` |

- [ ] Every login above tested — `n/a: no surface to test, per the note above`
- [ ] A login that should not have access is blocked server-side — `n/a: no surface`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; nothing in src/ touched`
- [ ] Manual updated — `n/a: nothing a shelter user sees changed; this is a release manager's handover`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI`

## 6. Regression

- [x] The pages nearest the change still work — not pages but readers: every claim written into the file was checked against the live state first. `purge-cache.mjs`'s `credEnv` line read in source for the test-cache claim; `#pz3tk`, `#prg4z`, `#t0k9r`, `#sud8p`, `#uq8wk` read in `docs/backlog.md`; `scripts/pi/setup.sh` and `docs/pi-hosting.md` read in the files rather than taken from `f3724a2d`'s commit message; `git ls-tree` for the migration number; `gh pr list --head claude/restore-grants` for `#rg7pv`'s PR state
- [x] Any shared file touched checked from a second, unrelated page — none touched. `docs/release-handover.md` and a new file in `docs/decisions/` are read by people, not by code; `grep -rl release-handover src/ scripts/ worker/` finds nothing
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged nothing (`Already up to date.`)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: no backlog item, per the header`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-09-handover-stale-undone-lines.md`, which records the thing worth keeping: the four stale lines were stale **in one direction**, all claiming work was outstanding when it was done, because a delta handover's carried list is the cheapest part to copy and the most expensive part to re-measure
- [x] `README.md` still accurate — unaffected; neither file is referenced there
- [ ] **Release notes.** — `n/a: nobody outside the release process reads either file. A shelter user could not notice this change, and the PR touches no src/, components/, manual/, i18n/ or worker/ path`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the specific risk here, since the change is nothing but claims about state. Each is sourced in §6. The one claim I could **not** measure is named rather than written: the restore drill line, left untouched

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test — `n/a: changes no deployable artifact. Both files are repository documentation; the Worker and Pi builds do not include docs/`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: nothing deployed changes`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date or time logic`
- [ ] Boundary or banding change covers both edges — `n/a: no boundary, threshold or band`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in §2 is the run's own closing lines, per-gate timings included
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

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR's merge restores the previous text of both files, completely and with nothing else to undo: no schema, no deployed artifact, no setting. What a revert would also restore is the four stale claims, so a reverter should re-measure rather than trust them — which is the whole point of the change

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The last edition contradicted itself about one host: its carried bullet called `lannacare.org` *"UAT"* while its own opening page said `lannacare.org` 301s to production. Both written 2026-11-08, hours apart | fixed — the corrected bullet states it and points at the opening |
| 2 | low | `Next free migration number` was five behind (`0338` against `0342`) within a day of being written, which is faster decay than a reader would expect of a number | fixed — corrected to `0343` and the line now tells the reader to run `git ls-tree` instead of trusting it |
| 3 | low | Process, not product: the first gates run was invoked as `node scripts/gates.mjs | tail -25`, which discarded three of the four per-gate lines and made the shell report `tail`'s exit status rather than the gates' own. That is the trap §2 of the template names in so many words, met while filling in §2 | fixed — re-run unpiped, and the block in §2 is that run's own output |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | Both files are read by a release manager at the next cut; there is no screen, wording or device for a person to look at separately from that. The one claim that needed a person's evidence was not written — see §1's out-of-scope note on the restore drill |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the change is two documentation files with no surface a person could look at; every claim in them was verified from the live state and listed in §6

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — it is the release manager's own handover, corrected in place and dated, so the next cut reads it rather than being told about it

Result: pass

Release manager acknowledgement: n/a: this PR is a correction to the release manager's own handover and carries nothing to deploy
