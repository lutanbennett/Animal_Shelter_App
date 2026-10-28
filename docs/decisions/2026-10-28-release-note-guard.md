# Deferred release notes are listed at every cut, and the cut refuses to skip them

2026-10-28. Process and tooling; no `src/`, no schema.

## What happened

Three release notes in a row went missing: `0275`'s (rescued as #1024), `0276`'s (#1038) and
`0279`'s (#1047/#1048). The procedure already said to check for PRs that wrote `n/a` for a step the
release closes, but only "when `unreleased` is empty". At `0.40.10` it held two notes and lacked a
third, so the check never ran. A release missing some notes looks the same as one with nothing
deferred. Naming a carrier in prose (four places for `0279`) did not work either.

## Decided

- `scripts/check-deferred-notes.mjs` lists every test plan changed since the last `Cut x.y.z` commit
  whose release-notes line says `n/a`, split into **may owe a note** (the reason mentions a step still
  to happen: deploy, production, migration, "until", "once", "carried", a migration number...) and
  the rest, shown shorter. Runs always, whether or not `unreleased` is empty.
- `cut-release.mjs` runs it before anything else. A may-owe candidate with no
  `--deferred-reviewed "<answer>"` is a **refusal before a byte is written**. The answer is printed
  so it can be copied into the cut's test plan.

## Refusal or list: why a refusal, narrowly

`check-test-plan.mjs` goes red only when a plan is genuinely wrong. A refusal here is not wrong
when it fires: it demands a sentence, not a fix, and it cannot be satisfied by doing nothing,
which a printed list can. But it fires only on candidates, not on every `n/a` (most are
"developer tooling"), so it does not become a flag typed by reflex. The keyword match is
deliberately generous: a false candidate costs one line, a missed one is the fault this stops.
It is not a CI check and does not touch the gates.

## Truth rule kept apart

The script never writes or suggests note text and never asks for a note before its step closes.
The two answers are symmetrical: *closed by this release -> add the note*; *still open -> say so
and leave it*, which is the truth rule's own outcome. It exists so a note is not lost, not so
one is published early.

## Not established

Whether any earlier release lost a note the same way. No sweep was done. On the real range
since `0.40.9` it flags the `0276` plan (production still needs `0279`), which is the right catch.

## Found, not fixed

The script's `--self-test` is not in `npm run lint` (that would touch the gates, out of scope).
