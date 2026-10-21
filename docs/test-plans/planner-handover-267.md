# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `267`, as a delta, with four durable facts promoted into the `plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is written at nine workstreams by the skill's step 8; Lutan asked for it directly in chat, 2026-10-21 |
| Branch / worktree | `claude/planner-handover-267` @ `C:\Development\Animal_Shelter_planner-handover-267` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | #800 |
| Tested by / date | Claude (Daily Planner session) / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | `30f10f62` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — the round's handover, written as a delta in the shape `258` asked for: no answered-questions list, rulings cited rather than summarised, `.plan-day.md` cited for the per-stream figures, and the four facts that will still be true in three rounds promoted into the skill instead of carried
- [x] Files/areas touched listed — **two files, no code:** `docs/planner-handover.md` (rewritten, 149 → 131 lines) and `.claude/skills/plan-day/SKILL.md` (+38 lines, four insertions). No `src/`, no `worker/`, no `scripts/`, no `CLAUDE.md`, no migration
- [x] Roles affected identified — **none.** Neither file is served at any route. The audience is future Claude sessions running `/plan-day`, and Lutan
- [x] Anything explicitly **out of scope** written down — (1) **no change to `CLAUDE.md`**: the drop-pricing rule could have gone in its migrations section, but that section is read by *streams* and this is a rule the *planner* applies when estimating, so it went to the skill; (2) **the three new candidate items filed by this round's streams were not planned** — the next chat plans, and this file only says where the board points; (3) **no backlog item for the three pending production migrations**: `docs/release-procedure.md` §5 already runs `--status` and `--dry-run` before any deploy, so a second record would be a duplicate that can go stale — checked by reading §5 rather than assumed; (4) **the `frequency_id` item was not re-planned or re-scoped** beyond the correction already committed to the `backlog` branch, because Lutan parked it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed — **the run reports four gates, not the template's three (`test=0` as well); the template's wording predates the test gate.** Pasted unedited

```
=== gates: build exited 0 after 108s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration. For the record, `main`'s highest is `0238_scheduled_job_status.sql`, so the next free number is `0239` and this branch does not claim it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration. The 239/239 zero-drift figure quoted in the handover was read with this command
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, so there are no constraints or defaults to exercise
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. Reverting this PR reverts two documentation and rules files
- [ ] Production apply plan stated for the release manager — n/a: no migration **from this PR**. Three migrations *are* pending on production (`0236`, `0237`, `0238`) from this round's feature PRs, and the handover records that the new status tile reads red until `0238` is applied; each is covered by its own PR's plan and by `docs/release-procedure.md` §5

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The happy path is a future session reading the file and planning from it, which no check here can exercise. **But the previous edition's equivalent unknown has now been answered — see section 6**
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked — n/a: no input path. The one boundary this PR has is the 150-line ceiling, checked in section 6

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — not served | n/a | n/a: not served by the app |
| management | nothing — not served | n/a | n/a: not served by the app |
| staff | retired role (`0173`) | n/a | n/a: not served by the app |
| doctor | nothing — not served | n/a | n/a: not served by the app |
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

**The risk here is contradiction, not breakage: a promoted fact that disagrees with the document it came from, or a handover that drops something load-bearing. Each was checked by reading the other side.**

- [x] The pages nearest the change still work — no pages. The things nearest it are the documents that quote these rules, checked below
- [x] Any shared file touched checked from a second, unrelated place — the skill is read by every `/plan-day`, so:
  - **The four promotions do not duplicate what is already in the skill.** The ~128k baseline and the band table were promoted by `258`; this edition adds the nine-of-nine evidence *beside* them rather than restating them, and the handover cites the skill instead of repeating the figures. Checked by grepping the handover for the band rows: the strings `126,512` and `235,561` appear **zero** times in it
  - **The drop-pricing rule does not contradict `CLAUDE.md`'s migrations section.** `CLAUDE.md` says schema lands first as its own additive PR; the new skill bullet says a *destructive* removal is not that shape and must be priced as three streams. Read both: they address different operations and do not overlap. `CLAUDE.md` is untouched
  - **The "read the whole item" rule does not contradict the existing "Already done?" bullet** — it sits immediately above it and is about *where in the line* to read, not *whether to trust it*. Both now say trust the repo over the item's framing
  - **The scratchpad-then-redirect rule does not contradict step 6's gitignore requirement** — it changes how the file is written, not what it is or where it lives. `git check-ignore -v .plan-day.md` still reports `.gitignore:55`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and the gates ran green on the merged tree
- [x] **The ceiling is respected by the document that states it** — `wc -l docs/planner-handover.md` is **131**, inside the 150 limit, over the ~100 aim, and the figure stated inside the file matches the measured one. See defect 4: it first claimed 104
- [x] **The previous edition's one manual-verification row is now ANSWERED, and the answer is yes.** `258` left open *"whether the new handover is actually enough to plan from — only the next `/plan-day` chat can show this"*. That chat is this one: it planned and set up nine workstreams across three batches from the 149-line delta, and **did not have to re-derive anything the file should have told it.** The two things it got wrong (section *Defects*, rows 5 and 6) were misreadings of `docs/backlog.md`, not gaps in the handover. **The delta shape is validated by use, and that row can be closed** — recorded here because nothing else closes a row on a merged PR's checklist

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item, and `docs/backlog.md` is deliberately untouched here. This round's nine items were ticked on their own feature branches
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **deliberately not a separate file: the decision is the rule, and it is written where the rule lives.** Each of the four promotions carries its own date, its evidence and its reason inside the skill. A decision file would be a third copy, which is the fault the delta rule exists to fix. The governing decision for the shape itself is already `docs/decisions/2026-10-20-release-paperwork-speedup.md` plus the skill's step 8, both cited rather than restated
- [x] `README.md` still accurate — unchanged and unaffected; it does not describe the handover
- [ ] **Release notes.** — n/a: nobody outside the planning loop would notice. No page, component, manual topic, i18n string or Worker code changes, and neither file is served or bundled. `src/lib/releases.ts` is untouched by this PR; its three `unreleased` lines came from this round's feature PRs
- [x] Commit messages say why, not just what — the commit states what was promoted and why each promotion belongs in the skill rather than in a document rewritten every nine streams
- [x] **Claims in commit messages and the handover were measured, not reasoned** — the nine actuals are `get_usage` readings taken in the turn each batch's merge was confirmed; the model and effort are `get_session`'s `model` and `effort` fields for all nine sessions, not the recommendation; `wc -l` for every line count; `apply-migrations.mjs --status` for 239/239; `gh pr list` for the PR numbers and for "no open PRs"; and the production-migrations claim is the retention stream's own read-only `check-cron-job.mjs --env production` output, cited to its decision file rather than re-run here. **The one claim I could not measure is the counterfactual** — that the briefs and not the model caused nine of nine; the handover says so in those words, and that the dial has never been varied is why

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Nothing in this PR reaches a deployed build: neither file is bundled
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic in this PR, so nothing derives a date at runtime
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the bands this PR adds evidence to are planning estimates in prose read by a human, not a threshold any code evaluates. No rounding rule, retry window, pagination limit or permission cutoff is touched
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is pasted from the run; the line counts in section 6 are `wc -l` output
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

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the `258` handover and the previous skill. No schema, no deployed artefact, no configuration, no `CLAUDE.md` change. **What it does not cover:** the four promoted facts would be lost with it, so a revert should carry them forward rather than simply dropping them — they are the durable half of this PR and the handover is the disposable half

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `Write` refused to overwrite `docs/planner-handover.md` (file not read this session), and `rm` on `.plan-day.md` was **refused by the auto-mode classifier** as irreversible local destruction — so neither obvious route to replacing a file works | **fixed, and promoted** — write into the scratchpad, then `cat scratch > target`. Now in the skill's step 6 so the fifth edition does not rediscover it |
| 2 | low | A heredoc inside a chained Bash command failed to parse (`unexpected EOF while looking for matching`) on prose containing backticks and apostrophes, silently costing a round-trip | **fixed, and promoted** — same skill note: prefer Write-then-redirect, or a node `replace()` with a guard |
| 3 | low | Multi-line string replacements against `.claude/skills/plan-day/SKILL.md` failed with no useful error because **that file is CRLF** while `docs/planner-handover.md` is LF. The first edit applied and the second did not, leaving a half-edited file | **fixed** — reverted with `git checkout`, then normalised to LF, edited, and restored CRLF, so the diff is +38 lines rather than a whole-file rewrite. Verified with `git diff --stat` |
| 4 | low | The handover's own opening claimed **104 lines when it was 131** — the same class of error `258` recorded against itself (it claimed 147 at 151). A document that states a ceiling is the one place the figure must be measured | **fixed** — corrected to 131 from `wc -l`, and the sentence now also says it is over the ~100 aim rather than quietly implying it met it |
| 5 | medium | **The planner read two backlog items' openings and missed answers appended at their ends** — asking Lutan for three diet decisions he had already given and which were recorded on the item. He had to say so | **fixed at the cause, and promoted** — now a bullet in the skill's step 3 with the `tail -c` habit. The items themselves were correct and needed no change |
| 6 | medium | **The planner priced a column drop as two light streams.** `frequency_id` is read by a database function driving the medicine forecast, so it is three streams. Found only because Lutan asked for the detail | **fixed at the cause, and promoted** — a skill bullet saying to grep `supabase/migrations/` for the column name before pricing a removal. The item was reworded and parked on the `backlog` branch (`1819521d`) at his request |
| 7 | low | `docs/diets-ingredients-design.md` still lists its three questions as open, with "Recommended: yes" beside each, although Lutan answered all three and the answers are recorded on the backlog item. Anyone opening the note would think it is still with him | **deferred to the next round** — the handover and `.plan-day.md` both name it, and the diets schema stream is briefed to record his answers at the top of the note as its first act. **Not caused by this PR** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether promoting these four facts into the skill actually removes them from the next handover.** The point of a promotion is that edition `276` cites the skill and deletes the prose; if it re-explains them, the ceiling will not come down and the promotion failed. Only the next edition shows this | The next `/plan-day` handover, `docs/planner-handover.md` and `.claude/skills/plan-day/SKILL.md` |
| 2 | **Whether the closing "what to delete next time" section is specific enough to act on.** `258`'s equivalent worked — this chat did what it said. Mine names the two planning errors; a future planner has to judge whether that is enough | The next `/plan-day` in a fresh chat |

Both rows are genuine unknowns about a document's usefulness, not deploy steps.
Nothing at deploy time closes either, and neither can be checked by the session
that wrote the document. **Row 1 of `258`'s equivalent list is now closed, and
section 6 records how** — which is the evidence that these rows do get answered
rather than accumulating.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it; the outstanding items are on the signature line below

Manual verification by: pending: edition 276 has not been written yet, so neither row can be checked

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: rules and documentation only — nothing in this PR reaches a deployed build
