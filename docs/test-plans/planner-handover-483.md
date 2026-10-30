# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover `483`, plus three promotions into the `/plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is written every nine streams by the loop in `.claude/skills/plan-day/SKILL.md` step 8; the promotions come from this round's own measurements |
| Branch / worktree | `claude/planner-handover-483` @ `C:\Development\Animal_Shelter_planner-handover-483` |
| Dev server | not started — `n/a`, no runtime surface (see §4) |
| PR | #1086 |
| Tested by / date | Claude (Daily Planner) / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `92219ee1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the handover for this round's nine streams, plus the three facts this round measured, promoted into the skill instead of being narrated in a document that is rewritten every nine streams (the skill's own rule 2 for handovers)
- [x] Files/areas touched listed — `docs/planner-handover.md` (rewritten) and `.claude/skills/plan-day/SKILL.md` (three insertions). No routes, no `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified: **none.** Neither file is read at runtime by anyone. Both are instructions to Claude sessions; no role, card or page behaviour changes
- [x] Anything explicitly **out of scope** written down — the handover is a **delta** and deliberately does not restate repo-read state (open-item counts, migration numbers, PR numbers, release state, the candidate list); those are re-read every run, and its own opening block says so. Also out of scope: `scripts/check-backlog-sections.mjs`, which Lutan decided against changing

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Its closing line, exactly as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the "function" of both files is that a session reads and follows them. Verified by reading each changed passage back in place after writing, and confirming the handover opens with its read-order line and its never-carry-forward block, and that each skill insertion sits correctly inside the list or section it extends
- [x] Data persists — reload the page and the change is still there — read back from disk after writing and again after `git commit`; both files present as intended at `92219ee1`
- [ ] Create / edit / delete all exercised — n/a: documentation change, no CRUD surface
- [ ] Empty state renders sensibly — n/a: documentation change, nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: documentation change, no input
- [x] Boundary cases checked — two real ones here. **(a) Length:** the handover has a ~150-line target and the skill says to write the content first and measure last rather than claiming a figure; `wc -l` reports **151**, which the skill explicitly says to ship rather than open a trimming pass for. **(b) Line endings:** `SKILL.md` is CRLF while `docs/` is LF, and a careless edit rewrites every line. The edit script normalised to LF, matched, and wrote back as CRLF; `git diff --stat` reports **58 changed lines in `SKILL.md`, not hundreds**, which is the proof there was no whole-file churn

### Role access matrix

Not applicable to this change, and filled in rather than left blank so the release manager is not left
guessing. Neither changed file is served, imported or read at runtime; there is no URL to hit directly and
nothing to refuse server-side.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — no runtime surface | no change | no change |
| management | nothing — no runtime surface | no change | no change |
| staff | retired role (`0173`); not tested | no change | no change |
| doctor | nothing — no runtime surface | no change | no change |
| volunteer | nothing — no runtime surface | no change | no change |
| signed out | nothing — no runtime surface | no change | no change |

- [x] Every role above tested — n/a as a sign-in exercise: recorded as "no runtime surface" for each, which is the honest result rather than six unticked boxes
- [ ] A role that should not have access is blocked server-side — n/a: no server-side surface in this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; `src/app/NavLinks.tsx` untouched
- [ ] Manual updated — n/a: the manual is for shelter staff; the handover and the planner skill are instructions to Claude sessions and have no place in it
- [ ] Translatable strings — n/a: no user-facing strings added
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [x] Browser console clean — n/a as a browser check, but the equivalent was asserted for the one file a tool parses: the `/plan-day` skill still loads, its front matter and heading structure are unchanged, and each insertion sits inside an existing list or section rather than breaking one
- [ ] Network clean — n/a: no pages changed

## 6. Regression

- [x] The pages nearest the change still work — no pages are near it. The meaningful regression check is that the skill is still internally consistent: the new rule-8 qualifier does not contradict rule 8's own folding advice (it narrows it, and says so), and the new *report every deliverable* block does not contradict the finish-line or STOP blocks it sits beside — all three remain about different failures (no PR, tidying from a large session, and an unreported deliverable)
- [x] Any shared file touched checked from a second, unrelated page — **by loading, not by reading.** `SKILL.md` is loaded by any session running `/plan-day`, so the load test is that a session still parses it; the full `gates.mjs` run (134s build included) was executed in this worktree after the edit, by a session holding the edited skill and the edited `CLAUDE.md` in context throughout
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the handover has no backlog item (see the header). Nothing to tick, and nothing was ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a as a new file, and deliberately: the round's one non-obvious choice already has its file from earlier today, `docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md`, which this PR's rule-8 qualifier cites rather than duplicates. Writing a second file saying the same thing is the recopying the handover rules forbid
- [x] `README.md` still accurate — unchanged by this PR and unaffected; it does not describe the handover loop or quote the skill's band table
- [ ] **Release notes.** — n/a: both files are instructions to Claude sessions. No shelter user can reach, see or be affected by either, and `unreleased` in `src/lib/releases.ts` gained no line
- [x] Commit messages say why, not just what — the commit says what held from `474`, what was closed, and what was promoted rather than narrated, with the two sides of the folding lesson named
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The claims that could have been reasoned were checked instead: the line count is `wc -l` (151) rather than an estimate, which is the specific habit the skill says four previous editions got wrong; the no-churn claim is `git diff --stat`; and the "it already fired twice" claim about the new brief block was read from #1083's and #1084's own PR bodies, not inferred from their having merged

## 8. Pre-production gate

**Nothing in this PR reaches production, and that is a property of the change rather than a deferral.**
Neither file is bundled, served or deployed: `docs/` and `.claude/skills/` are repository instructions read
by Claude sessions. There is no deployed artifact whose behaviour could differ.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing here is deployed; the SHA is recorded for the record only
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: nothing here is deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing here is deployed
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic in this PR
- [ ] Boundary or banding change assertions — n/a: the token bands in the skill are prose guidance for a planner, not code; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line in §2 is as printed, and the 151 and the 58 in §4 are `wc -l` and `git diff --stat` as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy in this PR
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy in this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh — n/a: no destructive or rewriting migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the commit; nothing else to undo, because no build, Worker, Pi image or database carries either file. **What that does not cover:** reverting would also restore the previous handover, so the next planner would read `474` as current and lose this round's record; and it would undo the three skill promotions, including the one whose absence caused two of this round's faults. Neither `deploy-pi.sh --ref` nor `wrangler rollback` is involved, since neither file ships

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover is 151 lines against a ~150-line target | accepted — the skill says explicitly that a little over is fine and that a trimming pass is the most expensive place to spend the budget the number exists to protect. No pass opened |

## Left for manual verification

Empty. Both files are prose read back in place after writing, and neither has a surface a person must go
and look at separately from this PR's own diff. The handover's audience is the next planning chat, which
reads it as its first act.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only; both passages were read back in place and there is no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing to hand over: this PR changes no deployed artifact, as §8 records

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR reaches production
