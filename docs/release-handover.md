# Release handover — written 2026-10-24 after `0.40.1`

A **delta**. The release's own facts are in `docs/releases/2026-10-24-0-40-1.md`
and the durable rules are in `docs/release-procedure.md`. **Both outrank this
file.**

## START HERE

**`0.40.1` is deployed, verified, and it correctly mailed nobody.** All four builds came
from **one SHA**, `254cd948`, and the code-identity check is clean. Both databases read
**257 of 257** with `No drift`, and `0254`, `0255` and `0256` all went on before either
deploy.

**The two items that shipped as a stated gap are CLOSED.** Lutan did both on 2026-10-24,
within the hour of the release: the **Stocktaking switches** and the **Features panel** both
work, **and the Thai reads correctly** — asked as a separate question, because "working" could
have meant the buttons alone. Both plans are signed in his name at his explicit request, each
signature stating its own scope.

**But three rows of those two tables are still open, and one of them matters.**
`who-does-what` item 2 — *move a card, then check a second role shows it in the same section* —
has been run by nobody, and it is the check that would catch the feature grouping being stored
per-role instead of once for every role, which is exactly what the release note promises. The
other two are `who-does-what` item 3 (**a decision**, not a check: where four guessed cards
belong) and `stocktaking` item 3 (on a real phone). **Do not read "both tested and working" as
closing those**; the record says why.

**Also his, and NOT done: the ten production sign-in checks** for this build. Recorded as not
done, not ticked — `0.40.0`'s were done by him and that does not carry to a different build.

**Re-measure before trusting any of it.** `main` did not move *during* the release, which is
luck rather than method, and it has since moved twice — a backlog grooming and this sign-off.
Run `git diff --stat 254cd948..HEAD`, `gh pr list`, `--status --env production` and the live
`/api/version` first.

## The handover's standing list of unreadable production facts is EMPTY

The last three editions carried a growing list of things "no session can read". **All three
are now answered**, by `scripts/check-production.mjs` — #901, merged in this very release,
the read-only check Lutan approved on 2026-10-24.

- `0230`'s doctor cells on production: **all 13 present**, nothing stripped. This also closed **#900's `pending:` signature**.
- Any production role holding the Operations or Management card: **none does**.
- `0250`'s per-serving back-fill: **every production diet line is in proportion**.

**Do not re-raise these as unknowns, and do not rebuild the list from the `0.40.0` edition.**
Run `node scripts/check-production.mjs all` instead — it is read-only, it takes seconds, and
this was its first use by a release.

**The method is the part worth keeping.** The available inference on the first one — `0230` is
applied to production, so its cells must be live — is exactly the error the planner recorded
making the day before. It was read instead of reasoned. A check approved this week paid for
itself in its first release.

## The mail question is now a runbook rule — do not re-derive it

`0.40.0`'s handover carried the "minor means the middle number" trap as a note. **It was
named in writing and still nearly bit the next release**, because the fault is in the
*question*, not the data. It is therefore **promoted into `docs/release-procedure.md` step 4**
("Ask about the EMAIL, never about 'major or minor'") and is deliberately not restated here.

The short version for anyone mid-release: **ask "should this release email you?"** and derive
the version from the answer. On `0.40.1` the first question used the two words and got an
answer that fitted two different releases with opposite mail behaviour; a second question with
the words removed settled it in one round trip.

## Corrections to the last edition

- **It said the SHA counter was retired and that three SHAs were the new normal. Retired yes — but this release came from ONE SHA**, because no other session merged anything during the deploy window. The replacement check had only one pair to compare. **That is other sessions' timing, not an improvement**, and the next release should expect three again.
- **It said `audit` was red with `body-parser` and `undici`. Still red, still those two, and now verified as nothing new** — all four advisory IDs on this run are already in `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md`. **Fix nothing.** The "5 vulnerabilities" line is those four with a transitive duplicate.
- **It said the OpenNext `Failed to copy` count rose from one to three and might keep rising. It held at three** — same three packages, and **zero** on the production build. Still watch, do not act.
- **It said `strip-baked-env` was held at 14 for a third release. Fourth now.**
- **It listed #890's empty *Left for manual verification* table as a paperwork fault to be aware of.** Unchanged and still worth nothing more than awareness; the check behind it is now runnable (above).

## Where things stand

| | |
|---|---|
| Live | **`0.40.1`** — all four builds from `254cd948`; production Worker version `a20a308f` tagged `v0.40.1`, test Worker `e0a11216` |
| Previous release SHA, for the next range | **`254cd948`** |
| Production database | **`257 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 257 of 257** |
| Next free migration number | **`0257`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None, correctly.** Both deploys printed `no major release new to <env> (was 0.40.0), so no email.` |
| `unreleased` and open PRs | 0 at the cut; `main` did not move during the release. **Run `gh pr list` yourself** |
| Backlog | Nothing needed folding at step 1 (`main..origin/backlog` empty) |
| Worktrees | **Ten leftovers, all `HELD` by live sessions and all reading `nothing beyond main`** — merged streams whose sessions are still open. None was free to reuse, so the cut needed a fresh worktree. **Worth a `/clean-streams` round**; `HELD` means ask, do not tear down |

**Counters:** `npm ci` as step 1 **24**; first CI run green by construction **7**; no
production-only guard **26**; `strip-baked-env` **19**, at **14**. **Server Actions keys**
(twenty-third check): production `cbd55beae8d8`, test `ecc41837fc0b`. **Releases that
mailed: 1 in the last seven.**

## The one avoidable cost, and it is a third touch

**The classifier refused `apply-migrations.mjs --env production` as a "Production Deploy"** —
a step the runbook assigns to Claude under a user-settings allow rule added 2026-10-13.
Nothing was applied; it was reported as blocked rather than narrated as progress, and the
retry Lutan asked for **succeeded first time**, which is the known-transient shape.

**Cost: one round trip and a third intervention in a release whose target is two.** Recorded
in the record as an avoidable cost, per the runbook's own instruction. **If this recurs, it is
the allow rule that needs looking at, not the release** — and a session meeting it should say
plainly that nothing reached the database rather than retrying in silence.

Two smaller things, neither a fault:

- **The production Pi's `guard-release` cannot check the schema** — `SUPABASE_ACCESS_TOKEN is not set` on the Pi, so it warns and continues. This is **designed** (`check-release-guards.mjs` asserts the path) and is the normal state there. Follow its own instruction: `--drift production` by hand.
- **The `pgrep -af "[d]eploy-pi.sh"` bracket trick matched only this session's own shell.** No orphan this time, and `0.39.5`'s 13-hour waiter is gone — but the confusion the trap creates is real, so read what it matched before concluding a build is running.

## In flight and open

**The security rebuild continues and still shapes what to cut.** All hard-coded role settings
are still to come out (`JOBS_OF_ROLE`, `CURATED_HOME`, `OUTSIDE_REGISTRY`, `FIXED_FOR_NOW`,
role-key ordering, the no-cards fallback home), with the card walkthrough runs **on hold**.
Lutan, 2026-10-24: **card sections by feature goes first in the next plan** — and `0255`/#906
have now delivered exactly that for the Add a card list, so the next plan should check what is
actually left of it rather than re-reading the instruction.

**Carried unchanged, nothing new to say:** the Thai wording of the Units screen and one real
vet visit booked on production (both from `0.40.0`); the same three silent failures as a set
(the public desexing sign-up, Drive space thresholds, the retention job — all wanting the same
`status_alert_runs` → mail plumbing); and the two unlooked-at items, the prescription form
reading 4 (`0.38.1`) and video playback on a real handset (`0.38.0`).

**One red still unresolved rather than explained away:**
`check-diets-per-serving-schema.mjs` fails `servings default to 1 / 1.5 / 2 - got 1` on dev
alongside 11 passing checks. Still **plausible and unverified**. The production side of this is
now partly readable — `check-production.mjs diets-proportion` reports every line in proportion —
so the next session has one more angle than the last did.
