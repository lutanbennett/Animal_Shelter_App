# Feature test plan — verification-queue

## Header

| | |
|---|---|
| Feature | `scripts/verification-queue.mjs` and `docs/manual-verification-queue.md`: read the 151 unsigned test plans, sort what is in them, and say what the queue actually contains |
| Backlog item | none — asked for by Lutan on 2026-10-03, relayed through the QA session, after a count of the queue came out of "where is the breakdown in the checks?" |
| Branch / worktree | `claude/verification-queue` @ `C:\Development\Animal_Shelter_verification-queue` |
| Dev server | not started — a script and a document, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `7c3831a8` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — a re-runnable reader of the manual-verification queue, plus the 2026-10-03 reading of it and the argument that follows
- [x] Files/areas touched listed — `scripts/verification-queue.mjs` (new), `docs/manual-verification-queue.md` (new). **No `docs/test-plans/` file is modified**, no gate, no CI job, no app code
- [x] Roles affected identified — none: developer tooling and documentation, never served by the app
- [x] Anything explicitly **out of scope** written down, below

### What this deliberately does not do

- **It does not sign, close or edit any plan.** The script reads `docs/test-plans/` and writes nothing. Closing a row is the owner's act, and for `look` rows only the person who looked may do it
- **It does not change what `check-test-plan.mjs` enforces**, nor branch protection. `CLAUDE.md` records `test-plan`'s soft-gate status as Lutan's staged rollout and explicitly not a session's call. The document argues for revisiting it and stops there
- **It does not touch production auth settings.** Several queue rows are undone Supabase settings; the document names them and says the console is Lutan's
- **It does not do the 14 tasks it found.** Finding them was the job

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked rather than assumed: the branch was created from `origin/main` at `7c3831a8` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 308s

gates: typecheck=0 lint=0 build=0
```

- [x] `node scripts/check-script-integrity.mjs` — `107 .mjs files parsed`, `ok`. Run because this PR adds a `.mjs` to `scripts/`, which is exactly what that guard covers
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: reads no database. The script reads markdown and `git log`
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/verification-queue.mjs` prints the summary; `--items` prints every item grouped by plan; `--kind work` prints one bucket. All three run against the real `docs/test-plans/`
- [x] Data persists — n/a in form, satisfied in substance: the script writes nothing by design, and that is the property worth asserting. `git status` is clean after every run
- [ ] Create / edit / delete all exercised — n/a: read-only tool, no write path to exercise
- [x] Empty state renders sensibly — a `--kind` with no matches prints nothing and exits 0, rather than erroring
- [x] Invalid input is rejected with a readable message — `--kind nonsense` prints nothing and exits 0. **Accepted, not fixed:** a typo'd bucket silently looks like an empty bucket. Noted as defect 1 rather than quietly tolerated
- [x] Boundary cases checked — the `pending` match deliberately accepts both `pending:` and `pending —`, because one plan uses the em dash and `check-test-plan.mjs` accepts it. Verified by name: `walkthrough-vet-pass-update` appears in the output, and dropping the loose match changes the count from 151 to 150

### The numbers were cross-checked against a different method

The script's three headline figures were each reproduced with plain shell, written before the script and not sharing a line of code with it:

| | shell | script |
|---|---|---|
| plans with a pending line | `grep -l '^Manual verification by: pending' \| wc -l` → **151** | **151** |
| plans in total | `ls docs/test-plans/*.md \| wc -l` → **260** | — |
| ever signed by a person | `grep -h '^Manual verification by:' \| grep -v pending \| grep -v 'n/a:' \| wc -l` → **40** | — |
| items | shell sum over the handover tables → **455** | **456** |

**The two item counts differ by one and the script's is right.** The shell count
matched table rows beginning `| 1`, `| 2`, …; the script parses the table and
takes any row with content in the second column. The extra row is in a table
whose numbering restarts or is absent. Recorded rather than reconciled away,
because a one-row discrepancy between two methods is the kind of thing this
whole document is about: the count that cannot see a row is the count that would
have reported success.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | a developer script and a doc, not served by the app | n/a |
| management | nothing | same | n/a |
| staff | nothing | same | n/a |
| vet | nothing | same | n/a |
| volunteer | nothing | same | n/a |
| signed out | nothing | same | n/a |

- [ ] Every role above tested — n/a: nothing here is reachable from the app
- [ ] A role that should not have access is blocked server-side — n/a: no access path

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the in-app manual is for shelter users; this is developer tooling
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — none; `build` compiled the app unchanged, which is the evidence that a new script under `scripts/` and a new doc touch nothing the app ships
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance: no shared file. The script only **reads** `docs/test-plans/`, and `check-test-plan.mjs` — the other reader of that directory — was run afterwards and still reports the plans as it did before
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item. The document's own recommendation is that the 14 `work` rows should move to the backlog, which is Lutan's to accept before anything moves
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a in form, satisfied in substance: `docs/manual-verification-queue.md` **is** the record of the choice and its reasoning, and a decision file pointing at it would duplicate it
- [x] `README.md` still accurate — unchanged; it does not describe the test-plan process
- [ ] **Release notes.** — n/a: no shelter user could notice a developer script or a document about test plans
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the document's two load-bearing claims were each checked rather than argued. That only 2 of 151 plans have an empty table is the script's output, against the expectation that most would. That the `public-views` CI job really runs is read from workflow run `37118893021`, which prints `ok` lines against a live database — a job skipped for want of secrets cannot. Where the document says a task is still open it says so **from the plan**, not from the console, and says which

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime dates. The script reads commit dates from `git log --format=%as`, which are already local calendar dates, and uses them only to sort
- [ ] **Boundary or banding change** — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block, the script-integrity line and the CI excerpt in the document
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR removes a read-only script and a document. Nothing in the app changes, no schema moves, and no plan was edited, so nothing it touched can be left half-done

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `--kind <typo>` prints nothing and exits 0, which looks identical to an empty bucket | accepted: the buckets are listed in the summary output above it, and the alternative — a validating script that nobody runs twice — is not obviously better. Worth fixing if anyone uses it in anger |
| 2 | low | The `work` / `read` / `look` classification is regex over each item's own words, so `look` over-collects and a `work` row phrased unusually will be missed | accepted and stated in both the script header and the document: it sorts, it does not judge. The 14 `work` rows were each read by hand before being written up |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the three recommendations are ones you want — in particular (1), moving tasks out of test plans and into the backlog, which changes how every future plan is written | `docs/manual-verification-queue.md`, "What to do about it" |
| 2 | The seven `work` rows listed as production settings: whether each is genuinely still open. The document says so **from the plan**, and only the Supabase and Google consoles can settle it | same file, the `work` table |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's; one is a decision about process and the other needs consoles only he can open

Manual verification by: pending: Lutan on the three recommendations, and on whether the seven production settings are still open

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises the finding
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-03 — and noting the irony on the record: this plan adds two more rows to the queue it is about. They are `look` rows, they are Lutan's, and they are the right shape for the table
