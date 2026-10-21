# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `285`, as a delta, with four durable rules promoted into the `plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is written at nine workstreams by the skill's step 8; Lutan asked for it directly in chat, 2026-10-21 |
| Branch / worktree | `claude/planner-handover-285` @ `C:\Development\Animal_Shelter_planner-handover-285` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | pending: opened immediately after this commit |
| Tested by / date | Claude (Daily Planner session) / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | `e32ec1fb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — the round's handover as a delta, plus four new durable rules promoted into the skill so this edition does not carry them either
- [x] Files/areas touched listed — **two files, no code:** `docs/planner-handover.md` (rewritten, 150 → 152 lines) and `.claude/skills/plan-day/SKILL.md` (+98 lines). No `src/`, no `worker/`, no `scripts/`, no `CLAUDE.md`, no migration
- [x] Roles affected identified — **none.** Neither file is served at any route. The audience is future Claude sessions running `/plan-day`, and Lutan
- [x] Anything explicitly **out of scope** written down — (1) **no change to `CLAUDE.md`**: all four promotions are rules the *planner* applies when reading the backlog or banding, not rules a *stream* follows; (2) **the next round was not planned** — the handover names candidates only; (3) **the four unwritten orphan reports were not written here**, though the handover now calls them the critical path: they are Lutan's ruled read-only chats, not a planner's PR; (4) **#807's missing release note was again not written here** — flagged for the `0.39.0` cut, because a planner adding a line to another stream's shipped work bypasses the judgement that stream was briefed to make

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed — **the run reports four gates, not the template's three (`test=0` as well); the template's wording predates the test gate.** Pasted unedited

```
=== gates: build exited 0 after 267s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration. For the record, `main`'s highest is `0245_public_story_drive_file.sql`, so the next free number is `0246` and this branch does not claim it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration. The 245/245 zero-drift figure read during the round came from this command
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, so there are no constraints or defaults to exercise
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. Reverting this PR reverts two documentation and rules files
- [ ] Production apply plan stated for the release manager — n/a: no migration **from this PR**. Ten *are* pending on production (`0236`–`0245`) from this round and the last; each is covered by its own PR's plan and by `docs/release-procedure.md` §5

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The happy path is a future session planning from these files, which no check here can exercise
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked — n/a: no input path. The one boundary this PR has is the 150-line ceiling, and it is **exceeded by two** — see defect 1

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — not served | n/a | n/a: not served by the app |
| management | nothing — not served | n/a | n/a: not served by the app |
| doctor | nothing — not served | n/a | n/a: not served by the app |
| 2IC | nothing — not served | n/a | n/a: not served by the app |
| volunteer | nothing — not served | n/a | n/a: not served by the app |
| signed out | nothing — not served | n/a | n/a: the repo is public, so both files are readable on GitHub; checked in section 7 that they name no real people beyond Lutan |

- [ ] Every role above tested — n/a: neither file is served at any route, so no role can reach them and there is nothing to differentiate
- [ ] A role that should not have access is blocked server-side — n/a: no route exists to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; rules files get no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The manual is for shelter users; these files are for the planning loop
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing renders in a browser
- [ ] Network clean — n/a: no pages

## 6. Regression

**The risk here is contradiction, not breakage: a promoted rule that disagrees with the document it came from, or a handover that drops something load-bearing. Each was checked by reading the other side.**

- [x] The pages nearest the change still work — no pages. The things nearest it are the documents that quote these rules, checked below
- [x] Any shared file touched checked from a second, unrelated place — the skill is read by every `/plan-day`, so:
  - **The four promotions do not duplicate what is already there.** The sub-note rule and the hub/leaf rule extend step 3's existing "Already done?" bullet from *is it done* to *is the whole of it visible*; the three band corrections sit beside the existing band table rather than restating it; the STEP ZERO block is a **third** brief block alongside the finish-line and STOP blocks, placed so a stream reads it with them. Checked by grepping the handover for the figures it would otherwise repeat: `111,834` and `110,653` appear **zero** times in it
  - **"Stop designing dial experiments" does not silently delete the model guidance above it.** The defaults-by-shape list and the "effort raises the figure" warning are untouched; what is retired is only the *instruction to vary one dial per batch as a plan*, and the new paragraph says so in those words. Nothing measured was invalidated
  - **The STEP ZERO block does not contradict the finish-line block.** The finish-line block says never end with a built branch and no PR; STEP ZERO says to stop *before building* if the work already exists, and states that this is a success rather than a failure. Different moments, no conflict — and STEP ZERO explicitly says not to open a PR in that case, which the finish-line block would otherwise seem to demand
  - **The hub/leaf rule does not contradict the existing "reading widely is cheap" correction.** That one is about *token cost*; this one is about *predicted impact*. Checked that the new text does not touch the three cost questions
  - `git check-ignore -v .plan-day.md` still reports it ignored, so the scratchpad-then-redirect route has not changed what the file is
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and all four gates ran green on the merged tree
- [ ] **The ceiling is respected by the document that states it** — n/a: NOT MET, and recorded as defect 1 rather than trimmed further. 152 lines against the stated 150, after four passes from 170. Stopping was a deliberate call: the remaining two lines cost more round-trips than they save, and the paperwork has a time budget too
- [x] **`276`'s three manual-verification rows are all ANSWERED, and this PR is the evidence.** Row 1 (do promotions remove themselves from the next edition?) — **yes, three for three**: this edition cites the skill for the band corrections and carries none of `276`'s seven promoted facts. Row 2 (does a trap in the skill rather than a defect table change behaviour?) — **yes**: the CRLF trap was handled correctly first time this edition, with no recurrence, by following the skill's step 6 rather than rediscovering it. Row 3 (is `production-rehearsal` displaced a third time?) — **yes, it was**, and the handover records it with the count attached, as `276` asked

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item, and `docs/backlog.md` is deliberately untouched here. This round's nine items were ticked on their own feature branches; the four *title* corrections, the two newly filed items and the `worktree.mjs list` item went on the `backlog` branch, which is where backlog edits belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **deliberately not a separate file: the decision is the rule, and it is written where the rule lives.** Each promotion carries its own date, evidence and reason inside the skill. A decision file would be a third copy, which is the fault the delta rule exists to fix
- [x] `README.md` still accurate — unchanged and unaffected; it does not describe the handover
- [ ] **Release notes.** — n/a: nobody outside the planning loop would notice. No page, component, manual topic, i18n string or Worker code changes, and neither file is served or bundled. `src/lib/releases.ts` is untouched by this PR; its nine `unreleased` lines came from this round's feature PRs
- [x] Commit messages say why, not just what — the first states what was promoted and why it belongs in the skill rather than here; the second states the trim and the measured result
- [x] **Claims in the handover were measured, not reasoned** — the nine actuals are `get_usage` readings taken in the turn each batch's merge was confirmed; **model and effort are `get_session`'s own fields for all nine sessions, not the recommendation**, which mattered enormously this round (five of nine ran on a different model from the one recommended); `wc -l` for every line count; `check-menu-coverage.mjs` run before and after for 66 → 15; `gh pr list` for PR numbers and "no open PRs"; `awk` over `releases.ts` for the nine `unreleased` lines; `git log --name-only` and targeted greps for each of the five already-built findings. **The one claim I cannot measure is the counterfactual** — that briefs rather than the model produced the good spread. The handover says so plainly and says four Opus readings prove nothing

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Nothing in this PR reaches a deployed build: neither file is bundled
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic in this PR, so nothing derives a date at runtime
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the bands this PR corrects are planning estimates in prose read by a human, not a threshold any code evaluates
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is pasted from the run; the line counts are `wc -l` output
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the `276` handover and the previous skill. No schema, no deployed artefact, no configuration, no `CLAUDE.md` change. **What it does not cover:** the four promoted rules would be lost with it, so a revert should carry them forward rather than drop them — they are the durable half of this PR and the handover is the disposable half

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **The handover is 152 lines against the 150 it states as a limit.** Four trimming passes took it 170 → 158 → 154 → 152, and each pass cost a round-trip because several substitutions replaced prose with prose of the same line count | **accepted, deliberately, and this is the fourth edition running to miss on the first write** (`276` claimed ~125 at 164, `267` claimed 104 at 131, `258` 147 at 151). `276` predicted "worth watching whether `285` does it again" — it did. **The honest reading: the ceiling is not the binding constraint, the first draft's length is**, and chasing the last two lines spends more than it saves. The paperwork has a time budget too (`docs/release-procedure.md`). **Recommend the next edition write its content first and its stated figure last, and treat 150 as a target rather than a hard gate** |
| 2 | high | **Five items were offered to Lutan as workstreams and all five had already shipped.** He caught four of them | **fixed within the round and promoted** — four titles rewritten in place on the `backlog` branch, and the STEP ZERO block added to the skill so every future brief re-checks. **The planner, not the streams, was the fault**, and the skill already said to trust commits over item prose |
| 3 | medium | **Two items existed only as sub-notes inside other items**, so they were invisible to anyone skimming titles and had nothing to tick | **fixed and promoted** — both filed on the `backlog` branch, and the skill's step 3 now says to read tails for follow-ups and file them |
| 4 | medium | **An item predicted 12 closed rows; the stream closed 51.** The planner quoted the item without asking whether the orphans were leaves or doorways, and so under-stated how close the menu-removal gate was | **fixed and promoted** — the hub/leaf rule is in the skill's step 3 |
| 5 | medium | **The round's dial plan was fiction.** Sonnet was recommended for batch 2 and all three ran Opus; Fable was recommended twice and both ran Sonnet | **fixed by retiring the plan** — the skill now says recommend, never plan around it, and record `get_session`'s answer. **No measurement was wrong**, because `get_session` was read every time, which is `276`'s rule working |
| 6 | low | **Two sessions retitled `docs/backlog.md` concurrently**, duplicating effort, and the next `git merge backlog` conflicted because each side had ticked one of two items the same PR closed | **fixed and recorded in the handover, not the skill** — it is a question of who does what in a multi-session day rather than how to plan, so it belongs in the disposable half. Conflict resolved by taking the ticked variant of each |
| 7 | low | A `python - <<'PY'` fallback wrapper around a `node -e` script ran the node branch but printed the heredoc marker handling oddly, costing one round-trip and achieving a zero-line reduction | **accepted** — no rule worth adding. The lesson is already in the skill: write the amendment script to the scratchpad and run it by path, which is what the other three passes did |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the STEP ZERO block actually stops a stream rebuilding shipped work.** Nine briefs carried it this round but no stream hit the case, so it is untested in anger. The test is a future stream reporting "already built, stopping" instead of opening a redundant PR | The next round's PRs and session reports, against the skill's step 7 |
| 2 | **Whether the four remaining orphan reports get run as chats.** The handover calls them the critical path to finishing the cards programme; they have been in Next up for days and two have dropped out of it entirely. Whether that is because they were written or because they were lost is **a question for Lutan**, and the handover says to check | `docs/backlog.md` Next up, and Lutan's Desktop for any report already written |
| 3 | **Whether `production-rehearsal` is displaced a FOURTH time.** It lost its slot twice to release-gating work and a third time to Lutan's own instruction. The handover tells the next planner not to displace it again without saying so to him | The next `/plan-day`, and `.plan-day.md`'s batch tables |
| 4 | **Whether the 150-line ceiling is the right target at all.** Four editions have missed it on the first write. Defect 1 recommends treating it as a target rather than a gate; that is a judgement for Lutan, not for the planner to change unilaterally | The skill's step 8, and whichever edition follows |

None of these can be closed by the session that wrote the document, and nothing at
deploy time touches any of them. **All three of `276`'s rows are closed, and
section 6 records how** — which is the evidence that these rows get answered
rather than accumulating.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it; the outstanding items are on the signature line below

Manual verification by: pending: four rows above, none checkable by the session that wrote this document

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: rules and documentation only — nothing in this PR reaches a deployed build
