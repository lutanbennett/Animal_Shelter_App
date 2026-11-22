# The tenancy canary cannot be run against production: the script refuses it, by design

**2026-11-22.** `#ykefa`'s one remaining step — *"the canary against production as the real anon path"* —
**was attempted with Lutan's authorisation and did not run.** `scripts/check-tenancy-canary.mjs` refuses
`--env production` itself. This file exists so the next session does not re-derive that, and so the item
does not close on a claim nobody checked.

## What was run, and what came back

From the main checkout, bare (the allow rule is an exact match, so a `cd` prefix or a pipe makes the
classifier refuse it as a production deploy):

```
node scripts/check-tenancy-canary.mjs --env production --untrusted --strict
exit 2
Never against production: the canary plants rows (rolled back) and a worktree cannot read it. NOT CHECKED.
```

Lutan authorised it in chat — asked whether to run it, he answered *"Yes, run it"* — after being told
what it does (plants a second shelter's rows inside one transaction that always rolls back) and that the
production Management API token can already write, since it applied `0434` an hour earlier.

## It is a deliberate guard, and it was not patched

```js
} else if (envName === "production") {
  console.error("Never against production: the canary plants rows (rolled back) and a worktree cannot read it. NOT CHECKED.");
  await exitWith(2);
}
```

`scripts/check-tenancy-canary.mjs` lines 61–63, added in **`a83d220d4` (2026-11-16)** — the same commit
that created the script. **No flag overrides it**: there is no `--force`, no `--allow-production`, nothing.

**It was not edited, and it should not be edited as part of closing `#ykefa`.** Changing a guard so that a
task can be ticked is the fault shape `CLAUDE.md` names in Lutan's own words — *a tool's suggested remedy
is not advice* — and this guard does not even offer a remedy to misread. Removing it would turn an
unproven claim into a tick, which is the opposite of what the item asks for.

## Its stated reason has two halves, and only one of them holds here

- *"a worktree cannot read it"* — **does not apply.** This was run from `C:\Development\Animal_Shelter_App`,
  the main checkout, which reads production routinely (both pre-flight commands below answered from it).
  The half is about a *worktree*, and a worktree is not where this was run.
- *"the canary plants rows (rolled back)"* — **stands, and it is the author's deliberate choice.** The
  rollback is by `raise`, so the transaction always aborts and the result travels in the error message. It
  is nevertheless a write transaction against the real database.

**No decision file records why.** None of the four canary decision files —
`2026-11-16-tenancy-canary-diff.md`, `2026-11-18-what-the-canary-proves.md`,
`2026-11-18-canary-proved-red-by-dropping-a-policy.md`, `2026-11-19-canary-plain-run-trust.md` — mentions
production or this guard. So the single thing blocking `#ykefa` had no written reasoning until this file.

## What WAS proved, on UAT, which the guard allows

```
node scripts/check-tenancy-canary.mjs --env uat --untrusted --strict
exit 0
Pass: UNTRUSTED (the 0392 per-shelter clause decides)
Project fsjagxmxjosauwmxwype
Read-as probe: {"jwt_claims":"{\"role\":\"anon\"}","current_user":"anon","is_trusted_caller":false}
Planted (rolled back, nothing left behind): residents + attachments rows for shelter B
Read 23 anon-reachable objects as the anon role (23 answered, 0 refused at read)
Id-taking anon functions: 2; cross-tenant calls made for the ones with a uuid or text argument: 1
0 new leak finding(s), 0 known (Part 5), 0 unstable object(s)
```

**Why this is worth more than a dev run and still less than production:** UAT's project holds **production's
real people** and the same schema (re-read the same day: production and UAT both `435 applied, 0 pending`,
`No drift` both ways). `is_trusted_caller: false` in the probe is the part that matters — without
`--untrusted` the harness goes in as a trusted caller, every per-shelter policy stands aside, and the run
proves nothing about the path PostgREST uses (`2026-11-18-what-the-canary-proves.md`, and the same trap
again four days later in `2026-11-22-scoping-harness-claims.md`).

**It is not production, and it is not presented as production.** Production's own anon path remains
unproven by this check.

## The pre-flight readings, re-measured rather than inherited

Both were handed over by the backlog manager and both were re-read here, bare, before anything else:

- `node scripts/apply-migrations.mjs --status --env production` → **435 applied, 0 pending**, 0 missing and
  0 extra against `origin/main`. **So there is no bulk apply left to rehearse**, which is what retired the
  October plan's four-hour rehearsal.
- `node scripts/check-deployed-hosts.mjs --env production` → every deployed address has a `shelter_hosts`
  row **and** an `/auth/callback` entry: `lannacareforanimals.org`, `www.lannacareforanimals.org`,
  `cooperjaidee.org`, `www.cooperjaidee.org`.

**One claim in the handover could not be supported from the repository.** It says the canary *"was
exercised on UAT"* before today; a `grep` across `docs/decisions/`, `docs/test-plans/` and
`docs/releases/` finds no record of any UAT run. It may well have happened unrecorded — but `#ykefa` must
not rest on it, and today's run above is now the first recorded one.

## What this leaves open, and whose it is

**`#ykefa` is NOT ticked, and `docs/backlog.md` was not edited.** Its closing condition is *"that run is
green and written down"*, and the run did not happen. The item's wording belongs to the backlog manager,
who holds it and its thirteen parts and has been told.

Three routes, and the choice is Lutan's or the planner's rather than a release manager's:

1. **Amend the guard deliberately** — make production opt-in behind an explicit flag, with a decision file
   saying why a plant-and-rollback is acceptable against the live database. That is a stream plus a
   decision, not a release step.
2. **Close `#ykefa` on the UAT run plus a stated limit** — the untrusted pass is green on a database
   carrying production's rows, and production's own anon path is recorded as unproven.
3. **Leave it open** until someone wants route 1.

**What nobody should do:** run the plain (trusted) pass against production if the guard is ever lifted and
read it as a pass. It would exit 0 having stood every per-shelter policy aside.
