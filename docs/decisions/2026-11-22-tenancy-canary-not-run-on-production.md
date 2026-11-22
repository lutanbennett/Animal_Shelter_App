# The tenancy canary cannot be run against production: the script refuses it, by design

> **SUPERSEDED THE SAME DAY — AND IT IS A SUCCESSOR, NOT A CORRECTION. THE RUN HAPPENED.**
> Everything below was true when written: the guard had no override, the run could not happen, and the
> route was chosen.  then shipped the flag (#1831) and **Lutan ran the canary against production
> that afternoon — untrusted, strict, and it found nothing.**
> **Read `docs/decisions/2026-11-22-tenancy-canary-run-on-production.md` for the result**, its limits, and
> how it is known. Do not read this file as the current state of the question.

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

**One claim in the handover could not be supported from the repository, and it turned out to be an
inference.** `#ykefa` said the canary *"was exercised on UAT"*; a `grep` across `docs/decisions/`,
`docs/test-plans/` and `docs/releases/` found no record of any UAT run. Raised with the backlog manager,
who checked and confirmed it was inferred rather than observed and has corrected that clause in those
words. **The UAT run above is therefore the first on record.**

## What this leaves open — DECIDED THE SAME DAY: `#cnypd`

**`#ykefa` is NOT ticked, and `docs/backlog.md` was not edited by this PR.** Its closing condition is
*"that run is green and written down"*, and the run did not happen.

**Lutan was shown three routes with their costs and took the strongest, 2026-11-22: make production opt-in
behind an explicit flag, with the decision file, rather than closing `#ykefa` on UAT.** It is filed as
**`#cnypd`** (Architecture, immediately after `#ykefa`), which is now `#ykefa`'s only blocker. The two
routes he did not take — closing on the UAT run with a stated limit, or leaving it open — are recorded
here only so nobody re-derives the choice.

**`#cnypd` is a stream's job, not a release step**, and it ends at a flag provable on dev and UAT. The
production run stays Lutan's afterwards. Three things it carries, from the item:

- **The flag must be typed, named so it cannot be passed by accident, and must refuse unless `--untrusted`
  is given too** — a trusted run against production would plant rows for nothing. Every other limit
  stays, including that it cannot run on the pull-request path (a write-capable token on a public repo).
- **The expensive half is a question, not the flag: what does planting a row set off that a rollback does
  NOT undo?** The rollback is total *inside* the database. It does not recall a trigger that sends mail or
  calls a webhook — and this schema has the status-alert mailer from `0098` — nor a `pg_net` request,
  nor a `NOTIFY` something is listening for. **To be established by reading the triggers on `residents`
  and `attachments` and whatever they call, on production's own schema, not reasoned from dev.** If
  anything does leave the database, **the flag is the wrong answer and the item changes shape rather than
  being forced through.**
- **It is not permission to delete the guard**, and **not a precedent for editing a refusal so that a task
  can be ticked.**

**What nobody should do, once the flag exists:** run the plain (trusted) pass against production and read
it as a pass. It would exit 0 having stood every per-shelter policy aside — which is the whole reason
`--untrusted` exists.
