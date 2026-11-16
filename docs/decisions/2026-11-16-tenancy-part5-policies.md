# Part 5 of the tenancy programme (#ujqr5): NOT BUILT — no row carries a shelter yet, so any per-shelter policy blanks everything

**Status: stopped at deliverable 3 by a measurement. No migration written, nothing applied to dev. `#ujqr5` stays open.**

## What was measured (dev project `qxkmhwybjggxvsfxsxbd`, 2026-11-16, `main` at `a911f04b6`)

- **Not already built.** No per-shelter restrictive policy exists; the only `as restrictive` policies are the older aal2 and attachment-folder ones. `current_shelter_id()` is called by nothing.
- **Counts.** 124 public tables; **95 carry `shelter_id`, 29 do not**, which agrees with the handover. The 29 (RLS on) are the lookup/catalogue tables, `shelters`, `schema_migrations` and the status-alert tables. I did not split "ambiguous" from "not tenant" (the 21/8 vs 9 question stays open).
- **Before readings.** `check-tenancy-catalogue.mjs --env test --strict --tenant-role rls_definer`: `0 flagged (0 views, 0 functions, 0 tables missing definer_all), 2 allowed by name, 0 stale` (the script's `--env` takes `test`, not `dev`; it is the same project). `check-tenancy-canary.mjs`: `0 new leak finding(s), 2 known (Part 5), 0 unstable object(s)`.
- **THE BLOCKER: every `shelter_id` column on dev is empty and nothing fills it.** All 95 columns are nullable, **none has a default, none is NOT NULL**, `residents` has 17 rows and **0 stamped**, and no function or trigger on dev references `current_shelter_id()`. Parts 2/2b/2c added the columns deliberately with "no default, no backfill, no NOT NULL".
- **Probe (rolled back, nothing left behind):** a restrictive policy `is_trusted_caller() or shelter_id = current_shelter_id()` on `residents`, read as `authenticated`: 0 rows with no header and **0 rows with a valid `x-shelter-id` header too**, against 17 as the owner. The policy hides every row from every login even when the header is right, because `null = <uuid>` is never true.

## What that means for the brief's questions

- **Deliverable 3 (dev):** both fears hold, and a worse one sits behind them. Applying now blanks every signed-in `localhost` session for every stream (no Worker, no header), and it would do so for production too **even with the header deployed**. New rows are also written with a null shelter, so they would be invisible the moment they were saved.
- **What Part 5 needs first, and it is a design job of its own, so I stopped rather than build it here:** (1) stamp the existing rows with the shelter they belong to (Lanna, shelter #1, an explicit one-off data statement, not a default); (2) a way for new rows to take their shelter (a default or trigger reading `current_shelter_id()` for logged-in callers; trusted callers have no shelter, which is the same problem 0383 solved for `reset_diet_rounds` by hand, and 55 existing triggers write rows); (3) then `NOT NULL`. I found no backlog part that owns (1)–(2): Part 6 is the hand work on singletons, Part 7 the service-role calls. **For the planner to file, or to fold into Part 5 as its first half.**
- **Not touched, as the brief requires:** no `current_shelter_id()` fallback to Lanna, no change to `src/` or `worker/`, the two `KNOWN_TODAY` entries, `docs/release-procedure.md` §5 (the line is still wanted, with the migration), `docs/backlog.md`.

## Deliverables, one line each

1 step zero: done (above). 2 first commit: this file. 3 dev question: settled (above). 4 wait for other PRs: moot, none open when checked. 5 migration, 6 views, 7 §5 line, 8 header confirm per environment, 9 after readings, 10 backlog tick: **not done**, blocked on the stamping work. 11 plan and merge: PR opened `[unfinished]`, not merged.
