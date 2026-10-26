# A real release cut script (2026-10-26)

`scripts/cut-release.mjs <version> <date> <major|minor> --title "…"` replaces the throwaway
script written at each cut. `--verify` runs the checks from `docs/release-procedure.md` step 4.

## Why
The throwaway anchored on `\n` while `src/lib/releases.ts` is CRLF, and refused on `0.40.1`
and `0.40.2`. The refusal was correct (nothing was corrupted); the cost was rediscovering it.

## What it guarantees
- Notes are lifted from `unreleased` by slice and re-indented, never retyped.
- `package.json` gets a one-line replacement of the `"version"` line, so line endings and key order survive.
- Works on LF and CRLF; the new entry uses the file's own ending.
- **Refuses before writing a byte** (exit 1) if: `unreleased` is empty, either anchor is missing,
  the version already exists, the title is missing, or an argument is malformed. Kept deliberately:
  a script that quietly "handles" a missing anchor is worse than the one it replaced.
- `major` means *worth an email*, as in `releases.ts`; the third argument is `major` or `minor`.

## `--verify`
Sixteen assertions against `--base` (default `origin/main`, or a file): notes character-identical
with role tags and order, none invented, earlier entries untouched, `compareVersions` order,
`package.json` equals the newest entry, no `[object Object]`/`undefined`, and the mail as an
absence (or presence, for `major`) **plus a control** from further back, so an absence cannot
pass because `majorReleasesSince` is broken.

## The trap
`majorReleasesSince()` returns `Release` **objects**, not version strings. Comparing them to a
string gave `0.40.2` a false red. The script maps to `.version` first.

## Also
`0257_card_grants.sql`'s `-- consumer:` header lost the renamed `check-cards-schema.mjs`. A comment
carries no behaviour, so editing an applied file is safe; the runner keeps no checksum.
