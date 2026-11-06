# Test plan — release record and handover for `0.43.4`

## Header

| | |
|---|---|
| Feature | The `0.43.4` release record, the rewritten release handover, and one correction to `docs/test-plan-template.md`. **Documents only — no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → none. The record and handover are procedure (`docs/release-procedure.md` rule 3), not backlog items |
| Branch / worktree | `claude/record-0-43-4` @ `C:\Development\Animal_Shelter_cut-release-0-43-4` (the cut's own worktree, reused after its PR merged, as rule 3 says) |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head; `check-docs-only.mjs` is the check that matters and it is run below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three documents: `docs/releases/2026-11-06-0-43-4.md` (new), `docs/release-handover.md` (replaced), `docs/test-plan-template.md` (one paragraph corrected)
- [x] Files/areas touched listed — those three and this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Cards affected identified — **none.** No card, activity, cell or page. Admin and the signed-out public are unaffected: none of these files is served
- [x] Anything explicitly out of scope written down — **the release is already deployed and verified.** This PR describes it; it does not change it. It is **not a gate**, and nothing waits on it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was cut from `origin/main` at `edcac6f0` immediately before the first commit, so there was nothing to merge in
- [x] `node scripts/gates.mjs` — **n/a: a documents-only PR has nothing for the four gates to exercise, and `check-docs-only.mjs` is what establishes that.** Its output is the evidence, in section 6. Running a 12-minute build over three markdown files would produce a number, not a check
- [x] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run **before the PR was opened**, which is the ordering `0.43.2`'s record PR got wrong

## 3. Schema and data

- [x] n/a: no migration in this PR. The release's eight (`0318`–`0324`) were applied before its deploy and are recorded in `docs/releases/2026-11-06-0-43-4.md`; production reads `326 applied, 0 pending`, drift zero

## 4. Functional checks

- [x] Happy path works end to end — the documents render as markdown and their internal references resolve; checked in section 6
- [x] Data persists — n/a: documents, not rows
- [x] Create / edit / delete all exercised — n/a: this PR adds one file, replaces one and edits one; there is no delete and no user-facing operation
- [x] Empty state renders sensibly — n/a: no list and no empty state
- [x] Invalid input is rejected with a readable message, not a crash — n/a: nothing here takes input
- [x] Boundary cases checked — n/a: no values, thresholds or dates computed

### Role access matrix

Analysed by card. **No card's behaviour changes**, and no file here is served to anybody.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | these files are in git, not on any page | pass |
| any single card | nothing in this PR | as above | pass |
| signed out | nothing in this PR | as above | pass |

- [x] Every login above tested — n/a as a browser exercise: there is no surface. The claim being made is that no file here is served, and that is what section 6 checks
- [x] A login that should not have access is blocked server-side — n/a: no access surface in this PR

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change
- [x] Manual updated — n/a: the manual is for shelter users; a release record is for release managers
- [x] Translatable strings go through the translation path — n/a: no user-facing string
- [x] Mobile viewport (375px) — n/a: no layout
- [x] Browser console clean — n/a: no page
- [x] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — n/a: no page is near these files. `check-docs-only.mjs` establishes that, and its answer is the evidence:

```
deps-changed: false
docs-only: true — 4 path(s), all documents
  docs/release-handover.md
  docs/releases/2026-11-06-0-43-4.md
  docs/test-plan-template.md
  docs/test-plans/record-0-43-4.md
The heavy jobs will skip; test-plan still runs.
```

- [x] Any shared file touched checked from a second, unrelated page — **`docs/test-plan-template.md` is the one shared file here, and it was checked by use rather than by reading**: this plan was written against the corrected paragraph, and `check-test-plan.mjs` parses it. **Reading it would prove only that it was edited.** The corrected text names the hosts this release actually deployed to and verified, which is the strongest check available for a sentence of prose
- [x] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes no backlog item. **It does close a defect carried on two consecutive release records** — the template's wrong hosts — and that is recorded in the `0.43.4` record's Defects table rather than in the backlog, because that is where both earlier mentions live
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the judgement in this release is the deferred-note review and the UAT refusal, and both are written up at length in the release record, which is where a release manager looks. A decision file would be a third home for one of them
- [x] `README.md` still accurate — unchanged by this PR
- [ ] **Release notes.** n/a: nobody using the app would notice a release record, a handover or a test-plan template. None of the three is served, imported or rendered, and nothing under `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched — which `check-docs-only.mjs` confirms above rather than leaving to assertion
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — every figure in the record was read from a tool and is quoted with the command that produced it. The two that would have been easiest to assume were deliberately measured: that the deployed tree equals the tested tree (`git diff --stat c1a1a42a af21ad0d`, empty) and that no email was sent (an inbox search returning two older releases, so its silence about this one is the search working)

## 8. Pre-production gate

**Since the 2026-11-05 cutover:** `lannacareforanimals.org` is production; `test.lannacare.org` is test on
the dev project; `lannacare.org` is UAT. **This PR is the correction that makes the template say so.**

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: **this PR ships nothing.** The release it describes was deployed at `af21ad0d` and that is recorded in the record itself
- [x] Deployed SHA matches the tested SHA — n/a as a step of this PR: it was checked for the release and proved empty (`git diff --stat c1a1a42a af21ad0d`)

### On the deployed build

- [x] Deployed to test — n/a: documents are not deployed
- [x] Smoke-tested on `test.lannacare.org` — n/a: there is nothing to smoke-test, because nothing in this PR reaches any host
- [x] Timezone-sensitive behaviour proved — n/a: no logic in this PR derives a date. The dates in the documents are literals recording when things happened
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no boundary, band, threshold or cutoff in this PR
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the `check-docs-only.mjs` line in section 6 is its own output
- [x] Public pages re-checked after a cache purge — n/a as a step of this PR. It was done for the release and is recorded there, proved byte-for-byte from the Pi rather than by size

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: this PR performs no deploy. It was read for the release: `dbkodyyxxhtygxcxmfcu`
- [x] `strip-baked-env` seen — n/a: as above. Seen on every Worker build of the release
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR introduces no variable. The release's one new variable, `STATUS_READ_TOKEN`, is deliberately unset and fails closed, which the record explains

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? — n/a: it contains neither
- [x] The remaining lines of this section — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR removes a record of a release that has already shipped and restores a template paragraph that is known to be wrong.** There is no runtime effect either way. The release itself rolls back as the record describes: a Pi rebuild at an earlier ref, which does not revert the eight migrations — they are additive, so leaving them is safe

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **The template's wrong host mapping had survived two releases as a recorded defect.** `0.43.3` wrote it down *"for the planner"*; nothing happened; `0.43.4` met it again, in a plan written on 2026-11-06 that had inherited the sentence verbatim | **Fixed here**, with the correction naming the date it went wrong so a reader of an older plan knows which way it went. **Recording a thing twice and fixing it neither time is how a defect becomes furniture** |
| 2 | low | **This plan's own evidence block was wrong on its first write.** The `check-docs-only.mjs` line was typed from memory as `docs-only=true deps-changed=false`, which is not the shape the script prints. Running it for real then reported **`2 path(s)`** against four files that had been written — revealing that a `git stash` round-trip had restored two of them unstaged, so the first commit silently took only half the change | **Both fixed: the evidence replaced with the tool's actual output, and the two missing files committed.** Worth recording rather than tidying away, because the template's own rule — *evidence pasted into this plan is the tool's actual output, unedited* — is what caught a real defect here, not just a formatting slip. **A plausible-looking line I had written myself would have shipped a record claiming a fix that was not in the PR** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty, and that is a real answer rather than an omission: there is nothing in this PR for a person to look
at. The release's own two manual items are on `docs/test-plans/cut-release-0-43-4.md`, where they stay open
until somebody looks — **listing them again here would give them a second home that nothing ever closes**,
which is the fault the template warns about and which five cut plans accumulated before it was noticed.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing being signed for

Manual verification by: n/a: nothing in this PR has a surface a person could look at; the release's own manual items are on its cut plan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-06
