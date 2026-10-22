# CI `audit`: a registry timeout is a warning, a finding is still red

2026-10-22. On PR #836 `npm audit` hung on the registry until the job was killed
at five minutes, with no advisory output; the same job passed in 10 seconds on
#831. A red with no advisory to read sent each stream to ask Lutan what to do.

The step now runs `npm run audit:prod` under `timeout 90`, once more on failure,
and then:

- exit 0 → pass;
- non-zero **with npm's findings summary in the output** → fail at once, no retry;
- non-zero or timed out with **no** findings summary, twice → a `::warning`
  ("inconclusive, not a finding") and exit 0.

`continue-on-error: true` is unchanged, so none of this can block a merge.
`advisories.yml` is untouched: the two disagree about failing on purpose
(`2026-10-02-scheduled-audit-fails-on-purpose.md`). Checked locally with a stub
`audit:prod` for all three outcomes. Not provable here: npm's exact wording on a
registry error. The finding test keys on the summary line (`found N
vulnerabilities`), so unfamiliar error text lands on the warning side.

Same PR: `scripts/import-appsheet.mjs` and `scripts/appsheet-export.mjs` deleted
(AppSheet retired 2026-10-09; cutover is a dump and restore, Lutan 2026-10-22).
