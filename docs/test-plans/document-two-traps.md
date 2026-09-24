# Feature test plan

## Header

| | |
|---|---|
| Feature | Document two traps hit on 2026-09-24: `--dry-run` failing a file that depends on another pending file, and CRLF-on-disk breaking scripted edits |
| Backlog item | none: follow-ups recorded in `docs/releases/2026-09-24.md` ("Belongs in CLAUDE.md's migrations section") and from cutting `0.2.0` |
| Branch / worktree | `claude/document-two-traps` @ `C:\Development\Animal_Shelter_document-two-traps` |
| Dev server | n/a: documentation only; no page is served |
| PR | #99 |
| Tested by / date | Claude, 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `7c91b20` (after syncing `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence: CLAUDE.md's migrations section explains why a dry-run can fail a correct file that depends on an earlier pending one, and README's gates notes explain that checkouts are CRLF and how to edit such files by script without breaking anchors or rewriting the whole file
- [x] Files/areas touched listed: `CLAUDE.md`, `README.md`, `docs/releases/2026-09-24.md` (one cell: "Belongs in" → "Now written into"), this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [ ] Roles affected identified — n/a: documentation only; no app role sees any of it
- [x] Out of scope: changing `apply-migrations.mjs --dry-run` to run pending files cumulatively in one transaction (which would remove the first trap), and adding a `.gitattributes` rule to pin line endings (which would remove the second). Both are behaviour changes, not documentation

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (#95–#98), pushed, exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [x] CI green on the PR: #99, `check` and `test-plan` both passed on 9eee9dc

```
=== gates: typecheck exited 0 after 26s
=== gates: lint exited 0 after 118s
=== gates: build exited 0 after 187s
gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

The README's claims were checked on this machine rather than copied from the 0.2.0 session's account. One of them was wrong, and it is corrected in this PR (Defect 1).

- [x] Happy path: the README snippet, run on a copy of `src/lib/releases.ts`, detected `crlf true`, and `cmp` reported the rewritten file byte-identical to the original
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no records
- [ ] Empty state — n/a: no UI
- [x] Invalid input: the failure the README describes reproduces. A `\n` anchor (`"unreleased: [\n"`) does not match the raw CRLF file and does match after normalising
- [x] Boundary cases: `git ls-files --eol` reports `i/lf w/crlf` for `README.md`, `package.json` and `src/lib/releases.ts`, and `tr -cd '\r' | wc -c` counts 120 and 41 CRs. Git Bash's `grep -c $'\r$'` and `grep -c $'\r'` both report 0 on the same files, which is why the README names `tr` as the check

### Role access matrix

n/a: no app surface.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] Server-side block — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: developer documentation, not an app feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest things still work: CLAUDE.md's migrations bullets and README's gates notes were re-read around the insertions. The surrounding text is unchanged and the new paragraphs sit in the right list items
- [ ] Shared file loaded from a second page — n/a: no runtime file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: docs only, merge conflict-free, gates exit 0 on the merged tree

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; these came from the 2026-09-24 release record, and the release record is updated to say so
- [ ] Non-obvious design choices appended to `docs/decisions.md` — n/a: no design choice; these are operational traps, recorded where the next person running the command will read them
- [x] `README.md` still accurate: the one inaccuracy found (CRLF attributed to `.gitattributes`) is fixed
- [ ] **Release notes.** n/a: developer documentation; no shelter user sees it, and the PR touches none of the user-visible paths
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The CRLF source, the `grep` blind spot and the snippet's round-trip were all measured in §4. The dry-run account is the release record's own diagnosis of `0075`/`0076`, which was read and then applied successfully that day. It was not re-run here, because both files are now applied to dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: documentation only; nothing in it is deployed
- [ ] Deployed SHA matches — n/a: not deployed

### On the deployed build

- [ ] Deployed to test — n/a: not part of the Worker bundle
- [ ] Smoke-tested on test.lannacare.org — n/a: not part of the Worker bundle
- [ ] Timezone-sensitive behaviour — n/a: no dates computed
- [ ] Boundary or banding change — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked — n/a: nothing public changed

### Deploy safety

- [ ] Production Supabase ref — n/a: no deploy
- [ ] `strip-baked-env` — n/a: no deploy
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR. Documentation only; no schema, no Worker

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The drafted README text blamed `.gitattributes` for the CRLF. It only pins `scripts/pi/*`, and the CRLF comes from `core.autocrlf=true` in Git for Windows' system gitconfig | fixed in this PR |

## Left for manual verification

Empty: documentation only, and every claim in it was checked by command above.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing to look at — documentation only, every claim checked by command

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (summary in the #99 description; full plan in this file)
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing deployed
