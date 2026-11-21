# Primary host backfill (#9l7xf)

**Step zero:** gap still there (`my_shelters()` joins `is_primary` inner; dev `lanna` had 5 hosts, 0 primary).

**Was 0428 an oversight?** No. 0428 backfills only a shelter with exactly one address and says in its comment "with several, none is marked; the app shows the oldest until someone chooses". That fallback was never written into 0433, so the gap is between two deliberate halves.

**Shape chosen: (a), by script, `scripts/set-primary-hosts.mjs`, not a migration and not a fallback in the function.** The measured tie (production: three of four hosts share `created_at` to the microsecond; two are wrong: `cooperjaidee.org`, a `www.` form) defeats "oldest". Only the deployment knows the website address: `PUBLIC_HOST` in `wrangler.jsonc`. Rule (`choosePrimaries()`): flag `PUBLIC_HOST` when it is one of that shelter's own hosts; any other unflagged shelter is printed UNDECIDED and left alone. Never guesses; never touches a shelter with a primary.
**Rejected:** (b) fallback inside `my_shelters()`: a deterministic rule cannot separate `lannacareforanimals.org` from `cooperjaidee.org`, and it would hide the missing flag forever. A migration: cannot read `wrangler.jsonc`.

**Proved on dev by driving the function** as a login holding a role at `lanna`: `my_shelters()` returned no row before, and `lanna` / `test.lannacare.org` after.

**Can it recur?** Yes: a shelter whose first address was added before 0428, or whose primary is later removed. The trigger covers new first addresses. Guard added: `check-deployed-hosts.mjs` now fails naming any live shelter with addresses and no primary (it already runs at release).

## Run on UAT and production (the planner; a stream cannot reach them), in this order
1. `node scripts/set-primary-hosts.mjs --env uat` (expect SET lanna: uat.lannacare.org), then again with `--apply`.
2. `node scripts/set-primary-hosts.mjs --env production` (expect SET lanna: lannacareforanimals.org; `cooperjaidee.org` and the `www.` forms stay unflagged), then with `--apply`.
3. `node scripts/check-deployed-hosts.mjs --env production` should pass.
Unresolved: `test123` on production is not covered if it has several hosts; it prints UNDECIDED (Lutan's own script owns it).
