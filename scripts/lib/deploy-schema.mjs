// The deploy-time schema check: does the target database hold every migration
// the commit being deployed carries? Used by scripts/deploy.mjs for uat and
// production; test deliberately runs ahead of or behind code and is not asked.
//
// The rule is "every file in the deployed commit is applied" and NOT "the
// database matches origin/main". Rows with no file in the commit are fine:
// schema ahead of code is the safe direction, and a migration for the next
// release can sit on main already (0118 during 0.10.1). The two coincide today
// only because deploy.mjs also insists HEAD equals origin/main; they must not
// be written as one thing or the check breaks on a tag or a hotfix deploy.
import { MIGRATIONS_DIR, parseLsTree } from "./migrations.mjs";

/** Files in the deployed commit the database has not applied, sorted. */
export function missingFromDatabase(deployedFiles, applied) {
  const have = new Set(applied);
  return [...new Set(deployedFiles)].filter((name) => !have.has(name)).sort();
}

/** Names of the migration files in a commit (default HEAD), per `git ls-tree`. */
export function deployedMigrations(git, ref = "HEAD") {
  return [...parseLsTree(git(`ls-tree ${ref} ${MIGRATIONS_DIR}/`)).keys()].sort();
}

/**
 * Ask the Management API which files the target has applied.
 * Returns { ok: true, applied: string[] } or { ok: false, reason } when it
 * could not be asked (no token, network, timeout, API error). Never throws.
 */
export async function appliedMigrations(env, projectRef, { timeoutMs = 20_000, fetchImpl = fetch } = {}) {
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) return { ok: false, reason: "SUPABASE_ACCESS_TOKEN is not set" };
  const query = async (sql) => {
    const res = await fetchImpl(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : [];
  };
  try {
    const [{ exists }] = await query("select to_regclass('public.schema_migrations') is not null as exists");
    // No table is an answer, not a failure: nothing has been applied.
    if (!exists) return { ok: true, applied: [] };
    const rows = await query("select filename from schema_migrations");
    return { ok: true, applied: rows.map((r) => r.filename) };
  } catch (error) {
    return { ok: false, reason: error?.message ?? String(error) };
  }
}
