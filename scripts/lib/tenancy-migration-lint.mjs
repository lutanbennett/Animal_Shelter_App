// The tenancy catalogue lint, read from a MIGRATION FILE instead of the database (#tnc41;
// docs/decisions/2026-11-26-tenancy-catalogue-gate.md).
//
// check-tenancy-catalogue.mjs reads pg_catalog, so it can only run where a Management API token is, and it only sees an object once the
// migration has been applied. That made it a count taken afterwards: the nightly went red on 2026-11-23 for objects 0436/0438 had put on
// dev days before. This reads the SQL text a branch adds, so it runs on every pull request with no token, and judges the three rules for
// every object the file CREATES that no earlier migration created:
//   rule 1  a view: security_invoker, or `alter view … owner to rls_definer` in the same file
//   rule 2  a security definer function the API can execute: `alter function … owner to rls_definer` in the same file
//   rule 3  a public table that has RLS enabled: `create policy definer_all on …` in the same file
// or an ALLOWED entry by name (the same map, scripts/lib/tenancy-catalogue.mjs), so the reason lives in one place.
//
// Pure functions: text in, findings out.
import { sqlCodeOnly } from "./sql-code-only.mjs";

const IDENT = String.raw`((?:"[^"]+"|[A-Za-z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_][\w$]*))?)`;

/** "Public"."X" / x / private.x -> { schema, name } in lower case; unqualified is public. */
export function qualify(raw) {
  const parts = raw.split(".").map((p) => p.trim().replace(/^"|"$/g, "").toLowerCase());
  return parts.length === 2 ? { schema: parts[0], name: parts[1] } : { schema: "public", name: parts[0] };
}
const keyOf = (kind, raw) => {
  const { schema, name } = qualify(raw);
  return `${kind}:${schema}.${name}`;
};

// Statements of the file with comments, string contents and function bodies blanked: what the file DECLARES.
function statements(sql) {
  return sqlCodeOnly(sql).split(";").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** Every view, function and RLS-enabled table this file creates: [{ kind, key, rule, invoker?, secdef? }]. */
export function createdObjects(sql) {
  const out = [];
  for (const s of statements(sql)) {
    let m;
    if ((m = s.match(new RegExp(String.raw`^create (?:or replace )?function ${IDENT}\s*\(`, "i"))))
      out.push({ kind: "function", key: keyOf("function", m[1]), rule: 2, secdef: /\bsecurity definer\b/i.test(s) });
    else if ((m = s.match(new RegExp(String.raw`^create (?:or replace )?(?:materialized )?view (?:if not exists )?${IDENT}`, "i"))))
      out.push({ kind: "view", key: keyOf("view", m[1]), rule: 1, invoker: /security_invoker\s*=\s*(true|on)/i.test(s) });
    else if ((m = s.match(new RegExp(String.raw`^create table (?:if not exists )?${IDENT}`, "i"))))
      out.push({ kind: "table", key: keyOf("table", m[1]), rule: 3 });
  }
  return out;
}

/** Names this file defines, for the "created by an earlier migration" set. */
export const definedKeys = (sql) => createdObjects(sql).map((o) => o.key);

// What the file says about ownership, grants and policies. Function bodies are KEPT here, so `alter … owner` inside a `do $$` block
// (0440's shape, which guards on rls_definer existing) still counts.
function facts(sql) {
  const code = sqlCodeOnly(sql, { dollarBodies: "keep" }).replace(/\s+/g, " ");
  const owned = new Set();
  for (const m of code.matchAll(new RegExp(String.raw`alter (function|materialized view|view) (?:if exists )?${IDENT}[^;]*? owner to "?rls_definer"?`, "gi")))
    owned.add(keyOf(/function/i.test(m[1]) ? "function" : "view", m[2]));
  const rls = new Set();
  for (const m of code.matchAll(new RegExp(String.raw`alter table (?:if exists )?(?:only )?${IDENT} enable row level security`, "gi")))
    rls.add(keyOf("table", m[1]));
  const definerAll = new Set();
  for (const m of code.matchAll(new RegExp(String.raw`create policy "?definer_all"? on ${IDENT}`, "gi")))
    definerAll.add(keyOf("table", m[1]));
  // Execute grants and revokes per function: Supabase grants anon and authenticated execute on every new public function, so a
  // definer function is out of the API's reach only when the file revokes it from all three and grants it back to none.
  const revoked = new Map();
  const granted = new Map();
  const API = ["public", "anon", "authenticated"];
  for (const m of code.matchAll(new RegExp(String.raw`(revoke|grant) (?:all|execute)(?: privileges)? on function ${IDENT}\s*(?:\([^)]*\))? (?:from|to) ([^;]+?)(?= cascade|;|$| revoke | grant )`, "gi"))) {
    const k = keyOf("function", m[2]);
    const who = m[3].toLowerCase().split(",").map((w) => w.trim());
    const map = m[1].toLowerCase() === "revoke" ? revoked : granted;
    map.set(k, new Set([...(map.get(k) ?? []), ...who.filter((w) => API.includes(w))]));
  }
  const apiReachable = (k) => {
    const r = revoked.get(k) ?? new Set();
    const g = granted.get(k) ?? new Set();
    return !API.every((w) => r.has(w)) || g.size > 0;
  };
  return { owned, rls, definerAll, apiReachable };
}

/**
 * Findings for one migration file.
 *   existing: Set of keys an earlier migration already created. A `create or replace` of one of those keeps its owner, which this file
 *             cannot see (0375 re-owned in a loop), so it is left to the nightly.
 *   allowed:  the ALLOWED map from tenancy-catalogue.mjs.
 */
export function lintMigration(sql, { existing = new Set(), allowed = {} } = {}) {
  const f = facts(sql);
  const findings = [];
  const allowedHit = [];
  for (const o of createdObjects(sql)) {
    if (existing.has(o.key)) continue;
    let ok;
    if (o.kind === "view") ok = o.invoker || f.owned.has(o.key);
    else if (o.kind === "function") ok = !o.secdef || !f.apiReachable(o.key) || f.owned.has(o.key);
    else ok = !f.rls.has(o.key) || f.definerAll.has(o.key) || !o.key.startsWith("table:public.");
    if (ok) continue;
    (allowed[o.key] ? allowedHit : findings).push({ rule: o.rule, object: o.key });
  }
  return { findings, allowedHit };
}
