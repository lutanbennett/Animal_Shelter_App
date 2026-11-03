// Rollback harness for 0308_bills_delivery_lines.sql against DEV only, on the LIVE schema.
// One transaction, then a deliberate raise carrying the evidence, so nothing commits.
//   node scripts/check-bills-delivery-lines.mjs     (from the repo root; dev only; apply 0308 first)
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
create temp table who (who text primary key, uid uuid);
insert into who values ('rec', gen_random_uuid()), ('buy', gen_random_uuid()), ('none', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0308-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now() from who;
insert into roles (key, name, kind) values ('h0308_rec', 'h', 'custom'), ('h0308_buy', 'h', 'custom'), ('h0308_none', 'h', 'custom');
insert into role_permissions (role_id, activity, level) select id, 'stock.delivery', 2 from roles where key = 'h0308_rec';
insert into role_permissions (role_id, activity, level) select id, 'stock.purchasing', 2 from roles where key = 'h0308_buy';
insert into role_permissions (role_id, activity, level) select id, 'maintenance.photos', 2 from roles where key = 'h0308_none';
insert into user_roles (user_id, role_id) select w.uid, r.id from who w join roles r on r.key = 'h0308_' || w.who;
grant select on who to authenticated;

do $$
declare
  v_med uuid; v_diet uuid; v_head uuid; v_when timestamptz := now() - interval '3 days';
  v_l_med uuid; v_l_diet uuid; v_l_desc uuid; v_l_desc2 uuid; v_old uuid;
  v_n int; v_unit text; v_recv timestamptz; v_diff numeric;
  v_report text := '';
begin
  select id into v_med from medication limit 1;
  select id into v_diet from diet_types limit 1;
  if v_med is null or v_diet is null then raise exception 'A0 dev has no medication or diet to test against'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'rec'), 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- A one bill carries a medication, a diet and a described line, and the old one-item rule does not block it
  insert into stock_deliveries (received_at, bill_date, amount, note) values (v_when, current_date, 100, 'harness-0308') returning id into v_head;
  insert into stock_receipts (delivery_id, item_kind, medication_id, quantity, cost) values (v_head, 'medication', v_med, 2, 40) returning id into v_l_med;
  insert into stock_receipts (delivery_id, item_kind, diet_type_id, quantity, cost) values (v_head, 'diet_type', v_diet, 3, 30) returning id into v_l_diet;
  insert into stock_receipts (delivery_id, item_kind, description, quantity, unit, cost) values (v_head, 'described', '  harness dish soap ', 4, 'bottle', 20) returning id into v_l_desc;
  select count(*) into v_n from stock_receipts where delivery_id = v_head;
  if v_n <> 3 then reset role; raise exception 'A1 three lines expected, got %', v_n; end if;
  v_report := v_report || ' | A one bill holds a medication, a diet and a described line';

  -- A2 the header decides when and from whom: every line took the header instant, the described line kept its typed unit
  select count(*) into v_n from stock_receipts where delivery_id = v_head and received_at is distinct from v_when;
  select unit into v_unit from stock_receipts where id = v_l_desc;
  if v_n <> 0 or v_unit <> 'bottle' then reset role; raise exception 'A2 stamp: % lines off the header instant, unit %', v_n, v_unit; end if;
  v_report := v_report || ' | A2 lines take the header instant, typed unit kept';

  -- B described counts toward no stock figure
  select count(*) into v_n from item_latest_delivery_cost where item_kind = 'described';
  if v_n <> 0 then reset role; raise exception 'B1 described line reached item_latest_delivery_cost'; end if;
  select count(*) into v_n from stock_receipts where item_kind = 'described' and (medication_id is not null or diet_type_id is not null);
  if v_n <> 0 then reset role; raise exception 'B2 a described line names a stock item'; end if;
  select count(*) into v_n from stock_count_intervals i where i.item_kind = 'described';
  if v_n <> 0 then reset role; raise exception 'B3 described line in stock_count_intervals'; end if;
  v_report := v_report || ' | B described line is in no price view, names no item, has no stocktake interval';

  -- C the bill against its lines: 100 printed, 90 of lines, difference shown and not blocked
  select difference into v_diff from stock_delivery_totals where delivery_id = v_head;
  if v_diff is distinct from 10 then reset role; raise exception 'C1 difference expected 10, got %', v_diff; end if;
  update stock_deliveries set amount = 90 where id = v_head;
  select difference into v_diff from stock_delivery_totals where delivery_id = v_head;
  if v_diff is distinct from 0 then reset role; raise exception 'C2 difference expected 0, got %', v_diff; end if;
  v_report := v_report || ' | C difference shown (10) then cleared (0), the save never blocked';

  -- D a described line is linked to a real item afterwards, and keeps its words
  update stock_receipts set promoted_medication_id = v_med where id = v_l_desc;
  select count(*) into v_n from stock_receipts where id = v_l_desc and promoted_medication_id = v_med and description like '%dish soap%' and item_kind = 'described';
  if v_n <> 1 then reset role; raise exception 'D1 link not stored'; end if;
  select count(*) into v_n from item_latest_delivery_cost where item_kind = 'described';
  if v_n <> 0 then reset role; raise exception 'D2 linked line counts in a price view'; end if;
  insert into stock_receipts (delivery_id, item_kind, description, quantity, unit) values (v_head, 'described', 'harness dish soap', 1, 'bottle') returning id into v_l_desc2;
  select count(*) into v_n from stock_receipts where promoted_medication_id is null and item_kind = 'described' and lower(btrim(description)) = 'harness dish soap' and delivery_id = v_head;
  if v_n <> 1 then reset role; raise exception 'D3 a second line with the same wording must stay unlinked, got %', v_n; end if;
  update stock_receipts set promoted_medication_id = null, promoted_diet_type_id = v_diet where id = v_l_desc;
  v_report := v_report || ' | D line linked later, still counts nowhere, same wording elsewhere stays unlinked, link re-pointable';

  -- E refusals on the shape (23514 check_violation)
  begin
    insert into stock_receipts (item_kind, medication_id, diet_type_id, quantity) values ('medication', v_med, v_diet, 1);
    reset role; raise exception 'E1 two items accepted';
  exception when check_violation then null; end;
  begin
    insert into stock_receipts (item_kind, description, quantity, unit) values ('described', '   ', 1, 'bag');
    reset role; raise exception 'E2 blank description accepted';
  exception when check_violation then null; end;
  begin
    insert into stock_receipts (item_kind, description, quantity) values ('described', 'rice', 1);
    reset role; raise exception 'E3 described line with no unit accepted';
  exception when check_violation then null; end;
  begin
    insert into stock_receipts (item_kind, medication_id, description, quantity) values ('medication', v_med, 'sneaky', 1);
    reset role; raise exception 'E4 medication line with a description accepted';
  exception when check_violation then null; end;
  begin
    insert into stock_receipts (item_kind, description, quantity, unit, medication_id) values ('described', 'rice', 1, 'bag', v_med);
    reset role; raise exception 'E5 described line naming a stock item accepted';
  exception when check_violation then null; end;
  begin
    insert into stock_receipts (item_kind, description, quantity, unit, promoted_medication_id, promoted_diet_type_id) values ('described', 'rice', 1, 'bag', v_med, v_diet);
    reset role; raise exception 'E6 linked to both a medication and a diet';
  exception when check_violation then null; end;
  begin
    insert into stock_receipts (item_kind, quantity) values ('bogus', 1);
    reset role; raise exception 'E7 unknown item_kind accepted';
  exception when check_violation then null; end;
  begin
    insert into stock_receipts (item_kind, quantity, unit) values ('described', 1, 'bag');
    reset role; raise exception 'E8 described with no description accepted';
  exception when check_violation then null; end;
  v_report := v_report || ' | E eight malformed lines refused';

  -- F nothing else on a line can be edited, linking a stocked line is refused
  begin
    update stock_receipts set quantity = 99 where id = v_l_desc;
    reset role; raise exception 'F1 quantity edit accepted';
  exception when insufficient_privilege then null; end;
  begin
    update stock_receipts set description = 'other' where id = v_l_desc;
    reset role; raise exception 'F2 description edit accepted';
  exception when insufficient_privilege then null; end;
  begin
    update stock_receipts set promoted_diet_type_id = v_diet where id = v_l_med;
    reset role; raise exception 'F3 a stocked line was linked';
  exception when insufficient_privilege then null; end;
  begin
    update stock_receipts set delivery_id = null where id = v_l_desc;
    reset role; raise exception 'F4 line moved off its bill';
  exception when insufficient_privilege then null; end;
  update stock_receipts set cost = 25 where id = v_l_desc;
  v_report := v_report || ' | F only cost (and the link on a described line) can change';

  -- G header: received_at is fixed once saved, delete is Admin only, header with lines cannot go
  update stock_deliveries set received_at = now() where id = v_head;
  select received_at into v_recv from stock_deliveries where id = v_head;
  if v_recv is distinct from v_when then reset role; raise exception 'G1 received_at changed'; end if;
  delete from stock_deliveries where id = v_head;
  select count(*) into v_n from stock_deliveries where id = v_head;
  if v_n <> 1 then reset role; raise exception 'G2 a stock.delivery login deleted a delivery'; end if;
  v_report := v_report || ' | G header instant fixed, delete not allowed without Admin';

  -- H the photos hang on the header, and only the delivery activity may add one
  perform record_attachment(p_owner_type => 'stock_delivery', p_owner_id => v_head, p_drive_file_id => 'h0308-bill', p_file_name => 'bill.jpg');
  select count(*) into v_n from attachments where owner_type = 'stock_delivery' and owner_id = v_head;
  if v_n <> 1 then reset role; raise exception 'H1 bill photo not stored on the header'; end if;
  reset role;

  -- I old shape still fine: a single-item delivery with no header
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'rec'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into stock_receipts (item_kind, medication_id, quantity) values ('medication', v_med, 1) returning id into v_old;
  select count(*) into v_n from stock_receipts where id = v_old and delivery_id is null;
  if v_n <> 1 then reset role; raise exception 'I1 headerless delivery'; end if;
  reset role;
  v_report := v_report || ' | H bill photo stored on the header | I headerless single-item delivery still records';

  -- J a login with only stock.purchasing reads but writes nothing; one with neither sees nothing and cannot attach
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'buy'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from stock_deliveries where id = v_head;
  if v_n <> 1 then reset role; raise exception 'J1 purchasing login cannot read the header'; end if;
  begin
    insert into stock_deliveries (note) values ('nope');
    reset role; raise exception 'J2 purchasing login recorded a delivery';
  exception when insufficient_privilege then null; end;
  begin
    perform record_attachment(p_owner_type => 'stock_delivery', p_owner_id => v_head, p_drive_file_id => 'h0308-no', p_file_name => 'b.jpg');
    reset role; raise exception 'J3 purchasing login attached a bill photo';
  exception when sqlstate 'P0001' then if sqlerrm not like 'Not authorized%' then raise; end if;
  end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'none'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from stock_deliveries where id = v_head;
  if v_n <> 0 then reset role; raise exception 'J4 login with no stock card read the header'; end if;
  begin
    perform record_attachment(p_owner_type => 'stock_delivery', p_owner_id => v_head, p_drive_file_id => 'h0308-no2', p_file_name => 'b.jpg');
    reset role; raise exception 'J5 login with no stock card attached a bill photo';
  exception when sqlstate 'P0001' then if sqlerrm not like 'Not authorized%' then raise; end if;
  end;
  reset role;
  v_report := v_report || ' | J purchasing reads only, no card sees nothing, neither can attach';

  -- K a header with lines cannot be deleted by anyone (restrict), lines go first
  begin
    delete from stock_deliveries where id = v_head;
    raise exception 'K1 header with lines deleted';
  exception when foreign_key_violation then null; end;
  v_report := v_report || ' | K header with lines cannot be deleted';

  raise exception 'HARNESS-OK 0308 (live)%', v_report;
end $$;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
