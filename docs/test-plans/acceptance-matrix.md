# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `scripts/acceptance-matrix.mjs` generates the role-by-activity acceptance checklist from the manual, the role walkthrough and the Admin-on-mobile decision, and `npm run lint` fails when a manual topic has no matrix entry |
| Backlog item | `docs/backlog.md` → "A role-by-activity matrix that becomes the acceptance checklist the shelter signs" |
| Branch / worktree | `claude/acceptance-matrix` @ `C:\Development\Animal_Shelter_acceptance-matrix` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not used: script and docs only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (acceptance-matrix session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | tip of the branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: a generator that reads the manual (`isForRole`), a hand-written entries file and the walkthrough's "must not" bullets, and fails loudly when any of them has drifted from the others
- [x] Files/areas touched listed: `scripts/acceptance-matrix.mjs` and `scripts/lib/acceptance-matrix-entries.mjs` (new), `package.json` (`lint` now also runs `--check`), `docs/decisions/2026-10-02-acceptance-matrix.md`, `docs/backlog.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`; the manual is read, not edited
- [ ] Roles affected identified — n/a: no app role's access changes; the *document* is for the shelter's testers, one sheet per role
- [x] Out of scope written down: the A4 sign-off PDF, Thai-language instructions, and agreeing who tests which role (filed as a follow-up on the `backlog` branch); the dry run itself (`fable-dry-run`, which waits on this PR)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR
- [x] `node scripts/gates.mjs` — see PR for the closing line
- [x] CI green on the PR — see PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration (0131 is held free for the failover work and was not claimed)
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

`node scripts/acceptance-matrix.mjs --check` against the real manual and walkthrough
printed `ok — 67 manual topics → 93 activities, 42 walkthrough lines + 3 visitor lines`.
`--out` produced the whole document and `--role vet` a single role's sheet (the matrix table plus that role's tables).
The failure paths were exercised on a scratch copy and then restored: a manual
topic with no entry, an entry for a topic that does not exist, and a reworded
walkthrough "must not" line were all reported together in one run, each with the
entry to paste (see below).

- [x] **A manual topic with no entry stops the run.** The `print-manual` key was renamed to `print-manualX`: the run listed "Printing this manual … has no matrix entry" with a scaffold to paste, and separately "an entry for `print-manualX`, which is not a manual topic"
- [x] **A reworded walkthrough "must not" line stops the run.** "Removing the last admin is refused" was reworded: reported once as a line with no boundary (with the `{ role, starts, text }` to add) and once as an orphaned boundary
- [x] **Every walkthrough "must not" bullet has an entry.** 42 bullets across Passes 1–6 matched exactly one boundary each; no boundary is unmatched
- [x] **`isForRole` is what decides the cells.** The vet column does Appointments and not My tasks; the volunteer column does the assistant's questions and not its writes; admin alone does "Withdraw a death", "Accounts and roles" and the access-requests task (read from the generated matrix)
- [x] **Entries cannot widen the manual.** The generator refuses an entry whose `roles` names a role the topic is not for (checked by reading the code path; no scratch case was run for this one)
- [ ] Create / edit / delete — n/a: nothing is stored; the script writes only where `--out` points
- [ ] Empty state — n/a: every role has rows today; a role with none would simply omit its first table
- [x] Invalid input: an unknown `--role` exits 2 and lists the roles
- [x] Boundary cases: a topic that is public to all (`public-pages`), a signed-in-only one (`change password`, public viewer included) and a visitor-only one (`request access`) each came out in the right columns

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | tooling and a document; no app surface | n/a |
| management | n/a | tooling and a document; no app surface | n/a |
| staff | n/a | tooling and a document; no app surface | n/a |
| vet | n/a | tooling and a document; no app surface | n/a |
| volunteer | n/a | tooling and a document; no app surface | n/a |
| signed out | n/a | tooling and a document; no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed; the matrix *describes* what each role must not do, and the dry run tests it

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: the manual is the input here and was deliberately not edited, so the dry run's screenshots stay valid
- [ ] Translatable strings — n/a: no app strings; the checklist's instructions are English only until the Thai manual exists (recorded in the decision)
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest thing still works: `npm run lint` (eslint, `check-migration-grants`, then the new `--check`) — see PR for the exit code
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`; the part not built (PDF edition, pre-run agreements) went on the `backlog` branch as a new item
- [x] Non-obvious design choices recorded in `docs/decisions/2026-10-02-acceptance-matrix.md`: what a row is, committed-or-generated, how the walkthrough's "must not" lines attach
- [x] `README.md` still accurate — it does not describe the lint script or the UAT documents
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing in the app changes. The *generated matrix is itself a shelter-facing document* (the one the shelter signs), but it is not shipped in the app and nobody meets it until the dry run and the shelter's own run
- [x] Commit messages say why, not just what
- [x] Claims were measured: the counts above are from the real run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager; `scripts/` and `docs/` are not in the Worker bundle
- [ ] Deployed SHA matches — n/a: nothing in the deployed site changes

### On the deployed build

- [ ] Deployed to test — n/a: nothing in the deployed site changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in the deployed site changes
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: covered in §4
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: deploy.mjs untouched
- [ ] `strip-baked-env` seen — n/a: build path untouched
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Nothing persistent is written; only `lint` gains a check, so reverting also removes the gate

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The backlog item says the manual has 81 topics, 55 tagged; it has 67 (the figure was counting something else). The matrix uses the real count | accepted — the item is ticked and its numbers are not relied on |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the generated document as a shelter worker would: are the "what to do" and "you should see" lines plain, and is any expected result wrong for the app as it is today? The dry run (`fable-dry-run`) is the first to walk it and corrects the matrix where it finds one wrong | `node scripts/acceptance-matrix.mjs` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (acceptance-matrix session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; this is Lutan's to tick after reading the document

Manual verification by: pending: the one item under Left for manual verification. The expected results are written from the manual and the walkthrough and have not been tried against the running app; that is what the dry run and then the shelter's run are for

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in the deployed site changes

Result: pass

Release manager acknowledgement: n/a (tooling and documents only)  Date: —
