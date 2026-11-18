# What the tenancy canary's red runs prove (#cniso)

2026-11-18. Follows PR #1703, whose `leak-table` run exited 1 with the restrictive policy still in place.

## The measurement (dev, inside the rolled-back harness, read as `set local role anon`)

    Read-as probe: {"jwt_claims":null,"current_user":"anon","is_trusted_caller":true}

`is_trusted_caller()` (0383) is `coalesce(request.jwt.claims ->> 'role','') not in ('anon','authenticated')`. It reads the
JWT claim, **not** `current_user`. The harness sets the database role but sends no claims, so the claim is empty and the
function returns true. 0392's policies are `using (is_trusted_caller() or shelter_id = current_shelter_id())`, so the
per-shelter clause is never evaluated for the canary.

## What the red runs prove: answer (a)

The plain canary, `leak-table`, `leak-attachments` and `drop-restrictive` all run as a trusted caller. Their red proves the
canary NOTICES a new row; none of them isolates the restrictive policy. The plain green proves nothing leaks through anon
grants and permissive policies today. Real PostgREST sends `role: anon`, so the production path is untrusted; the canary
never exercised it.

## What was built

Two modes that set `request.jwt.claims = {"role":"anon"}` first, with an identical grant and permissive policy:

| mode | probe `is_trusted_caller` | result |
|---|---|---|
| `untrusted-keep-restrictive` | false | exit 0 (green) |
| `untrusted-drop-restrictive` | false | exit 1, `residents … 19 -> 20` |

Only the restrictive policy differs, so the red is caused by its removal. Covers `residents` only. The existing modes are kept.
The plain run still reads as a trusted caller (changing what the canary checks was out of scope); the probe line now prints
who it reads as, every run.

## Not done / for the planner

Making the plain run untrusted (set the claim for every read) would exercise the restrictive policies nightly, but changes
what it checks. File it separately. `is_trusted_caller()` itself is not touched; trusting any non-anon/authenticated
claim (including none) is its design, and PostgREST always sends a role.

`LIMITS:` text corrected (see the script).
