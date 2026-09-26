import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAppEnv } from "@/lib/app-env";
import { checkDriveConnection, getDriveClient } from "@/lib/google/drive";
import { migrationDrift } from "@/lib/migration-drift";
import { latestRelease, unreleased } from "@/lib/releases";
import { createAdminClient } from "@/lib/supabase/admin";
import { type CheckOutcome, type CheckResult, cached, runCheck } from "./run";

/**
 * Settings → System status, the health half: one small function per tile,
 * each answering for whatever environment the page is served from. Every
 * one runs through runCheck (timeout, never throws, secrets scrubbed), so
 * a scheduled "alert me" can call them the same way the page does.
 */

/** A trivial round trip slower than this is amber: working, but something is wrong. */
const SLOW_DATABASE_MS = 3_000;

export type DatabaseFacts = { latencyMs: number };

export async function checkDatabase(): Promise<CheckOutcome<DatabaseFacts>> {
  const started = Date.now();
  const { error } = await createAdminClient().from("schema_migrations").select("filename").limit(1);
  const latencyMs = Date.now() - started;
  if (error) return { state: "fail", error: error.message, facts: { latencyMs } };
  return { state: latencyMs > SLOW_DATABASE_MS ? "warn" : "ok", facts: { latencyMs } };
}

export type DriveFacts = { notConnected: boolean };

/** Built on the Settings page's own check (drive-upload-errors), not a second one. */
export async function checkDrive(): Promise<CheckOutcome<DriveFacts>> {
  const result = await checkDriveConnection();
  if (result.ok) return { state: "ok", facts: { notConnected: false } };
  return { state: "fail", error: result.detail, facts: { notConnected: result.notConnected } };
}

export type MigrationFacts = {
  expected: number;
  applied: number;
  unapplied: string[];
  missingFile: string[];
};

/**
 * The migration files this build was made from (next.config.ts writes the
 * list in at build time; a Worker has no folder to read) against the
 * database's schema_migrations — the same comparison as
 * `apply-migrations.mjs --drift`, through the same function. A deploy is
 * built from main, so on test.lannacare.org and lannacare.org this is
 * "in step with main"; on a workstream's dev server it is that branch.
 *
 * A file the database hasn't applied is red: the running code expects a
 * table or column that isn't there. A row with no file is amber: the
 * database is ahead of the code, which is normal on dev while a schema PR
 * waits to merge, and wrong anywhere else.
 */
export async function checkMigrations(): Promise<CheckOutcome<MigrationFacts>> {
  const expected = (process.env.BUILD_MIGRATIONS ?? "").split(",").filter(Boolean);
  if (!expected.length) {
    return { state: "fail", error: "This build carries no list of migration files (BUILD_MIGRATIONS is empty)." };
  }
  const { data, error } = await createAdminClient().from("schema_migrations").select("filename");
  if (error) return { state: "fail", error: error.message };
  const applied = (data ?? []).map((row) => row.filename as string);
  const drift = migrationDrift(applied, expected);
  const facts = { expected: expected.length, applied: applied.length, ...drift };
  if (drift.unapplied.length) {
    return { state: "fail", error: `Not applied to this database: ${drift.unapplied.join(", ")}.`, facts };
  }
  return { state: drift.missingFile.length ? "warn" : "ok", facts };
}

type CloudflareEnvLike = {
  CF_VERSION_METADATA?: { id: string; tag: string; timestamp: string };
  RELEASE_MAIL?: unknown;
  RELEASE_MAIL_ENV?: string;
  RELEASE_MAIL_FROM?: string;
  ORIGIN_HOST?: string;
  ORIGIN_KEY?: string;
};

/**
 * The Worker's bindings, or null when this page wasn't rendered by the
 * Worker: under `next dev`, or on the Pi (`next start`), neither of which
 * has them.
 */
function workerEnv(): CloudflareEnvLike | null {
  try {
    return getCloudflareContext().env as CloudflareEnvLike;
  } catch {
    return null;
  }
}

export type ReleaseFacts = {
  version: string;
  title: string;
  releasedOn: string;
  /** Lines in `unreleased` this build carries (a test deploy from main has some). */
  unreleased: number;
  /** When this Worker version was uploaded; null off the Worker. */
  deployedAt: string | null;
  /** The Worker version's tag, "v0.6.0" when scripts/deploy.mjs made it. */
  workerTag: string | null;
  /** Rendered by the Worker, or somewhere without its bindings. */
  runtime: "worker" | "elsewhere";
};

/**
 * The release this build carries (src/lib/releases.ts, bundled in) and when
 * the Worker running it was deployed (the version_metadata binding,
 * wrangler.jsonc). Amber when the Worker's tag names a different release:
 * someone deployed without scripts/deploy.mjs, which is what tags it.
 */
export async function checkRelease(): Promise<CheckOutcome<ReleaseFacts>> {
  const meta = workerEnv()?.CF_VERSION_METADATA;
  const facts: ReleaseFacts = {
    version: latestRelease.version,
    title: latestRelease.title,
    releasedOn: latestRelease.date,
    unreleased: unreleased.length,
    deployedAt: meta?.timestamp ?? null,
    workerTag: meta?.tag || null,
    runtime: meta ? "worker" : "elsewhere",
  };
  if (meta && meta.tag !== `v${latestRelease.version}`) {
    return {
      state: "warn",
      error: `The Worker is tagged ${meta.tag ? `"${meta.tag}"` : "with nothing"}, not v${latestRelease.version}: it was deployed without scripts/deploy.mjs.`,
      facts,
    };
  }
  return { state: "ok", facts };
}

export type ReleaseMailFacts = { label: string | null; from: string | null; runtime: "worker" | "elsewhere" };

/**
 * Mirrors worker/release-mail.mjs's guard: mail goes out only when
 * RELEASE_MAIL_ENV is UAT or Production AND the send_email binding exists.
 * The test environment sets neither on purpose (the dev database never
 * mails), so there it is grey, not red. Names only: the binding is an
 * object, and the From address is a public var.
 */
export async function checkReleaseMail(): Promise<CheckOutcome<ReleaseMailFacts>> {
  const env = workerEnv();
  if (!env) return { state: "off", facts: { label: null, from: null, runtime: "elsewhere" } };
  const label = env.RELEASE_MAIL_ENV || null;
  const facts: ReleaseMailFacts = { label, from: env.RELEASE_MAIL_FROM || null, runtime: "worker" };
  if (!label) return { state: "off", facts };
  if (label !== "UAT" && label !== "Production") {
    return { state: "fail", error: `RELEASE_MAIL_ENV is "${label}"; the relay only sends as UAT or Production.`, facts };
  }
  if (!env.RELEASE_MAIL) {
    return { state: "fail", error: "RELEASE_MAIL_ENV is set but the RELEASE_MAIL send_email binding is missing (wrangler.jsonc).", facts };
  }
  if (!facts.from) {
    return { state: "fail", error: "RELEASE_MAIL_FROM is not set, so the relay has no From address.", facts };
  }
  return { state: "ok", facts };
}

/** Sunday's run is a week old by the next Sunday; a day's grace before amber, a second week missed is red. */
const BACKUP_WARN_DAYS = 8;
const BACKUP_FAIL_DAYS = 15;

export type BackupFacts = {
  /** The --env name scripts/backup.mjs files this database's dumps under. */
  env: string;
  newest: { name: string; createdAt: string; ageDays: number } | null;
  count: number;
};

/**
 * The newest dump scripts/backup.mjs uploaded for this environment:
 * Backups/lannacare-<env>-<timestamp>.dump under the Drive root. The Drive
 * file's own creation time is the record of the run, so nothing new had to
 * be stored. Only production is backed up on a schedule
 * (scripts/backup-schedule.ps1), so elsewhere "none yet" is grey.
 */
export async function checkBackup(): Promise<CheckOutcome<BackupFacts>> {
  const appEnv = getAppEnv();
  const env = appEnv === "dev" ? "test" : appEnv;
  const scheduled = appEnv === "production";
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) return { state: "fail", error: "GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured." };

  const drive = getDriveClient();
  const [folder] = await drive.listFiles({
    q: `'${rootId}' in parents and name = 'Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });
  const prefix = `lannacare-${env}-`;
  const dumps = folder
    ? (
        await drive.listFiles({
          q: `'${folder.id}' in parents and name contains '${prefix}' and trashed = false`,
          fields: "files(id, name, createdTime)",
          orderBy: "createdTime desc",
          pageSize: 100,
        })
      ).filter((f) => f.name?.startsWith(prefix) && f.name.endsWith(".dump") && f.createdTime)
    : [];

  const top = dumps[0];
  if (!top) {
    return scheduled
      ? { state: "fail", error: "No backup of this database has been found in Drive's Backups folder.", facts: { env, newest: null, count: 0 } }
      : { state: "off", facts: { env, newest: null, count: 0 } };
  }
  const ageDays = (Date.now() - Date.parse(top.createdTime!)) / 86_400_000;
  const facts = { env, newest: { name: top.name!, createdAt: top.createdTime!, ageDays }, count: dumps.length };
  if (!scheduled) return { state: "ok", facts };
  if (ageDays > BACKUP_FAIL_DAYS) {
    return { state: "fail", error: `The newest backup is ${Math.floor(ageDays)} days old; the weekly run has missed at least two Sundays.`, facts };
  }
  return { state: ageDays > BACKUP_WARN_DAYS ? "warn" : "ok", facts };
}

export type OriginFacts = { host: string | null; status: number | null };

/** Statuses that mean "the Pi isn't there", as worker/index.mjs treats them. */
const ORIGIN_DOWN_STATUSES = new Set([502, 503, 504, 521, 522, 523, 530]);

/**
 * The Raspberry Pi origin (docs/pi-hosting.md). With ORIGIN_HOST empty the
 * Worker renders everything itself, as it always has: grey. Once set, one
 * request to the tunnel with the shared key, as the Worker makes; no
 * answer or a gateway error means visitors are getting the Worker fallback.
 * The host name is shown, the key never is.
 */
export async function checkOrigin(): Promise<CheckOutcome<OriginFacts>> {
  const env = workerEnv();
  const host = env?.ORIGIN_HOST || process.env.ORIGIN_HOST || "";
  if (!host) return { state: "off", facts: { host: null, status: null } };
  const res = await fetch(`https://${host}/login`, {
    method: "HEAD",
    headers: { "x-origin-key": env?.ORIGIN_KEY ?? process.env.ORIGIN_KEY ?? "" },
    redirect: "manual",
    signal: AbortSignal.timeout(5_000),
  }).catch((err: unknown) => err);
  if (!(res instanceof Response)) {
    const why = res instanceof Error && res.name === "TimeoutError" ? "no answer within 5 seconds" : String(res);
    return { state: "warn", error: `The Pi did not answer (${why}); pages are served from the Worker fallback.`, facts: { host, status: null } };
  }
  if (ORIGIN_DOWN_STATUSES.has(res.status)) {
    return { state: "warn", error: `The Pi's tunnel answered ${res.status}; pages are served from the Worker fallback.`, facts: { host, status: res.status } };
  }
  return { state: "ok", facts: { host, status: res.status } };
}

export type HealthReport = {
  database: CheckResult<DatabaseFacts>;
  drive: CheckResult<DriveFacts>;
  migrations: CheckResult<MigrationFacts>;
  release: CheckResult<ReleaseFacts>;
  releaseMail: CheckResult<ReleaseMailFacts>;
  backup: CheckResult<BackupFacts>;
  origin: CheckResult<OriginFacts>;
};

export type HealthCheckKey = keyof HealthReport;

/**
 * Every health check at once, each on its own clock, fresh. The alert run
 * (src/lib/status/alerts.ts) calls this: it must see now, not the page's
 * minute-old copy.
 */
export async function runHealthChecks(): Promise<HealthReport> {
  const [database, drive, migrations, release, releaseMail, backup, origin] = await Promise.all([
    runCheck(checkDatabase, 5_000),
    runCheck(checkDrive),
    runCheck(checkMigrations, 5_000),
    runCheck(checkRelease),
    runCheck(checkReleaseMail),
    runCheck(checkBackup),
    runCheck(checkOrigin, 6_000),
  ]);
  return { database, drive, migrations, release, releaseMail, backup, origin };
}

/** The page's view: the same checks, cached for a minute. */
export function getHealthReport(): Promise<HealthReport> {
  return cached("health", runHealthChecks);
}
