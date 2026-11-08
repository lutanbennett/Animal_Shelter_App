// The two release guards shared by every path that serves users: the Worker
// (scripts/deploy.mjs) and the Pi (scripts/pi/guard-release.mjs, called by
// scripts/pi/deploy-pi.sh). One copy of the rules and of the messages, so the
// two paths cannot drift apart again (docs/decisions/2026-10-02-pi-ships-releases.md).
//
// The SCHEMA half is asked only where a Supabase token exists: scripts/deploy.mjs
// (Worker) and scripts/assert-schema.mjs (the deploy machine, before the Pi build).
// The Pi runs releaseProblems only, because it has no token and must not get one
// (docs/decisions/2026-11-08-guard-release-asserts.md).
import { deployedMigrations, missingFromDatabase } from "./deploy-schema.mjs";
import { declaredConsumers } from "./migration-consumers.mjs";
import { MIGRATIONS_DIR } from "./migrations.mjs";

/**
 * Why this commit is not a written-down release: package.json must name the
 * newest entry in src/lib/releases.ts and `unreleased` must be empty.
 * Returns the problems, empty when it is.
 */
export function releaseProblems({ pkgVersion, latestRelease, unreleased }) {
  const problems = [];
  if (pkgVersion !== latestRelease.version) {
    problems.push(`package.json says ${pkgVersion} but the newest release in src/lib/releases.ts is ${latestRelease.version}`);
  }
  if (unreleased.length) {
    problems.push(`src/lib/releases.ts has ${unreleased.length} unreleased note(s); cut a release first (see the top of that file)`);
  }
  return problems;
}

/**
 * The schema check's verdict, given what appliedMigrations() answered.
 * { warnings: string[], refusal: string | null }: "could not ask" is a
 * warning, never a refusal, so a Supabase blip cannot block a release.
 */
export function schemaVerdict({ envName, result, git }) {
  if (!result.ok) {
    return {
      warnings: [
        `could not ask ${envName} which migrations it has applied (${result.reason}).`,
        `continuing WITHOUT the schema check. Verify by hand: node scripts/apply-migrations.mjs --drift ${envName}`,
      ],
      refusal: null,
    };
  }
  const missing = missingFromDatabase(deployedMigrations(git), result.applied);
  if (!missing.length) return { warnings: [], refusal: null };
  return {
    warnings: [],
    refusal:
      `${envName} is missing ${missing.length} migration(s) this commit carries; shipping now would run code against schema that is not there:\n  - ` +
      missing.join("\n  - ") +
      `\nApply them first: node scripts/apply-migrations.mjs --env ${envName}`,
  };
}

/**
 * What a guarded deploy does with the two checks' results. `force` is the
 * operator's stated reason, or null. A forced deploy still prints every
 * problem; it just does not stop, and `overridden` is what the caller must
 * put on record. Test is never guarded, so callers do not ask for it.
 */
export function decideGuard({ envName, problems, schema, force }) {
  const errors = [];
  if (problems.length) errors.push(`${envName} ships only a written-down release:\n  - ` + problems.join("\n  - "));
  if (schema.refusal) errors.push(schema.refusal);
  const forced = Boolean(force) && errors.length > 0;
  return { refuse: errors.length > 0 && !forced, errors, warnings: schema.warnings, overridden: forced ? errors : [] };
}

/**
 * For each missing migration, the app files its `-- consumer:` header says read it.
 * `read(path)` returns the file text at the commit being shipped. Returns
 * [{ name, consumers }]: null = no header (says nothing), [] = `none`.
 */
export function consumersOf(missing, read) {
  return missing.map((name) => {
    let sql = "";
    try { sql = read(`${MIGRATIONS_DIR}/${name}`); } catch { /* unreadable reads as no header */ }
    return { name, consumers: declaredConsumers(sql) };
  });
}

/**
 * The STRICT schema verdict, for the one path that cannot rely on a person
 * noticing a warning (the deploy machine, before a Pi build). Unlike
 * schemaVerdict(), "could not ask" REFUSES: a guard that cannot check must not
 * pass. Returns { ok, message }.
 */
export function assertSchema({ envName, result, git, read }) {
  if (!result.ok) {
    return {
      ok: false,
      message:
        `cannot confirm ${envName}'s schema: could not ask which migrations it has applied (${result.reason}).\n` +
        `Refusing rather than guessing. Fix the cause, or check by hand: node scripts/apply-migrations.mjs --env ${envName} --status (read "0 pending").`,
    };
  }
  const missing = missingFromDatabase(deployedMigrations(git), result.applied);
  if (!missing.length) {
    return { ok: true, message: `${envName} holds every migration this commit carries${result.via ? ` (asked ${result.via})` : ""}.` };
  }
  const lines = consumersOf(missing, read).map(({ name, consumers }) =>
    `  - ${name}` +
    (consumers === null ? "  (declares no -- consumer: header)" : consumers.length ? `  <- read by ${consumers.join(", ")}` : "  (consumer: none)"));
  return {
    ok: false,
    message:
      `${envName} is missing ${missing.length} migration(s) this commit carries; the build would run code against schema that is not there:\n` +
      lines.join("\n") +
      `\nApply them first: node scripts/apply-migrations.mjs --env ${envName}`,
  };
}
