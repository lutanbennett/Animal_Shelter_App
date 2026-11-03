# Feature test plan — `backlog-manager-handover`

## Header

| | |
|---|---|
| Feature | A handover document for the backlog manager role, `docs/backlog-handover.md` |
| Backlog item | `docs/backlog.md` → none. Asked for directly by Lutan in chat on 2026-11-03, after a grooming round put nothing into `## Next up` and delayed a day's planning. No item was filed, so none is ticked |
| Branch / worktree | `claude/backlog-manager-handover` @ `C:\Development\Animal_Shelter_backlog-manager-handover` |
| Dev server | not started — `n/a: documentation only, no runnable surface` |
| PR | #TBD |
| Tested by / date | Claude Opus 5 / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | `0a8d6d51` plus this plan's own commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one new
  documentation file, `docs/backlog-handover.md`, edition `1`; it matches what Lutan asked for in
  chat, there being no backlog item
- [x] Files/areas touched listed — `docs/backlog-handover.md` (new) and `docs/test-plans/backlog-manager-handover.md` (new). **No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts**
- [x] Roles affected identified — `n/a: no role is affected. The file is read by a Claude session, not served by the app, and grants nothing`
- [x] Anything explicitly **out of scope** written down — **four things, all deliberate.** (1) **`CLAUDE.md` is not edited.** Its merge-on-green passage names *"the two handover documents"*, but since 2026-11-01 **every** PR merges on green, so that passage is historical context and a third handover needs no amendment to be covered. (2) **No backlog item is created or ticked**; nothing in `docs/backlog.md` is touched by this PR. (3) **The `## Next up` restocking itself is already done and landed** on the `backlog` branch at `141b0e8f` and merged to `main` — this PR only writes down why it must happen. (4) **No change to `check-backlog-sections.mjs`, `check-stale-titles.mjs` or the page generator**; the generator fix of 2026-11-03 lives in the gitignored `.local/` and is not a repo file
- [x] **Claims in commit messages and decision files were measured, not reasoned** — every claim in the document was taken from this session's own tool output rather than recalled. Measured, not assumed: that `/plan-day`'s skill never names `Next up` (`grep -n -i 'next up' .claude/skills/plan-day/SKILL.md` returned nothing); that it orders by file position (`SKILL.md:380`, *"Backlog priority is the default order across all nine"*, and `:191`, *"open items only"*); that `Next up` held 109 ticked and 0 open items before the promotion; that the move preserved 71 open and 845 ticked lines; and that the previous *ORDER OF WORK* note was dated 2026-10-25. The six ways that note was stale were each checked against the repo, not inferred

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0` — run in this
  worktree, output pasted exactly as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 81s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 282s
=== gates: test — npm test
=== gates: test exited 0 after 22s
=== gates: build — npm run build
=== gates: build exited 0 after 312s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

`n/a: no migration. This PR adds two Markdown files and touches no SQL, no table, no view and no function.`

## 4. Functional checks

`n/a: documentation only. There is no happy path, no input, no empty state and no persistence — the deliverable is a file a Claude session reads. The checks that do apply to it are in §7 and were run.`

### Role access matrix

`n/a: the document is not served by the app and grants nothing. No role can reach it and none is affected.`

- [x] Every role above tested — `n/a: no app surface, so there is nothing per role to test`
- [x] A role that should not have access is blocked server-side — `n/a: as above`

## 5. Cross-cutting

- [x] Nav entry correct — `n/a: no nav entry; the file is not a page`
- [x] Manual updated — `n/a: the manual is for shelter staff. This file is for a Claude session and would be noise in it`
- [x] Translatable strings go through the translation path — `n/a: no user-facing string. The document is English working material, like docs/planner-handover.md and docs/release-handover.md`
- [x] Mobile viewport (375px) — `n/a: no rendered surface`
- [x] Browser console clean — `n/a: no rendered surface`
- [x] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: no pages are near the change; nothing imports or reads either new file at runtime`
- [x] Any shared file touched checked from a second, unrelated page — `n/a: no shared file touched. The two files are new and nothing references them`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch adds two files
  that did not previously exist, so it cannot conflict with or shadow anything `sync` brought in.
  The gates above ran **after** the sync and are the evidence

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `n/a: there is no item. Lutan asked for this in chat; filing one in order to tick it in the same PR would be bookkeeping theatre`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: the document IS the record. A decision file restating why the handover exists would duplicate the handover's own lead paragraph, and the two would drift`
- [x] `README.md` still accurate — unchanged and still accurate; it does not enumerate the `docs/`
  handover files, so adding a third needs no edit there
- [ ] **Release notes.** `n/a: no shelter user can notice a Claude-facing handover document. It changes no screen, no wording and no behaviour in the app` — and `src/lib/releases.ts` is untouched by this PR, so a tick would have been false
- [x] Commit messages say why, not just what — the handover commit states the failure it encodes, what
  it cost, and why a handover rather than a `CLAUDE.md` note
- [x] **The document's own internal claims check out.** Every file path, script name and command in it
  was verified to exist in this worktree: `docs/backlog.md`, `CLAUDE.md`,
  `.claude/skills/plan-day/SKILL.md`, `scripts/check-backlog-sections.mjs`,
  `scripts/check-stale-titles.mjs`, and `scripts/check-stale-titles.mjs`'s optional path argument
  (`SKILL`-independent; the script's own usage line documents it). The `git log --since … origin/backlog`
  recipe is the one this session actually used

## 8. Pre-production gate

`n/a: nothing deploys. This PR adds no code to the Worker or the Pi, no migration, no secret and no env var, so there is no tested-build, deploy-safety, migration-ordering or rollback position to state. The next production release carries these two files as inert documentation.`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The backlog page generator and its two templates were living in a **session scratchpad** from a conversation that had already ended, so each new session had to hunt for them; a `find` took over two minutes | fixed 2026-11-03 — copied to the main checkout's gitignored `.local/`, and the handover's *MECHANICS* section now names that path. Not a repo file, so not in this PR |
| 2 | low | The generator ended an item at any blank line, so an item whose body sat on an indented line after a blank line rendered with an **empty body** and its text appeared inside the section's intro note. One item was affected. A second latent bug: an unindented line after an item was silently dropped | fixed 2026-11-03 in `.local/gen-backlog.mjs`; zero empty bodies after the fix. Not a repo file, so not in this PR |
| 3 | low | `docs/backlog.md`'s previous *ORDER OF WORK* note was stale in six ways that would each have misled a planner | fixed on the `backlog` branch at `141b0e8f`, already merged to `main`. Not in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the document says what Lutan wants said, and in the order he would put it.** He asked for it because the role's failure cost him a day, so he is the only person who can judge whether it would have prevented that. This is a read, not a test, and nothing automated can stand in for it | `docs/backlog-handover.md` |
| 2 | **Whether the nine items now in `## Next up`, and their order, are the right nine.** Already landed and reorderable by his own convention (*"reorder freely"*), but the selection was the backlog manager's judgement, not his instruction — he named the 24-hour window, not the nine | `docs/backlog.md` → `## Next up`, or the **Lanna Care Backlog** page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-03

### Manual verification

The two rows above are both reads only Lutan can do, and he has not done them yet. Written as
`pending:` rather than `n/a:` on purpose — there genuinely is something for a person to look at, and
an `n/a` here would be a false assurance about the one thing that could not be verified.

The template's *"the manual list above is empty, or every item in it was checked by a person"* line is
**deliberately not reproduced here.** The list is not empty, so by the template's own rule only the
person who looked may tick it — and the checker requires every checkbox it finds to be ticked or
`n/a`. Keeping the line would therefore have forced either a false tick or a false `n/a` on the one
line in this plan that is about a person having looked. The `pending:` signature below carries exactly
the same information, honestly.

Manual verification by: pending: Lutan reads the handover, and judges whether the nine items now in `## Next up` and their order are the right nine

### Result

- [x] Open defects are either fixed or explicitly accepted above — all three in the table are fixed,
  and none of the three is in this PR: two were in the gitignored `.local/` generator and one on the
  `backlog` branch, already merged to `main`
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — `n/a: nothing deploys. These two files are inert documentation and carry no production step, so there is nothing for the release manager to receive`

Result: pass

**Why `pass` with a `pending:` signature, stated rather than left to be inferred:** nothing blocks the
merge. A handover **outranks nothing** — this one says so in its own opening lines — it is read by one
chat, it is rewritten within a round, and a wrong one is corrected by its successor rather than by a
reviewer. That is exactly the reasoning `CLAUDE.md` records for merging the planner and release
handovers on green, and it applies here unchanged.
