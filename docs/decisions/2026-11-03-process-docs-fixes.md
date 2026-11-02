# 2026-11-03 — process-docs-fixes (plan-day skill, test-plan template, CLAUDE.md)

No app code changed. Three process fixes in one PR.

## Claim (1): nothing to fix
`grep -n "three gates\|three-gate\|typecheck, lint, test" .claude/skills/plan-day/SKILL.md` returns one hit
(line 1530), which says "typecheck, lint, test and a full `next build`": four gates, and it is about timeouts.
The appended brief block says only "the gates" and "Run `node scripts/gates.mjs`", with no count to go stale.
Closed as already satisfied; nothing edited for it.

## Promoted into the skill
- **Claim (2):** new block "Every brief also carries the finishing sequence as a numbered deliverable"
  (before "Every brief also OPENS…"), worked from the version that went 6 of 6. The point is the read step.
- **Claim (3):** the amendment advice now says `out.split(from).join(to)` not `replace()`, explains `$'`,
  `` $` `` and `$$`, and says the per-anchor guard is what limited the damage.
- Found while doing it: `SKILL.md` and `CLAUDE.md` are CRLF on disk, so a multi-line anchor written with `\n`
  does not match. The edit script joins with CRLF. (Same trap, different cause; not added to the skill.)

## The template's role matrix: CARDS, not a swapped role name
Chosen: the matrix rows are "admin", "exactly `<card key>`" (one row per card under test) and "signed out".
Reasoning: `CLAUDE.md` says roles are a transient grouping of cards and will be rebuilt, so any role name in
a plan is false after the rebuild; swapping `staff` for another role would repeat the fault with a current
name. `dev-signin.mjs --cards` already builds a login holding exactly one card, so the test is runnable.
Admin stays a row because it sits outside the card system. Line 70 now asks for "cards affected" and says who
holds them today is labelled context only. Section numbers and headings are unchanged; the checker matches on
none of the wording changed (it never reads the matrix).

## (C) measurement rule
Moved from PR #1207's decision file into `CLAUDE.md` ("Measuring the public site"). Backlog: only that half
of the speed item is struck; its five optional optimisations stay open.

## Left alone
`scripts/check-test-plan.mjs` (not touched, not loosened), `AGENTS.md`, all of `src/`.
