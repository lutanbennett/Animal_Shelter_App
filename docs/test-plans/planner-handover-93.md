# Feature test plan — `planner-handover-93`

## Header

| | |
|---|---|
| Feature | Planner handover rewritten after batch 93, and the planning skill's token floor corrected from ~110k to ~80k |
| Backlog item | `docs/backlog.md` → none. The handover is a process artefact mandated by `CLAUDE.md` and `.claude/skills/plan-day/SKILL.md` §8, written when the counter reaches nine; it is not a backlog item and never has been (same as #514, #501, #490) |
| Branch / worktree | `claude/planner-handover-93` @ `C:\Development\Animal_Shelter_planner-handover-93` |
| Dev server | not started — `n/a: no runtime surface, see §2` |
| PR | this one |
| Tested by / date | Claude (Daily Planner session) / 2026-10-11 |
| Carries a migration? | **no** |
| Tested at SHA | tip of `claude/planner-handover-93` after `sync` brought in `origin/main` at `d2e30a02` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two documentation changes: `docs/planner-handover.md` rewritten for the next `/plan-day` chat, and `.claude/skills/plan-day/SKILL.md`'s token floor corrected to ~80k with the bands that sit on it trimmed, on Lutan's ruling of 2026-10-11
- [x] Files/areas touched listed — `docs/planner-handover.md` (rewritten), `.claude/skills/plan-day/SKILL.md` (token table, rule 8, the band-widening guidance, one floor reference in *Model and effort*), `docs/decisions/2026-10-11-planner-token-floor.md` (new), `docs/test-plans/planner-handover-93.md` (this file). **No `src/`, no `worker/`, no `supabase/migrations/`, no `scripts/`.**
- [x] Roles affected identified — **none.** No shelter user of any role can reach any of these files; they are read by Claude sessions and by Lutan
- [x] Anything explicitly **out of scope** written down — (a) **the quick-win band was deliberately NOT changed**, on Lutan's separate ruling the same day that the band was right and the planner's quoting was high; the decision file says why the two rulings are not in tension and must not be "tidied" into agreement. (b) The architecture review's 15 new backlog items are **not** triaged here; they are candidates recorded in the handover. (c) No backlog item is ticked by this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 190s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — `n/a: no migration in this PR`
- [ ] `--status` reviewed — `n/a: no migration in this PR`
- [ ] `--dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to dev — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly — `n/a: no migration in this PR; no table, view or function is touched`
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — `n/a: no migration in this PR`
- [ ] Down-migration written — `n/a: no migration in this PR`
- [ ] Production apply plan — `n/a: no migration in this PR`

**Noted for the release manager, since it is the kind of thing this section exists to surface:** `main` now carries `0184` and `0185`, from `drop-leftovers-schema` and `vaccine-stock-forecast`. **`0184` drops database objects and cannot be undone by redeploying.** Neither is this PR's, and both are covered by their own plans — recorded here only so a reader of this plan is not left thinking the release carries no schema.

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: documentation only; there is no path to run`
- [ ] Data persists — `n/a: no data is written`
- [ ] Create / edit / delete exercised — `n/a: no feature surface`
- [ ] Empty state renders sensibly — `n/a: nothing renders`
- [ ] Invalid input rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

**What was verified instead, because the deliverable is prose and prose has its own failure mode:** every figure quoted in the handover was re-read from source rather than carried forward from the previous one — `main` at `d2e30a02` (`git log`), dev at 185 applied / 0 pending / no drift (`apply-migrations.mjs --status`), next free migration `0186` (`ls supabase/migrations/`), 101 open backlog items (`awk` over `docs/backlog.md` above `## Completed`), `0.26.0` as the last release (`src/lib/releases.ts`), and all twelve token actuals from `get_usage` with every `model`/`effort` pair read from `get_session` rather than assumed. The handover's closing line instructs the next writer to do the same.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | no change | no change — no file in this PR is served to any client |
| management | nothing in this PR | no change | no change |
| staff | n/a — retired by `0173` | n/a | n/a |
| doctor | nothing in this PR | no change | no change |
| volunteer | nothing in this PR | no change | no change |
| signed out | nothing in this PR | no change | no change |

- [ ] Every role above tested — `n/a: no role can reach a changed file; nothing in this PR is served to a browser`
- [ ] A role that should not have access is blocked server-side — `n/a: no route, policy or server action is touched`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav change; src/app/NavLinks.tsx untouched`
- [ ] Manual updated — `n/a: no user-facing behaviour changed; the manual describes the app, not the planning process`
- [ ] Translatable strings — `n/a: no user-facing strings; both files are English-only internal documents`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: nothing loads in a browser`
- [ ] Network clean — `n/a: no page to request`

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a "page" is the planning skill itself. **`SKILL.md` was re-read end to end after the three splices** to confirm the table, rule 8, the band-widening paragraph and the *Model and effort* reference are internally consistent and that no stale `~110k` or `~330k` remains (`grep -n "110k\|330k"` returns nothing)
- [x] Any shared file touched checked from a second, unrelated page — **`SKILL.md` is the shared file, and the check that matters is that it is still coherent as a whole**, since four separate places referenced the floor figure. All four were updated; the grep above is the evidence. The build gate also passes, which confirms nothing in `.claude/` breaks the app's compile
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in batches 91–93 and the `0.26.0` release; this branch touches none of those files

## 7. Documentation

- [ ] Backlog item ticked — `n/a: the handover is not a backlog item; it is mandated by CLAUDE.md and the plan-day skill, as #514, #501 and #490 were`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-11-planner-token-floor.md`. It records the measurement, **why the floor ruling and the quick-win-band ruling are not in tension**, the second correction to the band-widening rule, and **why the Fable figure must not be quoted as evidence of what Fable costs**
- [x] `README.md` still accurate — unaffected; this PR changes no behaviour the README describes. **Noted, not fixed:** the architecture review's §1.9 lists seven places `README.md` already disagrees with the code. Those are its own backlog items, filed in `46d11c0c`, and fixing them here would be scope this PR did not take
- [ ] **Release notes.** `n/a: an internal planning document and a skill's estimate table; no shelter user can reach either, and nothing about the app changes` — this is the first PR filled against §7's **new wording**, merged this morning as #540, and the answer is the one that wording asks for
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The central claim — that the floor is ~80k — is a measurement with its category breakdown pasted into the decision file, not an inference. The second claim — that reading many files is cheap and building an instrument is not — rests on two measured streams named by figure (`silent-empty-reads` 133,986 against `who-does-what-view` 449,014). **The one number explicitly marked as NOT evidence is the Fable review's**, because its model and effort both differ from every other row

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test — `deferred: production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: production release manager`
- [ ] Timezone-sensitive behaviour proved — `n/a: no date or time logic in this PR. The handover mentions Asia/Bangkok only in quoting a decision about receipts, which is another stream's code`
- [ ] Boundary or banding change — `n/a: the token bands are planning guidance read by a human, not a threshold any code evaluates. Nothing branches on them`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in §2 is copied verbatim, and the token figures are as `get_usage` returned them
- [ ] Public pages re-checked after a cache purge — `deferred: production release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `deferred: production release manager`
- [ ] `strip-baked-env` seen in the deploy output — `deferred: production release manager`
- [ ] Any new secret/env var exists in production — `n/a: this PR introduces no secret or environment variable`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — `n/a: no migration in this PR`
- [ ] `--env production --dry-run` clean — `n/a: no migration in this PR`
- [ ] Production backup fresh — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR's commit restores the previous handover and the previous token table completely; there is nothing else to undo.** No migration, no deployed artefact, no state outside git. **What it does not cover:** nothing — but note that reverting would also restore the ~110k floor, so a revert should be deliberate rather than incidental to rolling back something else in the same release

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Low (process, fixed in this PR) | The skill told the planner to widen a band whenever a stream "has to count" anything. `silent-empty-reads` was banded ~250–400k on exactly that reasoning and came in at 133,986 — so the rule as written produces bad estimates | **Fixed** — the guidance now turns on whether the stream must *build an instrument*, with both measured streams named |
| 2 | Low (data quality, accepted) | The Fable review's 448,294 varies both model and effort against every other measured row, so it cannot be used to say what Fable costs | **Accepted** — recorded as not comparable in the table, the handover and the decision file, rather than dropped. A future Fable stream at `low` would give the clean figure |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | *(empty)* | |

Nothing here needs a person to look at a screen. Both changed files are read by Claude sessions, and the handover's own correctness is checked by the next `/plan-day` run following it — which is the real test, and it happens in the next chat, not before this merges.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-11

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: documentation only — two internal files, no rendered surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet cut — this PR carries no deployable change, so it needs no acknowledgement of its own
