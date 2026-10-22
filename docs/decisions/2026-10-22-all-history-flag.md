# `apply-migrations.mjs --all-history`: building a fresh project from `0001`

2026-10-22, stream `migrations-all-history`. Finding 1 of
`2026-10-22-from-zero-rehearsal-and-schema-drift.md`.

## The fault

The runner's grants check (`check-migration-grants.mjs`) is run on every pending
file before anything applies. On a fresh project every file is pending, including
`0001`..`0077`, which predate the 2026-09-24 grants rule; the check flags 32
findings in them and the runner refuses, with no bypass. The cutover's step 2
("applies every migration from zero") therefore did not work.

## What was done

A deliberate flag: `node scripts/apply-migrations.mjs --all-history --env production`.

- It skips the grants check **only for files numbered `0077` or below**. `0077` is
  the catch-up file that grants everything before it (`LAST_EXEMPT` in
  `check-migration-grants.mjs`; the runner's `GRANTS_RULE_STARTS_AFTER` is the same
  number and the two must be kept in step). Files `0078` and later are checked
  exactly as before, flag or not.
- Without the flag nothing changes. The flag prints how many files it exempted and
  how many it still checked.
- It is refused with `--status`, `--drift` and `--baseline`.
- The `uat`/`production` guard (checkout must match `origin/main`) is untouched and
  applies to the flag too.
- Why a flag and not a quiet cut-off: an always-on exemption would let a stale
  pending file under `0078` through unnoticed on a shared database; the flag is
  something a person types for a rebuild.

## What is still NOT known

Whether the early objects end up with the right grants was **never checked**.
`check-schema-drift.mjs` compares columns only, not views, functions, policies or
grants. `0077` was written to grant them, and the 247-file rehearsal applied with no
SQL error, but nobody has compared the resulting grants with dev's. The history is
not shown to be clean on grants.

## What was proved

`--dry-run` against dev cannot exercise this (dev has nothing pending). The check
script was run directly: over `0001`..`0077` it reports 32 findings; over `0078`+ it
reports none. A real end-to-end run needs a throwaway project (the same rebuild
that succeeded on 2026-10-22 with the check disabled).
