# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `setup-test.sh` and `spare-clone.sh` committed `100755`, plus a CI guard (`script-integrity`) that parses every `scripts/**/*.mjs` and requires `100755` on any `.sh` a `.service` `ExecStart` runs |
| Backlog item | `docs/backlog.md` → Quick wins: two shell scripts committed without the executable bit |
| Branch / worktree | `claude/script-exec-bits-guard` @ `C:\Development\Animal_Shelter_script-exec-bits-guard` |
| Dev server | not used: tooling and CI only |
| PR | linked from the PR itself |
| Tested by / date | Claude (script-exec-bits-guard session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `6b6dbeb` (guard); gates re-run on the final tip |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two mode changes (no content) and one CI job covering both classes the item names, `node --check` over `scripts/**/*.mjs` and the `ExecStart` `.sh` mode check
- [x] Files/areas touched listed: `scripts/pi/setup-test.sh` and `scripts/pi/spare-clone.sh` (mode only), `scripts/check-script-integrity.mjs` (new), `.github/workflows/ci.yml` (new job), `docs/backlog.md`, `docs/decisions/2026-10-02-script-integrity-reads-the-index.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: developer tooling and CI; no app role sees any of it
- [x] Out of scope written down, and the script prints it on every run: `ExecStartPre/Post/Stop`, drop-ins, `ExecStart` through an interpreter, `.sh` not named by a `.service`, `.cjs`/`.ps1` syntax. Installing the spare-clone timer on the Pi is a separate item that this unblocks

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date.", pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 324s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist in the commit that creates it; the PR's own checks (including the new `script-integrity` job) are the evidence

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The guard was run against the real repo, then against two deliberately broken
states made and undone in this worktree (index-only mode flip; one appended
syntax error, restored with `git checkout`).

- [x] Happy path works end to end: on the fixed tree `node scripts/check-script-integrity.mjs` printed `94 .mjs files parsed, 1 ExecStart .sh file(s) checked in 3 .service file(s)` and `script-integrity: ok`, exit 0. The committed modes were confirmed with `git show --summary` on the mode commit (`mode change 100644 => 100755` on both files) and `git ls-files -s '*.sh'` (all four `100755`), not from `git status`
- [x] Data persists: the mode change is in the pushed commit `38b4bac`, and `git ls-files -s` on the branch shows it
- [x] Create / edit / delete: the failure paths were exercised, not only the pass:
  - **Watched it fail on the broken mode.** `git update-index --chmod=-x scripts/pi/spare-clone.sh`, then the guard exited 1 with `scripts/pi/spare-clone.service: ExecStart runs scripts/pi/spare-clone.sh directly, but git has it as mode 100644, not 100755; systemd will fail with "Permission denied".` and the remedy `git update-index --chmod=+x scripts/pi/spare-clone.sh`. Restored and it passed again
  - **Watched it fail on a syntax error.** `const = ;` appended to `scripts/gates.mjs`: exit 1, `SyntaxError: Unexpected token '='`, file named. Restored with `git checkout`
  - **A false pass was found and fixed on the way:** the first version used the pathspec `scripts/**/*.mjs`, which matched only 11 files (subfolders) and let the broken `gates.mjs` through with exit 0. Changed to `:(glob)scripts/**/*.mjs`, now 94 files, and the syntax case above failed correctly. This is why the guard was run on a bad input rather than assumed
- [x] Empty state: a repo with no `.service` files would print `0 ExecStart .sh file(s) checked in 0 .service file(s)` and pass; read in the code, not run
- [x] Invalid input is rejected with a readable message, not a crash: both failures above name the file and say how to fix it
- [x] Boundary cases: `ExecStart=/usr/bin/npm run start …` (the other two units) is skipped as not a `.sh`, and the count of 1 checked file shows only `spare-clone.service` was judged. A `-`/`@` prefix on the command word is stripped and an absolute `.sh` outside the repo is noted and skipped; those two were read in the code, not exercised against a real unit

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | tooling, no app surface | n/a |
| management | n/a | tooling, no app surface | n/a |
| staff | n/a | tooling, no app surface | n/a |
| vet | n/a | tooling, no app surface | n/a |
| volunteer | n/a | tooling, no app surface | n/a |
| signed out | n/a | tooling, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling, not an app feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `check-test-plan.mjs` and `gates.mjs` run on this tree; the other CI jobs in `ci.yml` are untouched and the new job sits beside them
- [ ] Shared file checked from a second page — n/a: no shared app file touched. `ci.yml` is shared, so the edit is one self-contained job inserted before `audit`, and line endings were normalised so the diff is 17 added lines, not a rewrite
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` found nothing to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what was done
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-02-script-integrity-reads-the-index.md` (index not working tree, and why; the glob pathspec trap; stated scope)
- [ ] `README.md` still accurate — n/a: README does not mention these scripts or CI jobs. `docs/pi-hosting.md:122` already says `./scripts/pi/setup-test.sh`, which is now correct; no `bash scripts/…` workaround is documented anywhere (grep)
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a file mode and a CI step; no shelter user sees either
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the 11-vs-94 file counts and both failing runs are from the runs in §4

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: `scripts/` and CI are not part of the Worker bundle; nothing deploys
- [ ] Deployed SHA matches — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: the one boundary is `100755` vs anything else, run on both sides in §4
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence; the gates lines in §2 are pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Nothing deploys; the only runtime effect is that the two scripts lose their executable bit again. It does not cover the Pi: a clone there that has already pulled this keeps the bit until it pulls the revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First draft of the guard matched 11 of 94 `.mjs` files (git pathspec without `:(glob)`) and passed a deliberately broken `gates.mjs` | fixed before commit; see §4 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes. One thing only the PR itself will show: that the new `script-integrity` job runs and goes green on GitHub's Ubuntu runner (it was run here on Windows). Read it on the PR.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (script-exec-bits-guard session)  Date: 2026-10-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; every behaviour is a command with an exit code, run above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys; tooling only

Result: pass

Release manager acknowledgement: n/a (tooling only)  Date: —
