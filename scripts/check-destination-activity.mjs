#!/usr/bin/env node
/**
 * check-destination-activity.mjs — does every link ask the activity its DESTINATION asks?
 *
 * The shape (backlog #79sqf, sweeps 6-11): a link or notice is drawn for a login that holds the
 * page's activity but NOT the activity of the page the link opens, so the press ends at /no-access.
 *
 * What it reads (static, TypeScript AST, no server, no database, no roles — cards/activities only):
 *   1. Every page.tsx's own guard: requirePermission("act", lvl) / requireAnyPermission([...]),
 *      plus the route registry (src/lib/permissions/routes.ts) for pages that have no guard call.
 *   2. Every `href` in JSX under src/ that points inside the app.
 *   3. The conditions the link sits under: `cond && <Link/>`, `cond ? <Link/> : …`, `if (cond) …`,
 *      early `if (!cond) return`. A condition resolves to can(perms, "act", lvl) calls directly, through a
 *      same-file const, or through a prop name (`canEnclosure`) by finding every place that prop is
 *      passed `can(...)`.
 *   4. For a link with no gate, the page(s) that render the file (import graph): a login that opens
 *      the host page must also be able to open the destination.
 *
 * Verdicts: OK / FINDING (gate or host asks something else) / UNRESOLVED (named in the output,
 * never silently passed). Findings are compared with docs/destination-activity-allowlist.json.
 *
 * WHAT IT CANNOT SEE (said here so a clean run is not read as more than it is): prose notices that
 * promise an ability (sweep-11's F2), a control whose server action asks a different activity from its
 * gate (F3/F4), `router.push`/`redirect` targets, links built from data rows, and OR-conditions
 * (any activity found under a gate is treated as enough). See docs/decisions/2026-11-09-destination-activity-check.md.
 *
 * Runtime: a few seconds. Run with no arguments. Exit 1 only for a finding not on the allow-list.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const ALLOW_FILE = path.join(ROOT, "docs", "destination-activity-allowlist.json");
const VERBOSE = process.argv.includes("--all");

const rank = (l) => (l === "read" ? 1 : 2);
const sat = (g, d) => g.act === d.act && rank(g.level) >= rank(d.level);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.|\.d\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

const files = walk(SRC);
const sfs = new Map();
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  sfs.set(f, ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS));
}

const strLit = (n) => (n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null);

// ---- 1. page guards ------------------------------------------------------------------------
function guardsIn(sf) {
  const found = [];
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      const name = n.expression.text;
      if (name === "requirePermission") {
        const a = strLit(n.arguments[0]);
        if (a) found.push([{ act: a, level: strLit(n.arguments[1]) || "edit" }]);
      } else if (name === "requireAnyPermission" && n.arguments[0] && ts.isArrayLiteralExpression(n.arguments[0])) {
        const alts = n.arguments[0].elements.map(strLit).filter(Boolean).map((act) => ({ act, level: "edit" }));
        if (alts.length) found.push(alts);
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
  return found; // list of "opens if any of these" sets; the page needs every set satisfied
}

const pages = []; // {pattern: string[], file, opens: sets[]}
for (const [f, sf] of sfs) {
  if (path.basename(f) !== "page.tsx") continue;
  const segs = rel(path.dirname(f)).replace(/^src\/app\/?/, "").split("/").filter((s) => s && !/^\(.*\)$/.test(s) && !s.startsWith("@"));
  pages.push({ file: rel(f), abs: f, pattern: segs, opens: guardsIn(sf) });
}
// registry fallback for a page with no guard call
const routesTs = fs.readFileSync(path.join(SRC, "lib/permissions/routes.ts"), "utf8");
for (const m of routesTs.matchAll(/path:\s*"([^"]+)",\s*activity:\s*"([^"]+)"(?:,\s*alsoActivity:\s*"([^"]+)")?(?:,\s*level:\s*"(read|edit)")?/g)) {
  const segs = m[1].split("/").filter(Boolean);
  const pg = pages.find((p) => p.pattern.join("/") === segs.join("/"));
  if (pg && pg.opens.length === 0) {
    const level = m[4] || "edit";
    pg.opens = [[{ act: m[2], level }, ...(m[3] ? [{ act: m[3], level: "edit" }] : [])]];
    pg.fromRegistry = true;
  }
}

function matchPage(segs) {
  // segs: array of string | null (null = ${} wildcard)
  let best = null, bestScore = -1;
  for (const p of pages) {
    if (p.pattern.length !== segs.length) continue;
    let ok = true, score = 0;
    for (let i = 0; i < segs.length; i++) {
      const pat = p.pattern[i], s = segs[i];
      const dyn = /^\[.*\]$/.test(pat);
      if (dyn) continue;
      if (s === null || s !== pat) { ok = false; break; }
      score++;
    }
    if (ok && score > bestScore) { best = p; bestScore = score; }
  }
  return best;
}

// ---- 2. import graph: file -> pages that render it -----------------------------------------
const aliasResolve = (from, spec) => {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base + ".tsx", base + ".ts", path.join(base, "index.tsx"), path.join(base, "index.ts"), base]) {
    if (sfs.has(c)) return c;
  }
  return null;
};
const importers = new Map();
for (const [f, sf] of sfs) {
  for (const st of sf.statements) {
    if ((ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      const t = aliasResolve(f, st.moduleSpecifier.text);
      if (t) (importers.get(t) || importers.set(t, new Set()).get(t)).add(f);
    }
  }
}
const importMap = new Map(); // file -> Map(localName -> resolved file)
for (const [f, sf] of sfs) {
  const m = new Map();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.importClause) {
      const t = aliasResolve(f, st.moduleSpecifier.text);
      if (!t) continue;
      const c = st.importClause;
      if (c.name) m.set(c.name.text, t);
      if (c.namedBindings && ts.isNamedImports(c.namedBindings)) for (const el of c.namedBindings.elements) m.set(el.name.text, t);
    }
  }
  importMap.set(f, m);
}
const hostCache = new Map();
function hostPages(file) {
  if (hostCache.has(file)) return hostCache.get(file);
  const seen = new Set([file]), q = [file], hosts = new Set();
  while (q.length) {
    const cur = q.pop();
    if (path.basename(cur) === "page.tsx") hosts.add(cur);
    for (const i of importers.get(cur) || []) if (!seen.has(i)) { seen.add(i); q.push(i); }
  }
  hostCache.set(file, hosts);
  return hosts;
}

// ---- 3. what a condition means -------------------------------------------------------------
const propActs = new Map(); // name -> [{act, level}] from `name={...can(...)...}` and `const name = ...can(...)`
const unresolvedProp = (name) => !propActs.has(name);
function directActs(expr, depth = 0, scopeLocals = null) {
  const out = [], idents = [];
  (function v(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "can" && n.arguments.length >= 2) {
      const a = strLit(n.arguments[1]);
      if (a) out.push({ act: a, level: strLit(n.arguments[2]) || "edit" });
    } else if (ts.isIdentifier(n) && !(n.parent && ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) {
      idents.push(n.text);
    }
    ts.forEachChild(n, v);
  })(expr);
  return { out, idents };
}
// collect named booleans and prop pass-through across the whole tree
const localDefs = new Map(); // file -> Map(name -> expr)
for (const [f, sf] of sfs) {
  const defs = new Map();
  (function v(n) {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) defs.set(n.name.text, n.initializer);
    if (ts.isJsxAttribute(n) && n.initializer && ts.isJsxExpression(n.initializer) && n.initializer.expression) {
      const name = n.name.getText();
      const { out } = directActs(n.initializer.expression);
      const tag = n.parent && n.parent.parent && (ts.isJsxOpeningElement(n.parent.parent) || ts.isJsxSelfClosingElement(n.parent.parent)) ? n.parent.parent.tagName.getText() : null;
      const target = tag ? importMap.get(f)?.get(tag.split(".")[0]) : null;
      if (out.length && target && /^(can|show|allow|has|may)/.test(name)) {
        const k = target + "::" + name;
        propActs.set(k, [...(propActs.get(k) || []), ...out]);
      }
    }
    ts.forEachChild(n, v);
  })(sf);
  localDefs.set(f, defs);
}
function resolveCondition(expr, file) {
  const acts = [];
  const unresolved = [];
  const seen = new Set();
  (function go(e, depth) {
    const { out, idents } = directActs(e);
    acts.push(...out);
    for (const id of idents) {
      if (seen.has(id) || depth > 3) continue;
      seen.add(id);
      const local = localDefs.get(file)?.get(id);
      if (local) { go(local, depth + 1); continue; }
      if (propActs.has(file + "::" + id)) acts.push(...propActs.get(file + "::" + id));
      else if (/^(can|show|allow|has|may|is)[A-Z]/.test(id)) unresolved.push(id);
    }
  })(expr, 0);
  return { acts, unresolved };
}

function gatesFor(node, file) {
  const conds = [];
  for (let cur = node, p = node.parent; p; cur = p, p = p.parent) {
    if (ts.isConditionalExpression(p) && p.whenTrue === cur) conds.push(p.condition);
    else if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && p.right === cur) conds.push(p.left);
    else if (ts.isIfStatement(p) && p.thenStatement === cur) conds.push(p.expression);
    else if (ts.isBlock(p) || ts.isSourceFile(p)) {
      // an earlier `if (!cond) return …;` in the same block
      for (const st of p.statements) {
        if (st.pos >= cur.pos) break;
        if (ts.isIfStatement(st) && /\breturn\b|\bredirect\b|\bnotFound\b/.test(st.thenStatement.getText())) {
          const e = st.expression;
          const neg = (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.ExclamationToken) ? e.operand : null;
          if (neg) conds.push(neg);
          else if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            for (const side of [e.left, e.right]) if (ts.isPrefixUnaryExpression(side) && side.operator === ts.SyntaxKind.ExclamationToken) conds.push(side.operand);
          }
        }
      }
    }
    if (ts.isFunctionLike(p) && !ts.isArrowFunction(p) && !ts.isFunctionExpression(p)) break;
  }
  const acts = [], unresolved = [];
  for (const c of conds) { const r = resolveCondition(c, file); acts.push(...r.acts); unresolved.push(...r.unresolved); }
  return { acts, unresolved };
}

// ---- 4. extract hrefs, judge each ----------------------------------------------------------
function hrefSegments(expr) {
  // returns segments array (string|null) or null when not an in-app path
  let head = "", wild = false;
  if (strLit(expr) !== null) head = strLit(expr);
  else if (ts.isTemplateExpression(expr)) {
    // build with placeholders
    let s = expr.head.text;
    for (const sp of expr.templateSpans) s += "\u0000" + sp.literal.text;
    head = s;
    wild = true;
  } else return null;
  if (!head.startsWith("/") || head.startsWith("//")) return null;
  head = head.split(/[?#]/)[0];
  if (head.startsWith("/api/")) return null;
  const parts = head.split("/").filter((s) => s !== "");
  return parts.map((s) => (s.includes("\u0000") ? null : s));
}

const results = { ok: 0, noDestGuard: 0, findings: [], unresolved: [], links: 0, notApp: 0 };
const okHow = { gate: 0, host: 0 };
const opensAll = (sets, dest) => sets.every((alts) => alts.every((p) => dest.some((d) => sat(p, d))));

for (const [f, sf] of sfs) {
  (function v(n) {
    if (ts.isJsxAttribute(n) && n.name.getText() === "href" && n.initializer) {
      const e = ts.isJsxExpression(n.initializer) ? n.initializer.expression : n.initializer;
      if (e) {
        const segs = hrefSegments(e);
        if (!segs) { results.notApp++; }
        else {
          results.links++;
          const pg = matchPage(segs);
          const where = `${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
          const target = "/" + segs.map((s) => s ?? "${…}").join("/");
          const destSets = pg ? pg.opens : [];
          if (!pg || destSets.length === 0 || destSets.some((s) => s.length === 0)) {
            results.noDestGuard++;
            if (VERBOSE) console.log(`  [no static destination activity] ${where} -> ${target}`);
          } else {
            // destination: the page needs every set; a login must satisfy each. Treat as one flat requirement list.
            const destAll = destSets.flat();
            const gates = gatesFor(n.parent.parent ?? n, f);
            const gateOk = gates.acts.some((g) => destAll.some((d) => sat(g, d)));
            if (gateOk) { results.ok++; okHow.gate++; }
            else {
              const hosts = [...hostPages(f)];
              const hostGuards = hosts.map((h) => pages.find((p) => p.abs === h));
              const allHostsOk = hosts.length > 0 && hostGuards.every((hp) => hp.opens.length > 0 && opensAll(hp.opens, destAll));
              const guardNames = destAll.map((d) => `${d.act}:${d.level}`).join(" | ");
              if (allHostsOk) { results.ok++; okHow.host++; }
              else if (gates.acts.length) {
                results.findings.push({ where, target, why: `gated on ${[...new Set(gates.acts.map((g) => g.act + ":" + g.level))].join(", ")}; destination asks ${guardNames}` });
              } else if (gates.unresolved.length) {
                results.unresolved.push({ where, target, why: `gate ${[...new Set(gates.unresolved)].join(", ")} could not be traced to an activity; destination asks ${guardNames}` });
              } else if (hosts.length === 0) {
                results.unresolved.push({ where, target, why: `no gate and no page renders this file; destination asks ${guardNames}` });
              } else if (hostGuards.some((hp) => hp.opens.length === 0)) {
                results.unresolved.push({ where, target, why: `no gate; a host page has no static guard; destination asks ${guardNames}` });
              } else {
                const bad = hostGuards.filter((hp) => !opensAll(hp.opens, destAll)).map((hp) => hp.file.replace(/^src\/app\//, "").replace(/\/page\.tsx$/, "") || "/");
                results.findings.push({ where, target, why: `no gate; opened by ${bad.slice(0, 3).join(", ")}${bad.length > 3 ? ` +${bad.length - 3}` : ""} which do not imply ${guardNames}` });
              }
            }
          }
        }
      }
    }
    ts.forEachChild(n, v);
  })(sf);
}

// ---- 5. report -----------------------------------------------------------------------------
let allow = { entries: [] };
try { allow = JSON.parse(fs.readFileSync(ALLOW_FILE, "utf8")); } catch {}
const key = (x) => `${x.where.replace(/:\d+$/, "")} -> ${x.target}`;
const allowed = new Set(allow.entries.map((e) => `${e.file} -> ${e.target}`));
const fresh = results.findings.filter((x) => !allowed.has(key(x)));
const known = results.findings.filter((x) => allowed.has(key(x)));
const stale = [...allowed].filter((k) => !results.findings.some((x) => key(x) === k));

console.log("check-destination-activity: does each in-app link ask the activity its destination asks?");
console.log(`  pages read: ${pages.length} (${pages.filter((p) => p.opens.length).length} with a static guard)`);
console.log(`  in-app links found: ${results.links} (non-app hrefs skipped: ${results.notApp})`);
console.log(`  resolved OK: ${results.ok} (by its own gate ${okHow.gate}, by the host page's guard ${okHow.host})`);
console.log(`  destination has no static activity (public or unguarded page): ${results.noDestGuard}`);
console.log(`  UNRESOLVED (could not decide): ${results.unresolved.length}`);
for (const u of results.unresolved) console.log(`    ? ${u.where} -> ${u.target}: ${u.why}`);
console.log(`  FINDINGS: ${results.findings.length} (${known.length} on the allow-list, ${fresh.length} new)`);
for (const x of results.findings) console.log(`    ${allowed.has(key(x)) ? "(known)" : "NEW"} ${x.where} -> ${x.target}: ${x.why}`);
for (const s of stale) console.log(`  STALE allow-list entry (no longer found, delete it): ${s}`);
if (fresh.length || stale.length) {
  console.log(fresh.length ? "NOT CLEAN: a link offers a destination the same login is refused." : "NOT CLEAN: the allow-list names a link that is no longer a finding.");
  process.exit(1);
}
console.log(results.unresolved.length ? "no new findings (unresolved links are listed above, not passed silently)" : "clean");
