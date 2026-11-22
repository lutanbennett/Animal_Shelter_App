# The tenancy canary ran against production, untrusted, and found nothing (`#ykefa`, `#cnypd`)

**Date:** 2026-11-22. **Run by:** Lutan, from `C:\Development\Animal_Shelter_App`, after `0.48.0` shipped.
**Written by:** the release manager session, because `#ykefa` names the decision file as the release
manager's and the next release record as where it is cited.

This is the successor to `docs/decisions/2026-11-22-tenancy-canary-not-run-on-production.md`, written
this morning when the guard had no override and the run could not happen. **That file is not wrong; it
has a successor.** It records the attempt, the refusal and the route chosen, and it now points here.

## What was run

```
node scripts/check-tenancy-canary.mjs --env production --untrusted --strict --i-understand-this-plants-rows-in-production
```

The flag is the one `#cnypd` specified and #1831 built: typed in full, production-only, **useless on its
own** — it still demands `--untrusted`, refuses `--prove-red`, and refuses to run in CI
(`docs/decisions/2026-11-22-tenancy-canary-production-flag.md`).

## The result

```
Pass: UNTRUSTED (the 0392 per-shelter clause decides)
Project dbkodyyxxhtygxcxmfcu
Read-as probe: {"jwt_claims":"{\"role\":\"anon\"}","current_user":"anon","is_trusted_caller":false}
Planted (rolled back, nothing left behind): [{"residents":"cc39fd32-a6af-4285-a231-0a24105bd2ef"},
                                             {"attachments":"canary-b-file-44f30fb4-618c-437e-a417-b580a7fdcb24"}]
Read 23 anon-reachable objects as the anon role (23 answered, 0 refused at read, e.g. column-level grants).
Id-taking anon functions: 2; cross-tenant calls made for the ones with a uuid or text argument: 1
0 new leak finding(s), 0 known (Part 5), 0 unstable object(s).
STRICT: exiting 1 on any finding.
```

## What it proves, precisely — and `is_trusted_caller: false` is the whole of it

**`is_trusted_caller: false` is the point, not a detail.** It means the run went in as **the real
anonymous path PostgREST uses**, so the per-shelter restrictive policies `0392` added were the thing
deciding what could be read. A *trusted* run stands every one of those policies aside, which is why
every earlier reading was insufficient however green it looked — and it is the specific artefact
`docs/decisions/2026-11-22-scoping-harness-claims.md` was written about, where 6 rows seen through a
claim-less harness turned out to prove nothing about `anon` and a migration (`0430`) was written to fix
a leak `anon` never had.

So: **a second shelter's rows existed inside that transaction, on the real database, and changed nothing
a stranger can see.** `--strict` exits 1 on any finding, and it exited on none.

## And its limits, in the instrument's own words, so nobody reads this as more than it is

- **It cannot see service-role calls.** Those are code paths, not a database role, so no policy governs
  them. They are Part 7's subject, which is done and checked separately by
  `scripts/check-service-role-shelter.mjs`. **This run says nothing about them either way.**
- **It cannot run on the pull-request path**, because that would mean a write-capable token on a public
  repository. **So this is a run someone triggers, not a gate**, and it will not stop a future change
  that reintroduces a leak. The nightly read-only lint and `check-tenancy-catalogue.mjs --strict` at
  release time are what run unattended; this is the one that plants a row and must be asked for.
- **It plants rows in the real database and rolls them back.** The output names what was planted so the
  rollback can be checked against something rather than trusted. Nothing was left behind.

## The first attempt failed, and that is the flag working

His first run was refused:

```
Not against production without --i-understand-this-plants-rows-in-production: the canary plants rows
(rolled back) in the real database. Read docs/decisions/2026-11-22-tenancy-canary-production-flag.md
first. NOT CHECKED.
```

**The cause was a trailing full stop on the end of the flag**, picked up in the copy. **Recorded as a
measurement of the flag rather than as a user error:** it is long enough that a copy acquires a stray
character, and the guard caught it, named the exact flag it wanted and pointed at the file to read
first. That is `#cnypd`'s intent — *typed, unmistakable, and refusing by default* — behaving correctly
on its first real encounter with a human. **The length is the price of being unmistakable and is worth
paying; nothing here argues for shortening it.**

## How this is known, stated exactly rather than implied

**I did not witness this run, and this file should not be read as though I had.**

- **The run is Lutan's**, in his own PowerShell window.
- **The observation is the backlog manager session's**, from two screenshots of that window which Lutan
  pasted into its conversation and which it transcribed: one showing the refused attempt with the
  trailing full stop, one showing the command without it and the output above.
- **What I verified myself:** that the flag exists and behaves as described (read in
  `scripts/check-tenancy-canary.mjs` — `PRODUCTION_FLAG`, the `--untrusted` requirement, the
  `--prove-red` and CI refusals), and that no committed file previously recorded a production run.
- **What I could not verify, and why the absence proves nothing:** `mcp__terminal__read_terminal` reads
  **only the app's Terminal panel**, and this session has one such tab whose scrollback ends at the
  `0.48.0` deploy. He ran the canary in his own terminal, which that tool cannot see. **The canary also
  writes no log and leaves no file by design**, so a completed run has no footprint to find. Worth
  knowing before anyone else treats a quiet terminal as evidence either way.

**Why the distinction is drawn so sharply.** A decision file is what the next person reaches for when
something has gone wrong, and the project's own rule is that a signature which does not correspond to
someone having looked is worse than none. The result is recorded here because it was **seen**, by a
named session, in images from the machine that ran it — not because it was reported. The earlier relay
of an *inferred* UAT run, corrected the same day, is why this paragraph exists at all.

## What this closes, and what it does not

- **`#ykefa` (multi-tenancy, the index item) is ticked**, and this file is the record it names as owed.
- **`#cnypd` is ticked**: the flag is built, its expensive half — what a planted row sets off that a
  rollback does not undo — is settled in its own decision file, and the run it existed to permit has
  happened.
- **It does not make the canary a gate.** Nothing runs it automatically and nothing will.
- **It does not cover service-role code**, as above.
- **It is a dated measurement, not a standing guarantee.** It judged the schema as it stood on
  2026-11-22, at `0.48.0`. Re-run it after any change to the per-shelter policies, the `definer_all`
  policies or the anon-reachable surface, rather than citing this file.
