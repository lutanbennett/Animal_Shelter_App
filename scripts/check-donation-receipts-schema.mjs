// 0168 (donation receipts) exercised on dev without keeping anything: assertions run under real
// management, staff and anon sessions inside begin…, and a final raise rolls it all back, the
// receipt counter included.
//
//   node scripts/check-donation-receipts-schema.mjs
//
// Covers: who writes (the donation.receipt cell: management yes, staff and anon no), the line
// constraints (in kind is null, never 0), issuing takes consecutive numbers and a refused issue
// does not advance the counter (no gaps), one live receipt per donation, a receipt cannot be
// inserted directly, rewritten or deleted, a void needs a reason and cannot be undone, a re-issue
// after a void takes the next number, the counter is closed to the API, and the audit log
// records the receipt.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
create function pg_temp.q(p_uid uuid, p_expr text, p_pgrole text default 'authenticated') returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims', case when p_uid is null then json_build_object('role', p_pgrole)::text
    else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', 'aal1')::text end, true);
  execute format('set local role %I', p_pgrole);
  begin execute 'select (' || p_expr || ')::text' into v; exception when others then v := 'ERR:' || sqlstate; end;
  reset role; return v;
end $f$;
create function pg_temp.try(p_uid uuid, p_sql text, p_pgrole text default 'authenticated') returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims', case when p_uid is null then json_build_object('role', p_pgrole)::text
    else json_build_object('sub', p_uid, 'role', p_pgrole, 'aal', 'aal1')::text end, true);
  execute format('set local role %I', p_pgrole);
  begin execute p_sql; get diagnostics v = row_count;
  exception when insufficient_privilege then v := -1; when others then v := -2; end;
  reset role; return v;
end $f$;
create temp table r (n serial, label text, got text, want text);
grant all on r to authenticated, anon;
do $$
declare m uuid; s uuid; d uuid; d2 uuid; c0 bigint; n1 text; n2 text; n3 text; rid uuid;
  issue text := 'issue_donation_receipt(%L, %L, current_date, ''{"name":"Probe issuer"}''::jsonb, ''{"donorName":"Probe"}''::jsonb)';
begin
  select ur.user_id into m from user_roles ur join roles x on x.id = ur.role_id where x.key = 'management' and ur.archived_at is null limit 1;
  select ur.user_id into s from user_roles ur join roles x on x.id = ur.role_id where x.key = 'staff' and ur.archived_at is null limit 1;
  insert into r (label, got, want) values ('logins found', (m is not null and s is not null)::text, 'true');
  select next_value into c0 from receipt_counters where series = 'LCA';

  insert into r (label, got, want) values ('mgmt records donation', pg_temp.try(m, $q$insert into donations (received_on, donor_name, method) values (current_date, 'Probe ผู้บริจาค จำกัด', 'cash')$q$)::text, '1');
  insert into r (label, got, want) values ('staff records donation', pg_temp.try(s, $q$insert into donations (received_on, donor_name, method) values (current_date, 'Staff probe', 'cash')$q$)::text, '-1');
  insert into r (label, got, want) values ('anon records donation', pg_temp.try(null, $q$insert into donations (received_on, donor_name, method) values (current_date, 'Anon', 'cash')$q$, 'anon')::text, '-1');
  insert into r (label, got, want) values ('bad method refused', pg_temp.try(m, $q$insert into donations (received_on, donor_name, method) values (current_date, 'X', 'crypto')$q$)::text, '-2');
  insert into r (label, got, want) values ('blank donor refused', pg_temp.try(m, $q$insert into donations (received_on, donor_name, method) values (current_date, '  ', 'cash')$q$)::text, '-2');
  select id into d from donations where donor_name = 'Probe ผู้บริจาค จำกัด';
  insert into r (label, got, want) values ('recorded_by from session', (select recorded_by from donations where id = d)::text, m::text);
  insert into r (label, got, want) values ('line with amount', pg_temp.try(m, format($q$insert into donation_lines (donation_id, position, description, amount) values (%L, 0, 'Dog food', 1200.50)$q$, d))::text, '1');
  insert into r (label, got, want) values ('in-kind line, null amount', pg_temp.try(m, format($q$insert into donation_lines (donation_id, position, description) values (%L, 1, 'Blankets')$q$, d))::text, '1');
  insert into r (label, got, want) values ('zero amount refused', pg_temp.try(m, format($q$insert into donation_lines (donation_id, position, description, amount) values (%L, 2, 'Zero', 0)$q$, d))::text, '-2');
  insert into r (label, got, want) values ('amount keeps satang', (select amount from donation_lines where donation_id = d and position = 0)::text, '1200.50');
  insert into r (label, got, want) values ('staff reads donations', pg_temp.q(s, '(select count(*) from donations)'), '0');
  insert into r (label, got, want) values ('anon reads donations', pg_temp.q(null, '(select count(*) from donations)', 'anon'), 'ERR:42501');

  n1 := pg_temp.q(m, format('(' || issue || ').number', d, 'TH'));
  insert into r (label, got, want) values ('mgmt issues: the next number', n1, 'LCA' || lpad(c0::text, 7, '0'));
  insert into r (label, got, want) values ('issued_by from session', (select issued_by from donation_receipts where number = n1)::text, m::text);
  insert into r (label, got, want) values ('second live receipt refused', pg_temp.q(m, format('(' || issue || ').number', d, 'TH')), 'ERR:23505');
  insert into r (label, got, want) values ('refused issue did not advance the counter', (select next_value from receipt_counters where series = 'LCA')::text, (c0 + 1)::text);
  insert into r (label, got, want) values ('staff issue refused', pg_temp.q(s, format('(' || issue || ').number', d, 'TH')), 'ERR:42501');
  insert into r (label, got, want) values ('bad country refused', pg_temp.q(m, format('(' || issue || ').number', d, 'FR')), 'ERR:23514');
  insert into r (label, got, want) values ('counter still unmoved', (select next_value from receipt_counters where series = 'LCA')::text, (c0 + 1)::text);
  insert into r (label, got, want) values ('direct insert refused', pg_temp.try(m, format($q$insert into donation_receipts (number, donation_id, country, issued_on, content, issuer) values ('LCA9999999', %L, 'TH', current_date, '{}', '{}')$q$, d))::text, '-1');
  insert into r (label, got, want) values ('content rewrite refused', pg_temp.try(m, format($q$update donation_receipts set content = '{"donorName":"Changed"}' where number = %L$q$, n1))::text, '-2');
  insert into r (label, got, want) values ('mgmt delete refused (no grant)', pg_temp.try(m, format($q$delete from donation_receipts where number = %L$q$, n1))::text, '-1');
  insert into r (label, got, want) values ('owner delete refused (trigger)', pg_temp.try(null, format($q$delete from donation_receipts where number = %L$q$, n1), 'postgres')::text, '-2');
  insert into r (label, got, want) values ('mark sent + drive id', pg_temp.try(m, format($q$update donation_receipts set sent_at = now(), drive_file_id = 'probe' where number = %L$q$, n1))::text, '1');
  insert into r (label, got, want) values ('void without reason refused', pg_temp.try(m, format($q$update donation_receipts set voided_at = now() where number = %L$q$, n1))::text, '-2');
  insert into r (label, got, want) values ('void with reason', pg_temp.try(m, format($q$update donation_receipts set voided_at = now(), voided_by = %L, void_reason = 'Probe: wrong name' where number = %L$q$, m, n1))::text, '1');
  insert into r (label, got, want) values ('void cannot be undone', pg_temp.try(m, format($q$update donation_receipts set voided_at = null, void_reason = null where number = %L$q$, n1))::text, '-2');
  insert into r (label, got, want) values ('voided receipt kept', (select count(*) from donation_receipts where number = n1)::text, '1');
  n2 := pg_temp.q(m, format('(' || issue || ').number', d, 'US'));
  insert into r (label, got, want) values ('re-issue after void: the next number', n2, 'LCA' || lpad((c0 + 1)::text, 7, '0'));
  insert into donations (received_on, donor_name, method) values (current_date, 'Probe two', 'in_kind') returning id into d2;
  n3 := pg_temp.q(m, format('(' || issue || ').number', d2, 'TH'));
  insert into r (label, got, want) values ('another donation: the next again', n3, 'LCA' || lpad((c0 + 2)::text, 7, '0'));
  insert into r (label, got, want) values ('donation with receipts cannot be deleted', pg_temp.try(m, format($q$delete from donations where id = %L$q$, d))::text, '-2');
  insert into r (label, got, want) values ('counter closed to authenticated', pg_temp.q(m, '(select count(*) from receipt_counters)'), 'ERR:42501');
  insert into r (label, got, want) values ('counter write closed to authenticated', pg_temp.try(m, 'update receipt_counters set next_value = 1')::text, '-1');
  select id into rid from donation_receipts where number = n1;
  insert into r (label, got, want) values ('audit: issue, sent and void recorded; refused writes left none', (select count(*) from audit_log where table_name = 'donation_receipts' and row_id = rid)::text, '3');
end $$;
do $$ begin raise exception 'RESULT%RESULT', (select json_agg(json_build_object('l', label, 'got', got, 'want', want) order by n) from r); end $$;
`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const body = await res.json().catch(() => null);
const msg = body?.message ?? JSON.stringify(body);
const m = msg.match(/RESULT(\[[\s\S]*\])RESULT/);
if (!m) { console.log(res.status, msg.slice(0, 2000)); process.exit(1); }
const rows = JSON.parse(m[1]);
let bad = 0;
for (const x of rows) {
  const ok = x.got === x.want;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${x.l}: got ${x.got}${ok ? "" : ` want ${x.want}`}`);
}
console.log(bad ? `${bad} FAILED` : `all ${rows.length} held (rolled back, nothing kept)`);
process.exitCode = bad ? 1 : 0;
