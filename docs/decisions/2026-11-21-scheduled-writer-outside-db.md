# The scheduled-writer guard for jobs that act outside the database (#swout), 2026-11-21

**Scope (deliverable 2).** A scheduled job can be declared in three places: `cron.job` rows (read by
`check-scheduled-writers.mjs`, live database), the Worker's `scheduled()` in `worker/index.mjs` (now read by
`scripts/check-scheduled-jobs.mjs`, from source), and `wrangler.jsonc` `triggers.crons` (one `*/15` tick that fires `scheduled()`;
it is the trigger, not a job). The Pi's own pollers (`docs/decisions/2026-11-17-pi-scheduled-writers.md`) are NOT reachable: not read.

**Shape.** The database arm cannot see Worker jobs, so a fourth tag there would catch nothing. The new arm is
`scripts/lib/scheduled-jobs.mjs`: each `await runX(` in `scheduled()` is followed to its `/api/...` route and that route's imports
(one level) and judged on two pattern questions: acts outside the database (mail, Google, translation engine, storage bucket), and
mentions `archived_at`. Outside and no `archived_at` is red. Pattern evidence, not proof; a reader that finds no jobs reports itself blind.

**Fixture (deliverable 5).** Copied `check-platform-files`: logic in `scripts/lib`, CLI beside it, `.test.mjs` builds a broken repo in a
temp dir (`root` argument). Proven: a new mail job with no `archived_at` goes red; with it, or with a reasoned exemption, it passes.

**Exemption (6).** `// writer-outside-db: no-archived-skip — <reason>` in the three lines above the dispatch, reason required.
`report-photo-retention` carries it (retention purge still purges a closed shelter, #1794's ruling).

**Finding, not a verdict:** `runTranslations` (translation engine, all drafts) never reads `archived_at`. It is exempted with the reason
"NOT ESTABLISHED" so lint is green; someone should decide whether closed shelters' drafts should be skipped. The other three read clean.

**Exit contract (8) and CI (9).** `check-scheduled-writers.mjs` is unchanged (exit 0 always; `--strict` only) apart from a pointer comment.
The source arm needs no database, so it IS safe in CI: it rides `npm run lint` (as `check-platform-files` does); `ci.yml` is untouched.
