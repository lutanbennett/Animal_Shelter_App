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

## Does a retry clear it? YES. The `#bld1f` claim that it does not was wrong.
`scripts/gates.mjs` never removes `.next` (grep: no rm of it). In this fresh worktree, `gates.mjs` run 1:
`typecheck=0 lint=0 test=0 build=1` (212 s, halt text printed). Run 2, nothing touched:
`typecheck=0 lint=0 test=0 build=0` (64 s). A receipt file existed in
`.next/cache/next-agentic-upgrade-retries/` after run 1. So the message is accurate: it stops once per
cache. A fresh worktree has no cache, so its first build always pays. The earlier "failed twice" reading
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
