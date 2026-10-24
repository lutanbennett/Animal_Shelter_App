// The allow-list for scripts/check-production.mjs: named questions about the live database, and the one function
// that can ask them. Read-only is structural, in three layers a reader can verify in under a minute:
//
//   1. There is NO path from argv to SQL. A caller names a check; the SQL below is the only SQL that can run.
//   2. runCheck() is the only code that sends a query, and it wraps every check in `begin read only; ... rollback;`.
//      Postgres itself then refuses any INSERT/UPDATE/DELETE/DDL in that transaction, even one made by a function.
//   3. assertSelectOnly() rejects any check whose SQL is not one SELECT (no `;`, no write keyword), and
//      scripts/check-production.test.mjs runs it over every entry, so a bad check fails `npm test`.
//
// Adding a check = adding an entry here. Results are counts, keys and names of settings, never residents or people.

import { expectedGrantsSql } from "./card-bundles.mjs";

const FORBIDDEN = /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|copy|call|do|vacuum|reindex|set|nextval|setval|pg_terminate_backend|pg_cancel_backend)\b/i;

/** Throws unless `sql` is one SELECT/WITH statement with no write keyword. Quoted strings are ignored. */
export function assertSelectOnly(name, sql) {
  const bare = sql
    .replace(/--.*$/gm, "")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"[^"]*"/g, '""');
  if (/;/.test(bare)) throw new Error(`check "${name}": more than one statement`);
  if (!/^\s*(select|with)\b/i.test(bare)) throw new Error(`check "${name}": must start with select or with`);
  const hit = FORBIDDEN.exec(bare);
  if (hit) throw new Error(`check "${name}": contains "${hit[0]}"`);
}

export const CHECKS = {
  "schema-version": {
    asks: "Which migration was applied last, and how many are applied?",
    sql: `select json_build_object('applied', count(*), 'latest', max(filename)) from schema_migrations`,
    render: (r) => [`${r.applied} migrations applied; the latest is ${r.latest}.`],
  },
  "role-cells": {
    asks: "For each role: how many permission cells, cards and extras does it hold? (Cells with no card or extra behind them are stripped the next time that role's cards are saved.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'cells', (select count(*) from role_permissions p where p.role_id = r.id),
        'cards', (select count(*) from role_cards c where c.role_id = r.id),
        'extras', (select count(*) from role_extras e where e.role_id = r.id)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'`,
    render: (rows) => rows.map((x) => `${x.role}: ${x.cells} cells, ${x.cards} cards, ${x.extras} extras`),
  },
  "role-cards": {
    asks: "Which cards does each role hold? (Answers 'does any role hold the Operations or Management card?'.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'cards', coalesce((select json_agg(c.card order by c.position) from role_cards c where c.role_id = r.id), '[]'::json)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'`,
    render: (rows) => rows.map((x) => `${x.role}: ${x.cards.length ? x.cards.join(", ") : "(no cards)"}`),
  },
  "doctor-cells": {
    asks: "Does the doctor role hold the 13 cells migration 0230 gave it, at that level or higher?",
    sql: `select json_build_object('missing', coalesce((select json_agg(w.activity order by w.activity)
        from (values ('resident.record',1),('resident.adoption_news',1),('resident.microchip',2),('visit.book',2),
          ('medical.visits',2),('medical.procedures',2),('medical.blood_tests',2),('medical.prescriptions',2),
          ('medical.immunizations',2),('medical.weight',2),('medical.diet',2),
          ('photos.resident_add',2),('reference.add_while_recording',2)) as w(activity, level)
        where not exists (select 1 from role_permissions p join roles r on r.id = p.role_id
          where r.key = 'doctor' and p.activity = w.activity and p.level >= w.level)), '[]'::json),
      'role_exists', exists (select 1 from roles where key = 'doctor'))`,
    render: (r) => !r.role_exists ? ["There is no doctor role."]
      : r.missing.length ? [`MISSING ${r.missing.length} of 13: ${r.missing.join(", ")}`] : ["All 13 doctor cells are present."],
    failed: (r) => !r.role_exists || r.missing.length > 0,
  },
  "diets-proportion": {
    asks: "Which diet ingredient lines have Medium/Large amounts out of proportion to Small?",
    sql: `select coalesce(json_agg(json_build_object('diet', d.name, 'ingredient', dt.name,
        's', di.qty_small, 'm', di.qty_medium, 'l', di.qty_large,
        'want_m', round(d.servings_medium / d.servings_small * di.qty_small, 3),
        'want_l', round(d.servings_large / d.servings_small * di.qty_small, 3)) order by d.name, dt.name), '[]'::json)
      from diet_ingredients di join diets d on d.id = di.diet_id join diet_types dt on dt.id = di.diet_type_id
      where abs(di.qty_medium - d.servings_medium / d.servings_small * di.qty_small) > 0.005
         or abs(di.qty_large - d.servings_large / d.servings_small * di.qty_small) > 0.005`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.diet} / ${x.ingredient}: Small ${Number(x.s)}, Medium ${Number(x.m)} (would be ${Number(x.want_m)}), Large ${Number(x.l)} (would be ${Number(x.want_l)})`)
      : ["Every line is in proportion."],
    failed: (rows) => rows.length > 0,
  },
};

/** Wrap one check in a read-only transaction. The result rides out in an exception message, as the harnesses do. */
export function buildQuery(name) {
  const check = Object.hasOwn(CHECKS, name) ? CHECKS[name] : undefined;
  if (!check) throw new Error(`no such check: ${name}`);
  assertSelectOnly(name, check.sql);
  return `begin read only;\ndo $o$ begin raise exception 'CHECK-RESULT %', ((${check.sql})::jsonb); end $o$;\nrollback;`;
}

/** Run one named check; returns the parsed result. The only place a query leaves this machine. */
export async function runCheck(name, { ref, token }) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: buildQuery(name) }),
  });
  const text = await r.text();
  let msg = text;
  try { msg = JSON.parse(text).message ?? text; } catch {}
  const m = /CHECK-RESULT (.*)/.exec(msg);
  if (!m) throw new Error(`${name}: no result (HTTP ${r.status}): ${String(msg).slice(0, 300)}`);
  return JSON.parse(m[1]);
}
