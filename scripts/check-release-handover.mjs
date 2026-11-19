#!/usr/bin/env node
/**
 * Is docs/release-handover.md stale? The version named by the NEWEST file in
 * docs/releases/ (<date>-<version>.md, dots written as dashes) must appear in
 * the handover's first line. An edition may cover two releases, so the test is
 * "does the newest appear", never "does exactly one".
 *
 * ADVISORY: always exits 0 and prints STALE or current. Not in CI on purpose
 * (a record PR would be red until the handover is written; see
 * docs/decisions/2026-11-19-stale-release-handover-check.md).
 *
 *   node scripts/check-release-handover.mjs [repo-root]   (root injectable for fixtures)
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ?? fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "docs", "releases");
const handover = join(root, "docs", "release-handover.md");

const records = readdirSync(dir)
  .map((f) => f.match(/^(\d{4}-\d{2}-\d{2})-(\d+)-(\d+)-(\d+)\.md$/))
  .filter(Boolean)
  .map((m) => ({ file: m[0], date: m[1], parts: [+m[2], +m[3], +m[4]], version: `${m[2]}.${m[3]}.${m[4]}` }))
  .sort((a, b) => a.date.localeCompare(b.date) || a.parts[0] - b.parts[0] || a.parts[1] - b.parts[1] || a.parts[2] - b.parts[2]);

if (!records.length) {
  console.log(`No release records in ${dir}; nothing to compare.`);
  process.exit(0);
}
const newest = records[records.length - 1];
const first = readFileSync(handover, "utf8").split(/\r?\n/)[0];
console.log(`Newest release record: docs/releases/${newest.file} (${newest.version})`);
console.log(`Handover first line (${handover}): ${first}`);
const named = new RegExp("(?<![\d.])" + newest.version.replace(/\./g, "\.") + "(?![\d])").test(first);
console.log(
  named
    ? `Current: the handover names ${newest.version}.`
    : `STALE: the handover does not name ${newest.version}. Write the next edition (release-procedure rule 3: it goes in the record's PR).`,
);
