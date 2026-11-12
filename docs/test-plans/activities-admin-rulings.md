# Test plan — record nine of Lutan's fourteen activity rulings

## Header

| | |
|---|---|
| Feature | Record **nine** of the fourteen ungranted activities as Admin-only on purpose, with his words and the date he said them; stop the check calling an already-given ruling "no ruling yet"; and a decision file. **No card gains or loses anything, and no schema changes** |
| Backlog item | `docs/backlog.md` → `#c4vn7`. **Not ticked by this PR** — it is nine of fourteen, and the item already records the full ruling and what is left (committed on the `backlog` branch 2026-11-12, so this PR does not touch `docs/backlog.md` and cannot conflict with it) |
| Branch / worktree | `claude/activities-admin-rulings` @ `C:\Development\Animal_Shelter_activities-admin-rulings` |
| Dev server | n/a: nothing in this PR is served or rendered. The one code file is a build-time/CI script library |
| PR | #1511 |
| Tested by / date | Claude Opus 5 / 2026-11-12 |
| Carries a migration? | **no** — and that is the reason this PR is nine rulings and not fourteen (section 1) |
| Tested at SHA | this branch's own head, cut from `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — Lutan ruled all fourteen on 2026-11-12 one at a time; this PR applies the nine that need no migration
- [x] Files/areas touched listed — `docs/ungranted-activities-allowlist.json`, `scripts/lib/ungranted-allowlist.mjs`, `docs/decisions/2026-11-12-fourteen-activities-ruled.md`, this plan. **Nothing under `src/`, `worker/`, `supabase/`**
- [x] Cards affected identified — **none.** No card gains or loses an activity, no grant changes, no cell changes. Nine activities that were already reachable by Admin alone are now *recorded* as intended rather than *printed as unruled*. **A login's access is byte-identical before and after**
- [x] Anything explicitly out of scope written down — **the other five rulings**, which need a migration: `stock.usage` onto the two forecast cards (`card_grants`), and four unused edit levels removed from the catalogue (`permission_activities`). On 2026-11-12 `claude/refusal-keys-group-7` already carried a migration and the repo allows only one in-flight branch to carry one, so splitting was forced rather than chosen. Both halves are specified in the decision file, including the trap that each record must be **deleted** in the same change that closes its gap
- [x] **The checker wording change is in scope, and here is why it is not scope creep.** The fault this item exists to fix is a ruling that was given and then invisible: his three answers of 2026-11-09 were written only into a backlog note and `activities-grantable` still printed them as UNRULED three days later. Recording nine while leaving the check saying *"no ruling yet"* about the remaining five — which **are** ruled — would recreate the identical fault in the identical place, and `CLAUDE.md` names it (*a false block is silent*). One branch in one function, no behaviour change beyond the sentence printed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` minutes before the work
- [x] `node scripts/gates.mjs` — **typecheck=0 lint=0 test=0 build=0**, all four run on this branch
- [x] `node scripts/check-ungranted-activities.mjs` — the check this PR is about. **Exit 0**, `85 catalogue activities; 14 Admin-only on purpose, 5 UNRULED; 56 cards`. Before: **5 Admin-only on purpose, 14 UNRULED**. All five remaining lines now read `RULED 2026-11-12 by Lutan, waiting on the build — do not re-ask`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**, *"ok — docs/test-plans/activities-admin-rulings.md"*
- [x] Checked no test asserts the old wording before changing it — `grep` for `no ruling yet` across `.mjs`, `.ts` and test files finds it **only in the file being changed**

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no row. **The live card tables are untouched**, which is why no production measurement is claimed below

## 4. Functional checks

- [ ] All items — n/a: no functional surface. A JSON record, a sentence a CI script prints, and two markdown files

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login holding any card | exactly what it reached before | unchanged | n/a: no grant, cell or card changed |
| Admin | everything, by the `isAdmin` short-circuit | unchanged | n/a: untouched by this PR |

- [x] A login that should not have access is blocked server-side — n/a: no access boundary moves. The nine activities were Admin-only before this PR and are Admin-only after it; what changed is that the fact is now written down with a date and a reason

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. The only new sentence is printed by a CI script to a terminal
- [x] Timezone — n/a: the dates are literals, and each is deliberately **the date he gave the answer** (2026-11-09 for three, 2026-11-12 for six), not the date it was filed
- [x] Money and rounding — n/a. `reports.cashflow` is *about* money but nothing computes here

## 6. Regression

- [x] Nearest pages still work — n/a: no page. The two consumers of the changed library are `check-ungranted-activities.mjs` (blocking in CI) and `activities-grantable` (run on production by a person); the first was run and exits 0
- [x] Shared file touched — **`scripts/lib/ungranted-allowlist.mjs`, which both activity checks share on purpose** so they cannot disagree about a row. The change is additive: a pending record **without** `ruled`/`by` prints exactly what it printed before, so the two checks still agree and nothing that reads the old shape breaks. `fails`, `ruled` and the summary are untouched

## 7. Documentation

- [x] Backlog item ticked — **no, deliberately.** `#c4vn7` is nine of fourteen done; ticking it would hide the migration half. Its title and body were rewritten on the `backlog` branch the same day to say the ruling is complete and the build is what is left
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-12-fourteen-activities-ruled.md`, quoting his answers, recording the shape of them, closing the `0216` conflict, and specifying both halves of the remaining build with its trap
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice. No card changes, no page changes, no behaviour changes — a login can do exactly what it could yesterday. The two visible changes are a line a CI script prints and a JSON record
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the before and after figures are the check's own output, run before and after the edit. **The checker's required fields were read from `compareToAllowlist` rather than copied from a neighbouring record**, which is what caught that a pending record needs `ruled` *and* `by` for the new branch to fire. **The count-box mismatch was not asserted as fixed**: it is recorded as moot, with the condition under which it returns

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header
- [x] Deployed SHA matches the tested SHA — n/a: **this PR deploys nothing.** It changes no served code. The allow-list and the script library are read at CI time and by a person running a production check

### On the deployed build

- [ ] All items — n/a: nothing to deploy or smoke-test. **Stated plainly rather than ticked:** no production reading is claimed, because no grant changed, so there is nothing on production for this PR to have moved. `activities-grantable` reads the same file and will report the same 14 and 5

### Deploy safety

- [ ] All items — n/a: no deploy, no secret, no env var, no mail

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? **No — it contains neither.** That is the point of the split: the five rulings needing a migration are left for a branch that can carry one
- [x] `--dry-run` run and understood — n/a: no migration
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a

### Rollback

- [x] Rollback position stated — `git revert`. Reverting restores five Admin-only records and fourteen UNRULED lines; **no access changes either way**, because the file records intent rather than granting anything

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | **A ruling given on 2026-11-09 was still printed as "no ruling yet" on 2026-11-12**, because it reached only a backlog note. The planner handover and the check disagreed, and nobody noticed for three days | **Both causes addressed.** The nine are recorded with his words; and the check no longer claims a given ruling is missing, so the remaining five cannot be re-asked the same way |
| 2 | low | **The stock count box would be offered to a card holder the database always refuses** — the Diets and Medications pages gate it on the list's edit, while `record_stock_correction()` demands the Admin-only `stock.correct` | **MOOT, not fixed**, because he ruled both lists' edit Admin-only as well. Recorded on both allow-list entries and in the decision file **with the condition under which it returns** — the day either list's edit goes onto a card |
| 3 | low | **Several controls are hidden correctly but silently** — `project_folders` shows a folder's photos with no Add, no bin and no message; the stock pages open read-only the same way | **Found, not fixed, and named as not this PR's work.** Hiding is right; the missing explanation is a courtesy gap. The appeal photo chooser is recorded as the model that does it properly |
| 4 | none | `gates.mjs` and `check-test-plan.mjs` results | **All four gates 0** — typecheck 47s, lint 147s, test 44s, build 162s. `check-test-plan.mjs --base origin/main` exit **0** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** No served surface; the only new output is a line in a CI log | — |

Lutan's own outstanding jobs are listed in the record of `0.44.3` and on his Desktop. **Deliberately not
copied here**, because copied items get a second home that nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty

Manual verification by: n/a: nothing in this PR is served, imported by the app or rendered, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed over — this session carries it to merge

Result: pass with accepted defects
