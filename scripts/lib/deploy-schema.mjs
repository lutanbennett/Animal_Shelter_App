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

/** Ask the Management API which files the target has applied. Never throws. */
async function fromManagementApi(env, projectRef, { timeoutMs, fetchImpl }) {
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
    if (!exists) return { ok: true, applied: [], via: "the Management API" };
    const rows = await query("select filename from schema_migrations");
    return { ok: true, applied: rows.map((r) => r.filename), via: "the Management API" };
  } catch (error) {
    return { ok: false, reason: error?.message ?? String(error) };
  }
}

/**
 * Ask the database itself, over PostgREST with the env file's service-role key.
 * The fallback for when the access token cannot read the project. Written for UAT
 * on 2026-11-08, when its reads died with `database_read`; that turned out to be the
 * shell's token from the other account (now fixed: ACCOUNT_KEYS in env.mjs), but the
 * fallback stays, because a wrong or revoked token must not leave the guard blind.
 *
 * The URL must name the SAME project the caller asked about, or this refuses:
 * answering about dev's database while the caller believes it asked UAT's is
 * the one way a working guard becomes a lying one.
 */
async function fromPostgrest(env, projectRef, { timeoutMs, fetchImpl }) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, reason: "no NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to ask the database directly" };
  if (projectRef && !url.includes(projectRef)) {
    return { ok: false, reason: `NEXT_PUBLIC_SUPABASE_URL is not project ${projectRef}, so asking it would answer about another database` };
  }
  try {
    const res = await fetchImpl(`${url.replace(/\/+$/, "")}/rest/v1/schema_migrations?select=filename`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    // No table reads as "nothing applied" here too, the same answer the API gives.
    if (res.status === 404 || (res.status === 400 && /schema_migrations/.test(text))) {
      return { ok: true, applied: [], via: "the database directly" };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return { ok: true, applied: JSON.parse(text).map((r) => r.filename), via: "the database directly" };
  } catch (error) {
    return { ok: false, reason: error?.message ?? String(error) };
  }
}

/**
 * Which files the target database has applied.
 * Returns { ok: true, applied: string[], via } or { ok: false, reason } when
 * neither route could be asked. Never throws.
 *
 * Two routes, in order: the Management API, then the database itself over
 * PostgREST. The second exists because a project's access token may be unable
 * to read it at all, which made the guard blind rather than wrong — the worse
 * failure, because a blind guard looks like a passing one.
 */
export async function appliedMigrations(env, projectRef, { timeoutMs = 20_000, fetchImpl = fetch } = {}) {
  const api = await fromManagementApi(env, projectRef, { timeoutMs, fetchImpl });
  if (api.ok) return api;
  const direct = await fromPostgrest(env, projectRef, { timeoutMs, fetchImpl });
  if (direct.ok) return direct;
  return { ok: false, reason: `${api.reason}; and asking the database directly: ${direct.reason}` };
}
