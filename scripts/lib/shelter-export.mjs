// The pure half of the per-shelter export (#sxyw3): which rows of which tables belong to one shelter, in what
// order they load, and the SQL that reads and writes them. No network and no files, so
// scripts/check-shelter-export.mjs can assert it against a fixture. docs/decisions/2026-11-17-per-shelter-export.md.

const IDENT = /^[a-z_][a-z0-9_]*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const q = (name) => {
  if (!IDENT.test(name)) throw new Error(`unsafe identifier ${JSON.stringify(name)}`);
  return `public.${name}`;
};

/**
 * How a table WITHOUT shelter_id is exported. Every one must be named in the registry's `exportTreatment`:
 *   all      every row (a lookup list, the card catalogue, schema metadata: the installation's, identical for all)
 *   own-row  only the named shelter's row (`shelters`)
 *   none     left out (installation monitoring: nothing a shelter owns)
 */
export const TREATMENTS = ["all", "own-row", "none"];

/** @param catalog {tables:[{name, scoped, columns:[{name}]}], fks:[{child, parent}]}  @param registry the parsed registry */
export function planTables(catalog, registry) {
  const treat = registry.exportTreatment ?? {};
  const problems = [];
  const tables = [];
  for (const t of catalog.tables) {
    if (t.scoped) {
      tables.push({ name: t.name, kind: "scoped", columns: t.columns });
    } else {
      const how = treat[t.name];
      if (!TREATMENTS.includes(how)) {
        problems.push(`${t.name}: no shelter_id and no exportTreatment (all | own-row | none) in the registry`);
        continue;
      }
      if (how !== "none") tables.push({ name: t.name, kind: how, columns: t.columns });
    }
  }
  for (const name of Object.keys(treat)) {
    if (!catalog.tables.some((t) => t.name === name && !t.scoped)) problems.push(`${name}: exportTreatment names a table that is not an unscoped table`);
  }
  const { order, cyclic } = loadOrder(tables.map((t) => t.name), catalog.fks);
  const byName = new Map(tables.map((t) => [t.name, t]));
  return { tables: order.map((n) => byName.get(n)), cyclic, problems };
}

/** Parents before children; tables in or behind a cycle come back in `cyclic`, last, and load under replica role. */
export function loadOrder(names, fks) {
  const set = new Set(names);
  const parents = new Map(names.map((n) => [n, new Set()]));
  for (const { child, parent } of fks) {
    if (child !== parent && set.has(child) && set.has(parent)) parents.get(child).add(parent);
  }
  const done = new Set();
  const order = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const n of [...names].sort()) {
      if (done.has(n)) continue;
      if ([...parents.get(n)].every((p) => done.has(p))) { done.add(n); order.push(n); progressed = true; }
    }
  }
  const cyclic = names.filter((n) => !done.has(n)).sort();
  return { order: [...order, ...cyclic], cyclic };
}

/** The read for one table. The filter is built here and nowhere else: check-shelter-export.mjs holds it to that. */
export function selectSql(table, shelterId) {
  if (!UUID.test(shelterId)) throw new Error("shelter id is not a uuid");
  const cols = table.columns.map((c) => `"${c.name}"`).join(", ");
  const where = table.kind === "scoped" ? `shelter_id = '${shelterId}'`
    : table.kind === "own-row" ? `id = '${shelterId}'`
    : "true";
  return {
    where,
    count: `select count(*)::int as n from ${q(table.name)} where ${where}`,
    page: (offset, limit) =>
      `select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) as rows from (select ${cols} from ${q(table.name)} where ${where} order by ctid offset ${offset} limit ${limit}) r`,
  };
}

/** Rows that carry no shelter at all: refuse rather than drop (loses data) or include (leaks). */
export function nullRowsSql(tables) {
  return tables.filter((t) => t.kind === "scoped")
    .map((t) => `select '${t.name}' as t, count(*)::int as n from ${q(t.name)} where shelter_id is null`).join("\nunion all\n");
}

/** One insert per page of rows; jsonb_populate_recordset keeps every column's own type. */
export function insertSql(table, rows, tag) {
  if (!rows.length) return "";
  const json = JSON.stringify(rows);
  if (json.includes(`$${tag}$`)) throw new Error("dollar-quote tag collides with the data");
  const cols = table.columns.map((c) => `"${c.name}"`).join(", ");
  return `insert into ${q(table.name)} (${cols}) overriding system value select ${cols} from jsonb_populate_recordset(null::${q(table.name)}, $${tag}$${json}$${tag}$::jsonb);\n`;
}
