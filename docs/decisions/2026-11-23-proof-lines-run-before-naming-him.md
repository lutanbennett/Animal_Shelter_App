# Proof lines are run before anything names Lutan (#prvln, second half)

**2026-11-23, stream `proof-line-run`. Lutan approved this half the same day ("Yes, into batch 2").**

## What was built

- `node scripts/check-backlog-waiting.mjs --proofs [#id ...]` **prints, never runs,** the `**Proof:**` line of
  every `waiting:lutan` item (or only the ids named). It extends the existing parser in
  `scripts/lib/backlog-waiting.mjs`; there is no second parser.
- `/plan-day` (`SKILL.md` section 6) now requires it before any list, table, batch or handover line, **Not today**
  included, names him. Items under **RUN IT** are run or looked at and what they showed is said; one already
  done is not his and is closed. Items under **NOT A COMMAND** are read out.

## The distinction, and where it is declared

Two classes: a proof a session can **run or look at** (a command, a screen, a query), and a **physical or human
wait** (hardware that does not exist, a panel on his own network, a design session, two people using the manual).
A line that cannot be run must never be printed as a failed check, and a physical wait must never look
settleable by a command (his own NOT IN SCOPE passage).

**Declared in the line's own prose, not in a tag.** A proof that cannot be run says so in its opening words:
*Not a command*, *Not provable by command*, *Not runnable from here*, or *no command proves*
(`NOT_A_COMMAND_RE`, only the first 220 characters decide, so a later "not a command" about a second half
cannot demote a runnable first half). Anything else is "run it". Why not a `proof:` key: the item itself warns a
shell command inside a one-line HTML comment is how tooling gets brittle, and the five existing lines already
say it in terms, so no data had to change. The default error is safe: an unrecognised line asks the planner to
run it or say why it cannot, which is a nuisance, never a silent skip.

## `decision by:lutan` is OUT

Same answer as the first half: a decision only he can make is not provable by a command, and `needsProof`
already excludes it. Nothing to run, so nothing to print.

## Deliberately not automated

No runner. Five of the thirteen lines are not commands, and several of the rest need production, a phone or the
Pi, none reachable from a worktree. A runner pretending to execute prose would report guesses.

## Found, not fixed

His "Not now" was recorded only in `.plan-day.md`, which he cannot see; the item still read `buildable`. A
mechanism: any answer of his goes on the item (a `parked` tag with the date) in the same hour. This already
happened for `#prvln`; the planner's step 6 is the place to enforce it. Not built here.

## What came out of SKILL.md

The 2026-11-11 multi-select incident (three lines) moved to `reference.md` section 5b, leaving its rule in place.
