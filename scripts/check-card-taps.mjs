// Name card taps (docs/decisions/2026-10-07-name-card-taps.md): whoever taps a resident's card
// lands on the public card, the public card plus extras, or the full record, and never on
// no-access or a 404. Against DEV only, one transaction that is always rolled back, each
// principal's own JWT (or the anon role for "signed out").
//
//   node scripts/check-card-taps.mjs            (from the repo root; dev only)
//   node scripts/check-card-taps.mjs --verbose  (also list every passing check)
//
// WHAT THIS ASSERTS (and what it does not), per principal: signed out, public_viewer, admin,
// management, staff, the 2IC, both Heads, a volunteer, a vet whose clinic treats the resident and
// a vet whose clinic does not.
//   1. the public card (public_resident_cards) answers with a row for every one of them: the
//      floor nobody falls below, so the page never 404s on a resident that exists
//   2. the landing, from src/lib/residents/card-landing.ts fed the inputs the page reads from
//      the live database (current_user_role, my_permissions, the residents row), is exactly the
//      expected one below
//   3. a "full" landing really reads the resident row (the hub will not 404) and holds
//      resident.record; a "public-plus" landing really reads the who-and-where row, except a vet
//      outside their clinic, who sees the plain card
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
const P = ["anon", "public_viewer", "admin", "management", "staff", "volunteer", "vet_in", "vet_out", "sic", "hom", "hm"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), OWN = randomUUID(), OTHER = randomUUID();

const EXPECT = {
  anon: "public", public_viewer: "public",
  admin: "full", management: "full", staff: "full",
  sic: "public-plus", hom: "public-plus", hm: "public-plus", volunteer: "public-plus",
  vet_in: "full", vet_out: "public-plus",
};

const harness = `
begin;
create temp table res (who text, k text, v text);
grant all on res to authenticated, anon;
create function pg_temp.look(p_who text, p_uid uuid, p_anon boolean) returns void language plpgsql as $f$
declare role_name text; rec text; vis int; card int; wow int;
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
      role_name := current_user_role()::text;
      rec := (my_permissions() -> 'permissions' ->> 'resident.record');
      if coalesce((my_permissions() ->> 'is_admin')::boolean, false) then rec := '2'; end if;
      select count(*) into vis from residents where id = '${R}';
      select count(*) into wow from resident_who_and_where where id = '${R}';
    end if;
    reset role;
    raise exception using errcode = 'P0999', message = 'look-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  insert into res values (p_who, 'role', coalesce(role_name, ''));
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
  insert into user_roles (user_id, role) values
    (${lit(ID.admin)}, 'admin'), (${lit(ID.management)}, 'management'), (${lit(ID.staff)}, 'staff'),
    (${lit(ID.volunteer)}, 'volunteer'), (${lit(ID.public_viewer)}, 'public_viewer');
  insert into vets (id, name, clinic_name) values (${lit(OWN)}, 'Harness own', 'Harness own'), (${lit(OTHER)}, 'Harness other', 'Harness other');
  insert into user_roles (user_id, role) values (${lit(ID.vet_in)}, 'vet'), (${lit(ID.vet_out)}, 'vet');
  insert into doctors (name, user_id, clinic_id) values ('Harness vet in', ${lit(ID.vet_in)}, ${lit(OWN)}), ('Harness vet out', ${lit(ID.vet_out)}, ${lit(OTHER)});
  insert into user_roles (user_id, role_id, role) select ${lit(ID.sic)}, id, legacy_role from roles where key = 'second_in_command';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.hom)}, id, legacy_role from roles where key = 'head_of_medical';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.hm)}, id, legacy_role from roles where key = 'head_of_maintenance';
  insert into residents (id, name, species) values (${lit(R)}, 'Harness resident', 'Dog');
  insert into clinic_visits (resident_id, clinic_id, appointment_date, status) values (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed');
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

const APP_ROLES = ["admin", "management", "staff", "vet", "volunteer"]; // src/lib/auth/app-access.ts
let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };

for (const p of P) {
  if (get(p, "card") === "1") pass(`${p}: the public card answers`);
  else fail(`${p}: the public card gave ${get(p, "card")} rows, so the tap would 404`);

  const role = get(p, "role") || null;
  const reads = get(p, "rec") === "1" || get(p, "rec") === "2";
  const landing = cardLanding({
    appAccess: p !== "anon" && !!role && APP_ROLES.includes(role),
    readsRecord: reads,
    // the volunteer floor: current_user_role() = 'volunteer', as readsWhoAndWhereOnly() asks
    whoAndWhereOnly: role === "volunteer",
    rowVisible: get(p, "visible") === "1",
  });
  if (landing === EXPECT[p]) pass(`${p}: lands on ${landing}`);
  else fail(`${p}: lands on ${landing}, expected ${EXPECT[p]}`);

  if (landing === "full" && get(p, "visible") !== "1") fail(`${p}: "full" but the resident row is not readable (the hub would 404)`);
  if (landing === "full" && !reads) fail(`${p}: "full" without resident.record`);
  if (landing === "public-plus" && p !== "vet_out" && get(p, "wow") !== "1") fail(`${p}: public-plus but the who-and-where row is not readable`);
}

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (every principal lands on the card, the card plus extras, or the record; none on no-access or 404)");
process.exitCode = fails ? 1 : 0;
