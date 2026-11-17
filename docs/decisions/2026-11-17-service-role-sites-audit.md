# Part 7, first half: every service-role call is recorded, and a new one fails the build (2026-11-17, #ps6ms)

**What shipped.** `docs/service-role-sites-registry.json` (one named record per `createAdminClient()` call, each with a
classification and a reason), `scripts/check-service-role-sites.mjs` (fails on an unrecorded call, a stale record, a bad
classification or an empty reason), its planted-violation test, and one line in the existing `hard-coded-security` CI job.
No call site, migration or file under `src/app/` changed. **The filters are Part 7's second half and remain.**

**Counts, measured 2026-11-17 on `src/` with `grep -rn "createAdminClient("`, definition excluded:**
**81 calls in 35 files** (the item's 82 across 35 was one off on calls; the planner's 36 files counted `admin.ts`'s own definition).
Files naming `SUPABASE_SERVICE_ROLE_KEY`: **5 in `src/`** (`admin.ts` and four routes/libs that read it directly), **59 across `src/`,
`scripts/` and `worker/`**. The item's 12 is neither; it was probably an older, narrower reading. The scripts and worker files
are outside this check on purpose: they run as the operator, not as a request.

**Rule applied.** *needs-shelter-filter*: the site reads or writes tenant data, or administers a login, on behalf of a person
or a public request, so another shelter's rows must not be reachable. *cross-shelter*: a platform job (cron sweep, health
facts) or an operation on the caller's own auth row. *unclassified*: cannot be decided from the code. Result: **59 / 14 / 8**.
Records are keyed `file#enclosingTopLevelFunction` (`#2` for a second call in one function), not by line number, so they survive edits.

**What the check does not catch.** It proves each call is *recorded*, not that a "needs filter" site is filtered, and the
classification is a judgement a reviewer can disagree with. A client built some other way (`createClient` with the key) is
not found; `check-hard-coded-security.mjs` already fails an unrecorded key reference. Two calls in one function are told apart
only by order. It reads `git ls-files`, so an untracked file is not seen until it is added.

**Answer to the inversion question (deliverable 6): the audit and the check did not need Part 5.** 73 of 81 sites classify from
what the code is for, and the check asserts a recorded decision, not a policy outcome. **Eight sites could not be classified
without a design decision that is not a policy:** `lib/status/alerts.ts` (6) and `lib/status/usage.ts` (2). They are
platform monitoring if `/admin/status` belongs to one Lanna operator, and a leak if it belongs to each shelter's admin. That depends
on whether Part 5 models a platform operator separately from a shelter admin. They stay `unclassified`; the check tolerates and prints them.
What Part 5 *is* needed for is the second half: testing that a filter actually holds.

**Not changed:** `admin.ts` itself. The one thing worth the planner's attention is that it already takes `{ shelterId }`, which is
what the second half's filters would pass.
