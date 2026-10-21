# Planner handover — edition `276`, 2026-10-21

**A delta, third edition in this shape — ~125 lines against `267`'s 131 and `258`'s 149.** The rules
are in `.claude/skills/plan-day/SKILL.md` step 8: ceiling ~100 lines, 150 the limit, say what
**changed**, promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `285`.**

> **Never carried forward: anything read from the repo.** Counts, migration numbers, PR numbers,
> release state, candidates — **re-read every time, never diffed.** Short prose, fresh facts.

---

## What `267` asked for, and what happened

- **"Cite the skill and delete the two planning errors." DONE** — the column-DROP rule and the
  read-the-whole-item rule are in the skill's step 3 and are not repeated here. That is this edition's
  main saving, as `267` predicted.
- **"Check for an open `planner-handover-*` PR first." HELD — checked, none. Keep it.**
- **"Capture the actuals the moment a batch merges." HELD, fourth round.** Nine of nine measured;
  `get_usage` again answered for sessions with `isRunning: false`.
- **"Brief the stream to run the allow-listed read-only script." FIRED, usefully** — `harness-reds`
  ran `check-bills-roles.mjs` before and after, and that before/after is what made its finding
  reviewable. `diets-sheet-schema` got the same shape.
- **The `rm`-then-write trap: HELD for a fifth edition, now with a THIRD half** (skill, step 6).
  `node -e` is no way round it: a single-quoted `node -e` holding `C:\Development` reached JS as
  `C:Development` and the anchor silently rotted. **Promoted.**
- **"The dial has never been varied." THIS IS THE ONE THAT CHANGED.**

## The dial was varied, and the honest answer is "one reading, no finding"

**`bills-and-groups-schema` ran `claude-opus-5-5` / `low`** — the first non-Sonnet reading in the
table — at **137,455 against a 150–185k band, ~8% under**, for a two-file schema PR that closed a
live permission and seeded a groups table.

**Do not report that as "Opus is cheaper", and do not let the next round quote it as evidence.** That
stream also had the tightest brief of its batch and `check-bills-roles.mjs` as a ready-made
instrument — the same pair of confounds that made a planner wrongly credit **Sonnet** in batch 89,
which `267` had to walk back. **Vary it again, on a different shape.**

**It took two attempts to get the reading.** The first time Lutan said mid-turn: *"Sorry I forgot to
change the model."* `get_session` reported Sonnet, and that is what went in the table. **Recording the
recommendation as the setting would have produced a false finding.** So: **ask him in the message
where he opens the session, not in the plan he reads before it.**

## `267`'s nine-of-nine did NOT repeat, and that is the correction to carry

**Nine streams: six under, three over, none over by more than 10%.** Figures are in `.plan-day.md`;
**cited, not repeated.**

`267` concluded prescriptive briefs made every estimate hold. **Softer and truer: the briefs removed
the LARGE overruns, not all overruns.** The old +50%/−39% swings are genuinely gone; ±10% noise
remains. **All three overruns were the planner's estimating, not the streams' scope** — three
different errors, all now in the skill's token section:

1. **A proof harness makes a schema PR dearer.** `diets-schema` was told the back-fill proof *was* the
   deliverable, then priced as a single-file schema PR.
2. **A brief asking for browser verification adds ~30k**, whatever the code shape. The quick win was
   only a quick win until the brief told it to drive five screens.
3. **"Schema PR with code" is not one band — it splits.** `diets-sheet-schema` came in **28% under**
   230–285k, because that band came from *permissions* work across many call sites and this was a view
   rewrite plus four **named** readers. **Ask how many readers the item names.**

**The planner is now the main source of estimate error, which is progress** — stream scope is no
longer the variable; the bands are.

## A merged PR is not proof its item is closed — read the commit

#806 was titled *"Rule: no scratch output above the repo"*. Its item's "Done when" needed the rule in
`CLAUDE.md` **and** `.local/` in `.gitignore`. The commit touched `CLAUDE.md`, a decision file and a
test plan; both greps came back empty. **Two of three clauses never shipped — and because this repo is
public, the missing one was the clause stopping a folder from being committed.** Promoted into the
skill's step 3; **one `git log -1 --name-only` per "done" claim is the whole cost.** The remainder was
folded into batch 3 and has landed.

**Three backlog titles were wrong today and all three were fixed in place.** Note the shape: every one
was a PR that shipped while nobody rewrote the title. **The planner is the only reader who checks, so
budget for it every round.**

## Two corrections the planner made to itself mid-round

- **The counter read 12 for three batches of three. Lutan caught it.** Re-planning a batch is not a
  stream. **Promoted into step 6** with what does and does not count.
- **"Cut `0.39.0` before batch 3" was WRONG and was withdrawn.** #809 put the diets app half on `main`
  **unreleasable** — the Feed Special Diets sheet still read legacy columns, so a Diabetic recipe was
  invisible and unchoosable at intake. **General lesson: a merged PR is not a releasable PR, and the
  planner should not advise on release timing without checking what `main` can actually ship.**

## Where things stand — re-read 2026-10-21, not carried

| | |
|---|---|
| `main` | `ff9186fd` |
| `backlog` | in sync |
| Dev database | 243 applied, 243 files, zero drift both ways |
| Next free migration | `0243` |
| Open backlog items | 83 |
| Open PRs | none, before this one |
| Release | `0.38.2` shipped today; `unreleased` carries **five** lines. **`0.39.0` is NOT cut — the release manager's**, and the diets gate is now lifted |
| Production | **behind by `0236`–`0242`.** `docs/release-procedure.md` §5 catches it before any deploy, so **no backlog item** |
| Leftover worktrees | one (`planner-handover-267`, free). The three batch-3 folders are **HELD** by their sessions — ask, do not tear down |
| Workstreams since handover | **9** — three batches of three. `.plan-day.md` carries the arithmetic |

**The round's nine:** #802–#804, #807–#809, #810–#812, all merged. **#806 was an unplanned tenth
stream**, named here because it is the one that shipped half a rule.

## One thing for the release manager, not a backlog item

**#807 narrowed a permission and wrote no release note.** A visiting vet who has been using the bills
inbox will find it closed, and nothing in `unreleased` says so. The stream was briefed to judge it and
did. **Flagged for the `0.39.0` cut to confirm, not to overturn** — it is the shape Lutan cares about,
a change that is invisible until someone hits it.

## Rulings worth not re-deriving — cited, not summarised

- **A visiting vet must not use the bills inbox:**
  `docs/decisions/2026-10-21-harness-reds-volunteer-and-bills.md`. The check already expected refused,
  so the fix was the permission, not the expectation.
- **The home screen is the role's cards, and the panel is gone:** #812's decision file, which also
  records `2026-10-19-role-home-tiles-panel.md` as superseded. **`role_home_tiles` (`0225`) is now
  DEAD BUT NOT DROPPED**, deliberately, so the drop can be verified against a working `main`.
- **A diet is a recipe of ingredients:** `docs/decisions/2026-10-21-diets-app-half.md` and #811's file.
  All three design questions were answered 2026-10-21 and are recorded on the item.

## Next round's candidates

The next chat plans; this is only where the board points. **`.plan-day.md` carries the reasoning.**

1. **`production-rehearsal`** — **first in line, and displaced twice already.** It blocks the cutover
   and needs its own migration, and both times a release-gating item took the batch's slot. **Do not
   displace it a third time without saying so to him.** He creates a throwaway Supabase project inside
   the work; **do not list it as waiting on him.**
2. **The diets cleanup drop** — part (3) of the recipes item, applicable only now that #811 has merged.
   **Grep `supabase/migrations/` for every column name before pricing it** (the `frequency_id` lesson).
3. **Drop `role_home_tiles`**, dead since #812. Same two-stage shape; folds with (2).
4. **The tile-groups app half** — `role_groups` (`0241`) is seeded and read by nothing.
5. **The six menu-orphan reports** — **chats, not workstreams**, and they do not count toward the tally.
6. **The five acceptance role passes** — blocked on the sign-off ground rules. One role per stream.

## Writing the next one

**The rules are in the skill, step 8.** Offer it; never on an ambiguous yes, and **read step 6's counting rules before writing a number.**

Branch, worktree, test plan, PR — then **merge it yourself once CI is green**, and never present it as
a gate. This one is `claude/planner-handover-276`, after #800 (`267`) and #790.

**What could go next time:** the three estimating errors are now in the skill — **cite it and delete
them**, about fifteen lines. The dial paragraph stays only until a second non-Sonnet reading exists.
