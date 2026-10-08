// Scope functions must sit beside a cell (backlog, found by perm-convert-settings 2026-10-06;
// decisions/2026-10-08-scope-functions-beside-a-cell.md).
//
// sees_all_residents(), sees_all_contacts(), sees_all_clinical() and has_shelter_floor() answer "how much of
// this may you see", not "may you see it at all", and each is TRUE for public_viewer (its role row is scope
// 'all'/'full'/'any' and its legacy_role is not 'volunteer'). A policy using one is safe only because
// has_permission() is ANDed beside it. 0150's first draft was not, and check-app-access-gate caught
// public_viewer reading 76 rows of translations. (sees_all_translations(), the fourth the item named, was
// dropped by 0154; the pattern covers every sees_all_* so the next one is in without an edit here.)
//
// The question asked of a policy's text: is every call of a scope function ANDed with a has_permission() call?
// "ANDed" is read structurally, not as "the text mentions has_permission somewhere": a policy written
//     has_permission('x') or sees_all_residents()
// mentions both and lets public_viewer in, and must fail. The walk: from the scope call, take the stretch of
// its own bracket level that holds it, bounded by OR, NOT, CASE, WHEN, THEN, ELSE, END. If that stretch holds
// something that implies a cell, it is guarded; otherwise step out one bracket and ask again. Out of brackets
// with none found: unguarded. "Implies a cell" is a has_permission() call, or a bracket in which every
// OR-branch implies one (so placement_history's `sees_all_residents() and ((a and has_permission('p')) or
// (b and has_permission('q')))` is guarded, as it is).
//
// It errs one way only. NOT, and a cell inside CASE, are never credited, so
// `sees_all_residents() and case when a then has_permission('x') else has_permission('y') end` is reported
// though it is safe. Write it with AND/OR, or mark it deliberate. Nothing unguarded is called guarded.

/** Scope functions: a regex source, so a future sees_all_<thing>() is covered with no edit. */
export const SCOPE_FN = /\b(sees_all_[a-z_]+|has_shelter_floor)\s*\(/gi;
const CELL = /\bhas_permission\s*\(/i;
// USING and CHECK too: in a whole `create policy` statement, a cell in USING does not guard a call in WITH CHECK.
const BOUNDARY = /^(or|not|case|when|then|else|end|using|check)$/i;

/** Literals, then the subselect wrapper Postgres deparses calls into, collapsed to one token each. */
function tokenize(text) {
  let s = text.replace(/'(?:[^']|'')*'/g, "''");
  // `( SELECT f(...) AS f)` -> `f(...)`: the wrapper is a bracket that holds no logic.
  s = s.replace(/\(\s*select\s+([a-z_]+\s*\([^()]*\))\s+as\s+[a-z_]+\s*\)/gi, "$1");
  // A call is one atom: name(args) -> CELL / SCOPE:name / FN. Args never hold the logic this walk follows.
  for (let prev = null; prev !== s; ) {
    prev = s;
    // A keyword before a bracket (`and (`, `in (`) is not a call.
    s = s.replace(/\b(?!(?:and|or|not|case|when|then|else|end|in)\b)([a-z_][a-z0-9_]*)\s*\(([^()]*)\)/gi, (_, name) =>
      /^has_permission$/i.test(name) ? " @CELL " : /^(sees_all_[a-z_]+|has_shelter_floor)$/i.test(name) ? ` @SCOPE:${name} ` : " @FN ",
    );
  }
  return s.match(/@SCOPE:[a-z_]+|@CELL|@FN|[()]|[a-z_][a-z0-9_]*|[^\s()a-z_]+/gi) ?? [];
}

/** tokens -> nested arrays, one per bracket. */
function tree(tokens) {
  const root = [];
  const stack = [root];
  for (const t of tokens) {
    if (t === "(") { const g = []; stack.at(-1).push(g); stack.push(g); }
    else if (t === ")") { if (stack.length > 1) stack.pop(); }
    else stack.at(-1).push(t);
  }
  return root;
}

const isBoundary = (x) => typeof x === "string" && BOUNDARY.test(x);
/** True only if this item being true means some has_permission() call was true. */
const impliesCell = (x) => x === "@CELL" || (Array.isArray(x) && bracketImpliesCell(x));
/** A bracket: no NOT/CASE at its level, and every OR-branch holds an item that implies a cell. */
function bracketImpliesCell(g) {
  if (g.some((x) => isBoundary(x) && !/^or$/i.test(x))) return false;
  const branches = [[]];
  for (const x of g) if (typeof x === "string" && /^or$/i.test(x)) branches.push([]); else branches.at(-1).push(x);
  return branches.every((b) => b.some(impliesCell));
}
/** The stretch of `g` holding index `i`, between boundary words. */
function stretch(g, i) {
  let a = i, b = i;
  while (a > 0 && !isBoundary(g[a - 1])) a--;
  while (b < g.length - 1 && !isBoundary(g[b + 1])) b++;
  return g.slice(a, b + 1);
}

/** Every scope-function call in `text` that no has_permission() is ANDed with: [name, ...] (empty = all guarded). */
export function unguardedScopeCalls(text) {
  const out = [];
  const visit = (g, path) => {
    g.forEach((x, i) => {
      if (Array.isArray(x)) return visit(x, [...path, [g, i]]);
      if (!x.startsWith("@SCOPE:")) return;
      const levels = [...path, [g, i]].reverse();
      const guarded = levels.some(([lg, li]) => stretch(lg, li).some(impliesCell));
      if (!guarded) out.push(x.slice("@SCOPE:".length));
    });
  };
  visit(tree(tokenize(text)), []);
  return out;
}
