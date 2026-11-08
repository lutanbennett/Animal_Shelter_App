// Shared by the Drive-copy follow-up scripts (#rqv5c). Pure functions only, so they can be tested.

const ID = /^[A-Za-z0-9_-]{10,}$/;

/** The id pairs drive-copy-tree.mjs wrote, one JSON object per line. Malformed ids are dropped. */
export function parseMap(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((m) => ID.test(m.from ?? "") && ID.test(m.to ?? ""));
}

/** The copy's root folder id, from the map's "root" line, or null. */
export function rootOf(pairs) {
  return pairs.find((p) => p.kind === "root")?.to ?? null;
}

/**
 * SQL counting, in one column, the Drive ids that are NOT one of the copies (`outside`), and of those,
 * how many are still an original id (`original`). Ids come from parseMap, so they match ID and are
 * safe to inline. Table and column come from information_schema.
 */
export function leftoverSql(table, column, pairs) {
  if (!/^[a-z_][a-z0-9_]*$/.test(table) || !/^[a-z_][a-z0-9_]*$/.test(column)) {
    throw new Error(`unexpected name ${table}.${column}`);
  }
  const copies = pairs.map((p) => `('${p.to}')`).join(",");
  const originals = pairs.map((p) => `('${p.from}')`).join(",");
  return `select count(*) filter (where x."${column}" not in (select t from (values ${copies}) as m(t)))::int outside,
          count(*) filter (where x."${column}" in (select f from (values ${originals}) as o(f)))::int original
     from public."${table}" x where coalesce(x."${column}", '') <> ''`;
}

/** The environments these scripts may touch, decided by the Supabase project (src/lib/app-env.ts). */
export const WRITABLE_APP_ENVS = new Set(["dev", "uat"]);
