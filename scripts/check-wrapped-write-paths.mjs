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
 * IT BLOCKS, SINCE 2026-11-01, and it is its own CI job. It could not before:
 * the shared header's writes were unwrapped, so it reported every path as
 * incomplete and wiring it in would have failed every build. The header stream
 * closed that (docs/decisions/2026-11-01-header-writes-wrapped.md) and this is
 * the check that would have caught /admin/units being listed in the first
 * place, so it is now the thing that stops the next path being listed wrongly.
 *
 * READ-ONLY ACTION MODULES, and why they needed saying out loud. The test below
 * is "does this module's source call runWriteAction()", which cannot tell a
 * read-only "use server" module from one with an unwrapped write -- neither
 * calls it. A read is safe to replay by construction: the Worker's rule is
 * method plus path (worker/origin.mjs mayReplayWrite), so it replays every POST
 * on a listed path, and a POST that writes nothing can be replayed all day. So
 * such a module may DECLARE itself, in its own source:
 *
 *   // write-requests: read-only -- <why>
 *
 * The declaration is an assertion by whoever wrote the module, in the place a
 * future edit would land, and it is guarded rather than proved: a module that
 * declares it and then shows a write-shaped call of its own (.insert, .update,
 * .upsert, .delete, .updateUser) is REFUSED, loudly, and the declaration counts
 * for nothing. What the guard does NOT see is a write inside a helper the
 * module imports -- the same limit the rest of this script has. That is why the
 * declaration carries a reason and why every run prints which modules used one.
 * `assistantLookup` is the worked example of getting this wrong: two documents
 * called it read-only because the question it answers is, and it inserts an
 * audit row on every call.
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

/** A write-shaped call in a module's OWN source; see the header on the limits. */
const WRITE_SHAPES = [".insert(", ".update(", ".upsert(", ".delete(", ".updateUser("];

const DECLARATION = /^\s*\/\/\s*write-requests:\s*read-only\s*(?:--|—)\s*(.+?)\s*$/m;

/**
 * The module with its comments taken out, so PROSE about runWriteAction() is
 * never mistaken for a call to it. Every converted file in this repo explains
 * itself in a comment that names the function, and the read-only declaration
 * below has to be able to name it too.
 */
function code(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * Does this module satisfy the rule, and how?
 *
 *   { how: "wrapped" }                        it calls runWriteAction()
 *   { how: "declared", why }                  it declares itself read-only, and
 *                                             shows no write-shaped call
 *   { how: "refused", why, shape }            it declares itself read-only and
 *                                             DOES show one -- a fault
 *   null                                      an unwrapped write
 */
function verdictFor(file) {
  const text = source.get(file) ?? "";
  const body = code(text);

  // The declaration is read FIRST and is the whole verdict when it is there: a
  // module either has writes to wrap or declares it has none, never both.
  const declared = text.match(DECLARATION);
  if (declared) {
    const shape = WRITE_SHAPES.find((s) => body.includes(s));
    // Fail closed: the declaration is worth nothing against evidence of a write.
    return shape
      ? { how: "refused", why: declared[1], shape }
      : { how: "declared", why: declared[1] };
  }

  return body.includes("runWriteAction") ? { how: "wrapped" } : null;
}

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
  const unwrapped = modules.filter((m) => !verdictFor(m) || verdictFor(m).how === "refused");
  report.push({ address, listed: isWrappedWritePath(address), modules, unwrapped });
}

const declarations = new Map();
const refusals = new Map();

for (const row of report) {
  const mark = row.unwrapped.length === 0 ? "complete" : `${row.unwrapped.length} unwrapped`;
  console.log(`${row.listed ? "LISTED " : "       "}${row.address}  (${mark})`);
  for (const mod of row.modules) {
    const verdict = verdictFor(mod);
    const actions = [...(source.get(mod) ?? "").matchAll(/^export async function (\w+)/gm)].map((m) => m[1]);
    if (verdict?.how === "declared") declarations.set(mod, verdict.why);
    if (verdict?.how === "refused") refusals.set(mod, verdict);
    const mark2 =
      verdict?.how === "wrapped" ? "ok  " : verdict?.how === "declared" ? "read" : "NOT ";
    console.log(`    ${mark2} ${mod}  ${actions.join(", ")}`);
  }
}

// Printed on every run, so a declaration can never quietly become the reason a
// path is listed. The header says why these are an assertion and not a proof.
if (declarations.size > 0) {
  console.log("");
  console.log("declared read-only (no write to wrap), which this check takes on trust:");
  for (const [mod, why] of declarations) console.log(`  ${mod}: ${why}`);
}

if (refusals.size > 0) {
  console.log("");
  console.log("A read-only declaration was REFUSED -- the module writes:");
  for (const [mod, { shape }] of refusals) console.log(`  ${mod}: declares read-only but calls ${shape}`);
  console.log("Wrap the write through runWriteAction(), or take the declaration off and say what it does.");
}

const broken = report.filter((r) => r.listed && r.unwrapped.length > 0);
console.log("");
if (broken.length === 0 && refusals.size === 0) {
  console.log(`every path on WRAPPED_WRITE_PATHS has all its reachable writes wrapped (${WRAPPED_WRITE_PATHS.length} listed)`);
} else {
  if (broken.length > 0) {
    console.log("THE WHOLE-PAGE RULE IS BROKEN on these listed paths:");
    for (const row of broken) console.log(`  ${row.address}: ${row.unwrapped.join(", ")}`);
    console.log("A listed path with an unwrapped write is the #250 double write. Take it off the list or wrap the writes.");
  }
  // It blocks since 2026-11-01. A refused declaration fails even on a path that
  // is not listed: it is a lie in the source either way, and it is cheap to fix.
  process.exitCode = 1;
}
