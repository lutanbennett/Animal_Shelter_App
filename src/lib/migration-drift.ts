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

/**
 * For each row with no file, the file on the list that has the same name
 * under a different number — the usual cause: a migration renumbered after
 * it was applied leaves its old name recorded beside the new one
 * (docs/decisions/2026-11-26-dev-migration-0422.md). Only a match whose new
 * name is itself applied is returned: then the object is recorded under the
 * number that counts, and the old row is safe to clear with --forget.
 */
export function renumberedRows(
  missingFile: Iterable<string>,
  expected: Iterable<string>,
  applied: Iterable<string>,
): { row: string; file: string }[] {
  const appliedSet = new Set(applied);
  const suffix = (name: string) => name.replace(/^\d+_/, "");
  const bySuffix = new Map<string, string[]>();
  for (const file of expected) {
    const key = suffix(file);
    bySuffix.set(key, [...(bySuffix.get(key) ?? []), file]);
  }
  const out: { row: string; file: string }[] = [];
  for (const row of missingFile) {
    const matches = (bySuffix.get(suffix(row)) ?? []).filter((f) => f !== row && appliedSet.has(f));
    if (matches.length === 1) out.push({ row, file: matches[0] });
  }
  return out;
}
