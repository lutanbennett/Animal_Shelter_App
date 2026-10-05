# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `scripts/load-residents.mjs`: bulk resident loads from a reviewed CSV, dry-run by default; and `worktree.mjs new` pre-answers the folder-trust prompt |
| Backlog item | `docs/backlog.md` → none: asked for in chat on 2026-10-05, after the 2026-10-04 loads showed the throwaway-script cost. A `grep` of `docs/backlog.md` was refused by the auto mode classifier (no reason given) and not retried, so whether a matching item already exists is unconfirmed — see **Left for manual verification** |
| Branch / worktree | `claude/load-residents` @ `C:\Development\Animal_Shelter_load-residents` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3019` (not needed; no UI) |
| PR | linked from the PR itself |
| Tested by / date | Claude (Animal shelter upload permissions session), 2026-10-05 |
| Carries a migration? | no |
| Tested at SHA | `6a26cc3` — the tip after both code commits. The later commits on this branch are `docs/` and `README.md` only and change nothing the gates read |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked: one permitted script at a fixed path for bulk resident loads instead of a throwaway script per load, plus one fewer click when a workstream folder is created
- [x] Files/areas touched listed: `scripts/load-residents.mjs` (new), `scripts/worktree.mjs`, `README.md`, `docs/decisions/2026-10-05-bulk-resident-loader.md` (new), `docs/decisions/2026-10-05-worktree-folder-trust.md` (new), `docs/test-plans/load-residents.md` (new). Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: developer tooling run from a terminal; no app role reaches either script. The rows it creates are ordinary residents and are read by whatever roles already read residents
- [x] Out of scope written down: no match-and-update mode (updating an existing resident stays a job for the app), no microchip/photo/medical-history columns, no xlsx reading, and `--apply` is not idempotent. The allow rule that makes this permitted lives in the main checkout's gitignored `.claude/settings.local.json` and is therefore not in this PR

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. Ticked on exit codes.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date." — `main` had not moved since the branch was cut), and it pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 139s

gates: typecheck=0 lint=0 build=0
```

- [x] `node scripts/check-script-integrity.mjs` — exit 0; the new `.mjs` parses under `node --check` and no `.service` exec bit is involved
- [x] CI green on the PR — all 6 checks passing on #369, `mergeStateStatus: CLEAN`, read from the PR status rather than assumed

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the loader only inserts, and the rows it reads (zones, enclosures, diet types, resident names) it reads read-only
- [ ] Constraints and defaults exercised against real rows — n/a: no migration. The equivalent for this change is §4, which runs the loader's own transaction against real dev rows and rolls it back
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Every case run against the **dev** project (`qxkmhwybjggxvsfxsxbd`) with real
zones, enclosures and diet types. Exit codes read from `$?` directly, not
through a pipe.

- [x] Happy path works end to end: a 4-row CSV dry-ran clean, then `--apply` created `R-2624` `Loader Test Alpha`, `R-2625` `Loader Test Beta`, `R-2626` `Loader Test Gamma`, exit 0
- [x] Data persists — a separate read-back query after the commit (not the loader's own output) confirmed, per resident: Thai name (`ทดสอบหนึ่ง`), sex, size, colour, `is_desexed`, `good_with_dogs`, `energy_level`, estimated age, the open `Intake` placement in the right zone/enclosure, the placement note, the diet (including the per-row `Renal diet` override), and the intake weight
- [x] Create exercised. **Edit and delete — n/a by design:** the script only inserts; there is no update or delete path to exercise
- [x] Empty state renders sensibly: header-only file → "has a header but no rows", exit 2; file where every row is held → "Nothing to load: 2 row(s) read, 2 held, none left.", exit 2; missing file → exit 2
- [x] Invalid input is rejected with a readable message, not a crash: a 2-row file of bad values listed all six problems in one run (bad sex, bad size, non-numeric age, impossible date `31/31/2020`, the missing date that follows from it, unknown enclosure), printed "Nothing was sent to the database.", exit 1. One run reports everything wrong rather than the first thing
- [x] Boundary cases checked:
  - **Both edges of the size band** (the template's own warning): 9.99 kg → Small, 10 → Medium, 25 → Medium, 25.01 → Large. The band is closed at both ends as documented, and the two values that discriminate are the limits themselves, not a midpoint
  - **SQL quoting, proven by what was stored and not by the dry run passing**: `O'Malley The Quote Test` with the note `Note with an apostrophe: don't drop it, and a comma` applied as `R-2635`, and the read-back shows both strings byte-for-byte, with the comma inside the quoted CSV field intact
  - **Day-first dates**: `1/2/2021` stored as `2021-02-01`, not 1 Feb read as 2 Jan
  - **Missing optional fields**: an all-blank row loaded as `R-2626` with every optional column null and landed in `Lifecycle / Unassigned`, with all three warnings printed first
  - **Long text / unicode**: Thai names round-tripped
  - **Transaction boundary**: two full dry runs ran the same 3-row insert set and rolled back; the database held exactly one copy afterwards, which is what the re-run's clash check then proved
- [x] Name clash refused by default: re-running the applied file listed all three names as "a resident of this name already exists (--allow-name-clash to load anyway)", exit 1, nothing sent. With `--allow-name-clash` the same file dry-ran clean and the three lines moved to warnings
- [x] Held rows excluded and reported, not dropped silently: the held row was listed as `row 5 Loader Test Delta (hold: duplicate of R-0001?)` and the run ended "1 row(s) were held and still need a decision."
- [x] Unknown columns ignored and named: `columns ignored: Reviewer comment`, so a review workbook's own columns need not be stripped
- [x] `--receipt` wrote `resident_code,name,intake_date` for the three created residents
- [x] Exit code on refusal is 1, not 127. The first version crashed libuv (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`) on `process.exit()` while `fetch` still held a socket and exited 127; fixed the way `import-appsheet.mjs` documents, and re-checked
- [x] `worktree.mjs new` still works and pre-answers trust: a throwaway `trust-probe` stream was created and removed. One `projects` entry added to `~/.claude.json` with `hasTrustDialogAccepted: true`, the other 236 entries byte-identical, no entries lost, file still valid JSON in the app's own 2-space formatting with no trailing newline, no temp file left behind. The test entry was then removed, leaving the file as found

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | terminal tooling, no app surface | n/a |
| management | n/a | terminal tooling, no app surface | n/a |
| staff | n/a | terminal tooling, no app surface | n/a |
| vet | n/a | terminal tooling, no app surface | n/a |
| volunteer | n/a | terminal tooling, no app surface | n/a |
| signed out | n/a | terminal tooling, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed; neither script is reachable from the app
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed. The loader reaches the database through the Management API with `SUPABASE_ACCESS_TOKEN`, which is not an app role and already governs `apply-migrations.mjs` and `import-appsheet.mjs`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling, not an app feature. Its documentation is the script header, `README.md` and the two decision files
- [ ] Translatable strings — n/a: no UI strings. The loader's own output is developer-facing English
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI; nothing was loaded in a browser
- [ ] Network clean — n/a: no app page changed. The loader's own requests were watched by their status codes: `201` on every Management API call, no retries

## 6. Regression

- [x] The nearest things still work: `worktree.mjs new` (the `trust-probe` run above, `--no-install`), `worktree.mjs done` (same), and `worktree.mjs sync` (run on this branch) all exit 0. `scripts/lib/env.mjs` and `scripts/lib/csv.mjs` are imported, not modified
- [x] Shared file touched: `scripts/worktree.mjs`, checked by running three of its subcommands rather than by re-reading it. `README.md` is the other, and the paragraph edited is prose in "Project structure" with nothing reading it
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` reported "Already up to date.", so nothing was merged, and the gates ran on the result

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: no item to tick; this came from a request in chat on 2026-10-05, not from the backlog. Whether a related item already exists is unconfirmed because the file read was refused (see the header and **Left for manual verification**); nothing was ticked, so nothing is wrongly claimed either way
- [x] Non-obvious design choices added as new files in `docs/decisions/`: `2026-10-05-bulk-resident-loader.md` (CSV over xlsx, the `hold` column, `record_intake` over direct inserts, one transaction, clash-refusal as the default, the weight-to-size split, and `created_by` null as a stated limitation) and `2026-10-05-worktree-folder-trust.md` (where trust is stored, why the write is timid, and the race it cannot rule out)
- [x] `README.md` still accurate — the `scripts/` paragraph in "Project structure" now names `load-residents.mjs` and points at its decision file
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: developer tooling only. Both scripts run from a terminal on the developer machine; no page, string or behaviour a shelter user can reach changes. The residents a future load creates are ordinary residents, created the same way the intake form creates them
- [x] Commit messages say why, not just what: each of the two code commits opens with the problem it is for (throwaway scripts and the classifier refusal; one trust click per stream) before what it does
- [x] Claims in the commit messages and decision files were measured, not reasoned. Specifically: the size-band edges were run, not argued from the thresholds; the quoting claim rests on the stored value read back, not on the dry run passing; the `~/.claude.json` claim rests on a diff of all 237 entries before and after, not on the one entry added; and the classifier reasons quoted in the loader's header (`Credential Materialization`, no reason given, `Production Deploy`) are the strings from the 2026-10-04 transcript, not a paraphrase

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: `scripts/`, `README.md` and `docs/` are not part of the Worker bundle; nothing deploys
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: no "today" logic. The loader derives no date from the clock: every intake date comes from the file or from `--intake-date`, and is validated as a calendar date and passed as a `date` literal. The one clock-dependent expression is the receipt's `created_at >= now() - interval '15 minutes'` read-back window, which only chooses which rows to print after a successful commit
- [ ] Both edges of a band covered — n/a: nothing deploys, so there is no deploy-time band to check; the size band's four discriminating values were run in §4
- [ ] Evidence pasted is the tool's actual output, unedited — n/a: nothing deploys, so there is no deploy output to paste; the `gates:` lines in §2 are pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] Any new secret/env var exists in production — n/a: none added. The loader uses `SUPABASE_ACCESS_TOKEN`, which `apply-migrations.mjs` already requires

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Only the developer machine is affected and nothing deploys. **What a revert does not cover:** the `~/.claude.json` trust entries already written for folders created while this was in — they are the app's own data, they stay, and they are indistinguishable from entries the user clicked. That is harmless (the folders are trusted either way), but it is not undone by reverting. Residents created by a past load are not affected by reverting the script and would have to be removed through the app

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A refusal crashed libuv on Windows (`process.exit()` while `fetch` held a socket) and exited 127, so anything reading the exit code could not tell a refusal from a crash | fixed: no `process.exit()` past the first request; `process.exitCode` and return instead, as `import-appsheet.mjs` documents |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether `docs/backlog.md` already holds an item for a repeatable resident loader, and tick it if so. A `grep` of that file was refused by the auto mode classifier with no reason given; per the refusal it was not retried through another tool | `C:\Development\Animal_Shelter_Backlog\docs\backlog.md`, or `docs/backlog.md` on this branch |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Animal shelter upload permissions session)  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet checked; the one row is a file read Claude was refused, and it is Lutan's to confirm. It blocks nothing in this PR: nothing is ticked on the strength of it

Manual verification by: pending: Lutan — the backlog row above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys; developer tooling only

Result: pass

Release manager acknowledgement: n/a: nothing deploys
