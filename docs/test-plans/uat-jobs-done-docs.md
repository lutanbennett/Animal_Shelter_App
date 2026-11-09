# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The release runbook said two finished UAT jobs were still outstanding |
| Backlog item | `docs/backlog.md` → `#r9k2m` |
| Branch / worktree | `claude/uat-jobs-done-docs` @ `C:\Development\Animal_Shelter_uat-jobs-done-docs` |
| Dev server | not started — documentation only, no code and no page |
| PR | [#1409](https://github.com/lutanbennett/Animal_Shelter_App/pull/1409) |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | `f756b506` — the gates ran against that tree. The two commits after it add this plan and fill it in, and change no code |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *four passages of `docs/release-procedure.md` and one of `docs/uat-finalisation.md` said two one-time UAT jobs were still outstanding after they were finished on 2026-11-09; each is rewritten with its old wording kept in place, marked superseded*
- [x] Files/areas touched listed — `docs/release-procedure.md`, `docs/uat-finalisation.md`, `docs/backlog.md` (this item's tick). No routes, no `worker/`, no `supabase/migrations/`, no shared libs, nothing under `src/`
- [ ] Cards affected identified — n/a: no card grants or denies anything here. The change is prose in two runbooks; no code reads them and no page renders them
- [x] Anything explicitly **out of scope** written down — *release records (`docs/releases/`), test plans (`docs/test-plans/`) and decision files were deliberately left alone: they are dated records of what was true when written, not living documents, and rewriting them would destroy the history the superseded notes point at. `README.md` was read and needed no change*

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (*Already up to date*)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — all four exit codes `0`. The run took 18 minutes rather than the usual four; another stream was building on this machine at the same time, which is the same machine-load effect `CLAUDE.md` records for Lighthouse figures. Its closing lines, as printed:

```
=== gates: typecheck exited 0 after 173s
=== gates: lint exited 0 after 494s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 379s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: there is no path. Nothing executes: the change is prose in two markdown files that no code reads
- [ ] Data persists — n/a: nothing is written or read back
- [ ] Create / edit / delete all exercised — n/a: the change has no operations
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: the change takes no input
- [ ] Boundary cases checked — n/a: the change has no values

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | — | — | n/a: the files changed are repository documents, not pages |
| signed out | — | — | n/a: the files changed are repository documents, not pages |

- [ ] Every login above tested — n/a: there are no pages. Both files changed are read in the repository by whoever runs a release, and access to them is access to the repository
- [ ] A login that should not have access is blocked server-side — n/a: there are no pages

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page, so no nav entry
- [ ] Manual updated — n/a: the manual is for shelter users; these two documents are release runbooks for whoever ships a release
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings changed
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: nothing renders
- [ ] Network clean — n/a: nothing renders

## 6. Regression

- [x] The pages nearest the change still work — *no pages are near it; what is near it is the rest of each document. Both were re-read around every edit, and the three cross-references to the renamed heading "What UAT still needs once" were found by grep and updated to "What UAT needed once", so no reference dangles*
- [x] Any shared file touched — *`docs/backlog.md` is the one file other streams also edit. The tick was applied with anchored matching on the item's own id and verified afterwards (one line, still in `## Documentation`, still above `## Completed`); `check-backlog-sections.mjs` and `check-backlog-ids.mjs` both pass on the result*
- [x] Nothing merged from `main` during `sync` was broken by this branch — *`sync` reported `Already up to date`*

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#r9k2m`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the choice worth recording is already inside the two documents. Each superseded passage says what the old state was and why it changed, which is where a release manager actually meets it; a decision file would be a third copy to keep in step
- [x] `README.md` still accurate — *read its UAT paragraphs in full. They describe the Pi's third instance and `ACCOUNT_KEYS` correctly and never claimed the three jobs were outstanding, so nothing needed changing. Checked rather than assumed: an earlier plan of mine ticked this line without reading, and the README turned out to hold six stale facts*
- [ ] **Release notes.** — n/a: nobody outside this repository could notice. The change is to two release runbooks; no shelter user and no page reaches them
- [x] Commit messages say why, not just what — *the commit leads with the consequence: the next release record would have carried two invented defects*
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — *every claim written into the two documents was measured today: `sudo -n -l` on the Pi for the six commands, `sudo -n systemctl is-active --quiet lanna-care-uat` for the absent prompt, Cloudflare's own zones endpoint for what the new token can reach, and `purge-cache.mjs --env uat` for the CF MISS re-fetch. The one claim not re-derived from scratch is that commit `86ac6d35` fixed the Supabase token; that rests on `apply-migrations.mjs --env uat --status` answering today where it refused yesterday*

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the release manager at the next release cut
- [ ] Deployed SHA matches the tested SHA — deferred: the release manager at the next release cut

### On the deployed build

- [ ] Deployed to test — n/a: nothing in this PR is deployed. Neither file is bundled, served or read at runtime
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR is deployed
- [ ] **Timezone-sensitive behaviour proved** — n/a: no logic and no dates in code; the dates in the prose are historical labels
- [ ] **For a boundary or banding change** — n/a: no boundary, band or threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — *the gates block is the run's own closing lines; nothing here is a tidied table*
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: this PR is not deployed
- [ ] `strip-baked-env` seen in the deploy output — n/a: this PR is not deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var. The purge token this PR describes is a local deploy-machine value in a gitignored file, not a Worker secret

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — *`git revert` of this commit restores the previous wording, and nothing else is affected: no build output, no database, no deployed artifact. What a revert would not undo is the three jobs themselves — changes on the Pi, in Cloudflare and in a local env file — so reverting the prose would simply make the runbook wrong again*

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first attempt at these edits matched multi-line text with bare newlines while the documents are CRLF in the worktree, so seven of eight replacements silently found nothing. The runner now matches with each file's own line ending and asserts exactly one match per edit, so a miss fails loudly instead of passing quietly | fixed |
| 2 | low | Renaming the heading *What UAT still needs once* would have left three cross-references pointing at a heading that no longer existed. Found by grep after the rename rather than before it | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — *the list is empty: there is no surface for a person to look at*

Manual verification by: n/a: documentation only — nothing renders, and both documents were read in full around every edit as part of the automated pass

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — *the PR body carries what changed, the two deliberate choices and the measurements behind the new wording, and points at this file*
- [x] Handed to the production release manager — *this plan is the handover; there is nothing for them to do at deploy time beyond the two deferred SHA lines that every PR carries*

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing to deploy or verify on a deployed build
