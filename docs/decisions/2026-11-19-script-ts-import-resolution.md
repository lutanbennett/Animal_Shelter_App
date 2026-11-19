# A TS module reached from a script must carry extensions in its own imports (2026-11-19)

**Cause.** `scripts/connect-shelter-calendar.mjs` loads `scripts/lib/connect-shelter-calendar.mjs`, which imported
`FALLBACK_SHELTER_KEY` from `src/lib/google/shelter-drive-decide.ts`. That file's first line imports
`"./drive-credentials-crypto"` with no extension. TypeScript, Next and the build accept that; raw Node's ESM resolver does
not, so the script died with `ERR_MODULE_NOT_FOUND` before reading anything. Nothing caught it because only the script path
is affected. `connect-shelter-drive.mjs` worked because it reaches the crypto module directly, and that file is a leaf.

**The rule.** A TS module reached from a script is only safe if its own internal imports carry extensions. A leaf (no
imports) is always safe.

**Chosen: shape 4, a leaf file.** `FALLBACK_SHELTER_KEY` now lives in `src/lib/google/fallback-shelter-key.ts` (no imports).
`shelter-drive-decide.ts` imports and re-exports it, so every existing importer is unchanged; the script lib imports the leaf
with `.ts`. One source of truth, no compiler option, no hook.

**Rejected.**
1. *`.ts` on the import in `shelter-drive-decide.ts`.* Measured: `tsc` reports TS5097 because `tsconfig.json` has no
   `allowImportingTsExtensions`. Enabling it is a repository-wide change.
2. *`--import ./scripts/test-support/register.mjs`.* Works, but that file says "Test-only: nothing here ships".
3. *Copy the constant into the script lib.* A second source of truth.

**Sweep.** On the onboarding path, only the two connect scripts import `src/lib` TS. The drive script imports the leaf
crypto module (fine); the calendar script now imports two leaves. `populate-shelter-settings.mjs` and `shelter-export.mjs`
import only `scripts/lib/*.mjs`. Not established: the other ~20 scripts that import `src/lib/*.ts` (`deploy.mjs`,
`load-role-draft.mjs`, `check-*.mjs`, …) were not checked for non-leaf imports; for the planner to file.

**`--help`.** `populate-shelter-settings.mjs` has no `--help`: the flag is ignored and the script runs for real (it printed
`already set … nothing to do`). The runbook never tells anyone to run `--help`, so no flag was added. The risk is worth filing:
an unknown flag is silently ignored by a script that can write.

**Not established.** Whether `connect-shelter-calendar.mjs` works end to end against a real calendar (secrets are Lutan's).
