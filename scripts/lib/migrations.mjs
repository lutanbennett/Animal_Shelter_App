// What counts as a migration file, shared by apply-migrations.mjs (which
// applies them and reports --drift) and check-migration-numbers.mjs (which
// guards their numbering). One definition, so the two can never disagree
// about which files exist on origin/main or what "the highest" is.

export const MIGRATIONS_DIR = "supabase/migrations";
export const MIGRATION_NAME = /^\d{4}_.+\.sql$/;

/**
 * `git ls-tree <ref> supabase/migrations/` output → Map of file name → blob id,
 * keeping only names apply-migrations would apply.
 */
export function parseLsTree(out) {
  const blobs = new Map();
  for (const line of out.split("\n").filter(Boolean)) {
    // "<mode> blob <sha>\t<path>"
    const [meta, path] = line.split("\t");
    const name = path.slice(MIGRATIONS_DIR.length + 1);
    if (MIGRATION_NAME.test(name)) blobs.set(name, meta.split(" ")[2]);
  }
  return blobs;
}

export const numberOf = (name) => Number(name.slice(0, 4));

/**
 * Numbers used by more than one migration file: Map of number -> sorted names.
 * A pure filename read, so it needs no network and no database.
 */
export function duplicateNumbers(names) {
  const by = new Map();
  for (const name of names) {
    if (!MIGRATION_NAME.test(name)) continue;
    const n = numberOf(name);
    by.set(n, [...(by.get(n) ?? []), name]);
  }
  for (const [n, list] of [...by]) if (list.length < 2) by.delete(n);
  for (const list of by.values()) list.sort();
  return by;
}

/**
 * Pairs of duplicate numbers that are already applied in more than one
 * database, so they cannot be renamed (schema_migrations records the filename).
 * Each is recorded with the reason; a duplicate NOT listed here fails the check.
 * Never add to this list for a new file: rename the new file instead.
 */
export const KNOWN_DUPLICATES = new Map([
  [191, { files: ["0191_donation_channels.sql", "0191_stock_receipts_update_policy.sql"], why: "both applied to dev and production under these names" }],
  [324, { files: ["0324_can_see_drive_file_lists_reels.sql", "0324_database_health.sql"], why: "PRs #1333 and #1334 were cut before either merged; both applied to dev and production" }],
]);

/**
 * Open PRs (`gh pr list --json number,headRefName,files`) that add a migration
 * with the same number as one of `freshNames`. `ownBranch` is skipped so a PR
 * never collides with itself. Returns [{ name, number, pr, other }].
 */
export function collisionsWithOpenPrs(freshNames, prs, ownBranch) {
  const hits = [];
  for (const pr of prs) {
    if (ownBranch && pr.headRefName === ownBranch) continue;
    for (const f of pr.files ?? []) {
      const path = f.path ?? f;
      if (!path.startsWith(`${MIGRATIONS_DIR}/`)) continue;
      const other = path.slice(MIGRATIONS_DIR.length + 1);
      if (!MIGRATION_NAME.test(other)) continue;
      for (const name of freshNames)
        if (numberOf(name) === numberOf(other) && name !== other)
          hits.push({ name, number: numberOf(name), pr: pr.number, other });
    }
  }
  return hits;
}
