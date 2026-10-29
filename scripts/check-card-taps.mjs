// Name card taps (docs/decisions/2026-10-07-name-card-taps.md): whoever taps a resident's card
// lands on the public card, the public card plus extras, or the full record, and never on
// no-access or a 404. Against DEV only, one transaction that is always rolled back, each
// principal's own JWT (or the anon role for "signed out").
//
//   node scripts/check-card-taps.mjs            (from the repo root; dev only)
//   node scripts/check-card-taps.mjs --verbose  (also list every passing check)
//
// WHAT THIS ASSERTS (and what it does not), per principal, each defined by the CARDS it holds: signed out, public_viewer, Admin,
// a login whose role holds no card, one holding only a who-and-where card (Enclosures), and one holding View residents.
// (Doctor-outside-their-clinic is not a principal: no card or policy narrows the resident row by clinic any more; see below.)
//   1. the public card (public_resident_cards) answers with a row for every one of them: the
//      floor nobody falls below, so the page never 404s on a resident that exists
//   2. the landing, from src/lib/residents/card-landing.ts fed the inputs the page reads from
//      the live database (my_permissions, the residents row), is exactly the
//      expected one below
//   3. a "full" landing really reads the resident row (the hub will not 404) and holds
//      resident.record; a "public-plus" landing really reads the who-and-where row.
// Not asserted: the rendered HTML, the job buttons, or the redirect from /residents/<id>. Those
// are in the test plan's browser checks. Whether the Heads and volunteers SHOULD read medical is
// the Director's matrix, not this script: it asserts the default (no).
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { cardLanding } = await import(pathToFileURL(join(root, "src/lib/residents/card-landing.ts")).href);

const lit = (id) => `'${id}'::uuid`;
// Principals are defined by the CARDS they hold, never by a role: a role is a transient grouping that gets rebuilt (Lutan, 2026-10-28).
// A doctor outside the treating clinic is deliberately NOT a principal, and the reason is that the behaviour is gone, not that a
// column is: 0264 dropped the clinic-scoped doctor_read_residents policy, may_open_resident_record() and roles.scope_residents, and
// residents_select_perm now asks only has_permission('resident.record', 'read'). So any login holding that card reads every
// resident row, whatever clinic it works in; the reads_record principal below is that case. Restore a principal here only if a card
// that narrows the row set is ever built (backlog: scoped card grants).
// Each login below is given a throwaway role holding exactly the cards named, inside the rolled-back transaction.
const CARDS_OF = {
  no_cards: [],                     // signed in, a role holding no card: not in the app
  who_where_only: ["enclosures"],   // resident.who_and_where read and no resident.record
  reads_record: ["view_residents"], // resident.record at read
};
const P = ["anon", "public_viewer", "admin", ...Object.keys(CARDS_OF)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const ROLE = Object.fromEntries(Object.keys(CARDS_OF).map((p) => [p, randomUUID()]));
const R = randomUUID();

const EXPECT = {
  anon: "public", public_viewer: "public", no_cards: "public",
  admin: "full", reads_record: "full",
  who_where_only: "public-plus",
};

const harness = `
begin;
create temp table res (who text, k text, v text);
grant all on res to authenticated, anon;
create function pg_temp.look(p_who text, p_uid uuid, p_anon boolean) returns void language plpgsql as $f$
declare role_name text; enters text := 'false'; rec text; vis int; card int; wow int;
begin
  begin
    if p_anon then
      set local role anon;
    else
      perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
      set local role authenticated;
    end if;
    select count(*) into card from public_resident_cards where id = '${R}';
    if p_anon then role_name := null; rec := null; vis := 0; wow := 0;
    else
      role_name := my_permissions() -> 'role' ->> 'key';
      rec := (my_permissions() -> 'permissions' ->> 'resident.record');
      if coalesce((my_permissions() ->> 'is_admin')::boolean, false) then rec := '2'; end if;
      enters := (coalesce((my_permissions() ->> 'is_admin')::boolean, false) or my_permissions() -> 'permissions' <> '{}'::jsonb)::text;
      select count(*) into vis from residents where id = '${R}';
      select count(*) into wow from resident_who_and_where where id = '${R}';
    end if;
    reset role;
    raise exception using errcode = 'P0999', message = 'look-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  insert into res values (p_who, 'role', coalesce(role_name, ''));
  insert into res values (p_who, 'enters', enters);
  insert into res values (p_who, 'rec', coalesce(rec, '0'));
  insert into res values (p_who, 'visible', vis::text);
  insert into res values (p_who, 'wow', wow::text);
  insert into res values (p_who, 'card', card::text);
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-card-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.filter((p) => p !== "anon").map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id)
  select ${lit(ID.admin)}, id from roles where key = 'admin';
  insert into user_roles (user_id, role_id)
  select ${lit(ID.public_viewer)}, id from roles where key = 'public_viewer';
${Object.entries(CARDS_OF).map(([p, cards], i) => `
  insert into roles (id, key, name, kind, home_path) values (${lit(ROLE[p])}, 'harness_tap_${i}', 'Harness: ${cards.join(", ") || "no cards"}', 'custom', '/home');
  ${cards.map((c) => `insert into role_cards (role_id, card) values (${lit(ROLE[p])}, '${c}');`).join("\n  ")}
  insert into user_roles (user_id, role_id) values (${lit(ID[p])}, ${lit(ROLE[p])});`).join("")}
  insert into residents (id, name, species) values (${lit(R)}, 'Harness resident', 'Dog');
end $setup$;

do $run$ begin
${P.map((p) => `  perform pg_temp.look('${p}', ${lit(ID[p])}, ${p === "anon"});`).join("\n")}
end $run$;
do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 1500)}`);
const rows = JSON.parse(m[1]);
const get = (who, k) => rows.find((r) => r.who === who && r.k === k)?.v;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };

for (const p of P) {
  if (get(p, "card") === "1") pass(`${p}: the public card answers`);
  else fail(`${p}: the public card gave ${get(p, "card")} rows, so the tap would 404`);

  const role = get(p, "role") || null;
  const reads = get(p, "rec") === "1" || get(p, "rec") === "2";
  const landing = cardLanding({
    appAccess: get(p, "enters") === "true", // entersApp(): Admin, or any cell at all
    readsRecord: reads,
    rowVisible: get(p, "visible") === "1",
  });
  if (landing === EXPECT[p]) pass(`${p}: lands on ${landing}`);
  else fail(`${p}: lands on ${landing}, expected ${EXPECT[p]}`);

  if (landing === "full" && get(p, "visible") !== "1") fail(`${p}: "full" but the resident row is not readable (the hub would 404)`);
  if (landing === "full" && !reads) fail(`${p}: "full" without resident.record`);
  if (landing === "public-plus" && get(p, "wow") !== "1") fail(`${p}: public-plus but the who-and-where row is not readable`);
}

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (every principal lands on the card, the card plus extras, or the record; none on no-access or 404)");
process.exitCode = fails ? 1 : 0;
