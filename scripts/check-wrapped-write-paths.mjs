#!/usr/bin/env node
/**
 * THE WHOLE-PAGE RULE, ANSWERED FOR EVERY PAGE: which page addresses have
 * every write reachable at them wrapped in runWriteAction(), and which do not.
 *
 * WHY IT EXISTS. A path goes on WRAPPED_WRITE_PATHS (src/lib/write-requests.ts)
 * only when EVERY write reachable at that address goes through
 * runWriteAction(); miss one and the Worker replays an unclaimed write, which
 * is the #250 double write. Until now that rule was checked by reading, and
 * reading missed something: a Server Action POSTs to the address of the page
 * the person is ON, not to the file the action lives in, so the shared header
 * in src/app/layout.tsx puts its own writes on EVERY address in the app.
 * docs/decisions/2026-11-01-write-paths-admin-sweep.md.
 *
 * WHAT IT DOES. For each page under src/app, it walks the import graph from
 * page.tsx plus every layout above it, collects the "use server" modules it can
 * reach, and reports each exported action and whether its module calls
 * runWriteAction(). Then it names any path on WRAPPED_WRITE_PATHS that has an
 * unwrapped write reachable at it.
 *
 * WHAT IT IS NOT. It is a reachability heuristic over imports, not a proof:
 * an action imported by a component that is never rendered still counts, and
 * module-level granularity means one unwrapped action marks its whole module.
 * Both err towards reporting MORE than is really reachable, which is the safe
 * direction for a fail-closed rule.
 *
 * IT ALWAYS EXITS 0 AND IS DELIBERATELY NOT IN CI. Today it reports every path
 * as incomplete, because the shared header's writes are unwrapped, so wiring it
 * in would fail every build. Wiring it in is worth doing once that is closed --
 * it is the check that would have caught /admin/units being listed -- and it is
 * a backlog item under Security, not something to switch on quietly.
 *
 *   node scripts/check-wrapped-write-paths.mjs            # the listed paths
 *   node scripts/check-wrapped-write-paths.mjs --all      # every page
 *   node scripts/check-wrapped-write-paths.mjs --prefix /admin
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const slash = (s) => s.split("\\").join("/");

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full)) files.push(full);
  }
})(join(repo, "src"));

const source = new Map(files.map((f) => [slash(relative(repo, f)), readFileSync(f, "utf8")]));

/** "@/x" and "./x" to a repo-relative module path, or null for a package. */
function resolveSpec(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = `src/${spec.slice(2)}`;
  else if (spec.startsWith(".")) {
    const parts = from.split("/").slice(0, -1);
    for (const seg of spec.split("/")) {
      if (seg === "." || seg === "") continue;
      if (seg === "..") parts.pop();
      else parts.push(seg);
    }
    base = parts.join("/");
  } else return null;
  for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`, base]) {
    if (source.has(candidate)) return candidate;
  }
  return null;
}

const imports = new Map();
for (const [file, text] of source) {
  const out = new Set();
  for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) {
    const resolved = resolveSpec(file, m[1]);
    if (resolved) out.add(resolved);
  }
  imports.set(file, out);
}

const isActionModule = (file) => /^["']use server["']/.test(source.get(file) ?? "");

/** The "use server" modules reachable from a page and the layouts above it. */
function actionModulesFor(roots) {
  const seen = new Set();
  const found = new Set();
  const queue = [...roots];
  while (queue.length) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    // An action module's own imports are server code, not more actions a press can reach.
    if (isActionModule(current)) {
      found.add(current);
      continue;
    }
    for (const next of imports.get(current) ?? []) queue.push(next);
  }
  return found;
}

/** A page.tsx or layout.tsx to the address it serves, route groups removed. */
function addressOf(file) {
  return (
    file
      .slice("src/app".length)
      .replace(/\/(page|layout)\.tsx?$/, "")
      .split("/")
      .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")))
      .join("/") || "/"
  );
}

const pages = [...source.keys()].filter((f) => f.startsWith("src/app/") && /\/page\.tsx?$/.test(f));
const layouts = [...source.keys()].filter((f) => f.startsWith("src/app/") && /\/layout\.tsx?$/.test(f));

const args = process.argv.slice(2);
const all = args.includes("--all");
const prefixAt = args.indexOf("--prefix");
const prefix = prefixAt === -1 ? null : args[prefixAt + 1];

const { WRAPPED_WRITE_PATHS, isWrappedWritePath } = await import("../src/lib/write-requests.ts");

const report = [];
for (const page of pages.sort()) {
  const address = addressOf(page);
  if (prefix && !address.startsWith(prefix)) continue;
  if (!all && !prefix && !isWrappedWritePath(address)) continue;

  const above = layouts.filter((l) => {
    const la = addressOf(l);
    return la === "/" || address === la || address.startsWith(`${la}/`);
  });
  const modules = [...actionModulesFor([page, ...above])].sort();
  const unwrapped = modules.filter((m) => !(source.get(m) ?? "").includes("runWriteAction"));
  report.push({ address, listed: isWrappedWritePath(address), modules, unwrapped });
}

for (const row of report) {
  const mark = row.unwrapped.length === 0 ? "complete" : `${row.unwrapped.length} unwrapped`;
  console.log(`${row.listed ? "LISTED " : "       "}${row.address}  (${mark})`);
  for (const mod of row.modules) {
    const wrapped = !row.unwrapped.includes(mod);
    const actions = [...(source.get(mod) ?? "").matchAll(/^export async function (\w+)/gm)].map((m) => m[1]);
    console.log(`    ${wrapped ? "ok  " : "NOT "} ${mod}  ${actions.join(", ")}`);
  }
}

const broken = report.filter((r) => r.listed && r.unwrapped.length > 0);
console.log("");
if (broken.length === 0) {
  console.log(`every path on WRAPPED_WRITE_PATHS has all its reachable writes wrapped (${WRAPPED_WRITE_PATHS.length} listed)`);
} else {
  console.log("THE WHOLE-PAGE RULE IS BROKEN on these listed paths:");
  for (const row of broken) console.log(`  ${row.address}: ${row.unwrapped.join(", ")}`);
  console.log("A listed path with an unwrapped write is the #250 double write. Take it off the list or wrap the writes.");
}
