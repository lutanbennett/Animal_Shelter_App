# Feature test plan

## Header

| | |
|---|---|
| Feature | The planner handover's 150 lines becomes a target rather than a hard gate (Lutan's ruling, 2026-10-21) |
| Backlog item | `docs/backlog.md` → none. Raised as row 4 of `docs/test-plans/planner-handover-285.md`'s *Left for manual verification* — "a judgement for Lutan" — and answered by him in chat the same day |
| Branch / worktree | `claude/handover-ceiling-target` @ `C:\Development\Animal_Shelter_handover-ceiling-target` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | pending: opened immediately after this commit |
| Tested by / date | Claude (Daily Planner session) / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | `6502f098` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — the planner handover's line ceiling becomes a target, with the practical thresholds written down; Lutan asked for exactly this in the words *"yes let's make it a target not a hard gate"*
- [x] Files/areas touched listed — **two files, no code:** `.claude/skills/plan-day/SKILL.md` (step 8's length rule and its heading, +36/−4) and a new `docs/decisions/2026-10-21-handover-length-is-a-target.md`. No `src/`, no `worker/`, no `scripts/`, no `CLAUDE.md`, no migration, no `docs/backlog.md`
- [x] Roles affected identified — **none.** Neither file is served at any route. The audience is future Claude sessions running `/plan-day`, and Lutan
- [x] Anything explicitly **out of scope** written down — (1) **`docs/release-procedure.md` rule 4 is DELIBERATELY UNCHANGED.** It carries the identical *"treat 150 as the limit"* wording for the **release** handover. Lutan was asked about the planner's ceiling, in the context of the planner's four misses; the release side has its own author, its own history and its own measured 45-minutes-after-deploy cost, and nothing shows it has the same problem. **Changing it was not asked for and would be the planner editing the release manager's runbook.** Named in the decision file so the release side can take the same latitude if it wants it, as its own decision; (2) **the delta shape itself is unchanged** — the three rules, the "never carried forward" block and the promote-once rule are untouched and still outrank the line count; (3) **edition `285` was not retro-trimmed** to 150: it is merged at 152 and its accepted defect stands as the evidence for this change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (branch cut after #823 merged, so it already carried edition `285`)
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed — **the run reports four gates, not the template's three (`test=0` as well); the template's wording predates the test gate.** Pasted unedited

```
=== gates: build exited 0 after 113s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration. For the record `main`'s highest is `0245_public_story_drive_file.sql`, so `0246` is free and this branch does not claim it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, so there are no constraints or defaults to exercise
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. Reverting this PR reverts one rules file and deletes one decision file
- [ ] Production apply plan stated for the release manager — n/a: no migration from this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The happy path is a future edition landing at 155 lines and being shipped rather than trimmed, which only a later session can demonstrate — see *Left for manual verification*
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [x] Boundary cases checked — **the boundaries ARE the content of this change, and they are stated explicitly rather than left to judgement:** under ~150 say nothing, up to ~160 ship it, 200+ cut content rather than reword. Checked by reading the new text back in the committed file: all three thresholds appear, each paired with what to do at it. No code evaluates them, so reading is the only check available — but it was done, not assumed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — not served | n/a | n/a: not served by the app |
| management | nothing — not served | n/a | n/a: not served by the app |
| doctor | nothing — not served | n/a | n/a: not served by the app |
| 2IC | nothing — not served | n/a | n/a: not served by the app |
| volunteer | nothing — not served | n/a | n/a: not served by the app |
| signed out | nothing — not served | n/a | n/a: the repo is public, so both files are readable on GitHub; checked in section 7 that they name no real people beyond Lutan |

- [ ] Every role above tested — n/a: neither file is served at any route, so no role can reach them
- [ ] A role that should not have access is blocked server-side — n/a: no route exists to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; rules files get no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The manual is for shelter users
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing renders in a browser
- [ ] Network clean — n/a: no pages

## 6. Regression

**The risk is a rules file contradicting itself or its neighbour. Each was checked by reading the other side.**

- [x] The pages nearest the change still work — no pages. The things nearest it are the documents that state the same rule, checked below
- [x] Any shared file touched checked from a second, unrelated place — the skill is read by every `/plan-day`, so:
  - **The section heading now agrees with the rule.** It read *"THE HANDOVER IS A DELTA, AND IT HAS A CEILING"*; a heading saying "ceiling" above a paragraph saying "target" is exactly the kind of half-change that misleads a skimming reader. Changed to *"…AND IT HAS A LENGTH TARGET"*. **This is the #806 fault in miniature — two of three clauses shipping — and it was caught by grepping for every statement of the number before editing, not after**
  - **`grep -n '150\|100 lines\|ceiling\|the limit'` over the skill now returns only the new paragraph.** No second statement of the old rule survives in it
  - **The budget argument is preserved, not weakened.** The 2026-10-20 400-line edition and "the writing was the largest single cost" both remain, with a new sentence saying the cost is still real and only the over-run response changes. A reader who takes this as licence to write 400 lines is contradicted two sentences later
  - **The three delta rules and the "never carried forward" block are untouched**, and the new text says in terms that they outrank the line count. Verified by diff: the change is confined to the one paragraph plus the heading
  - **`docs/release-procedure.md` rule 4 still says "treat 150 as the limit"**, intentionally. Checked that the skill's new text does not claim to speak for the release handover: it does not mention it, and the decision file states the boundary explicitly. **The two documents now differ on purpose, and the difference is recorded** — which is the lesson from `ci.yml`'s two audit workflows ("do not 'tidy' the two to match")
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and all four gates ran green on the merged tree
- [x] **The change does not invalidate edition `285`'s accepted defect** — that defect is the evidence for this change, not something superseded by it. `285` stays merged at 152 and is not retro-trimmed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item, and `docs/backlog.md` is untouched. The request came from a test-plan manual-verification row answered in chat, not from the backlog
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-21-handover-length-is-a-target.md`, carrying Lutan's words, the four-edition table that justifies it, what the number is still for, and the deliberately narrow scope. **A decision file is right here even though edition `285` argued the opposite for its own promotions: that was a rule the planner wrote for itself, this is a ruling by Lutan, and `docs/decisions/` is where his rulings go**
- [x] `README.md` still accurate — unchanged and unaffected
- [ ] **Release notes.** — n/a: nobody outside the planning loop would notice. No page, component, manual topic, i18n string or Worker code changes, and neither file is served or bundled. `src/lib/releases.ts` is untouched
- [x] Commit messages say why, not just what — the message gives the four-edition evidence table in prose, says the budget is unchanged and only the over-run response differs, and states why the release side was left alone
- [x] **Claims were measured, not reasoned** — the four line counts (151, 131, 164, 170 against claims of 147, 104, ~125, ~130) come from the editions' own test plans and defect tables plus `wc -l` on the merged files; `285`'s four trimming passes are in this session's own history; the "returns only the new paragraph" claim is a re-run of the grep used to find the sites in the first place. **The one thing I cannot measure is whether the latitude gets used sensibly** — that is manual row 1

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Nothing in this PR reaches a deployed build: neither file is bundled
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the thresholds this PR states are prose read by a human, not a threshold any code evaluates. No rounding rule, retry window, pagination limit or permission cutoff is touched. The three thresholds are nonetheless each written with what to do at them, which is checked in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is pasted from the run
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

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores *"treat 150 as the limit"* and the "CEILING" heading, and deletes the decision file. No schema, no deployed artefact, no configuration. **What it does not cover:** reverting would put back a rule Lutan has explicitly changed, so a revert needs his word, not just a planner's judgement. It also would not undo edition `285` shipping at 152, which is already merged

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **The section heading still said "CEILING" after the paragraph under it had been changed to "target".** A skimming reader takes the heading as the rule, so the change would have been half-shipped | **fixed in the same commit** — heading changed to "LENGTH TARGET". Found by grepping every statement of the number *before* editing rather than after, which is the habit the #806 finding argued for: that PR shipped one of three clauses of a rule and nobody checked |
| 2 | low | The identical wording lives in `docs/release-procedure.md` rule 4 for the **release** handover, so a grep for the rule finds two sites and only one was in scope | **accepted, deliberately, and recorded** in the decision file and in section 1. Changing it was not asked for and belongs to the release manager. **The two documents now differ on purpose** — the same shape as `ci.yml`'s two audit workflows, which `CLAUDE.md` says not to tidy into agreement |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the latitude is used sensibly rather than as licence.** The failure mode this change could create is an edition at 250 lines defended as "a target, not a gate". The rule's answer is that 200+ means cut content, and promotion is the lever — but only a later edition shows whether that holds | The next two editions of `docs/planner-handover.md`, and their stated-vs-measured line counts |
| 2 | **Whether "write the figure last, measured with `wc -l`" actually stops the four-edition pattern** of stating a length that was never measured. This is the half of the change that costs one command and fixes the real fault | The next edition's opening line against `wc -l` on the merged file |
| 3 | **Whether the release handover should take the same latitude.** Deliberately not decided here. It is the release manager's runbook and its 150 is unchanged | `docs/release-procedure.md` rule 4, and the release manager's own judgement |

Row 3 is **Lutan's or the release manager's**, not mine; I have deliberately left it
rather than acting on it. Rows 1 and 2 cannot be checked by the session that made
the change.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it; the outstanding items are on the signature line below

Manual verification by: pending: three rows above, none checkable by the session that made the change

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: rules and documentation only — nothing in this PR reaches a deployed build
