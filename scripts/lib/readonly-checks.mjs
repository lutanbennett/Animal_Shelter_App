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
    asks: "For each role: how many permission cells and cards does it hold? (Cells with no card behind them are stripped the next time that role's cards are saved.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'cells', (select count(*) from role_permissions p where p.role_id = r.id),
        'cards', (select count(*) from role_cards c where c.role_id = r.id)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'`,
    render: (rows) => rows.map((x) => `${x.role}: ${x.cells} cells, ${x.cards} cards`),
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
  "role-cards-coverage": {
    asks: "For each role: which held card needs access the role does not have, and which activity at which level is missing? (After the card-grants release this must print nothing.)",
    // Reads card_grants and card_includes (0257): each held card with everything it includes. Before 0257 is applied to a database
    // this reports a missing table, which is the same finding: that database has no copy of what a card requires.
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from role_cards) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity)
      select coalesce(json_agg(json_build_object('role', r.key, 'card', c.card, 'activity', g.activity,
          'need', g.level, 'have', coalesce(p.level, 0)) order by r.key, c.card, g.activity), '[]'::json)
      from roles r join role_cards c on c.role_id = r.id join g on g.card = c.card
        left join role_permissions p on p.role_id = r.id and p.activity = g.activity
      where r.kind <> 'fixed' and coalesce(p.level, 0) < g.level`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.role}: card ${x.card} needs ${x.activity} at ${x.need === 2 ? "edit/yes" : "read"}, role has ${["none", "read", "edit/yes"][x.have]}`)
      : ["Every held card is covered by its role's access."],
    failed: (rows) => rows.length > 0,
  },
  "cards-union": {
    asks: "For each role: are its permission cells exactly the union of its cards' grants? (Lists cells no card backs, and backed access the role lacks.)",
    // Reads card_grants and card_includes, like role-cards-coverage.
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from role_cards) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity),
      want as (select c.role_id, g.activity, max(g.level) as level
        from role_cards c join g on g.card = c.card group by c.role_id, g.activity)
      select coalesce(json_agg(json_build_object('role', r.key,
          'unbacked', coalesce((select json_agg(p.activity order by p.activity) from role_permissions p
            where p.role_id = r.id and not exists (select 1 from want w where w.role_id = r.id and w.activity = p.activity and w.level >= p.level)), '[]'::json),
          'unapplied', coalesce((select json_agg(w.activity order by w.activity) from want w
            where w.role_id = r.id and not exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = w.activity and p.level >= w.level)), '[]'::json))
        order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'`,
    render: (rows) => rows.map((x) => x.unbacked.length + x.unapplied.length === 0
      ? `${x.role}: exactly the union of its cards`
      : `${x.role}: ${x.unbacked.length} cells no card backs (${x.unbacked.join(", ") || "-"}); ${x.unapplied.length} backed but missing (${x.unapplied.join(", ") || "-"})`),
    failed: (rows) => rows.some((x) => x.unbacked.length + x.unapplied.length > 0),
  },
  "fault-residents-lifecycle": {
    asks: "Which roles hold the Residents card or a placement cell but not facility.enclosures at read? (They cannot move, hospitalise, foster/adopt or record a death: the enclosure lookup is refused.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'residents_card', exists (select 1 from role_cards c where c.role_id = r.id and c.card = 'residents'),
        'placement_cells', coalesce((select json_agg(p.activity order by p.activity) from role_permissions p where p.role_id = r.id and p.activity like 'placement.%'), '[]'::json),
        'enclosures_read', exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'facility.enclosures' and p.level >= 1)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'
        and (exists (select 1 from role_cards c where c.role_id = r.id and c.card = 'residents')
          or exists (select 1 from role_permissions p where p.role_id = r.id and p.activity like 'placement.%'))`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.role}: Residents card ${x.residents_card ? "held" : "not held"}, ${x.placement_cells.length} placement cells, enclosures read ${x.enclosures_read ? "yes" : "NO - BLOCKED"}`)
      : ["No role holds the Residents card or a placement cell."],
    failed: (rows) => rows.some((x) => !x.enclosures_read),
  },
  "fault-clinic-visit-save": {
    asks: "Which roles hold a card or cell that books or saves a clinic visit (Book clinic visits, Medical records, visit.book) but not clinics.list? (The clinic list is empty and the field is required.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'cards', coalesce((select json_agg(c.card order by c.card) from role_cards c where c.role_id = r.id and c.card in ('book_clinic_visits', 'medical_records')), '[]'::json),
        'visit_book', exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'visit.book'),
        'clinics_list', exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'clinics.list' and p.level >= 1)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'
        and (exists (select 1 from role_cards c where c.role_id = r.id and c.card in ('book_clinic_visits', 'medical_records'))
          or exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'visit.book'))`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.role}: cards ${x.cards.join(", ") || "(none)"}, visit.book ${x.visit_book ? "yes" : "no"}, clinics.list ${x.clinics_list ? "yes" : "NO - BLOCKED"}`)
      : ["No role holds a clinic-visit card or cell."],
    failed: (rows) => rows.some((x) => !x.clinics_list),
  },
  "fault-maintenance-delete": {
    asks: "Which roles hold the Do Maintenance card, whose maintenance jobs nobody can delete? (Every holder is affected: no delete control exists.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed' and exists (select 1 from role_cards c where c.role_id = r.id and c.card = 'do_maintenance')`,
    render: (rows) => rows.length ? rows.map((x) => `${x.role}: holds Do Maintenance`) : ["No role holds the Do Maintenance card."],
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
