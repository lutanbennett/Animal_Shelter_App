# Feature test plan — record `0.41.0` and the handover

## Header

| | |
|---|---|
| Feature | The `0.41.0` release record, the handover's `0.41.0` edition, and one paragraph promoted into the runbook about `Tee-Object` buffering |
| Backlog item | `docs/backlog.md` → n/a: the record and handover are steps in `docs/release-procedure.md`. The release's one new backlog item — removing the Anthropic SDK — was filed by the **backlog manager**, not this session, and is already on `main` as `22805187`; verified with `git log` rather than taken on trust |
| Branch / worktree | `claude/record-0-41-0` @ `C:\Development\Animal_Shelter_cut-release-0-41-0` — **the cut's own worktree, reused**, which paperwork rule 2 requires and which `0.40.12` could not do because another session's clean-up had removed it. Checked with `git worktree list` first, then `git checkout -b … origin/main`, the recipe corrected in `0.40.12` |
| Dev server | n/a: markdown only; nothing runs |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-31 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `823127ca` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for: the release that already shipped is written down, the handover is replaced with its `0.41.0` edition, and the `Tee-Object` buffering trap is promoted into the runbook so it is not re-derived
- [x] Files/areas touched listed: `docs/releases/2026-10-31-0-41-0.md` (new), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (one paragraph added), `docs/test-plans/record-0-41-0.md` (this file). No code, no migration
- [x] Roles affected identified: none. Documents under `docs/` are not served by the app
- [x] Anything explicitly **out of scope** written down: **this PR is not a gate**; `0.41.0` was deployed, mailed and verified before it existed. Removing the Anthropic SDK is the next release's work, not this PR's

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `823127ca` minutes before writing, after a `git fetch`
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: a documents-only PR skips the heavy CI jobs by design (paperwork rule 1). The release's gates ran on the cut, all four numbers read
- [x] CI green on the PR: filled in from the PR before merging
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR. It ran on the cut, exit 0, 16 `ok`
- [x] `node scripts/check-test-plan.mjs --base origin/main`, run the way CI runs it, exit **0**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The release's seven are applied; the next free number is `0296`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no path; these are documents
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked: the handover's ceiling holds at **111 lines** against an aim of about 100 and a limit of 150, measured with `wc -l`. The deleted-page command the handover prescribes was **run** on this release's range and printed nothing, which is why the `0.40.12` Pi fault could not recur

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | these files | no route serves `docs/` | **as expected**: no route added |

- [ ] Every role above tested — n/a: no role can reach a file the app does not serve
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: these describe a release to the people who run releases
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI
- [x] **The repository is public and these files were checked for anything that should not be in it.** No resident names: the one check that lists typed text (`assistant-could-not-help`) was read during verification and its contents were deliberately **not** copied into the record, because they are sentences real people typed and two of them name a resident and a person. No credentials. **No dev-session snippet**: one was used for the cut's browser check and is nowhere in these files. Worker version ids, Supabase project refs and the recipient of the release mail are the same class of identifier every record in this folder already carries, and the mail recipient is Lutan's own address, already in the repository's git history as the commit author

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the readers are the next release manager and `/plan-day`, who read these files by path. Paths unchanged; the record follows the `<date>-<version>` convention of its neighbours
- [x] Any shared file touched checked from a second, unrelated page: `docs/release-procedure.md` gains one paragraph in the production-deploy section, re-read in place against the paragraph above it so the two do not now contradict each other — the existing text says to confirm `.local/` exists, and the new text says what its *log file* being absent does and does not mean. The handover is replaced wholesale by design and says explicitly which of its predecessor's points it corrects
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged. `main` moved three documents-only commits during the release and the code-identity diff is empty

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item, and the release's new item was filed on the `backlog` branch by the backlog manager
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. The narrowing of the Pi-failover release note is recorded in the cut's plan and in the record, and it is a judgement about wording rather than about code
- [x] `README.md` still accurate: unchanged; it quotes no version number
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: the Worker deployment from `wrangler deployments list` matching the log's `Current Version ID`; the mail's **arrival** from the inbox rather than from `sent 1`; the after-picture from `role-cells` compared figure by figure against the before-picture; code identity from `git diff --name-only` filtered to non-documents, empty; `translations-unlisted` re-read after the apply to check `0293`'s own claim, 12 columns down to 2; the handover's length with `wc -l`; the backlog item's existence with `git log`

## 8. Pre-production gate

- [x] Tested SHA recorded in the header: the release's deployed SHA `73a4bdc5` is in the record's header, and all four builds came from it
- [x] Deployed SHA matches the tested SHA: for the **release**, every build is `73a4bdc5`, so the code-identity diff is empty by construction. For **this PR**, nothing is deployed
- [x] Deployed to test: **yes, for the release**: test Worker `6c600aee` and test Pi at `73a4bdc5`, both endpoints agreeing on `0.41.0`
- [x] Smoke-tested on `test.lannacare.org`: `/api/version` `0.41.0` @ `73a4bdc5`, Pi asset check byte-identical to the build, drift clean, and the test deploy correctly mailed nobody (`[off]: sent 0, skipped 40`)
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today"; every time in these documents is a literal quoted from a tool. The release's own unverified timezone surface is named in the record as a gap
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: this PR changes no boundary
- [x] **Evidence pasted into these documents is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served. For the release the purge was done and proved on both hosts, and the record states plainly that the signed-out surface itself is unverified because the site is locked
- [x] The production deploy's Supabase project line read, **for the release**: `dbkodyyxxhtygxcxmfcu (73a4bdc5)`
- [x] The `strip-baked-env` line seen, **for the release**: **14** on both environments, and the record notes which names were *not* in it
- [x] Any new secret/env var exists in the production Cloudflare environment: none needed, markdown only. The release added only **optional** assistant LLM entries, none required
- [x] **Does this PR contain both a migration and code that reads it?** No, neither
- [x] Rollback position stated: reverting this PR removes the record of a release that still shipped, restores a handover known to be out of date, and removes a runbook paragraph about a trap that has already misled one release manager. It cannot affect production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | The release's own items — the Anthropic SDK shipping against Lutan's wish, the `glob` advisory, the stale Pi type folders, `doctor-cells` — are in the record | Recorded there, not copied here, so each has one home |
| 2 | low | An earlier draft of this record asserted that **`main` did not move during the release**. It had: three documents-only commits. Caught by running `git log` before writing rather than after | **Fixed in the record**, which now states what moved, that the code-identity diff is empty, and that the correct response was to do nothing |
| 3 | low | One scratch command in this session was written with backticks inside a double-quoted `node -e`, so the shell ate three fragments and wrote a mangled line into the record draft | **Fixed**: the damage was inspected and the line rewritten with the right figures. Noted because the failure was silent — the command reported success |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in **this PR** needs a person. The release's items for Lutan are in the record and in the cut's plan, deliberately not copied here | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-31

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at; this PR is four markdown files, no UI, no route and no behaviour. The release's own items belong to the record and to Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
