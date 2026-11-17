# The `next build` advisory halt: recorded, version left alone (Path B)

Backlog `#bld1f`. Decided 2026-11-17 by the stream, not a decision of Lutan's.

## Mechanism
`next build` compiles fully, prints the route table, then raises `SecurityFatalError` to show a Next
advisory. It runs only when an agent drives the build: `node_modules/next/dist/esm/lib/upgrade/nudge.js`
skips on `isCI` (line 391) and calls `getAgentName()` (line 396). CI never sees it. The receipt is
written under `.next/cache/next-agentic-upgrade-retries/` (`nudge.js:43`).
Switch: `experimental.agentUpgrade` (`config-shared.d.ts:367`). Not set; setting it `false` would hide a real advisory.

## The advisory
GHSA-mfr8-8qww-v76h, moderate, `next@16.4.2`: information disclosure across root params when a
`"use cache"` function is called through `unstable_cache()`. It needs both. `16.4.6` is `latest`.

Reachability, grep on 2026-11-17 (re-run before trusting):
`grep -rn "unstable_cache\|use cache\|cacheLife\|cacheTag" src/ worker/` -> no output.

## Does a retry clear it? ONLY INSIDE FIVE MINUTES. Both earlier answers were half right.
**Amended 2026-11-17 by the planner, after this file's own answer failed to reproduce.** The heading here
used to read *"YES, the `#bld1f` claim that it does not was wrong"*. **That is true for the run below and
false for a full `gates.mjs` re-run, and the reason is a timer neither reading had found.**

**THE MECHANISM, READ OUT OF `node_modules/next/dist/esm/lib/upgrade/nudge.js`:** the halt writes a receipt
`{"issuedAt":<ms>}` to `.next/cache/next-agentic-upgrade-retries/<hash>.json` (line 43) and suppresses
itself **only while `now - issuedAt < RETRY_TTL`, and `RETRY_TTL = 5 * 60 * 1000` — five minutes** (lines
17 and 70). **So it does not stop "once per cache": it stops once per five-minute window.**

**WHICH IS WHY THE TWO READINGS DISAGREED, AND BOTH ARE NOW EXPLAINED.** The run below took **64 s** for
its second build — comfortably inside the window, so the halt stayed suppressed. **On
`claude/planner-handover-757` the planner ran `gates.mjs` twice and got `build=1` BOTH times**, because a
full gates run here is about five to six minutes (typecheck 43 s, lint ~3 min, tests, build 124 s), **so
the receipt had already expired by the time the second run reached its build step.** `.next` was never
removed and the receipt file was present throughout.

**THE DECISIVE TEST: `npx next build` alone, started with the receipt 88 seconds old — exit 0, no halt,
no advisory text in the log.** Same tree, same cache, same commit; only the elapsed time differed.

**SO THE ADVICE THAT WORKS IS NARROWER THAN "RUN IT AGAIN": re-run `npx next build`, not
`node scripts/gates.mjs`.** Re-running the gates pays five minutes to be told the same thing, which is
exactly the wasted run `#bld1f` was filed about. **And it also answers the question this file left open**
(*"Why PRs #1650/#1651 had `build=0` was not investigated"*): their gate runs reached a build inside the
window.

**The original reading is kept below, unedited, because it is a correct measurement of its own run.**
`scripts/gates.mjs` never removes `.next` (grep: no rm of it). In this fresh worktree, `gates.mjs` run 1:
`typecheck=0 lint=0 test=0 build=1` (212 s, halt text printed). Run 2, nothing touched:
`typecheck=0 lint=0 test=0 build=0` (64 s). A receipt file existed in
`.next/cache/next-agentic-upgrade-retries/` after run 1. So the message is accurate: it stops once per
cache. **[AMENDED: once per five-minute WINDOW, not once per cache — see above.]** A fresh worktree has no cache, so its first build always pays. The earlier "failed twice" reading
was not reproduced here. (Why PRs #1650/#1651 had `build=0` was not investigated.)

## Path chosen: B (record, leave the version). Reason
Not reachable, no user-visible change, and the upgrade path wants a changelog read and a real audit run
in its own PR. Path A (`next@16.4.6`) stays the alternative and is not rejected.

## Register home: NOT `docs/advisory-register.json`
`scripts/audit-register.mjs` only puts high and critical advisories into `found` (lines 34, 59-72), and
only checks `mustStayAbsent` for ids in `found`. A moderate entry would never be checked, and the script
would print "no longer reported. Delete its entry" on every run. It would guard nothing and mislead. So
the record is this file; the greps above are the re-check. The `#bld1f` done-when asked for a register
entry; that part is deliberately not done. Left: a real guard (a check script that fails if
`unstable_cache` or `"use cache"` appears) is for the planner to file; it needs a CI home that runs when
source changes, not only when `package.json` does.

## Also done
`.claude/skills/plan-day/brief-blocks.md` block G names this as a known environment fault: retry is
correct, report it, do not upgrade from the build message.
