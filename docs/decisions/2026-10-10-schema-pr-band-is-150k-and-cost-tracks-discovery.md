# The schema-PR token band is ~150k, and estimate error tracks discovery, not file count

**Date:** 2026-10-10
**Branch:** `claude/planner-handover-87` (written while rewriting `docs/planner-handover.md`)
**Supersedes:** nothing. **Extends:** `docs/decisions/2026-10-08-plan-day-token-estimates.md`
and `docs/decisions/2026-10-09-quick-win-band-is-130-190k.md`.

## What this records

Two corrections to the token bands in `.claude/skills/plan-day/SKILL.md`, both from
measured actuals rather than reasoning. **This file deliberately does not edit the skill**
— see *Why not just change the skill* below.

### 1. The schema-PR band is no longer unmeasured

The skill's table reads:

| scale | band | shape |
|---|---|---|
| Schema PR | unmeasured | read `zone-colour-schema` (batch 73) while its session is live |

That instruction can no longer be followed: the `zone-colour-schema` session is long
closed, and `get_usage` only answers for a session that is still running. The figure it
points at is unrecoverable.

Two schema PRs have since been measured:

| stream | what it was | actual |
|---|---|---|
| `map-rooms-schema` (#506) | one migration file: three columns, a dropped check constraint, a back-fill of three rows, registration in two translation tables; dry-run, apply to dev, `--status`; a test plan that was mostly reasoned `n/a` | **151,273** |
| `receipt-issuer-server-side` (#510) | one migration (`create or replace` of a `security definer` RPC) **plus** the app change and a before/after probe | **143,678** |

**So: use ~150k for a schema PR.** Note the second figure covers a migration *and* app
code *and* a security probe, which is why the next finding matters more than this one.

### 2. Estimate error tracks how much a stream must discover

Nine streams across batches 84–86, estimate versus actual:

| stream | est. | actual | error |
|---|---|---|---|
| `close-the-remaining-over-grants` | ~250k | 192,781 | −23% |
| `multi-tenancy-spike` | ~280k | 271,109 | −3% |
| `roles-parity-reconcile` | ~160k | 193,109 | +21% |
| `donation-picker-and-map-zoom` | ~210k | 219,652 | +5% |
| `check-harness-repair` | ~300k | 351,237 | +17% |
| `map-rooms-schema` | ~170k | 151,273 | −11% |
| `map-rooms-editor` | ~450k | 380,933 | −15% |
| `parity-layer-3` | ~280k | 182,043 | −35% |
| `receipt-issuer-server-side` | ~250k | 143,678 | −43% |

The mean error is about **−10%**, and it is useless as a correction because the spread is
**+21% to −43%**. What the spread does correlate with is **how much each stream had to
find out before it could act**:

- **A single known fix with named files and a precise brief lands at 143k–185k**, however
  much machinery it touches. `receipt-issuer-server-side` changed a `security definer`
  RPC, app code and applied a migration for 143,678. `parity-layer-3` enumerated 63 pages
  and added a lint rule for 182,043.
- **A fully-specified large build lands at the bottom of its band**, not the middle:
  `map-rooms-editor` was briefed from `0175`'s own handover note and came in 15% under a
  ~450k estimate.
- **A stream that must discover its own scope overruns.** `check-harness-repair` ran 17%
  over because its backlog item said *"eight dev check harnesses"* — a count taken from six
  harnesses actually run plus two inferred — and there were **51**. The item even named the
  grep (`grep -ln "'staff'" scripts/check-*.mjs`) that would have found them.

**The practical rules:**

1. **Estimate by what must be discovered, not by files touched.**
2. **A precisely-briefed single-fix stream is ~160–200k**, not the ~250k a "medium" label
   suggests.
3. **Nothing lands below ~130k** — six consecutive streams confirm it. The ~110k floor is
   paid before any work begins, and a stream still has to read, build, check and write a
   test plan on top of it.
4. **When an item states a count, check how it was obtained.** If it says "measured on
   dev" and names a wider search, size it for the search.

## Why not just change the skill

`.claude/skills/plan-day/SKILL.md` is the rules, and changing the rules is Lutan's call,
not a session's — the same position `2026-10-09-quick-win-band-is-130-190k.md` took and
the reason it too left the skill untouched. **So two documents a planner reads now
disagree in two places**, and both say so rather than leaving someone to trip over it:
the skill says the quick-win band is 110–170k and the schema band is unmeasured; this file
and the handover say 130–190k and ~150k.

That divergence is a real cost, accepted deliberately. The alternative — a session editing
the rules file on its own judgement, from nine data points — is worse, and a planner who
reads the handover gets the corrected figures anyway.

## Why a decisions file and not only the handover

`docs/planner-handover.md` is rewritten every nine workstreams **by design**, so a
correction recorded only there evaporates and the next planner re-derives it from the same
numbers. That is exactly what happened to the schema-PR band: the skill has pointed at an
unreadable session since batch 73. Measurements belong somewhere permanent.
