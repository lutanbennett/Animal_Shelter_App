# 2026-11-20 — A database-level proof is not an end-to-end one (`#uatsb`)

## What happened

`#hostx` found that an address with no `shelter_hosts` row resolves to no shelter, so the Worker
sends no `x-shelter-id`, `0392`'s restrictive policies answer nothing, `my_permissions()` is null
and **every** sign-in is refused as *"This account doesn't have access yet"* — on an address whose
pages render perfectly. The rows were added on dev, UAT and production, and
`scripts/check-deployed-hosts.mjs` shipped to stop it recurring.

**UAT still refused every sign-in afterwards.** It was found by going to UAT to prove something
unrelated (`#drvtk`'s photo upload) and pressing the button.

## The cause, measured

Ruled out first, in this order, so the conclusion is not a guess from the symptom:

- the login — one **live** Admin role on Lanna in UAT's own database: `is_admin` true, `archived_at`
  null, `starts_on` and `ends_on` null, `role_row_live()` true;
- the rows — UAT's `shelter_hosts` holds `uat.lannacare.org` and `www.uat.lannacare.org`;
- the build — all three Pi instances are on the same commit.

Then: `worker/shelter.mjs`'s `resolveShelterSite()` returns `none` when
`!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY`, and `wrangler.jsonc` set `SUPABASE_URL` in
the `test` block and the `production` block **and not in the `uat` block**. The UAT Worker therefore
never called the lookup at all. **No number of rows helps a Worker that never reads them.**

`test` and `production` set it for the translations cron, which UAT does not run — which is exactly
why UAT never got it. The same variable is also needed by `worker/heartbeat.mjs` and
`worker/writer-runs.mjs`, so UAT was quietly missing those too.

## The decision

The fix is the variable **and a rule that fires**, not the variable alone.

The rule lives in `scripts/lib/site-hosts-problems.mjs`, beside the other pre-flight host rules, so
`scripts/check-site-hosts.mjs` runs it on the real files **and on deliberately broken copies** —
that file's existing self-proof, which is what makes a green run mean the rules work rather than
that nothing tripped. Two broken copies were added: a routed environment with the value deleted, and
two environments sharing one value. Both are asserted to make a named rule fail.

It is scoped to environments that **have routes**: an environment nothing can reach cannot refuse
anybody. And it checks the values are **distinct**, because the tempting one-line fix is to copy a
neighbour's, which would point a site at another environment's database — a worse fault than the one
being fixed, and a silent one.

## Why this is written down rather than just fixed

**Both proofs that existed were database-level, and neither touches the Worker.**
`check-deployed-hosts.mjs` passed on UAT. `resolve_shelter_site()` answered correctly on UAT. Every
sign-in on UAT was refused throughout. The checks were right about the data and said nothing about
whether a person could sign in.

Two things follow:

1. **The only proof of a sign-in is a sign-in, pressed.** For an address, the check is necessary and
   not sufficient. Production's `www.lannacareforanimals.org` has its row and its Worker does set
   `SUPABASE_URL`, so it is expected to work — and that expectation is not a reading.
2. **A setting that is not deployed changes nothing.** This PR lands the value; the UAT Worker deploy
   is a separate step and is Lutan's (his instruction, 2026-10-02). `#uatsb` stays open until a
   sign-in on UAT has been pressed, and `#drvtk`'s UAT upload stays open behind it.

## What was deliberately not done

- `#uatsb` is **not ticked** in this PR, and `src/lib/releases.ts` gains **no** note: both would tell
  a reader the fix works now, when it works only after a deploy nobody has run
  (`docs/decisions/2026-10-11-release-note-truth-rule.md`).
- Nothing in the `test` or `production` blocks was touched; both are asserted byte-identical.
- Whether UAT's Worker already holds the `SUPABASE_SERVICE_ROLE_KEY` secret was **not** verified —
  a Worker's secrets cannot be read back. If the deploy does not fix the sign-in, that is the next
  thing to look at.
