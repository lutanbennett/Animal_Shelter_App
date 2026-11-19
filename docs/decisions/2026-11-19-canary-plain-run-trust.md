# Canary: the nightly runs BOTH passes, trusted and untrusted (#cnutr)

2026-11-19. Answer **(c)**. Follows `2026-11-18-what-the-canary-proves.md` (#1706). The judgement is Claude's: a developer instrument.

## Before, after, stopped

- **Before:** one nightly run, `check-tenancy-canary.mjs --strict`. Probe: `{"jwt_claims":null,"current_user":"anon","is_trusted_caller":true}`.
  Every `0392` policy (`is_trusted_caller() or shelter_id = current_shelter_id()`) took the trusted branch, so a green said nothing about the per-shelter clause.
- **After:** two steps in `.github/workflows/tenancy-canary.yml`: the same plain run (trusted), then `--strict --untrusted` (new flag: sets `request.jwt.claims` to `{"role":"anon"}` first, as PostgREST does, so `is_trusted_caller()` is false). Each is its own rolled-back transaction. The second step has `if: always()`, so a red first pass cannot hide it.
- **Stopped asserting: nothing.** The trusted pass is byte-for-byte what ran before. That was the trade in the item (an untrusted-only run would drop the path service-role callers take); two passes avoid it.

## Measurements (dev, 2026-11-19, `--strict`)

| Run | Probe `is_trusted_caller` | Result |
|---|---|---|
| plain | true | 0 findings, exit 0 |
| `--prove-red untrusted-keep-restrictive` | false | 0 findings, exit 0 (expected green) |
| `--prove-red untrusted-drop-restrictive` | false | `FAIL residents: ... 19 -> 20`, exit 1 (expected red) |
| `--untrusted` (new, no sabotage) | false | 0 findings, exit 0, 23 objects, 2.1 s wall |

## Is (c) cheap? Yes — loudly so

Two separate API calls, ~2 s each, no second harness, no composition inside one rollback (each call rolls back by itself). The "does it compose" worry does not arise because the passes are never in one transaction.

## What the first red would look like, and who reads it (deliverable 6)

Both steps print a first line `Pass: TRUSTED ...` or `Pass: UNTRUSTED ...` and the Read-as probe, so the failing step's name and its printed `is_trusted_caller` tell the reader which pass went red.
- **Trusted red only:** a row visible to anon through a grant or policy the trusted path allows (same meaning as every red before today).
- **Untrusted red only:** the per-shelter clause no longer holds for a surface anon can reach: the thing the pass exists to watch. Real leak candidate.
- **Both red:** a new anon-reachable object leaks regardless of clause.
- **Untrusted pass red with the trusted green is not a change in what the check asks**: the untrusted pass is new, but on dev today it is green (above). If a future migration makes anon-reachable views read empty when untrusted, the existing `public_resident_cards` hollow-diff guard raises exit 2 NOT CHECKED rather than a false red.
Reader: whoever gets the nightly failure email; the step names are the signal.

## Not changed

`is_trusted_caller()` untouched. No migration, no `src/`. The untrusted pass reads for residents/attachments only where anon already holds grants; on today's dev it proves "nothing leaks untrusted", and the `--prove-red untrusted-*` pair proves it would notice the policy going.
