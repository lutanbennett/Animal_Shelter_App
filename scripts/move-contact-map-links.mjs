// Move each contact's map link out of its address into map_url (0164).
//
//   node scripts/move-contact-map-links.mjs                            (dev — lists, changes nothing)
//   node scripts/move-contact-map-links.mjs --apply                    (dev — moves them)
//   node scripts/move-contact-map-links.mjs --env production [--apply] (only when Lutan asks)
//
// .env.deploy.production lives only in the main checkout, so for production run
// a workstream's copy from there: node ../Animal_Shelter_<feature>/scripts/…
//
// Before 0164 a contact had one box for both, so a map link sat at the front of
// the address, sometimes with the written address after it. The rule is the
// contact forms' own (contactAddressFields in src/lib/contacts/contacts.ts,
// imported, so this script and the forms cannot disagree): an address that
// STARTS with a link gives that link to map_url, and the words after it stay as
// the address. Nothing else is touched:
//   - an address with no link at the front (written words, a link buried in
//     the middle) is left as it is — scripts/audit-contact-map-links.mjs lists
//     those for a person to fix;
//   - a contact that already has a map_url is skipped (someone has edited it
//     since 0164; their choice stands);
//   - a link the forms would refuse (not a real http(s) link) is reported,
//     not moved.
// Archived contacts are moved too: same data, shown nowhere, and an unarchived
// one should not come back in the old shape.
//
// Each UPDATE names the row's current address and an empty map_url, so a row
// edited between the read and the write is left alone, not overwritten.
// Re-runnable: a second run finds nothing to move. Whether a link leads to a
// place is not this script's question — it moves what is there, as is.
//
// Exit code 0 when it ran, 1 when it couldn't read or write the database.
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.removeAllListeners("warning");

const root = join(fileURLToPath(import.meta.url), "../..");
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const { loadEnv, parseEnvArg, projectRef } = await imp("scripts/lib/env.mjs");
const { contactAddressFields } = await imp("src/lib/contacts/contacts.ts");

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const { name: envName } = parseEnvArg(argv.filter((a) => a !== "--apply"));
const env = loadEnv(envName);
const ref = projectRef(env);

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`database said ${res.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

const lit = (v) => (v === null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

async function main() {
  let rows;
  try {
    rows = await query(
      `select id, name, address, map_url, (archived_at is not null) as archived
         from contacts
        where address ~* '^\\s*https?://'
        order by name`,
    );
  } catch (e) {
    console.error(`Could not read contacts from ${envName} (${ref}): ${e.message}`);
    process.exitCode = 1;
    return;
  }

  const moves = [];
  const refused = [];
  const already = [];
  for (const row of rows) {
    if (row.map_url) {
      already.push(row);
      continue;
    }
    const split = contactAddressFields(row.address, null);
    if (split.ok) moves.push({ ...row, newAddress: split.address, newMapUrl: split.map_url });
    else refused.push(row);
  }

  console.log(`Contact map links — ${envName} (${ref}), ${apply ? "APPLY" : "dry run, nothing changed"}`);
  console.log(`${rows.length} contacts have an address starting with a link.`);
  console.log(`\n== To move: ${moves.length} ==`);
  for (const m of moves) {
    console.log(`- ${m.name}${m.archived ? " (archived)" : ""}`);
    console.log(`    Map link: ${m.newMapUrl}`);
    console.log(`    Address:  ${m.newAddress ?? "(empty — type the written address under Management → Contacts)"}`);
  }
  console.log(`\n== Already have a Map link, left alone: ${already.length} ==`);
  for (const r of already) console.log(`- ${r.name}: ${r.address}`);
  console.log(`\n== Not a usable link, left alone — fix by hand: ${refused.length} ==`);
  for (const r of refused) console.log(`- ${r.name}: ${r.address}`);

  if (!apply) {
    if (moves.length) console.log(`\nRun again with --apply to move ${moves.length}.`);
    return;
  }

  let moved = 0;
  for (const m of moves) {
    try {
      const out = await query(
        `update contacts set map_url = ${lit(m.newMapUrl)}, address = ${lit(m.newAddress)}
          where id = ${lit(m.id)} and address = ${lit(m.address)} and map_url is null
          returning id`,
      );
      if (out.length === 1) moved++;
      else console.log(`- ${m.name}: changed since it was read, left alone`);
    } catch (e) {
      console.error(`- ${m.name}: could not save (${e.message})`);
      process.exitCode = 1;
    }
  }
  console.log(`\nMoved ${moved} of ${moves.length}.`);
}

await main();
