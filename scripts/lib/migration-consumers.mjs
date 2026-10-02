// The apply-time mirror of the deploy schema check (scripts/lib/deploy-schema.mjs):
// deploy.mjs refuses code whose schema is not there; apply-migrations.mjs warns
// when it puts schema on a database whose reader is not live yet. Schema ahead
// of code is the direction this project uses on purpose, so this only ever
// WARNS - it never blocks and never changes what is applied.
//
// Which code reads a migration is declared, not inferred. A migration's header
// may carry
//
//   -- consumer: src/app/adopt/[id]/page.tsx, src/lib/residents/public.ts
//   -- consumer: none            (nothing in the app reads it)
//
// Inference was rejected (docs/decisions/2026-10-02-migration-consumer-header.md):
// it needs SQL parsed to find what a file adds and TypeScript searched for the
// name, and a dynamic select it misses reads as "nothing reads this", which is
// worse than saying nothing. A file with no header is reported as "declares no
// consumer" - a different sentence from "no consumer found", and the only one
// this can honestly say.
//
// "Live" is what the serving origin says it runs (GET /api/version, version and
// commit, no sign-in; liveRelease below). Only when it cannot say - unreachable,
// an older build without the route, a commit this checkout does not have - does
// this fall back to ASSUMING the newest cut on origin/main is live, and then an
// undeployed cut reads as live. The report says which one it used.

const HEADER_LINE = /^--\s*consumer:\s*(.+?)\s*$/i;

/** Consumer paths declared in a migration's leading comment block. null = no header; [] = `none`. */
export function declaredConsumers(sql) {
  for (const line of sql.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("--")) break; // the header is the leading comments only
    const m = HEADER_LINE.exec(trimmed);
    if (!m) continue;
    if (/^none\b/i.test(m[1])) return [];
    return m[1].split(",").map((p) => p.trim()).filter(Boolean);
  }
  return null;
}

/**
 * One path's state against the release assumed live and origin/main.
 * `read(ref, path)` returns the file's text, or null when it is not there.
 * live: identical at both. absent-at-release / absent-on-main / differs: not
 * provably live. "differs" can be an unrelated edit; it is reported as unknown.
 */
export function consumerState(path, { releaseRef, read }) {
  const atRelease = read(releaseRef, path);
  const onMain = read("origin/main", path);
  if (onMain === null) return "absent-on-main";
  if (atRelease === null) return "absent-at-release";
  return atRelease === onMain ? "live" : "differs";
}

/**
 * Lines to print for the files about to be applied.
 * files: [{ name, sql }]. release: { version, ref } or null when it could not
 * be worked out. Returns { warnings, notes } - notes are never warnings.
 */
export function consumerReport(files, { release, read }) {
  const warnings = [];
  const undeclared = [];
  for (const { name, sql } of files) {
    const consumers = declaredConsumers(sql);
    if (consumers === null) { undeclared.push(name); continue; }
    if (!consumers.length) continue;
    if (!release) continue;
    const not = consumers
      .map((path) => [path, consumerState(path, { releaseRef: release.ref, read })])
      .filter(([, s]) => s !== "live");
    for (const [path, s] of not) {
      const why = {
        "absent-on-main": "is not on origin/main at all",
        "absent-at-release": `does not exist in release ${release.version}`,
        differs: `differs from release ${release.version}, so it may or may not already read this`,
      }[s];
      warnings.push(`${name}: declared consumer ${path} ${why}.`);
    }
  }
  const notes = [];
  if (!release && files.some((f) => declaredConsumers(f.sql)?.length)) {
    notes.push("consumer check skipped: could not work out which release is live (needs origin/main's package.json version).");
  }
  if (warnings.length) {
    notes.push(
      "These tables/columns land before the code that reads them is live. That is the safe direction - nothing is blocked - but do not deploy the reader before this is applied, and expect nothing to use it yet.",
      release.exact
        ? `\"Live\" here is what ${release.origin} reports it runs: ${release.version} @ ${release.ref.slice(0, 7)}${release.servedBy === "worker" ? " (answered by the Worker, the fallback, not the Pi)" : ""}.`
        : `\"Live\" here is ASSUMED to be the commit that cut ${release.version} (${release.askedFailed}), so an undeployed cut counts as live.`,
    );
  }
  if (undeclared.length) {
    notes.push(`${undeclared.length} file(s) declare no \`-- consumer:\` header, so nothing was checked for them (that is not the same as nothing reading them).`);
  }
  return { warnings, notes };
}

/**
 * The release the serving origin says it runs: { version, ref (the commit),
 * exact: true, ... }, or the assumption below with exact: false and
 * `askedFailed` saying why asking did not work. `hasCommit(sha)` says whether
 * this checkout can read that commit - a sha it cannot read cannot be compared.
 */
export async function liveRelease({ siteOrigin, git, hasCommit, fetchImpl = fetch }) {
  let askedFailed;
  try {
    const res = await fetchImpl(`${siteOrigin}/api/version`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) askedFailed = `${siteOrigin}/api/version answered ${res.status}`;
    else {
      const { version, sha } = await res.json();
      if (typeof version !== "string" || !/^[0-9a-f]{40}$/.test(sha ?? "")) askedFailed = `${siteOrigin}/api/version gave no version and commit`;
      else if (!hasCommit(sha)) askedFailed = `${siteOrigin} runs ${sha.slice(0, 7)}, which this checkout does not have (git fetch)`;
      else return { version, ref: sha, exact: true, origin: siteOrigin, servedBy: res.headers.get("x-lanna-served-by") };
    }
  } catch (error) {
    askedFailed = `could not ask ${siteOrigin}: ${error.message}`;
  }
  const assumed = assumedLiveRelease(git);
  return assumed && { ...assumed, exact: false, askedFailed };
}

/** The release assumed live, when the origin cannot be asked: version in origin/main's package.json and the commit that set it. */
export function assumedLiveRelease(git) {
  try {
    const version = JSON.parse(git(["show", "origin/main:package.json"])).version;
    if (!version) return null;
    const ref = git(["log", "-1", "--format=%H", `-S"version": "${version}"`, "origin/main", "--", "package.json"]);
    return ref ? { version, ref, exact: false, askedFailed: "the origin was not asked" } : null;
  } catch {
    return null;
  }
}
