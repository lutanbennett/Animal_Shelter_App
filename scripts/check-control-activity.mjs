#!/usr/bin/env node
/**
 * check-control-activity.mjs — does every control ask the activity its own ACTION asks?
 *
 * The second resolver for backlog #79sqf (the first, check-destination-activity.mjs, does links). CLAUDE.md's rule:
 * a control is drawn only when can(perms, <activity>) is true for the activity the action's OWN server check or RPC
 * asks, "so the control and the action cannot disagree". A FINDING is: gate activity != action activity.
 *
 * Static (TypeScript AST + the migration files). No server, no database, no roles: cards/activities only.
 *   1. Controls: any JSX `onClick`, `onSubmit`, `action`, `formAction` attribute.
 *   2. Control -> action: the attribute's expression is followed through identifiers: a function imported from
 *      a "use server" file (the server action), a same-file handler (depth 3), `useActionState(fn, …)` bound names,
 *      and a direct `.rpc("name")`. A callback prop (`onDelete`) that nothing local defines is UNRESOLVED, by name.
 *   3. Action -> activity: inside the action body (and helpers it calls, same file or imported from src/, depth 2):
 *      can(perms, "act", lvl), requirePermission/requireAnyPermission, and `.rpc("name")`, whose activity is read from
 *      the LIVE definition (last create-or-replace, minus later drops: scripts/lib/sql-refusals.mjs liveFunctions)
 *      as `has_permission('act'[, 'lvl'])`. An rpc whose live body asks no card is UNRESOLVED, by function name.
 *   4. Control -> gate: the conditions it sits under (`&&`, `?:`, `if`, early return), resolved through same-file
 *      consts and through props passed `can(...)` — the same machinery as the first resolver (copied, not shared:
 *      the first resolver's output is measured and must not move). A control with no gate falls back to the
 *      page(s) that render its file: every host page's guard must imply the action's activity.
 *
 * Verdicts: OK / FINDING / UNRESOLVED (printed by name, never passed) / "no static activity" (counted, not judged:
 * the action asks no card in code we can read — public or self-service actions).
 * Admin is ignored on purpose (outside the card system); an activity no card grants is #c4vn7's ruling, not a control fault.
 *
 * WHAT IT CANNOT SEE: prose notices that promise an ability (F2 — a render-time finding, not catchable here);
 * click-only controls whose handler is a callback prop passed through two components; dynamic rpc names;
 * an action reached through `router.push`; OR-conditions (any gate activity that satisfies any action activity is
 * treated as enough); SQL that asks a card through a helper function rather than has_permission(); the live database.
 *
 * Runtime: a few seconds. Exit 1 only for a finding not on docs/control-activity-allowlist.json, or a stale entry.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { readMigrations, liveFunctions } from "./lib/sql-refusals.mjs";
const require = createRequire(import.meta.url);
const ts = require("typescript");

const T0 = Date.now();
const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const ALLOW_FILE = path.join(ROOT, "docs", "control-activity-allowlist.json");
const VERBOSE = process.argv.includes("--all");

// hooks that wrap a server action: `const [state, onSubmit, pending] = useWriteForm(action, …)`
const FORM_HOOKS = /^(useActionState|useWriteForm|useKeptForm|usePrepared)$/;
const rank = (l) => (l === "read" ? 1 : 2);
const sat = (g, d) => g.act === d.act && rank(g.level) >= rank(d.level);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");
const strLit = (n) => (n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null);
const uniq = (a) => [...new Map(a.map((x) => [x.act + ":" + x.level, x])).values()];
const show = (a) => [...new Set(a.map((x) => `${x.act}:${x.level}`))].join(", ");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.|\.d\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}
const sfs = new Map();
for (const f of walk(SRC)) {
  const text = fs.readFileSync(f, "utf8");
  sfs.set(f, ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS));
}
const isUseServer = (sf) => sf.statements.some((s) => ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression) && s.expression.text === "use server");

// ---- imports ---------------------------------------------------------------------------------
const aliasResolve = (from, spec) => {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base + ".tsx", base + ".ts", path.join(base, "index.tsx"), path.join(base, "index.ts"), base]) if (sfs.has(c)) return c;
  return null;
};
const importMap = new Map(); // file -> Map(local -> {file, name})
const importers = new Map();
for (const [f, sf] of sfs) {
  const m = new Map();
  for (const st of sf.statements) {
    if ((ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      const t = aliasResolve(f, st.moduleSpecifier.text);
      if (!t) continue;
      (importers.get(t) || importers.set(t, new Set()).get(t)).add(f);
      const c = ts.isImportDeclaration(st) ? st.importClause : null;
      if (c?.name) m.set(c.name.text, { file: t, name: "default" });
      if (c?.namedBindings && ts.isNamedImports(c.namedBindings)) for (const el of c.namedBindings.elements) m.set(el.name.text, { file: t, name: (el.propertyName ?? el.name).text });
    }
  }
  importMap.set(f, m);
}

// ---- page guards (as the first resolver) -----------------------------------------------------
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
  return found;
}
const pages = new Map(); // abs -> {file, opens}
for (const [f, sf] of sfs) if (path.basename(f) === "page.tsx") pages.set(f, { file: rel(f), segs: rel(path.dirname(f)).replace(/^src\/app\/?/, "").split("/").filter((s) => s && !/^\(.*\)$/.test(s) && !s.startsWith("@")), opens: guardsIn(sf) });
const routesTs = fs.readFileSync(path.join(SRC, "lib/permissions/routes.ts"), "utf8");
for (const m of routesTs.matchAll(/path:\s*"([^"]+)",\s*activity:\s*"([^"]+)"(?:,\s*alsoActivity:\s*"([^"]+)")?(?:,\s*level:\s*"(read|edit)")?/g)) {
  const segs = m[1].split("/").filter(Boolean).join("/");
  for (const p of pages.values()) if (p.segs.join("/") === segs && p.opens.length === 0) p.opens = [[{ act: m[2], level: m[4] || "edit" }, ...(m[3] ? [{ act: m[3], level: "edit" }] : [])]];
}
const hostCache = new Map();
function hostPages(file) {
  if (hostCache.has(file)) return hostCache.get(file);
  const seen = new Set([file]), q = [file], hosts = new Set();
  while (q.length) {
    const cur = q.pop();
    if (pages.has(cur)) hosts.add(cur);
    for (const i of importers.get(cur) || []) if (!seen.has(i)) { seen.add(i); q.push(i); }
  }
  hostCache.set(file, hosts);
  return hosts;
}

// ---- conditions (as the first resolver) --------------------------------------------------------
const propActs = new Map();
const propSrcs = new Map(); // calleeFile::canX -> [{expr, file}] every expression passed for a gate prop
const cbSources = new Map(); // calleeFile::onX -> [{expr, file}] every place a callback prop is passed
const localDefs = new Map(); // file -> Map(name -> initializer)
function directActs(expr) {
  const out = [], idents = [];
  (function v(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "can" && n.arguments.length >= 2) {
      const a = strLit(n.arguments[1]);
      if (a) out.push({ act: a, level: strLit(n.arguments[2]) || "edit" });
    } else if (ts.isIdentifier(n) && !(n.parent && ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) idents.push(n.text);
    ts.forEachChild(n, v);
  })(expr);
  return { out, idents };
}
for (const [f, sf] of sfs) {
  const defs = new Map();
  (function v(n) {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) defs.set(n.name.text, n.initializer);
    if (ts.isJsxAttribute(n) && n.initializer && ts.isJsxExpression(n.initializer) && n.initializer.expression) {
      const name = n.name.getText();
      const { out } = directActs(n.initializer.expression);
      const tag = n.parent?.parent && (ts.isJsxOpeningElement(n.parent.parent) || ts.isJsxSelfClosingElement(n.parent.parent)) ? n.parent.parent.tagName.getText() : null;
      const target = tag ? importMap.get(f)?.get(tag.split(".")[0])?.file : null;
      if (target && /^(can|show|allow|has|may)/.test(name)) { const k2 = target + "::" + name; (propSrcs.get(k2) || propSrcs.set(k2, []).get(k2)).push({ expr: n.initializer.expression, file: f }); }
      if (out.length && target && /^(can|show|allow|has|may)/.test(name)) {
        const k = target + "::" + name;
        propActs.set(k, [...(propActs.get(k) || []), ...out]);
      }
    }
    if (ts.isJsxAttribute(n) && n.initializer && ts.isJsxExpression(n.initializer) && n.initializer.expression && /^on[A-Z]/.test(n.name.getText())) {
      const tag = n.parent?.parent && (ts.isJsxOpeningElement(n.parent.parent) || ts.isJsxSelfClosingElement(n.parent.parent)) ? n.parent.parent.tagName.getText() : null;
      const target = tag ? importMap.get(f)?.get(tag.split(".")[0])?.file : null;
      if (target) { const k = target + "::" + n.name.getText(); const elx = n.parent.parent; (cbSources.get(k) || cbSources.set(k, []).get(k)).push({ expr: n.initializer.expression, file: f, node: ts.isJsxOpeningElement(elx) ? elx.parent : elx }); }
    }
    ts.forEachChild(n, v);
  })(sf);
  localDefs.set(f, defs);
}
function resolveCondition(expr, file, pd = 0) {
  const acts = [], unresolved = [], seen = new Set();
  (function go(e, depth) {
    const { out, idents } = directActs(e);
    acts.push(...out);
    for (const id of idents) {
      if (seen.has(id) || depth > 3) continue;
      seen.add(id);
      const local = localDefs.get(file)?.get(id);
      if (local) { go(local, depth + 1); continue; }
      if (propSrcs.has(file + "::" + id)) { for (const sc of propSrcs.get(file + "::" + id)) { const r = depth < 3 ? resolveCondition(sc.expr, sc.file, depth + 1) : { acts: [], unresolved: [] }; acts.push(...r.acts); } }
      else if (propActs.has(file + "::" + id)) acts.push(...propActs.get(file + "::" + id));
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
      for (const st of p.statements) {
        if (st.pos >= cur.pos) break;
        if (ts.isIfStatement(st) && /\breturn\b|\bredirect\b|\bnotFound\b/.test(st.thenStatement.getText())) {
          const e = st.expression;
          const neg = ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.ExclamationToken ? e.operand : null;
          if (neg) conds.push(neg);
          else if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.BarBarToken)
            for (const side of [e.left, e.right]) if (ts.isPrefixUnaryExpression(side) && side.operator === ts.SyntaxKind.ExclamationToken) conds.push(side.operand);
        }
      }
    }
    if (ts.isFunctionLike(p) && !ts.isArrowFunction(p) && !ts.isFunctionExpression(p)) break;
  }
  const acts = [], unresolved = [];
  for (const c of conds) { const r = resolveCondition(c, file); acts.push(...r.acts); unresolved.push(...r.unresolved); }
  return { acts, unresolved };
}

// ---- where a component is rendered: is every render site gated (or on a page whose guard implies the action)? ----
const usageSites = new Map(); // file -> [{file, node}] JSX elements rendering a component imported from it
for (const [f, sf] of sfs) {
  (function v(n) {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const imp = importMap.get(f)?.get(n.tagName.getText().split(".")[0]);
      if (imp) (usageSites.get(imp.file) || usageSites.set(imp.file, []).get(imp.file)).push({ file: f, node: ts.isJsxOpeningElement(n) ? n.parent : n });
    }
    ts.forEachChild(n, v);
  })(sf);
}
const opensAllNeed = (sets, need) => sets.every((alts) => alts.every((p) => need.some((d) => sat(p, d))));
/** true only if the component(s) in `file` are rendered somewhere and EVERY render site is gated on, or sits on a page that guards, an activity implying one of `need`. */
function usageOk(file, need, depth = 3, seen = new Set()) {
  if (seen.has(file) || depth < 0) return false;
  seen.add(file);
  const sites = usageSites.get(file) || [];
  const pg = pages.get(file);
  if (pg) return pg.opens.length > 0 && opensAllNeed(pg.opens, need);
  if (!sites.length) return false;
  return sites.every((u) => {
    if (gatesFor(u.node, u.file).acts.some((g) => need.some((d) => sat(g, d)))) return true;
    return usageOk(u.file, need, depth - 1, seen);
  });
}

/** The control sits inside a component of this file; is every <Component/> in this file gated on `need`, or itself inside such a component (recursively), ending at the file-level check? */
function enclosingComponent(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.name && /^[A-Z]/.test(p.name.text)) return p.name.text;
    if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && p.parent && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name) && /^[A-Z]/.test(p.parent.name.text)) return p.parent.name.text;
  }
  return null;
}
function sameFileOk(node, f, need, depth = 4) {
  const comp = enclosingComponent(node);
  if (!comp || depth < 0) return usageOk(f, need);
  const sites = [];
  (function v(n) {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText() === comp) sites.push(ts.isJsxOpeningElement(n) ? n.parent : n);
    ts.forEachChild(n, v);
  })(sfs.get(f));
  if (!sites.length) return usageOk(f, need);
  return sites.every((u) => gatesFor(u, f).acts.some((g) => need.some((d) => sat(g, d))) || sameFileOk(u, f, need, depth - 1));
}

// ---- SQL: the live definition of an rpc ------------------------------------------------------
const { live } = liveFunctions(readMigrations(path.join(ROOT, "supabase", "migrations")));
const liveByName = new Map();
for (const f of live) (liveByName.get(f.name) || liveByName.set(f.name, []).get(f.name)).push(f);
/** Activities a live SQL function asks, following calls to other live functions to `depth` (a definer helper may hold the check). */
function rpcActs(name, depth = 2, seen = new Set()) {
  const fns = liveByName.get(name);
  if (!fns) return { acts: [], notes: [`no live SQL function "${name}"`] };
  const acts = [], notes = [];
  seen.add(name);
  for (const fn of fns) {
    for (const m of fn.body.matchAll(/has_permission\(\s*'([a-z_.]+)'(?:\s*,\s*'(read|edit)')?\s*\)/gi)) acts.push({ act: m[1], level: m[2] || "edit" });
    if (/has_permission\(\s*[^'\s)]/i.test(fn.body)) notes.push(`live SQL function "${name}" asks has_permission with a non-literal`);
    if (/\bexecute\b/i.test(fn.body)) notes.push(`live SQL function "${name}" builds SQL dynamically`);
    if (depth > 0) for (const m of fn.body.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/gi)) {
      const callee = m[1].toLowerCase();
      if (seen.has(callee) || !liveByName.has(callee) || callee === "has_permission") continue;
      const sub = rpcActs(callee, depth - 1, seen);
      acts.push(...sub.acts); notes.push(...sub.notes);
    }
  }
  return { acts, notes: acts.length ? [] : notes };
}

// ---- action -> activity ------------------------------------------------------------------------
// findFn: the declaration (function / const arrow) named `name` in `file`
function findFn(file, name) {
  const sf = sfs.get(file);
  let hit = null;
  (function v(n) {
    if (hit) return;
    if (ts.isFunctionDeclaration(n) && n.name?.text === name && n.body) hit = n;
    else if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) hit = n.initializer;
    else ts.forEachChild(n, v);
  })(sf);
  return hit;
}
/**
 * PATTERN (i), an optional can(). `const canPublish = can(perms, "x")` whose name is only ever used to SHAPE what the action writes
 * (the condition of a ternary, the left side of `&&`, never refusing) does not make x a requirement of the control: the action runs
 * for a login without it, it just writes less. Anything else is a requirement, conservatively: any use in an `if`, a `||`/`??`,
 * passed to a call, returned, or a ternary arm that refuses. Counted in OPTIONAL_CAN so the report says how many were skipped.
 */
const OPTIONAL_CAN = [];
const REFUSES = /\brefuse\b|\bthrow\b|\bnotFound\b|\bredirect\b|ok:\s*false/;
function isOptionalCan(call) {
  const decl = call.parent;
  if (!decl || !ts.isVariableDeclaration(decl) || decl.initializer !== call || !ts.isIdentifier(decl.name)) return false;
  let fn = decl;
  while (fn && !ts.isFunctionLike(fn)) fn = fn.parent;
  if (!fn) return false;
  let optional = true;
  (function v(n) {
    if (!optional) return;
    if (ts.isIdentifier(n) && n.text === decl.name.text && n !== decl.name && !(n.parent && ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) {
      let use = n;
      while (use.parent && (ts.isParenthesizedExpression(use.parent) || (ts.isPrefixUnaryExpression(use.parent) && use.parent.operator === ts.SyntaxKind.ExclamationToken))) use = use.parent;
      const p = use.parent;
      const shapes =
        (p && ts.isConditionalExpression(p) && p.condition === use && !REFUSES.test(p.whenTrue.getText() + p.whenFalse.getText())) ||
        (p && ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && p.left === use && !REFUSES.test(p.right.getText()));
      if (!shapes) optional = false;
    }
    ts.forEachChild(n, v);
  })(fn.body ?? fn);
  return optional;
}
const actCache = new Map();
/** Activities asked inside function `name` of `file`, following calls to helpers (same file, then imports) to `depth`. */
function actionActs(file, name, depth = 2, seen = new Set()) {
  const key = `${file}::${name}`;
  if (seen.has(key)) return { acts: [], rpcNotes: [] };
  seen.add(key);
  if (depth === 2 && actCache.has(key)) return actCache.get(key);
  const fn = findFn(file, name);
  const res = { acts: [], rpcNotes: [] };
  if (!fn) { return res; }
  (function v(n) {
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      if (ts.isIdentifier(callee)) {
        const nm = callee.text;
        if (nm === "can" && n.arguments.length >= 2 && strLit(n.arguments[1]) && isOptionalCan(n)) OPTIONAL_CAN.push(`${rel(file)} ${strLit(n.arguments[1])}`);
        else if (nm === "can" && n.arguments.length >= 2 && strLit(n.arguments[1])) res.acts.push({ act: strLit(n.arguments[1]), level: strLit(n.arguments[2]) || "edit" });
        else if (nm === "requirePermission" && strLit(n.arguments[0])) res.acts.push({ act: strLit(n.arguments[0]), level: strLit(n.arguments[1]) || "edit" });
        else if (depth > 0) {
          const imp = importMap.get(file)?.get(nm);
          const sub = imp ? actionActs(imp.file, imp.name, depth - 1, seen) : actionActs(file, nm, depth - 1, seen);
          res.acts.push(...sub.acts); res.rpcNotes.push(...sub.rpcNotes);
        }
      } else if (ts.isPropertyAccessExpression(callee) && callee.name.text === "rpc" && strLit(n.arguments[0])) {
        const r = rpcActs(strLit(n.arguments[0]));
        res.acts.push(...r.acts);
        res.rpcNotes.push(...r.notes);
        res.hasRpc = true;
      }
    }
    ts.forEachChild(n, v);
  })(fn.body ?? fn);
  if (depth === 2) actCache.set(key, res);
  return res;
}

// ---- control -> action -------------------------------------------------------------------------
/** Follow an expression to the server actions / rpcs it can reach. */
function reach(expr, file, depth = 3, seen = new Set()) {
  const out = { actions: [], rpcs: [], callbacks: [], callers: [] }; // actions: {file,name}; rpcs: names; callers: {file,node,sub} one per caller of a callback prop
  const addAll = (r) => { out.actions.push(...r.actions); out.rpcs.push(...r.rpcs); out.callbacks.push(...r.callbacks); out.callers.push(...r.callers); };
  (function v(n) {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === "rpc" && strLit(n.arguments[0])) out.rpcs.push(strLit(n.arguments[0]));
    if (ts.isIdentifier(n) && !(n.parent && ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) && !(n.parent && ts.isPropertyAssignment(n.parent) && n.parent.name === n)) {
      const nm = n.text, k = file + "::" + nm;
      const imp = importMap.get(file)?.get(nm);
      if (imp && isUseServer(sfs.get(imp.file)) && findFn(imp.file, imp.name)) { out.actions.push({ ...imp, via: nm }); return; }
      if (seen.has(k) || depth <= 0) return;
      seen.add(k);
      const fn = findFn(file, nm);
      if (fn) { addAll(reach(fn.body ?? fn, file, depth - 1, seen)); return; }
      const init = localDefs.get(file)?.get(nm);
      if (init && !ts.isArrowFunction(init)) { // e.g. const [s, formAction] = useActionState(saveX, …) -> follow the first argument
        if (ts.isCallExpression(init) && ts.isIdentifier(init.expression) && FORM_HOOKS.test(init.expression.text) && init.arguments[0]) addAll(reach(init.arguments[0], file, depth - 1, seen));
      } else if (init) addAll(reach(init.body ?? init, file, depth - 1, seen));
      else {
        // destructured `const [state, formAction] = useActionState(...)`
        let decl = null;
        (function f(x) { if (decl) return; if (ts.isVariableDeclaration(x) && ts.isArrayBindingPattern(x.name) && x.name.elements.some((e) => ts.isBindingElement(e) && e.name.getText() === nm) && x.initializer) decl = x; else ts.forEachChild(x, f); })(sfs.get(file));
        if (decl && ts.isCallExpression(decl.initializer) && ts.isIdentifier(decl.initializer.expression) && FORM_HOOKS.test(decl.initializer.expression.text) && decl.initializer.arguments[0]) addAll(reach(decl.initializer.arguments[0], file, depth - 1, seen));
        else if (/^on[A-Z]/.test(nm)) {
          const srcs = cbSources.get(file + "::" + nm);
          if (srcs?.length && depth > 1) {
            // PATTERN (iii): a callback prop is judged PER CALLER, never as the union of every caller's action. A shared component's
            // onPick is whatever the caller passed; the caller's own gate and the pages that render the CALLER are what guard it.
            for (const sc of srcs) {
              const sub = reach(sc.expr, sc.file, depth - 1, seen);
              out.callbacks.push(...sub.callbacks); out.callers.push(...sub.callers);
              if (sub.actions.length || sub.rpcs.length) out.callers.push({ file: sc.file, node: sc.node, sub: { actions: sub.actions, rpcs: sub.rpcs } });
            }
          }
          else out.callbacks.push(nm);
        }
      }
    }
    ts.forEachChild(n, v);
  })(expr);
  return out;
}

// ---- walk every control ------------------------------------------------------------------------
const CONTROL_ATTRS = new Set(["onClick", "onSubmit", "action", "formAction"]);
const R = { controls: 0, withAction: 0, ok: 0, noActivity: 0, none: 0, findings: [], unresolved: [] };
const okHow = { gate: 0, host: 0 };
const opensAll = (sets, need) => sets.every((alts) => alts.every((p) => need.some((d) => sat(p, d))));

for (const [f, sf] of sfs) {
  (function v(n) {
    if (ts.isJsxAttribute(n) && CONTROL_ATTRS.has(n.name.getText()) && n.initializer && ts.isJsxExpression(n.initializer) && n.initializer.expression) {
      R.controls++;
      const el = n.parent.parent;
      const tag = el.tagName.getText();
      const where = `${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
      const r = reach(n.initializer.expression, f);
      const names = [...new Set([...r.actions.map((a) => a.name), ...r.rpcs.map((x) => `rpc:${x}`)])];
      const label = `<${tag} ${n.name.getText()}> ${names.join(" + ")}`;
      const el2 = el.parent && ts.isJsxElement(el.parent) ? el.parent : el;
      const units = [];
      if (r.actions.length || r.rpcs.length) units.push({ actions: r.actions, rpcs: r.rpcs, caller: null });
      for (const c of r.callers) units.push({ actions: c.sub.actions, rpcs: c.sub.rpcs, caller: c });
      if (!units.length) {
        if (r.callbacks.length) R.unresolved.push({ where, label: `<${tag} ${n.name.getText()}> ${[...new Set(r.callbacks)].join(", ")}`, why: `calls a callback prop (${[...new Set(r.callbacks)].join(", ")}); the action it runs is defined by the caller and not followed` });
        else R.none++;
      } else {
        R.withAction++;
        const outcomes = [];
        for (const u of units) {
          const unames = [...new Set([...u.actions.map((a) => a.name), ...u.rpcs.map((x) => `rpc:${x}`)])];
          const ulabel = `<${tag} ${n.name.getText()}> ${unames.join(" + ")}`;
          const via = u.caller ? ` (passed by ${rel(u.caller.file)})` : "";
          const need = [], notes = [];
          for (const a of u.actions) { const x = actionActs(a.file, a.name); need.push(...x.acts); notes.push(...x.rpcNotes); }
          for (const rp of u.rpcs) { const x = rpcActs(rp); need.push(...x.acts); notes.push(...x.notes); }
          const needU = uniq(need);
          if (!needU.length) {
            if (notes.length) { R.unresolved.push({ where, label: ulabel, why: [...new Set(notes)].join("; ") + via }); outcomes.push("bad"); }
            else outcomes.push("noact");
            continue;
          }
          const gates = gatesFor(el2, f);
          const callerGates = u.caller ? gatesFor(u.caller.node, u.caller.file) : { acts: [] };
          const allGate = [...gates.acts, ...callerGates.acts];
          if (allGate.some((g) => needU.some((d) => sat(g, d)))) { outcomes.push("gate"); continue; }
          const hosts = [...hostPages(u.caller ? u.caller.file : f)].map((h) => pages.get(h));
          const hostOk = (hosts.length > 0 && hosts.every((hp) => hp.opens.length && opensAll(hp.opens, needU))) || (u.caller ? sameFileOk(u.caller.node, u.caller.file, needU) : sameFileOk(el, f, needU));
          if (hostOk) { outcomes.push("host"); continue; }
          outcomes.push("bad");
          if (allGate.length) R.findings.push({ where, label: ulabel, why: `gated on ${show(allGate)}; its action asks ${show(needU)}${via}` });
          else if (gates.unresolved.length) R.unresolved.push({ where, label: ulabel, why: `gate ${[...new Set(gates.unresolved)].join(", ")} not traced to an activity; action asks ${show(needU)}${via}` });
          else if (!hosts.length) R.unresolved.push({ where, label: ulabel, why: `no gate and no page renders this file; action asks ${show(needU)}${via}` });
          else if (hosts.some((hp) => !hp.opens.length)) R.unresolved.push({ where, label: ulabel, why: `no gate; a host page has no static guard; action asks ${show(needU)}${via}` });
          else R.findings.push({ where, label: ulabel, why: `no gate; host page(s) ${hosts.filter((hp) => !opensAll(hp.opens, needU)).slice(0, 3).map((h) => h.file.replace(/^src\/app\//, "").replace(/\/page\.tsx$/, "") || "/").join(", ")} do not imply ${show(needU)}${via}` });
        }
        if (!outcomes.includes("bad")) {
          if (outcomes.every((o) => o === "noact")) R.noActivity++;
          else { R.ok++; okHow[outcomes.includes("host") ? "host" : "gate"]++; }
        }
      }
    }
    ts.forEachChild(n, v);
  })(sf);
}

// ---- report ------------------------------------------------------------------------------------
let allow = { entries: [] };
try { allow = JSON.parse(fs.readFileSync(ALLOW_FILE, "utf8")); } catch {}
const key = (x) => `${x.where.replace(/:\d+$/, "")} -> ${x.label}`;
const allowed = new Set(allow.entries.map((e) => `${e.file} -> ${e.control}`));
const fresh = R.findings.filter((x) => !allowed.has(key(x)));
const known = R.findings.filter((x) => allowed.has(key(x)));
const stale = [...allowed].filter((k) => !R.findings.some((x) => key(x) === k));

console.log("check-control-activity: does each control ask the activity its own action asks?");
console.log(`  controls read (onClick/onSubmit/action/formAction): ${R.controls}`);
console.log(`  reach no server action or rpc (state toggles, links, etc.; not judged): ${R.none}`);
console.log(`  reach an action: ${R.withAction}`);
console.log(`    action asks no static activity (self-service or public; counted, not judged): ${R.noActivity}`);
console.log(`    resolved OK: ${R.ok} (by its own gate ${okHow.gate}, by the host page's guard ${okHow.host})`);
console.log(`    optional can() calls in action bodies, not counted as requirements (pattern i): ${[...new Set(OPTIONAL_CAN)].join("; ") || "none"}`);
console.log(`  UNRESOLVED (could not decide): ${R.unresolved.length}`);
for (const u of R.unresolved) console.log(`    ? ${u.where} ${u.label}: ${u.why}`);
console.log(`  FINDINGS: ${R.findings.length} (${known.length} on the allow-list, ${fresh.length} new)`);
for (const x of R.findings) console.log(`    ${allowed.has(key(x)) ? "(known)" : "NEW"} ${x.where} ${x.label}: ${x.why}`);
for (const s of stale) console.log(`  STALE allow-list entry (no longer found, delete it): ${s}`);
console.log(`  ran in ${((Date.now() - T0) / 1000).toFixed(1)} s`);
if (fresh.length || stale.length) {
  console.log(fresh.length ? "NOT CLEAN: a control is offered to a login whose cards its action refuses." : "NOT CLEAN: the allow-list names a control that is no longer a finding.");
  process.exit(1);
}
console.log(R.unresolved.length ? "no new findings (unresolved controls are listed above, not passed silently)" : "clean");
