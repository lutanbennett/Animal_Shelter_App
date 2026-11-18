# `check-scheduled-writers.mjs` classifies a delete-only `security invoker` function (#ukncl)

**The blind spot.** The function list was `security definer` functions plus trigger functions. A plain `security invoker`
non-trigger function such as `purge_write_requests()` was never in the list, so the cron job calling it fell through to the last
`else` and printed `[UNKNOWN]`: "calls no function in the list". Identical on both databases, so the instrument, not the data.

**What changed.** The SQL predicate also takes any function whose name appears followed by `(` in a `cron.job` command
(`\m<name>\s*\(`). I chose widening the one query over a second lookup because it keeps the "one SELECT" property and the
function then flows through the same `classify()` as every other. The summary line now says what it counts: "function(s) read
(security definer, trigger, or named by a cron command)". Dev went from 91 to 92, the one added being `purge_write_requests`.

**Bucket question: a new bucket, `deleteonly`, not `nowrite`.** `nowrite` is labelled "writes no shelter table", which is false
of a function that deletes from `write_requests`. A delete cannot create a row, so it cannot create a mis-shelter'd one, which
is the whole reason such a function needs no shelter. The label says that: "DELETES ONLY — creates no row, needs no shelter".
It is bucketed only when every write to a shelter-bearing table is a `delete from`; any `update` stays in `sends` as before, and
any insert or `EXECUTE` is judged exactly as before. Ranking for a job calling several functions: none < unknown < sends <
deleteonly < nowrite, so a job is never reported better than its worst function.
Side effect, correct and intended: delete-only functions already in the list (`discard_label_draft`, `drop_translations`,
`purge_assistant_actions`, ...) moved out of "SENDS A SHELTER", where their "only updates/deletes" text had been a stretch.

**What an unclassifiable function still does.** Still `UNKNOWN`: proved by scheduling a throwaway invoker function using
`EXECUTE` on dev, which printed `[UNKNOWN] ... uses EXECUTE (dynamic SQL)`; the job and function were removed afterwards.

**Still cannot see.** A function that calls another writing function is not followed; a cron command that reaches its function
by any form other than `name(`; the Pi; production unless run with `--env production`.
