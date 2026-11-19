# A stale release handover is reported, not blocked (`#hndvr`)

**Problem.** The release record and `docs/release-handover.md` are one PR (release-procedure rule 3). That was missed on `0.47.1`, `0.47.3` and `0.47.4`, each time found by Lutan asking. A prose warning had been tried and did not hold.

**Decision.** `scripts/check-release-handover.mjs` compares the newest `docs/releases/<date>-<version>.md` with the handover's first line. It is **advisory: it always exits 0**, prints `Current` or `STALE`, and is not in CI or branch protection. `/plan-day` step 1 and release-procedure rule 3 run it.

**Why advisory.** A required check would be red on every record PR in the minutes before the handover is written. This matches `test-plan`, advisory permanently by Lutan's decision of 2026-10-20: a red people are emailed about hourly is one they filter. Making it blocking needs Lutan's say-so and was not asked.

**Design point, not a caveat: an edition may cover two releases** (the `0.47.2` and `0.47.4` editions do). The test is "does the newest version appear", never "exactly one". A fixture proves it: a handover naming only `0.47.3` is STALE against a newest of `0.47.4`; one naming `0.47.3` and `0.47.4` is current. The repo root is injectable (`node scripts/check-release-handover.mjs <root>`).
