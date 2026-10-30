# CLAUDE.md's "audit never runs on any PR" went stale; corrected (2026-10-30)

**Finding: it went stale. It was not wrong when written.**

- 2026-10-25 (`d9405a7b`): `ci.yml` gated `audit` on `deps-changed`, but `check-docs-only.mjs` only printed it.
- 2026-10-27/28: `CLAUDE.md` and the 2026-10-25 decision recorded, correctly, that the job never ran on any PR.
  Re-checked 2026-10-28, still true.
- 2026-10-28 (`4e7509ca`, #1041): `check-docs-only.mjs:108` began appending `docs-only=…` and `deps-changed=…`
  to `GITHUB_OUTPUT`. Nothing updated `CLAUDE.md`, which kept citing a re-check command that now proves the opposite.

**Measured 2026-10-30:** `grep -n GITHUB_OUTPUT scripts/check-docs-only.mjs` shows both values on line 108; `ci.yml`
gates `audit` on `deps-changed == 'true'`; on the `0.40.11` cut (#1085) it ran and passed, on the docs-only record PR
(#1086) it was skipped.

**Changed:** the `CLAUDE.md` paragraph now says the job runs on a PR touching `package.json`/`package-lock.json`,
skips otherwise (skipped is not a pass), and that since #1055 a red `audit` means an advisory not on
`docs/advisory-register.json`. The re-check command is kept and its expected answer stated. The 2026-10-25 decision
gained a SUPERSEDED marker. Kept unchanged: `continue-on-error` cannot block a merge; the release-time audit step;
the daily `advisories.yml`; the two standing rules. No code, workflow or `advisories.yml` change.
