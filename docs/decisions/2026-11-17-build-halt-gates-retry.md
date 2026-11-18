# gates.mjs re-runs the build once when Next's advisory halt stops it (#bhalt)

Decided 2026-11-17 by the stream; not a decision of Lutan's.

## Measured, not read: it is a one-shot token
Four consecutive `npx next build` in one worktree, receipt folder emptied first, 2026-11-17:

| Run | Start | Result | Receipt afterwards |
|---|---|---|---|
| 1 | 20:20:20 | exit 0, no halt | none written |
| 2 | 20:25:19 | exit 1, `SecurityFatalError` | written |
| 3 | 20:26:51 | exit 0 | consumed |
| 4 | 20:28:01 | exit 1, `SecurityFatalError` | written |

Runs 2-4 sit inside five minutes. A "five-minute window of silence" predicts 2 halt, 3 pass, 4 pass;
the data is halt, pass, halt. So `nudge.js` (`allowNudgeRetry`) issues a **one-shot token valid for five
minutes**: the halt writes it, the next build inside five minutes spends it, the one after halts again.
This corrects "suppresses itself for five minutes" in `2026-11-17-next-agent-upgrade-halt.md` and the briefs.
Run 1 neither halted nor wrote a receipt; why is not established (the advisory lookup did not fire).

## Honest suppression? No variable qualifies. Definition used
Honest = changes no dependency, hides no real finding from anyone who would act on it, weakens no gate,
and would not mask a different advisory later.
- `__NEXT_AGENT_UPGRADE` (`nudge.js:94`): selects an upgrade *policy* (`security`/`latest`/`experimental-future`).
  Setting it asks the tool to act on an upgrade. Not honest here: upgrading is out of scope.
- `NEXT_PRIVATE_ALLOWED_UPGRADE_RETRIES` (`nudge.js:98`): read only when `NEXT_PRIVATE_WORKER === '1'`;
  entries must be 64-hex identities. Spoofing a worker flag to pre-spend tokens is a private-API misuse
  and would silence every later advisory for that identity too. Not honest.
- `experimental.agentUpgrade: false`: hides the advisory for everyone, including a new one. Not honest.

## What changed
`scripts/gates.mjs`: the **build gate only** passes its output through unchanged while watching for
`SecurityFatalError`. If the build exits non-zero *and* that marker was printed, it re-runs the build
**once, immediately**, while the token is fresh, and reports the second run's own exit code. Any other
failure, and a second failure, is reported as is. Typecheck, lint and test are untouched.
Alternatives: re-running all of `gates.mjs` costs ~9 minutes to spend a token that expires in 5.
Running build first fails on a cold cache (the first build writes the token and halts; nothing before it
absorbs that), so it saves nothing.

## Proof it does not hide a real failure
Scratch type error in `src/scratch-bad.ts` (removed): `gates: typecheck=2 lint=0 test=0 build=1`, exit 1,
no re-run line printed (build failed on the type error, not the halt).

## Cost
The saving is the second *whole* gates run or the manual `npx next build` plus the turns to notice
(measured: a build is 62-92 s here; the retry costs one build, not nine minutes). Untested beyond one
run: let the next batch be the evidence.
