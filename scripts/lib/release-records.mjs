// The release records in docs/releases/ (<date>-<version>.md, dots as dashes),
// shared by check-release-handover.mjs and release-prs.mjs.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Every versioned record, oldest first. Undated-version files (2026-09-30.md) are ignored. */
export function releaseRecords(root) {
  const dir = join(root, "docs", "releases");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((f) => f.match(/^(\d{4}-\d{2}-\d{2})-(\d+)-(\d+)-(\d+)\.md$/))
    .filter(Boolean)
    .map((m) => ({ file: m[0], date: m[1], parts: [+m[2], +m[3], +m[4]], version: `${m[2]}.${m[3]}.${m[4]}` }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.parts[0] - b.parts[0] || a.parts[1] - b.parts[1] || a.parts[2] - b.parts[2]);
}

const COMMIT = /\*\*Commit\*\*\s*`([0-9a-f]{7,40})`/;

/**
 * The range start release-prs.mjs should use. An explicit argument always wins.
 * Otherwise the newest record's `**Commit** `<sha>`` line. Never guesses:
 * returns { error } when there is no record or the record has no commit line.
 */
export function resolveSince({ arg, root }) {
  if (arg) return { sha: arg, source: "argument" };
  const records = releaseRecords(root);
  if (!records.length) {
    return { error: `no release record matching <date>-<version>.md in ${join(root, "docs", "releases")}` };
  }
  const newest = records[records.length - 1];
  const path = `docs/releases/${newest.file}`;
  const m = COMMIT.exec(readFileSync(join(root, path), "utf8"));
  if (!m) return { error: `${path} has no **Commit** \`<sha>\` line (the newest record, ${newest.version})` };
  return { sha: m[1], source: "record", version: newest.version, file: path };
}
