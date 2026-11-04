# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.42.0` release record and the release handover, written after the release was deployed and verified |
| Backlog item | `docs/backlog.md` → n/a: a release record closes no backlog item. This release **created** one — the code-identity check counting repo tooling as served code — and it is filed on the `backlog` branch under *Architecture* (id `pte7h`, `check-backlog-ids` and `check-backlog-sections` both ok), which is where new items go and not in this PR |
| Branch / worktree | `claude/record-0-42-0` @ `C:\Development\Animal_Shelter_cut-release-0-42-0` — the cut's own worktree, reused after its PR merged, as the paperwork budget's rule 2 requires |
| Dev server | not started — n/a: two markdown files, neither served, imported nor rendered |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-04 |
| Carries a migration? | no — the release's three (`0306`–`0308`) were applied before the deploy and are recorded in the record |
| Tested at SHA | branched from `origin/main` at `cd2b0070` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — `docs/releases/2026-11-04-0-42-0.md` and a rewritten `docs/release-handover.md`, in **one** PR, which is paperwork rule 3
- [x] Files/areas touched listed — those two files and this plan. Nothing else
- [x] Cards affected identified — **none.** No card, activity, cell, control or line of code changes in this PR
- [x] Anything explicitly **out of scope** written down — the eight plans signed `pending:`, which keep their own signatures and are only *grouped* in the record; and the backlog item this release raised, which belongs on the `backlog` branch and is already committed there

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was created with `git checkout -b claude/record-0-42-0 origin/main` after a fresh `git fetch`, so it starts at `origin/main` by construction. `git checkout main` in a second worktree is refused because the main checkout holds it, which is why this is the documented route
- [x] `node scripts/gates.mjs` — n/a: **a documents-only PR skips the heavy CI jobs** by design (`scripts/check-docs-only.mjs` decides, and `ci.yml` gates everything except `test-plan` on it). Running four gates against two markdown files would cost a build and prove nothing. **Deliberately not run, and recorded rather than ticked silently**
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

The release's own evidence is the record, which is this PR's content: every figure in it is pasted from a run, and where something was not established it says so. The checks that bear on **this** PR rather than on the release are:

```
check-backlog-ids:      ok — 937 items, 937 ids, all present and unique
check-backlog-sections: ok — 76 open items, all above `## Completed`
```

Both read from the commands themselves, not through a pipe. They cover the backlog item this release raised, which is on the `backlog` branch and not in this PR.

**The handover is 117 lines** (`wc -l`), inside the runbook's ~100-line aim and under its 150 ceiling. It is a delta: it says what changed since the last edition, what is open, and where things stand, and it cites the record rather than restating it.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. For the next release: `0308` is the highest on `main`, so **`0309` is free**, and both databases read 309 applied of 309 files with nothing applied that has no file
- [x] `--status` reviewed before applying — n/a as this PR's own step; done for the release and recorded: 306 applied / 3 pending before, **309 applied / 0 pending** after
- [x] `--dry-run` reviewed — n/a as this PR's own step; done for the release: all three **ok, exit 0**, with three `-- consumer:` warnings each matched file-by-file against `git diff`
- [ ] Applied to **dev** — n/a: applied by the streams that wrote them; `--drift test` ends `No drift`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as this PR's own migration; the release's is recorded: `0306`–`0308` to `dbkodyyxxhtygxcxmfcu` **before either deploy**, and that is what happened

## 4. Functional checks

- [x] Happy path works end to end — n/a as an app path; the equivalent for a record is that every claim in it is traceable to a command's output, which it is
- [x] Data persists — n/a as written; both files are committed in git, which is the whole point of filing the record beside the change
- [ ] Create / edit / delete all exercised — n/a: two documents, no operation to exercise
- [x] Empty state renders sensibly — n/a as a UI state. The analogous honest state is the record's **What this record cannot say** section, which is not empty and names four things
- [x] Invalid input is rejected with a readable message — n/a for a document. Exercised for real elsewhere in the release: `cut-release.mjs` refused to write until all nine deferred-note candidates were answered
- [x] Boundary cases checked — n/a as a boundary. The release's own boundaries are asserted in `cut-release-0-42-0.md`: the version both ways and the mail window from both ends
- [ ] Driven in a real browser — n/a: neither file is served or rendered anywhere

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changes in this PR, and neither file is reachable from the app at all. Reported by card rather than by role, as `CLAUDE.md` requires — and for this PR the honest answer is that there is no card to report, because nothing in it is behind one.

- [ ] Every login tested — n/a: nothing in this PR is served to any login
- [ ] A login that should not have access is blocked server-side — n/a: no server check changes

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changes
- [ ] Manual updated — n/a: a release record is not a manual topic
- [x] Translatable strings go through the translation path — n/a: neither file contains a user-facing string. The release's own notes are English prose in `src/lib/releases.ts` and have never been translatable labels
- [ ] Mobile viewport (375px) — n/a: no layout or component changes
- [ ] Browser console clean — n/a: no code changes
- [ ] Network clean — n/a: no request changes

## 6. Regression

- [x] The pages nearest the change still work — n/a: there are no pages near this change. Nothing imports either file
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` is the one shared file here, rewritten rather than appended. Its only reader is the next release manager, and it **outranks nothing**: it says so in its own opening lines and cites `docs/release-procedure.md` and the record as outranking it
- [x] Nothing merged from `main` was broken by this branch — the branch starts at `origin/main` and adds three files, two of them new

## 7. Documentation

- [x] Backlog item ticked — n/a: a release record closes none. The one this release **raised** is on the `backlog` branch under *Architecture*, id `pte7h`, committed and pushed before this plan was written
- [x] Non-obvious design choices recorded — the record carries them: why nothing was rebuilt when `main` moved, why eight flagged files were read rather than obeyed mechanically, why the first edge-cache reading was discarded, and why the apply not being refused is not evidence the refusals are fixed
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched. The nine notes this release publishes were moved into place by the cut, #1255
- [x] Commit messages say why, not just what — the commit explains what the record settles (the `node_modules` cause, the deferred-note window collapsing, the apply not being refused) and what it raises (the code-identity exclusion list)
- [x] **Claims were measured, not reasoned** — this is the line that matters most on a record, and the record is explicit about the difference in four places: the code-identity conclusion rests on a **second grep** that is quoted, not on judgement; `activities-grantable` before and after was **diffed** rather than eyeballed; the email is confirmed from the **inbox** rather than from `sent 1`; and the first edge-cache reading is recorded as **having proved nothing** and redone. Where something was not established — anything behind sign-in, the public surface — it says so

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is where this branch starts — `cd2b0070`
- [x] Deployed SHA matches the tested SHA — n/a: **nothing in this PR is deployed.** The release's deployed SHA is `2c985e4f` on both Pi clones and the production Worker, and `cd2b0070` on the test Worker, with the code-identity finding reasoned in full in the record

### On the deployed build

- [x] Deployed to test — n/a: this PR is not deployed. The release was, and test answers `0.42.0`
- [x] Smoke-tested on `test.lannacare.org` — n/a as this PR's step; done for the release and recorded: both environments answer `0.42.0` at both endpoints, asked both ways round
- [ ] Timezone-sensitive behaviour proved — n/a: the only dates in these files are literals naming the release day
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the two backlog check lines, and every figure quoted in the record
- [x] Public pages re-checked after a cache purge — n/a as this PR's step; done for the release: purge exit 0, then `check-assets` re-run **by hand on both hosts** and both `ok … identical to the build`

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — n/a as this PR's step; read for the release: `dbkodyyxxhtygxcxmfcu (2c985e4f)`, the production ref and the release commit
- [x] `strip-baked-env: removed N env var(s)` seen — n/a as this PR's step; seen for the release on **both** Workers: 14 each, every name listed in the record
- [x] Any new secret/env var exists in the production Cloudflare environment — **none added or removed** by this PR or anywhere in the release range

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration in this PR
- [x] `--env production --dry-run` clean — n/a as this PR's step; clean for the release, all three ok
- [ ] Backup fresh for a destructive migration — n/a: no migration in this PR, and none in the release deletes rows
- [x] Apply plan stated — n/a as this PR's own migration; the release's is recorded and was followed

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR changes nothing that runs.** It would only remove the record and restore the previous handover, which is a loss of knowledge rather than a change in behaviour. The release's own rollback position is stated in `cut-release-0-42-0.md`: `deploy-pi.sh --ref befdeeb8` on both clones returns users to `0.41.3`, `wrangler rollback` reverts only the Worker fallback, neither reverts `0306`–`0308`, and **nothing reverts the email**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | `backlog-ids.mjs` needs its path as an argument and prints a usage line without it, which cost one wasted invocation | **Not a defect — the script telling me how to call it**, and `check-backlog-ids.mjs` printed the exact command to run. Recorded only because the first attempt's exit code came through a pipe and read as 0 when nothing had been done, which is the runbook's own `tail` trap in miniature |

The release's own defects and avoidable costs are in the record, where they belong: the `release-prs.mjs` shortfall (four releases running), the code-identity exclusion list (now a backlog item), the deferred-note boilerplate, and the discarded first edge-cache reading.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | n/a: nothing in this PR is served, rendered or reachable from the app, and the handover is read only by the next release manager | — |

The release's own manual items belong to the eight plans signed `pending:` and to `cut-release-0-42-0.md`'s own list — reading the nine notes and the `0.42.0` email, and looking at the poodle drawings. They are **not** copied here, because copying them would give them a second home that nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: two documentation files, neither served nor rendered, read only by the next release manager; the release's own manual items are carried on their own plans

Manual verification by: n/a: two documentation files, neither served nor rendered, read only by the next release manager; the release's own manual items are carried on their own plans and on the cut's

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-04
