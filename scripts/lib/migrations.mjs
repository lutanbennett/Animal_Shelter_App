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
