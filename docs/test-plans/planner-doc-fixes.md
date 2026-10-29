# Feature test plan

## Header

| | |
|---|---|
| Feature | Recover two process-doc changes dropped by `claude/pi-cache-videos` (#1079): the `CLAUDE.md` backlog filing rule and the `/plan-day` reconciliation rate |
| Backlog item | `docs/backlog.md` → none. Neither change is a backlog item: the `CLAUDE.md` reword is Lutan's direct decision of 2026-10-29, and the skill rate is planner tooling. Recorded in `docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md` |
| Branch / worktree | `claude/planner-doc-fixes` @ `C:\Development\Animal_Shelter_planner-doc-fixes` |
| Dev server | not started — `n/a`, no runtime surface (see §4) |
| PR | #1082 |
| Tested by / date | Claude (Daily Planner) / 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | `b5658854` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two documentation files; the `CLAUDE.md` half matches Lutan's chosen option verbatim ("reword `CLAUDE.md`", not "make the checker warn")
- [x] Files/areas touched listed — `CLAUDE.md` (one bullet in *The backlog branch*), `.claude/skills/plan-day/SKILL.md` (one bullet in the walkthrough-rate section), and one new file in `docs/decisions/`. No routes, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified: **none.** Neither file is read at runtime by anyone. `CLAUDE.md` and the skill are instructions to Claude sessions; no role, card or page behaviour changes
- [x] Anything explicitly **out of scope** written down — `scripts/check-backlog-sections.mjs` is deliberately NOT changed: Lutan chose the wording fix over the checker warning, and changing both would be asking him twice. Also out of scope: the other two deliverables #1079 did ship (the videos route, the proxy backlog item), which are already on `main`

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

- [x] Happy path works end to end — the "function" of both files is that a reader follows them. Verified by reading each changed passage back in place (`sed -n '636,653p' CLAUDE.md`, `sed -n '605,625p' .claude/skills/plan-day/SKILL.md`) and confirming the new text is complete, correctly nested in its bullet list, and that the sentence it replaced is gone
- [x] Data persists — reload the page and the change is still there — read back from disk after writing, and again after `git commit`; both passages present at `b5658854`
- [ ] Create / edit / delete all exercised — n/a: documentation change, no CRUD surface
- [ ] Empty state renders sensibly — n/a: documentation change, nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: documentation change, no input
- [x] Boundary cases checked — the real boundary here is **line endings**, and it bites: this skill file is CRLF while `docs/` is LF. The edit script normalised to LF, matched, then wrote back as CRLF. Confirmed no whole-file line-ending churn: `git show --stat` reports **3 files changed, 67 insertions(+), 6 deletions(-)**, not hundreds

### Role access matrix

Not applicable to this change, and filled in rather than left blank so the release manager is not left
guessing. Neither changed file is served, imported, or read at runtime; there is no URL to hit directly
and nothing to refuse server-side. The live roles were not exercised because there is nothing for them
to reach.

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
- [ ] Manual updated — n/a: the manual is for shelter staff; `CLAUDE.md` and the planner skill are instructions to Claude sessions and have no place in it
- [ ] Translatable strings — n/a: no user-facing strings added
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [x] Browser console clean — n/a as a browser check, but asserted the equivalent for the one file that *is* parsed by a tool: the `/plan-day` skill still loads. Its front matter and heading structure are unchanged, and the edit sits inside an existing bullet list
- [ ] Network clean — n/a: no pages changed

## 6. Regression

- [x] The pages nearest the change still work — no pages are near it; instead the two **consumers** of these files were checked. `scripts/check-backlog-sections.mjs` still runs and still reports as before (`ok — 50 open items, all above '## Completed'`), confirming the reword did not purport to change checker behaviour, which was the whole point of choosing the wording fix
- [x] Any shared file touched checked from a second, unrelated page — **by loading, not by reading.** `CLAUDE.md` is loaded by every Claude session in this repo, so the meaningful load test is that a session still parses it: the full `gates.mjs` run (124s build included) was executed in this worktree *after* the edit, and the session that ran it had the edited `CLAUDE.md` in context throughout
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: neither change has a backlog item (see the header). Nothing to tick, and nothing was ticked
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-29-folded-process-docs-get-their-own-pr.md`, which records why folding worked for #1078 and failed here: same-kind work versus different-kind work
- [x] `README.md` still accurate — unchanged by this PR and unaffected; it does not quote either passage (`grep -n "above .## Completed" README.md` → no match)
- [ ] **Release notes.** — n/a: both files are instructions to Claude sessions. No shelter user can reach, see, or be affected by either, and `unreleased` in `src/lib/releases.ts` gained no line
- [x] Commit messages say why, not just what — the commit explains that both changes were dropped by #1079, which decision each came from, and why this one is not folded again
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The two claims that could have been reasoned were instead checked: that the changes are **not** on `main` (`grep -c` on both files on `main` → `0` for the skill text, and line 642 of `CLAUDE.md` unchanged), and that #1079 never mentioned them (`gh pr view 1079 --json body` → three bullets, neither change among them). The "same-kind versus different-kind" explanation is an inference from two data points and is written in the decision file as such, not as a measurement

## 8. Pre-production gate

**Nothing in this PR reaches production, and that is a property of the change rather than a deferral.**
Neither file is bundled, served or deployed: `CLAUDE.md` and `.claude/skills/` are repository
instructions read by Claude sessions. There is no deployed artifact whose behaviour could differ.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing here is deployed; the SHA is recorded for the record only
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: nothing here is deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing here is deployed
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic in this PR
- [ ] Boundary or banding change assertions — n/a: no boundary, threshold or banding logic in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line in §2 and the `check-backlog-sections` line in §6 are as printed
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

- [x] Rollback position stated, **including what it does not cover** — revert the commit; there is nothing else to undo, because no build, Worker, Pi image or database carries either file. **What that does not cover:** reverting it would also revert Lutan's chosen `CLAUDE.md` wording, so a revert puts the backlog-filing fault back and the planner would owe the change a third time. Nothing is covered by `deploy-pi.sh --ref` or `wrangler rollback` here, since neither file ships

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `claude/pi-cache-videos` (#1079) silently dropped two of its four briefed deliverables and reported `finished=yes`, with no mention in its PR body. One of them was Lutan's own decision made that morning | fixed — both recovered in this PR; cause and the rule qualifier recorded in `docs/decisions/2026-10-29-folded-process-docs-get-their-own-pr.md` |
| 2 | low | #1079's usage figure (134,059) was banded for four deliverables and spent on two, so it is not a clean band reading for the brief as written | accepted — recorded in `.plan-day.md` as a partial-scope figure and kept out of the bands |

## Left for manual verification

Empty. Both changes are prose that was read back in place after writing, and neither has a surface a
person must go and look at separately from this PR's own diff.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only; both passages were read back in place and there is no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing to hand over: this PR changes no deployed artifact, as §8 records

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches production
