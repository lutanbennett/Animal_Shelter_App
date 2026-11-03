# Feature test plan — backlog item ids, and the page generator in the repo

## Header

| | |
|---|---|
| Feature | Every backlog item carries a permanent id; the page generator, its templates and the id script move from `.local/` into `scripts/`; a new check enforces the ids |
| Backlog item | `docs/backlog.md` → *THE BACKLOG PAGE'S GENERATOR LIVES ONLY IN THE GITIGNORED `.local/`…* (`<!--#ri51p-->`) |
| Branch / worktree | `claude/backlog-ids-in-repo` @ `C:\Development\Animal_Shelter_backlog-ids-in-repo` |
| Dev server | not started — this change has no app surface |
| PR | see the PR this plan is committed to |
| Tested by / date | Claude (Opus 5) / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | see the gates block in §2 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item asked for the generator's home **and** a check; both are here
- [x] Files/areas touched listed — `scripts/gen-backlog.mjs`, `scripts/backlog-ids.mjs`, `scripts/check-backlog-ids.mjs`, `scripts/lib/backlog-page/{head,priorities}.html`, `.githooks/pre-commit`, `.github/workflows/ci.yml`, `README.md`, `docs/backlog.md` (935 ids + the tick), `docs/decisions/2026-11-03-backlog-item-ids.md`. No `src/`, no `worker/`, no `supabase/migrations/`
- [x] Cards affected identified — **none.** Nothing here reads or grants a permission; the backlog page is a private artifact, not an app surface. Admin and the signed-out public are unaffected
- [x] Anything explicitly out of scope written down — the artifact page's own publish is not part of this PR (it is published from a session, not from CI); no backlog item is reworded beyond the one tick; `priorities/ranking` is **not** written by this change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` — four gates, each exit code `0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 96s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 38s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/gen-backlog.mjs . <out>` from the new location renders the page, and `node scripts/backlog-ids.mjs docs/backlog.md` reports `935 items, 935 already had an id, 0 were given one`
- [x] Data persists — the page generated from `scripts/` is **byte-identical** to the last page published from `.local/`, ignoring the timestamp line. That is the evidence the move changed nothing
- [x] Create / edit / delete all exercised — the id script's three states exercised: assigning to a file with none (935 assigned), re-running (0 assigned, idempotent), and a file with a missing id and a duplicate id (both reported, exit 3)
- [x] Empty state renders sensibly — `check-backlog-ids.mjs` against a file with no items exits 1 with *"no items found … that cannot be right"*, rather than passing an empty file
- [x] Invalid input is rejected with a readable message, not a crash — the check names each bad line and prints the one command that fixes every one of them
- [x] Boundary cases checked — a **lone CR inside an item line** was the real one: it made an item invisible to a `.`-based pattern and was caught by the item count disagreeing with the checkbox count (934 vs 935). Both scripts now use `[\s\S]` and report such a character; the stray byte itself is removed. Also checked: a CRLF working tree (the main checkout), where a trailing CR is the line ending and must **not** be reported

### Role access matrix

n/a — this change has no app surface and no card. The table is left empty
deliberately rather than filled with rows that test nothing.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| — | — | — | n/a: no app surface |

- [ ] Every login above tested — n/a: no app surface, no card, nothing reachable in the app changed
- [ ] A login that should not have access is blocked server-side — n/a: no route added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; nothing in `src/app/NavLinks.tsx` touched
- [ ] Manual updated — n/a: the manual is for shelter staff using the app; this is a developer script
- [ ] Translatable strings — n/a: no user-facing string; the scripts print to a terminal, in English, for developers
- [ ] Mobile viewport — n/a: no app surface. (The artifact page itself is read on a phone and is unchanged in layout by this PR)
- [ ] Browser console clean — n/a: no app surface
- [ ] Network clean — n/a: no app surface

## 6. Regression

- [x] The pages nearest the change still work — the backlog page is the only consumer, and it renders byte-identically
- [x] Any shared file touched checked from a second, unrelated page — `.githooks/pre-commit` and `.github/workflows/ci.yml` are the shared files. The hook was **run, not read**, and running it is the only way to check it here: `core.hooksPath` is an absolute path to the main checkout's `.githooks`, so **a worktree runs main's hooks and never its own**, and the commit that adds this check was made under the old hook. Proved by staging `docs/backlog.md` with one id removed and running `sh .githooks/pre-commit` directly — it refused with exit 1 and named line 940 — then restoring the file. `check-script-integrity.mjs` still reports `ok` with the four new files present
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought nothing that touches these paths

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `<!--#ri51p-->`, with what closed it
- [x] Non-obvious design choices added — `docs/decisions/2026-11-03-backlog-item-ids.md`, including why ids are random rather than sequential and why the id is invisible
- [x] `README.md` still accurate — the backlog worktree section now shows the id shape and names the three commands
- [ ] **Release notes.** — n/a: a developer script and a private planning page. No shelter user can reach any of it, and `src/` and `worker/` are untouched
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned — the byte-identical page, the 934-vs-935 count that found the stray CR, and the check's exit codes were all run and their output read

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date; the only timestamp is the page's own generation stamp
- [ ] Boundary or banding change — n/a: no threshold, band or cutoff
- [ ] Evidence pasted is the tool's actual output — n/a: no deploy-time evidence; §2 and §4's evidence is unedited tool output
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] `--dry-run` against production — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated — reverting the commit restores the previous state entirely. **What it does not cover:** the 935 ids already merged to `main` through the `backlog` branch would remain in `docs/backlog.md`, which is harmless — they are inert comments that the old generator ignores. Nothing to revert in a database, and no deploy is involved

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | A lone CR sat mid-sentence inside a completed backlog item, making that line invisible to any `.`-based pattern | fixed — character removed, both scripts hardened and now report such a character rather than skipping the line |
| 2 | low | `gen-backlog.mjs`'s item pattern required `**` immediately after the checkbox, so it would have rendered every item blank once ids were added | fixed in this PR — the id is optional in the pattern, so an item filed without one still renders |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the published page still reads correctly on a phone, and that the Customer priorities panel still saves when opened from the Claude sidebar — the panel needs the artifact runtime, which no script can exercise | the pinned **Lanna Care Backlog** artifact |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-11-03

### Manual verification

pending: the one row above — the artifact page opened from the sidebar on a phone, and a star pressed to confirm the panel still saves
