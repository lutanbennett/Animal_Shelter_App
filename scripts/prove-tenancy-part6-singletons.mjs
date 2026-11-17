// Part 6 (#bncd0) "done when": a SECOND shelter can have its own website row, facility overview, standard diet and receipt
// numbers, and cannot see another shelter's logins through private.app_users. Planted and rolled back inside one transaction on
// dev (nothing is kept); modelled on prove-dev-shelter-header.mjs.
//   node scripts/prove-tenancy-part6-singletons.mjs
import { loadEnv, projectRef } from "./lib/env.mjs";
import { runHarness } from "./lib/rollback-harness.mjs";
import { scriptShelterId } from "./lib/shelter-env.mjs";
import { exitWith } from "./lib/exit.mjs";

const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const s1 = scriptShelterId(env, "test");
if (!s1) throw new Error("DEV_SHELTER_ID is not set (.env.local)");

const hdr = (id) => `perform set_config('request.headers', json_build_object('x-shelter-id', ${id}::text)::text, true);`;
const sql = `
do $$
declare s2 uuid := gen_random_uuid(); s1 uuid := '${s1}'; m uuid := gen_random_uuid();
  n_site1 int; n_site2 int; dup text := 'none'; n_fm int; n_diet int; num text; iss text; lanna_next bigint; lanna_next2 bigint;
  au_own int; au_other int; au_trusted int; au_before int;
begin
  insert into shelters (id, key, name, receipt_series, receipt_issuers)
  values (s2, 'zz-proof', 'Proof Shelter', 'ZZA', jsonb_build_object('TH', jsonb_build_object('name','Proof Shelter Org','addressLines','[]'::jsonb,'registrationLines','[]'::jsonb,'statementLines','[]'::jsonb)));
  select next_value into lanna_next from receipt_counters where series = 'LCA';
  select count(*) into au_before from private.app_users;

  -- its own website row, overview, standard diet; a SECOND website row for the same shelter is refused
  ${hdr("s2")}
  insert into site_content (id) values (true);
  begin insert into site_content (id) values (true); exception when unique_violation then dup := 'refused'; end;
  insert into facility_maps (kind, image_path, width, height) values ('overview', 'x.png', 10, 10);
  insert into diets (name, is_standard) values ('Proof standard', true);
  select count(*) into n_site2 from site_content where shelter_id = s2;
  select count(*) into n_fm from facility_maps where shelter_id = s2 and kind = 'overview';
  select count(*) into n_diet from diets where shelter_id = s2 and is_standard;
  select count(*) into n_site1 from site_content where shelter_id = s1;

  -- a login in shelter 2 holding donation.receipt, its own counter, its own number and issuer
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (m, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-part6-' || m || '@example.invalid', '{}', '{}', now(), now());
  insert into roles (key, name, kind, shelter_id) values ('h_part6', 'h part6', 'custom', s2);
  insert into role_permissions (role_id, activity, level) select id, 'donation.receipt', 2 from roles where key = 'h_part6' and shelter_id = s2;
  insert into user_roles (user_id, role_id, shelter_id) select m, id, s2 from roles where key = 'h_part6' and shelter_id = s2;
  insert into receipt_counters (series, next_value, shelter_id) values ('ZZA', 1, s2);
  insert into donations (received_on, donor_name, method, shelter_id) values (current_date, 'Proof donor', 'cash', s2);
  insert into donation_lines (donation_id, position, description, amount) select id, 0, 'Gift', 100 from donations where donor_name = 'Proof donor';

  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select (issue_donation_receipt((select id from donations where donor_name = 'Proof donor'), 'TH', current_date, null, null)).number into num;
  reset role;
  select issuer ->> 'name' into iss from donation_receipts where number = num;
  select next_value into lanna_next2 from receipt_counters where series = 'LCA';

  -- private.app_users: own shelter's login visible, hidden from another shelter's header, still visible to a trusted caller whose own row is in another shelter
  select count(*) into au_own from private.app_users where id = m;
  ${hdr("s1")}
  select count(*) into au_other from private.app_users where id = m;
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'service_role')::text, true);
  select count(*) into au_trusted from private.app_users where id = m;

  if n_site2 <> 1 or dup <> 'refused' or n_fm <> 1 or n_diet <> 1 or n_site1 <> 1 or num <> 'ZZA0000001'
     or iss <> 'Proof Shelter Org' or lanna_next <> lanna_next2 or au_own <> 1 or au_other <> 0 or au_trusted <> 1 then
    raise exception 'HARNESS-FAIL site s2=%, dup=%, overview=%, standard diet=%, site s1=%, number=%, issuer=%, lanna counter % -> %, app_users own=% other-shelter=% trusted=%',
      n_site2, dup, n_fm, n_diet, n_site1, num, iss, lanna_next, lanna_next2, au_own, au_other, au_trusted;
  end if;
  raise exception 'HARNESS-OK second shelter: own website row % (a second refused), own overview %, own standard diet %, first shelter still % site row, receipt number % issued by "%" with Lanna counter untouched (% -> %); app_users: own shelter sees %, another shelter sees %, trusted caller sees % (rolled back)',
    n_site2, n_fm, n_diet, n_site1, num, iss, lanna_next, lanna_next2, au_own, au_other, au_trusted;
end $$;`;

exitWith((await runHarness(ref, env, "second shelter proof", sql)) ? 0 : 1);
