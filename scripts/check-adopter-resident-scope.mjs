// Rollback harness for 0357_adopter_resident_scope.sql against DEV only. Nothing commits.
//   node scripts/check-adopter-resident-scope.mjs
// Proves: only the OPEN Adopt placement's carer is in scope; a returned resident drops the past adopter; a re-adopter enters;
// another placement type, an archived contact and another contact are out; the scope is empty for an unknown contact;
// an unapproved update's text_approval is NULL (not approved at the epoch) and is absent from public_adoption_updates.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $h$
declare r uuid; a uuid; b uuid; p uuid; u uuid; n int; v_pub int;
begin
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0357', 'Dog', true, 'R-H357A') returning id into r;
  insert into contacts (name, type, email) values ('Adopter A', 'Carer', 'h357a@example.invalid') returning id into a;
  insert into contacts (name, type, email) values ('Adopter B', 'Carer', 'h357b@example.invalid') returning id into b;

  -- no Adopt placement yet: nobody in scope
  if adopter_may_submit(a, r) then raise exception 'FAIL 1 in scope with no Adopt placement'; end if;

  insert into placement_history (resident_id, placement_type, carer_id, start_date) values (r, 'Adopt', a, now() - interval '2 days') returning id into p;
  if not adopter_may_submit(a, r) then raise exception 'FAIL 2 current adopter not in scope'; end if;
  if adopter_may_submit(b, r) then raise exception 'FAIL 3 another contact in scope'; end if;
  select count(*) into n from adopter_residents(a); if n <> 1 then raise exception 'FAIL 4 expected 1 resident, got %', n; end if;
  select count(*) into n from adopter_residents(gen_random_uuid()); if n <> 0 then raise exception 'FAIL 5 unknown contact has scope'; end if;

  -- archived contact drops out
  update contacts set archived_at = now() where id = a;
  if adopter_may_submit(a, r) then raise exception 'FAIL 6 archived contact in scope'; end if;
  update contacts set archived_at = null where id = a;

  -- returned: the Adopt placement ends, the past adopter is out
  insert into placement_history (resident_id, placement_type, start_date) values (r, 'ReturnToShelter', now() - interval '1 day');
  if adopter_may_submit(a, r) then raise exception 'FAIL 7 past adopter still in scope after the placement ended'; end if;

  -- adopted again by B: B in, A still out
  insert into placement_history (resident_id, placement_type, carer_id, start_date) values (r, 'Adopt', b, now() - interval '12 hours');
  if not adopter_may_submit(b, r) or adopter_may_submit(a, r) then raise exception 'FAIL 8 re-adoption scope wrong'; end if;

  -- an update sent for it is born unapproved (NULL, not an epoch) and absent from the public view
  insert into adoption_updates (resident_id, received_on, channel, sender_contact_id, share_publicly, public_story, public_first_name)
    values (r, current_date, 'email', b, true, 'Harness story', 'Harness') returning id into u;
  if (select text_approval from adoption_updates where id = u) is not null then raise exception 'FAIL 9 text born approved'; end if;
  if (select text_approval_at from adoption_updates where id = u) is not null then raise exception 'FAIL 10 approval time set while unapproved'; end if;
  set local role anon;
  select count(*) into v_pub from public_adoption_updates where public_story = 'Harness story';
  reset role;
  if v_pub <> 0 then raise exception 'FAIL 11 an unapproved update is on the public view'; end if;

  raise exception 'HARNESS-OK scope = open Adopt placement carer only | past adopter out after return | re-adopter in | archived and other contacts out | unknown contact empty | unapproved text is NULL, no stamp, absent from public_adoption_updates';
end; $h$;
rollback;
`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text; try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`); console.log(msg);
await exitWith(/HARNESS-OK/.test(msg) ? 0 : 1);
