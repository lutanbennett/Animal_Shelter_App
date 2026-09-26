/**
 * Both halves of the gap between a database's schema_migrations rows and
 * the migration files it should hold. One definition for the two places
 * that ask: scripts/apply-migrations.mjs (--status / --drift, against the
 * files on origin/main) and Settings → System status (against the files
 * the running build was made from, src/lib/status/checks.ts).
 *
 * Plain data with no imports: the script loads this file directly under
 * Node's type stripping, as scripts/deploy.mjs does src/lib/releases.ts.
 */
export type MigrationDrift = {
  /** Files the code expects that the database has not applied. */
  unapplied: string[];
  /** Rows the database holds with no file behind them. */
  missingFile: string[];
};

export function migrationDrift(applied: Iterable<string>, expected: Iterable<string>): MigrationDrift {
  const appliedSet = new Set(applied);
  const expectedSet = new Set(expected);
  return {
    unapplied: [...expectedSet].filter((name) => !appliedSet.has(name)).sort(),
    missingFile: [...appliedSet].filter((name) => !expectedSet.has(name)).sort(),
  };
}
