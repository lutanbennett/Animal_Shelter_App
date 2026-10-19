# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover rewrite at the nine-workstream mark (2026-10-19, evening) |
| Backlog item | `docs/backlog.md` → none: the handover is a process artifact, written when `.plan-day.md`'s counter reaches nine |
| Branch / worktree | `claude/planner-handover-240` @ `C:\Development\Animal_Shelter_planner-handover-240` |
| Dev server | not started — `docs/` only, nothing to render |
| PR | PENDING |
| Tested by / date | Claude (Daily Planner) / 2026-10-19 |
| Carries a migration? | no |
| Tested at SHA | `a4bcb940` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` for the next `/plan-day` chat after the nine workstreams of 2026-10-19; no backlog item, the trigger is the counter in `.plan-day.md`
- [x] Files/areas touched listed — `docs/planner-handover.md` and this new test plan. **Nothing else**: no routes, no `src/`, no `worker/`, no `scripts/`, no `supabase/migrations/`, no `.claude/`
- [x] Roles affected identified — none. Nothing in the app reads this file; its readers are Claude sessions and Lutan
- [x] Anything explicitly **out of scope** written down — the round's open work is **recorded in the handover and deliberately not acted on here**, so this PR stays docs-only: the five red harnesses (ruled by Lutan this afternoon, needing one or two streams); the `stock_receipts` over-permission (its own item); the Drive folder sharing (deferred by his decision until the production Google account move); the two security switches that are his console; and every item under *Items whose remaining condition is a person*. `.plan-day.md` is gitignored local state and its counter reset is not part of this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `sync` declines to run in a worktree ("run 'git pull' in the main checkout instead"), so the merge was done directly: `git fetch origin && git merge origin/main` reported **Already up to date**. The branch was cut from `663ae69e`, the tip of `main` after #757 and the `backlog` merge. Pushed by the post-commit hook
- [x] `node scripts/gates.mjs` — closing lines exactly as printed:

```
=== gates: build exited 0 after 160s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. Recorded for the next stream: the highest on `main` is `0229_video_media.sql`, so `0230` is free
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR, though `--status` was read while writing the handover and reported 230 of 230 applied, zero drift
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. The handover does record that `0227`, `0228` and `0229` shipped this round and are theirs to sequence

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a Markdown document with no runtime behaviour
- [ ] Data persists — n/a: nothing is written or read by the app
- [ ] Create / edit / delete all exercised — n/a: no feature surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

n/a for every row: the file is not served by the app and is not reachable from any route. It is
read from the repository by Claude sessions and by Lutan. The table is left unfilled for that
reason rather than overlooked.

- [ ] Every role above tested — n/a: the file has no route, so there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route, no server handler

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; `src/app/NavLinks.tsx` untouched
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: an internal process document, not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing loads in a browser
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] The pages nearest the change still work — none: no page reads this file. Verified by `grep -rn "planner-handover" --include=*.ts --include=*.tsx --include=*.mjs src/ scripts/ worker/`, which returns nothing
- [x] Any shared file touched checked from a second, unrelated page — n/a by the usual reading, and answered deliberately: the only shared artifact is the handover itself, whose second reader is the next `/plan-day` chat. Its structure matches the previous edition's so that reader finds the same sections
- [x] Nothing merged from `main` during `sync` was broken by this branch — `git merge origin/main` reported Already up to date, so nothing was merged in; `gates.mjs` passed all four afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not a backlog item; the handover's trigger is the counter in `.plan-day.md`. The round's backlog edits were made on the `backlog` branch, as the rules require, and are listed in *Defects found*
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, but answered deliberately: the choices this round produced are **estimating and process** choices, which belong in the handover and `.plan-day.md`'s measurement table rather than in `docs/decisions/`. The two engineering findings it surfaced were filed as backlog items instead, because neither has been designed yet
- [x] `README.md` still accurate — unchanged by this PR and makes no claim about this file
- [ ] **Release notes.** — n/a: an internal planning document; no shelter user could notice it, and `src/lib/releases.ts` is untouched
- [x] Commit messages say why, not just what — the commit leads with the round's finding (the planner rebuilt the previous document instead of the list, and read 330-character tails while claiming to have read items in full) rather than with "rewrite the handover"
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every token figure in the handover was read from `get_usage` against the named session id, not estimated. The one claim that cannot be measured — what model and effort each stream genuinely ran on for its whole life — is stated as the recommendation rather than asserted as fact

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded in the header; it is this branch's tip, and `main` is `663ae69e`, which this branch already contains
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing in this PR reaches a build
- [ ] Deployed to test — deferred: production release manager. `docs/` files are not deployed
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. No deployed surface to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the only dates are written in prose
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" in this document are estimating guidance for a human and a planner, not code, and nothing asserts against them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied from the run, and every figure in the handover's measurement table is the `tokensUsed` value `get_usage` returned for that session
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var in this PR

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this commit restores #742's edition of the handover. Nothing else is affected: no build carries the file, no migration is involved, no runtime reads it. What a revert does **not** cover: `.plan-day.md`'s counter is gitignored local state, so reverting would leave the counter reset while the handover describing the round was gone — whoever reverts should set it back to 9 by hand. It also would **not** undo the backlog edits made on the `backlog` branch today, which are separate commits on a separate branch and are the substance of the round's findings

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | **The planner reported two of five harness results to Lutan exactly inverted.** These `check-*.mjs` scripts build their label from the *expectation* (`exp ? "allowed" : "refused"`), so `refused — got 1` means *expected refused, actually allowed*. Read as a result it says the opposite. He was told the vet could already change diets and prescriptions when the vet **cannot**, and that a delivery could not be edited by anyone when in fact **four roles can** | fixed — corrected PDF reissued the same day, the reading trap recorded on the harness item and in this handover, and the real finding filed as its own backlog item. **The backlog's own description had been right all along and was contradicted on the misreading** |
| 2 | high | **The planner rebuilt the previous document instead of rebuilding the list.** Asked to update the *Waiting on you* sheet, it diffed against the morning's 43 items rather than deriving them from the backlog, so every wrong entry survived by default. Lutan corrected **six** in under an hour: *"I shouldn't have to be doing all this correction"* | fixed — the sheet was rebuilt from source with every claimed blocker checked against the code, release records and live config, and each entry date-stamped with when its blocked-ness was last confirmed. The rule is written into the handover as the round's finding |
| 3 | high | **It read each item's last 330 characters and called that "read to the end" — then wrote that claim in the document's footer.** Answers sitting mid-item were missed (Home Assistant, the left-menu decision). A false assurance is worse than an unverified list, because it stops the reader checking | fixed — both entries removed with the reason recorded, and *"never state a verification standard you did not apply"* written into the handover |
| 4 | medium | **Matching a backlog item with `line.includes(needle)` matches the body, not the title.** Items are 5,000–11,000-character single lines, so phrases recur across items. This put an answer on a **completed** item about the Doctor's `home_path`, and a Drive note on the wrong Drive item | fixed — both moved to the correct items in follow-up commits; the `titleOf()` regex and the "print what you matched before writing" rule are recorded in the handover |
| 5 | medium | **The merge rule still does not cover `main` SHORTER with both sides open**, for the second round running. `main` carried #754's status; the `backlog` branch carried Lutan's "only Admin manages tiles" answer. Taking either side alone silently drops the other | fixed — resolved as the union and said so in the merge commit. The handover restates the test as *what does each side know that the other does not?* rather than tick-or-length |
| 6 | medium | **Nine estimates, eight under band and none over** — the second consecutive round in the same direction, after the bands were already reduced once | accepted and acted on — bands revised down again in the handover, by shape, with the measured figure cited against each. The screens axis is explicitly narrowed: below about ten screens, band as ordinary work |
| 7 | low | **The Write tool refused to overwrite the handover again**, because reading the copy in the main checkout does not count as reading the copy in the new worktree | accepted — `rm` then write as new, and the handover's note now says explicitly that the two copies are different files |

Defects 1–5 were established and resolved during this round; their fixes are on the `backlog`
branch and in a reissued Desktop document, not in this PR's diff. They are listed because this plan
is where the planner's pass over the round is recorded. **What this PR actually contains is the
handover that carries all seven forward.**

## Left for manual verification

| # | What to check | Where |
|---|---|---|
|   |   |   |

Empty, deliberately. There is no surface a person needs to look at to verify this PR: the
document's audience is the next `/plan-day` chat, and the way it gets verified is being used, which
happens after this merges. Every figure in it was read from a session or from the repository rather
than estimated.

The things that do need a person are not checks on this PR; they are recorded in the handover under
*Items whose remaining condition is a person*. Three are worth naming here so they are not lost:
**eleven leftover worktrees** are waiting on `/clean-streams`; **two security switches** are unset
on both Supabase projects (leaked-password protection, and the session inactivity timeout that the
plan says should be 60 days), with the read values recorded as the evidence; and **the Cloudflare
WAF and bot rules and the laptop's disk encryption cannot be read from a session at all**, which is
now written down so nobody spends another session trying.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-19

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document with no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing here needs deploying. **What does need their attention before the next production deploy is in the handover**: `0227`, `0228` and `0229` all shipped this round and must be applied to production before this round's app code, or the assistant retention delete, the meme source columns and the video media columns have no tables behind them; and the `stock_receipts` over-permission is a silent-wrong-history defect that is filed but not yet fixed

Result: pass with accepted defects
