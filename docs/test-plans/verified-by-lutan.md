# Test plan — record what Lutan verified on 2026-11-12

## Header

| | |
|---|---|
| Feature | Record three things Lutan did or checked himself the day after `0.44.3`: a dated addendum to the release record, and a correction to the handover, which was asserting the opposite. **Documents only** |
| Backlog item | `docs/backlog.md` → none. A verification record and a handover correction are not backlog work |
| Branch / worktree | `claude/verified-by-lutan` @ `C:\Development\Animal_Shelter_verified-by-lutan` |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #1512 |
| Tested by / date | Claude Opus 5 / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, after `worktree.mjs sync` brought in #1511 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — he reported three things done in chat; this records them where the documents said otherwise
- [x] Files/areas touched listed — `docs/releases/2026-11-11-0-44-3.md` (an appended, dated addendum), `docs/release-handover.md` (two places), and this plan. **Nothing under `src/`, `worker/`, `scripts/` or `supabase/`**
- [x] Cards affected identified — **none by this PR.** He assigned two cards himself, on production, through Settings. This PR only records that
- [x] **Anything explicitly out of scope: the two merged test plans, and this is a correction of my own first attempt.** `docs/test-plans/login-inapp-browser.md` and `docs/test-plans/cut-release-0-44-3.md` were edited first, and that was wrong. A merged plan records what **its own PR** checked, and `check-test-plan.mjs` holds the whole plan to whichever PR touches it: editing the in-app plan made CI demand that *this* PR add a release note to satisfy that plan's release-notes tick — **a tick that was true for its own PR, which did add one.** Satisfying the check would have meant unticking a true record. Both files are reverted to `main`'s content and the verification went to the release record instead, which is the home `cut-release-0-44-3.md` nominates in its own words (*"pending: filled in the release record once merged"*)
- [x] **The handover is edited directly, and that is not the same thing.** A handover is a live delta rewritten every release, not a historical record; `CLAUDE.md` says a wrong one is corrected by its successor. It was claiming nobody holds the two cards and calling it *"Fourth handover running"* — a false statement in the first paragraph the next release manager reads
- [x] **The release record's existing figures are not touched.** It says 18 plans carried `pending:`, which was true when written. The addendum only adds, and says so in its first line

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run, after #1511 merged; the merge is in this branch
- [x] `node scripts/gates.mjs` — n/a: documents-only PR; `check-docs-only.mjs` decides and `ci.yml` gates the heavy jobs on it. Nothing here was changed to make a check run
- [x] `node scripts/check-docs-only.mjs --base origin/main` — exit **0** (read from the script, not through a pipe)
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** (read from the script, not through a pipe). **It failed on the first attempt with two real problems and that failure was the useful part**: see *Defects found*

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no row

## 4. Functional checks

- [ ] All items — n/a: no functional surface. Two markdown files and this one

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | none of these files | unchanged | n/a: not served, not imported, not rendered |

- [x] A login that should not have access is blocked server-side — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. **Noted, not fixed:** whether the sign-in notice's Thai reads correctly is one of the three things his confirmation does not cover, and the addendum records it as still open
- [x] Timezone — n/a: dates are literals, each the date he reported the thing done
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — n/a: no page
- [x] Shared file touched — **`docs/release-handover.md`**, in two places only: the paragraph claiming nobody holds the two cards, and its matching closing bullet. **It stays at 150 lines**, counted with `wc -l`, which is rule 4's limit — the replacement was written long and then trimmed to hold the line rather than letting the file drift past it
- [x] **Line endings checked, because this is where a docs edit goes wrong.** The worktree checks these files out as CRLF while git stores LF, so a multi-line pattern joined with `\n` does not match and a careless fix strips every CR and produces a whole-file diff. Both edit scripts join with the file's own ending, **refuse rather than guess** when a paragraph is not found verbatim (one did refuse, which is how this was caught), and the append script **asserts zero lone LFs afterwards**. `git diff --numstat` is the proof: **37/0 and 4/4**, not whole files

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes none
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a, and deliberately. The one judgement is *where a later verification belongs*, and the answer is recorded in the addendum itself, beside the evidence, rather than in a second file saying the same thing. The rule it follows already exists: `CLAUDE.md` on who may sign a manual line
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice. No behaviour changes and none of these files is served. The two cards he assigned do change what one card set can do, but **he did that on production through Settings, not through this PR**, and no release note can announce a card assignment
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the cards were **read off production** rather than accepted on his word; the diff sizes were checked to prove no line-ending churn; and the exit codes in section 2 were read from the scripts rather than through `tail`, which is the fault recorded below

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header
- [x] Deployed SHA matches the tested SHA — n/a: this PR deploys nothing and changes no served code

### On the deployed build

- [x] Smoke-tested on the deployed build — **this PR records smoke testing rather than performing any.** What Lutan checked, he checked on production: the sign-in notice on a real phone, and the release notes on the deployed build. What his checks do and do not cover is tabulated in the addendum
- [ ] Remaining items — n/a: nothing to deploy

### Deploy safety

- [ ] All items — n/a: no deploy, no secret, no env var, no mail

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither

### Rollback

- [x] Rollback position stated — `git revert`. It would restore the handover to claiming nobody holds the two cards, and remove a dated addendum. Nothing that runs changes either way

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **medium** | **I reported this PR's checks as passing on a piped exit code.** `node scripts/check-test-plan.mjs ... \| tail -1` returns **`tail`'s** status, not the script's, so a failing check read as exit 0 and was reported to Lutan as green. The check had two real problems throughout | **Mine, and recorded in the release record's addendum as well as here**, because it is the trap that record already names in its own defects section — repeated two hours later in the same session. Every exit code in section 2 is now read from the script directly |
| 2 | **medium** | **Editing two merged test plans was the wrong approach**, and CI caught it: holding the in-app plan to this PR made its release-notes tick unsatisfiable without unticking something that was true | **Reverted.** Both files are back to `main`'s content and the verification moved to the release record. **The check was right and I was wrong**; the reasoning is written into the addendum so the next person does not repeat it |
| 3 | low | **The handover asserted nobody holds the two cards**, calling it the fourth handover running, after Lutan had assigned them | **Fixed**, with the state measured on production rather than copied from his message |
| 4 | none | `audit` will show `skipped` on this PR | Correct and expected for a documents-only diff. Skipped is not a pass; no dependency changes here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** Markdown only, none of it served | — |

**What is still outstanding elsewhere, and deliberately not copied here:** which app the sign-in notice
was seen in, its Thai wording, the absence of the Google button, whether the Bills-tagged release notes
show only to Bills holders, a Thai speaker for the three refusal-key groups, and a Bills login attaching
a bill. Each stays on its own plan, where it will be closed, and the addendum names them too.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty

Manual verification by: n/a: nothing in this PR is served, imported or rendered. **Lutan's own checks are the subject of this PR, not a check on it**, and what each does and does not cover is tabulated in the addendum rather than signed off on his behalf

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed over — this session carries it to merge

Result: pass with accepted defects
