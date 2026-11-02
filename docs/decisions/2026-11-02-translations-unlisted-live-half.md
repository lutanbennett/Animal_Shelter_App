# Translations-unlisted: the live-database half

2026-11-02, stream `translations-unlisted-live-half`. Follows `2026-11-02-translations-unlisted-ci-gate.md`.

- **The query already existed** as `check-production.mjs translations-unlisted` (a report: no `failed`, no exceptions, so
  `rounds.name_th` and `label_drafts.text_th` showed on every run). Rather than a second command, that entry now imports
  `liveUnlisted()` from `scripts/check-translations-unlisted.mjs`, which filters with the file check's own `DELIBERATE`. One
  list, one import; adding an exception in one place changes both.
- **It has a `failed`**: exit 1 when any `_th` column is neither registered nor deliberate. Deliberate columns are printed,
  not counted. Read-only is unchanged (the allow-list's `begin read only` wrapper); no migration; the file check's behaviour
  and CI job are untouched.
- **Dev as well as production: yes.** `--env test` already works, and a hand-applied column is likelier on the database every
  stream shares. The release procedure (section 5) says to run both, after the apply.
- **Release-time, not CI**: CI has no live database to ask.
- **Exit path**: `check-production.mjs` sets `process.exitCode` after its fetches and never calls `process.exit` then, so the
  libuv-on-Windows failure (`scripts/lib/exit.mjs`) does not apply.
