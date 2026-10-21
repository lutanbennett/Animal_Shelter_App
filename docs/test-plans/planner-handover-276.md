# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `276`, as a delta, with seven durable facts promoted into the `plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is written at nine workstreams by the skill's step 8; Lutan asked for it directly in chat, 2026-10-21 |
| Branch / worktree | `claude/planner-handover-276` @ `C:\Development\Animal_Shelter_planner-handover-276` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | #813 |
| Tested by / date | Claude (Daily Planner session) / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | `93b9b30b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — the round's handover as a delta in the shape `267` asked for, with `267`'s two planning errors deleted and cited to the skill, plus seven new durable facts promoted so this edition does not carry them either
- [x] Files/areas touched listed — **two files, no code:** `docs/planner-handover.md` (rewritten, 131 → 150 lines) and `.claude/skills/plan-day/SKILL.md` (+44 lines across two commits). No `src/`, no `worker/`, no `scripts/`, no `CLAUDE.md`, no migration
- [x] Roles affected identified — **none.** Neither file is served at any route. The audience is future Claude sessions running `/plan-day`, and Lutan
- [x] Anything explicitly **out of scope** written down — (1) **no change to `CLAUDE.md`**: all seven promotions are rules the *planner* applies when estimating or amending, not rules a *stream* follows; (2) **the next round was not planned** — the handover names candidates only, and the next chat plans; (3) **no backlog item for the seven pending production migrations**: `docs/release-procedure.md` §5 catches them before any deploy, checked by reading §5 rather than assumed; (4) **#807's missing release note was not written here** — it is flagged for the `0.39.0` cut to confirm, because a planner adding a line to another stream's shipped work would bypass the judgement that stream was briefed to make

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed — **the run reports four gates, not the template's three (`test=0` as well); the template's wording predates the test gate.** Pasted unedited

```
=== gates: build exited 0 after 103s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration. For the record, `main`'s highest is `0242_special_diets_and_intake_read_recipes.sql`, so the next free number is `0243` and this branch does not claim it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration. The 243/243 zero-drift figure quoted in the handover was read with this command
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, so there are no constraints or defaults to exercise
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. Reverting this PR reverts two documentation and rules files
- [ ] Production apply plan stated for the release manager — n/a: no migration **from this PR**. Seven *are* pending on production (`0236`–`0242`) from this round's feature PRs; each is covered by its own PR's plan and by `docs/release-procedure.md` §5

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The happy path is a future session planning from the file, which no check here can exercise. **`267`'s equivalent unknowns are now answered — see section 6**
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
  - **The seven promotions do not duplicate what is already there.** The browser-verification cost and the schema-with-code split sit *beside* the existing band table rather than restating it; the commit-not-title rule sits immediately above the existing "Already done?" bullet and extends it from *items* to *PRs*; the counter rule sits under the existing counter line. Checked by grepping the handover for the band figures it would otherwise repeat: `126,512` and `235,561` appear **zero** times in it
  - **The schema-with-code correction does not contradict the readings it replaces.** The old single band `230–285k` is kept verbatim as the upper half, with its two measured readings named, and the new lower half is added with its own. Nothing was deleted, so no earlier measurement was invalidated to make the correction fit
  - **The commit-not-title rule does not contradict `CLAUDE.md`'s finishing section.** That section tells a *stream* to tick what its work closed; this tells the *planner* not to believe a tick without reading the commit. Different readers, same direction. `CLAUDE.md` is untouched
  - **The counter rule does not contradict step 8's nine-stream trigger** — it changes when a batch is counted, not the threshold. Verified by re-deriving this round from it: three batches × one count each = 9, which is what `.plan-day.md` now says
  - `git check-ignore -v .plan-day.md` still reports `.gitignore:55`, so the scratchpad-then-redirect route has not changed what the file is
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and all four gates ran green on the merged tree
- [x] **The ceiling is respected by the document that states it** — `wc -l docs/planner-handover.md` is **150**, the limit exactly, and the figure stated inside the file matches. See defect 3: it took three passes, from 164
- [x] **Both of `267`'s manual-verification rows are ANSWERED, and this PR is the evidence.** Row 1 asked *"whether promoting these four facts actually removes them from the next handover"* — **yes**: this edition cites the skill for the column-DROP rule and the read-the-whole-item rule and carries neither, which is most of why it fits in 150 lines while adding a round's worth of new findings. Row 2 asked whether the closing "what to delete next time" section was specific enough to act on — **yes**: it named the two errors and they were deleted without re-deriving which. **The promotion mechanism is now validated twice over** (`258`→`267`, `267`→`276`)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item, and `docs/backlog.md` is deliberately untouched here. This round's nine items were ticked on their own feature branches; the three *title* corrections went on the `backlog` branch (`84c46c5a`, `1b3b5c30`, `bc9a8401`), which is where backlog edits belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **deliberately not a separate file: the decision is the rule, and it is written where the rule lives.** Each promotion carries its own date, evidence and reason inside the skill. A decision file would be a third copy, which is the fault the delta rule exists to fix. The governing decision for the shape is `docs/decisions/2026-10-20-release-paperwork-speedup.md` plus the skill's step 8, cited rather than restated
- [x] `README.md` still accurate — unchanged and unaffected; it does not describe the handover
- [ ] **Release notes.** — n/a: nobody outside the planning loop would notice. No page, component, manual topic, i18n string or Worker code changes, and neither file is served or bundled. `src/lib/releases.ts` is untouched by this PR; its five `unreleased` lines came from this round's feature PRs
- [x] Commit messages say why, not just what — the first states what was promoted and why it belongs in the skill; the second states that the CRLF trap was promoted **because recording it in a test plan did not stop it recurring**, which is the reason rather than the change
- [x] **Claims in commit messages and the handover were measured, not reasoned** — the nine actuals are `get_usage` readings taken in the turn each batch's merge was confirmed; model and effort are `get_session`'s own fields for all nine sessions, **not** the recommendation (which mattered: the first Opus attempt reported Sonnet and was recorded as such); `wc -l` for every line count; `apply-migrations.mjs --status` for 243/243; `gh pr list` for PR numbers and "no open PRs"; `git log -1 --name-only` plus two greps for the #806 finding; and `grep -ci bills src/lib/releases.ts` cross-read against the five `unreleased` lines for the missing-release-note flag. **The one claim I cannot measure is the counterfactual** — that briefs rather than the model caused the improvement. The handover says so in those words, and says the single Opus reading proves nothing

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Nothing in this PR reaches a deployed build: neither file is bundled
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic in this PR, so nothing derives a date at runtime
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the bands this PR corrects are planning estimates in prose read by a human, not a threshold any code evaluates. No rounding rule, retry window, pagination limit or permission cutoff is touched
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

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the `267` handover and the previous skill. No schema, no deployed artefact, no configuration, no `CLAUDE.md` change. **What it does not cover:** the seven promoted facts would be lost with it, so a revert should carry them forward rather than drop them — they are the durable half of this PR and the handover is the disposable half

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **The CRLF trap recurred.** `267` hit it, fixed it and recorded it — in its own test plan's defect table. Forty minutes later every multi-line anchor against `SKILL.md` failed again, with no useful error, for the identical reason | **fixed, and promoted with its general rule** — normalise before matching, restore on write. The rule that came with it matters more than the trap: **a trap worth not repeating goes in the skill or `CLAUDE.md`, never only in a test plan or a handover**, because nobody reads an old defect table before acting |
| 2 | low | A single-quoted `node -e` holding `C:\Development` reached JS as `C:Development` (`\D` eaten as an escape), so the anchor silently rotted and the replacement failed its own guard | **fixed, and promoted** — write the amendment script to the scratchpad with the Write tool and run it by path. **It failed loudly only because the guard exists**; without one it would have matched nothing and reported success, which is the argument for the guard |
| 3 | low | The handover's own opening claimed ~125 lines at **164**, then 152, then 150 — three passes to meet a ceiling it states. Same class as `267` (claimed 104 at 131) and `258` (147 at 151): **three editions running, the stated figure was wrong on the first write** | **fixed** — measured with `wc -l` and trimmed to 150 exactly. **Accepted as a pattern rather than promoted:** the fix is to write the figure last, which no rule can enforce. Worth watching whether `285` does it again |
| 4 | medium | **The workstream counter read 12 for three batches of three.** Batch 3 was counted once when re-planned mid-round and again at setup. **Lutan caught it, not the planner** | **fixed, and promoted** — a batch counts once, at setup. The skill now also says what does and does not count (a release's own two PRs do not; an unplanned stream that shipped a PR does) |
| 5 | medium | **The planner advised cutting `0.39.0` early to stop the production migration gap growing, while `main` carried an unreleasable diets half.** Acting on it would have shipped a feature whose Feed Special Diets sheet could not show a Diabetic recipe | **fixed within the round** — withdrawn in the same conversation once the blocker item was read, and the blocker was scheduled into batch 3 at Lutan's request. **The general lesson is in the handover**: a merged PR is not a releasable PR |
| 6 | low | An anchor failed because the prose it matched wrapped differently in the file than in the script (`A heredoc in a` / `chained Bash command`), costing a round-trip | **accepted** — inherent to matching wrapped prose. The guard caught it immediately and the fix was to read the file's own wrapping with `grep -n -A`. No rule worth adding |
| 7 | low | **#807 narrowed a permission and `unreleased` carries no line for it.** A visiting vet who used the bills inbox will find it closed with nothing saying so | **deferred, and flagged to the release manager** rather than fixed here. The stream was briefed to judge this and did; a planner writing a release line into another stream's shipped work would bypass that judgement. Named in the handover for the `0.39.0` cut to confirm, **not** to overturn |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the seven promotions remove themselves from edition `285`.** The test is the same one `267` set and passed: if `285` re-explains the band corrections instead of citing the skill, the ceiling will not come down. Two for two so far | The next `/plan-day` handover, `docs/planner-handover.md` and `.claude/skills/plan-day/SKILL.md` |
| 2 | **Whether the CRLF rule's general half actually changes behaviour** — that a trap goes in the skill rather than a defect table. This PR is the first test of it, and only a later session hitting a *new* trap shows whether the habit took | The next edition's defect table, against the skill's step 6 |
| 3 | **Whether `production-rehearsal` is displaced a third time.** It has now lost the migration slot twice to release-gating work. The handover tells the next planner not to displace it again without saying so to Lutan; whether that holds is his call to see | The next `/plan-day`, and `.plan-day.md`'s batch tables |

All three are genuine unknowns about a document's usefulness, not deploy steps.
Nothing at deploy time closes any of them, and none can be checked by the session
that wrote the document. **Both of `267`'s rows are now closed, and section 6
records how** — which is the evidence that these rows get answered rather than
accumulating.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it; the outstanding items are on the signature line below

Manual verification by: pending: edition 285 has not been written yet, so none of the three rows can be checked

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: rules and documentation only — nothing in this PR reaches a deployed build
