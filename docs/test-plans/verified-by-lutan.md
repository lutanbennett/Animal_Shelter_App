# Test plan — record what Lutan verified on 2026-11-12

## Header

| | |
|---|---|
| Feature | Record three things Lutan did or checked himself after `0.44.3`, in the plans and handover that claim otherwise, and answer two SHA lines the release record can now settle. **Documents only** |
| Backlog item | `docs/backlog.md` → none. These are test-plan signatures and a handover correction, not backlog work |
| Branch / worktree | `claude/verified-by-lutan` @ `C:\Development\Animal_Shelter_verified-by-lutan` |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #1512 |
| Tested by / date | Claude Opus 5 / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — he reported three things done in chat; this records them where the documents currently say they are outstanding
- [x] Files/areas touched listed — `docs/test-plans/login-inapp-browser.md`, `docs/test-plans/cut-release-0-44-3.md`, `docs/release-handover.md`, and this plan. **Nothing under `src/`, `worker/`, `scripts/` or `supabase/`**
- [x] Cards affected identified — **none by this PR.** He assigned two cards himself on production; this PR only records that. No code or migration touches a card
- [x] Anything explicitly out of scope written down — **the release record `docs/releases/2026-11-11-0-44-3.md` is deliberately NOT edited.** It says 18 plans carried `pending:`, which was true when it was written; a release record is a snapshot of a moment, and rewriting it to track later events would make it untrustworthy as a record. The test plans are the authoritative home for verification and are where this goes
- [x] **What his words do and do not cover was read before anything was signed.** He said *"the message is clear and working when trying to login from an apps inbuilt browser"*. The manual item asks for four things: LINE **and** Messenger, no Google button, the notice in English **and Thai**, and sign-in working. His sentence covers the notice and sign-in. **It does not say which app, whether Thai reads correctly, or whether the Google button was absent**, so those three stay outstanding and the signature line says so. Same treatment for the release notes: he read them, which cannot settle whether the two Bills-tagged notes show *only* to Bills holders, because that needs two logins

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` minutes before the work
- [x] `node scripts/gates.mjs` — n/a: documents-only PR; `check-docs-only.mjs` decides and `ci.yml` gates the heavy jobs on it. Nothing here was changed to make a check run
- [x] `node scripts/check-docs-only.mjs --base origin/main` — exit **0**, listing exactly the four files: *"The heavy jobs will skip; test-plan still runs."*
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] The two cards were **measured on production**, not taken on his word — `check-production.mjs role-cards` shows `approve_text` and `diet_settings` in the Management set

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no row

## 4. Functional checks

- [ ] All items — n/a: no functional surface. Three markdown files

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | none of these files | unchanged | n/a: not served, not imported, not rendered |

- [x] A login that should not have access is blocked server-side — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. **Noted, not fixed:** whether the sign-in notice's Thai reads correctly is one of the three things his confirmation does not cover, and it stays outstanding
- [x] Timezone — n/a: dates are literals, each the date he reported the thing done
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — n/a: no page
- [x] Shared file touched — **`docs/release-handover.md`**, edited in two places only: the paragraph claiming nobody holds the two cards, and the matching closing bullet. **It stays at 150 lines**, counted with `wc -l`, which is rule 4's limit — the replacement paragraph was written long and then trimmed to hold the line rather than letting the file drift past it. The surrounding delta is untouched
- [x] **Line endings checked before editing, because this is where a docs edit goes wrong.** The worktree checks these files out as CRLF while git stores LF. A multi-line pattern joined with `\n` therefore does not match, and a careless fix strips every CR in the file and produces a whole-file diff. The edit script joins with the file's own ending and **refuses rather than guessing** if the paragraph is not found verbatim; it did refuse once, which is how this was caught. `git diff --numstat` is the proof: **4/4, 5/5 and 3/3 lines**, not whole files

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes none
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a. The one judgement is whose signature may be written and for what, and `CLAUDE.md` already rules it: Claude never signs the manual line on someone's behalf unless that person has looked and says so, and the line then says so. This PR follows that rule rather than making a new decision; the reasoning is in section 1 beside the evidence
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice. No behaviour changes and none of these files is served. The two cards he assigned change what one card set can do, but **he did that on production through Settings, not through this PR**, and no release note can announce a card assignment
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the cards were read off production rather than accepted; the SHA answers come from the release record's own table; and the diff sizes were checked to prove no line-ending churn

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header
- [x] Deployed SHA matches the tested SHA — n/a: this PR deploys nothing and changes no served code

### On the deployed build

- [x] Smoke-tested on the deployed build — **this PR records smoke testing rather than doing any.** What Lutan checked, he checked on production: the sign-in notice on a real phone, and the release notes on the deployed build
- [ ] Remaining items — n/a: nothing to deploy

### Deploy safety

- [ ] All items — n/a: no deploy, no secret, no env var, no mail

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither

### Rollback

- [x] Rollback position stated — `git revert`. It would restore three documents to claiming three things are outstanding that are not

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **Three documents claimed work was outstanding that Lutan had done** — most pointedly the handover, which said nobody holds the two cards and called it the fourth handover running | **Fixed here**, with the card state measured on production rather than copied from his message |
| 2 | none | A multi-line edit refused to apply because the pattern was joined with `\n` against CRLF files | **Caught by the script refusing**, not by a bad diff. Fixed by joining with the file's own ending; proven by the per-file numstat |
| 3 | none | `audit` will show `skipped` on this PR | Correct and expected for a documents-only diff. Skipped is not a pass; no dependency changes here |
| 4 | none | `check-docs-only.mjs` and `check-test-plan.mjs` results | **Both exit 0.** docs-only lists exactly the four files; test-plan reports ok |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** Markdown only, none of it served | — |

**What is still outstanding elsewhere, and deliberately not copied here:** which app the sign-in notice
was seen in, its Thai wording, the absence of the Google button, whether the Bills-tagged release notes
show only to Bills holders, a Thai speaker for the three refusal-key groups, and a Bills login attaching
a bill. Each is recorded on its own plan, where it will be closed.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty

Manual verification by: n/a: nothing in this PR is served, imported or rendered. **Lutan's own checks are the subject of this PR, not a check on it**, and each is attributed to him on the plan it belongs to

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed over — this session carries it to merge

Result: pass
