// 0191 (donation channels, the schema half) exercised on dev without keeping anything: the file is applied inside
// begin..., assertions run under real management, 2IC and anon sessions, and a final raise rolls it all back.
//
//   node scripts/check-donation-channels-schema.mjs
//
// Covers: who writes (website.content), anon has no grant on the table, a HIDDEN row is absent from
// public_donation_channels while a shown one is present, the https and own-domain checks (look-alikes included),
// stamps from the session, and the QR file being served only while its row is shown.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
const mig = readFileSync(join(root, "supabase/migrations/0191_donation_channels.sql"), "utf8");
const sql = `
begin;
${mig}
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
do $$
declare m uuid; s uuid;
begin
  select ur.user_id into m from user_roles ur join roles x on x.id = ur.role_id where x.key = 'management' and ur.archived_at is null limit 1;
  select ur.user_id into s from user_roles ur join roles x on x.id = ur.role_id where x.key = 'second_in_command' and ur.archived_at is null limit 1;
  insert into r (label, got, want) values ('logins found', (m is not null and s is not null)::text, 'true');
  insert into r (label, got, want) values ('mgmt adds paypal', pg_temp.try(m, $q$insert into donation_channels (way, label, url, sort_order) values ('paypal', 'PayPal', 'https://www.paypal.com/donate/?hosted_button_id=X', 1)$q$)::text, '1');
  insert into r (label, got, want) values ('paypal.me ok', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('paypal', 'P2', 'https://paypal.me/lanna')$q$)::text, '1');
  insert into r (label, got, want) values ('donorbox ok', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('donorbox', 'DonorBox', 'https://donorbox.org/lanna')$q$)::text, '1');
  insert into r (label, got, want) values ('wise ok', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('wise', 'Wise', 'https://wise.com/pay/me/lanna')$q$)::text, '1');
  insert into r (label, got, want) values ('http refused', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('paypal', 'X', 'http://paypal.com/x')$q$)::text, '-2');
  insert into r (label, got, want) values ('paypal.com.evil refused', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('paypal', 'X', 'https://paypal.com.evil.test/x')$q$)::text, '-2');
  insert into r (label, got, want) values ('secure-paypal-donate.com refused', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('paypal', 'X', 'https://secure-paypal-donate.com/x')$q$)::text, '-2');
  insert into r (label, got, want) values ('userinfo trick refused', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('wise', 'X', 'https://wise.com@evil.test/x')$q$)::text, '-2');
  insert into r (label, got, want) values ('path trick refused', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('donorbox', 'X', 'https://evil.test/donorbox.org')$q$)::text, '-2');
  insert into r (label, got, want) values ('wrong company refused', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('wise', 'X', 'https://paypal.com/x')$q$)::text, '-2');
  insert into r (label, got, want) values ('other may link to any https', pg_temp.try(m, $q$insert into donation_channels (way, label, url) values ('other', 'Other', 'https://example.org/give')$q$)::text, '1');
  insert into r (label, got, want) values ('bad way', pg_temp.try(m, $q$insert into donation_channels (way, label) values ('bitcoin', 'X')$q$)::text, '-2');
  insert into r (label, got, want) values ('blank label', pg_temp.try(m, $q$insert into donation_channels (way, label) values ('other', '  ')$q$)::text, '-2');
  insert into r (label, got, want) values ('2IC cannot add', pg_temp.try(s, $q$insert into donation_channels (way, label) values ('other', 'X')$q$)::text, '-1');
  insert into r (label, got, want) values ('anon cannot add', pg_temp.try(null, $q$insert into donation_channels (way, label) values ('other', 'X')$q$, 'anon')::text, '-1');
  insert into r (label, got, want) values ('created_by from session', (select created_by from donation_channels where label = 'PayPal')::text, m::text);
  insert into donation_channels (way, label, bank_name, account_number, qr_drive_file_id, shown) values ('promptpay', 'Hidden PromptPay', 'SECRETBANK', '999-HIDDEN', 'hidden-qr', false);
  insert into donation_channels (way, label, bank_name, account_number, qr_drive_file_id, shown) values ('bank_transfer', 'Shown bank', 'Kasikorn', '123-SHOWN', 'shown-qr', true);
  insert into r (label, got, want) values ('anon reads the table', pg_temp.q(null, '(select count(*) from donation_channels)', 'anon'), 'ERR:42501');
  insert into r (label, got, want) values ('anon sees shown row in view', pg_temp.q(null, $q$(select count(*) from public_donation_channels where label = 'Shown bank')$q$, 'anon'), '1');
  insert into r (label, got, want) values ('anon does NOT see hidden row', pg_temp.q(null, $q$(select count(*) from public_donation_channels where label = 'Hidden PromptPay' or account_number = '999-HIDDEN')$q$, 'anon'), '0');
  insert into r (label, got, want) values ('QR of shown row served', pg_temp.q(null, $q$is_public_drive_file('shown-qr')$q$, 'anon'), 'true');
  insert into r (label, got, want) values ('QR of hidden row not served', pg_temp.q(null, $q$is_public_drive_file('hidden-qr')$q$, 'anon'), 'false');
  update donation_channels set shown = true where label = 'Hidden PromptPay';
  insert into r (label, got, want) values ('showing it makes it public', pg_temp.q(null, $q$(select count(*) from public_donation_channels where label = 'Hidden PromptPay')$q$, 'anon'), '1');
  update donation_channels set shown = false where label = 'Hidden PromptPay';
  insert into r (label, got, want) values ('hiding it again removes it', pg_temp.q(null, $q$(select count(*) from public_donation_channels where label = 'Hidden PromptPay')$q$, 'anon'), '0');
  insert into r (label, got, want) values ('mgmt reads table', (pg_temp.q(m, '(select count(*) from donation_channels)')::int > 0)::text, 'true');
  insert into r (label, got, want) values ('2IC reads table', pg_temp.q(s, '(select count(*) from donation_channels)'), '0');
  insert into r (label, got, want) values ('label queued for Thai', (select (count(*) > 0)::text from translations where table_name = 'donation_channels' and column_name = 'label'), 'true');
  insert into r (label, got, want) values ('view carries no created_by', pg_temp.q(null, '(select count(created_by) from public_donation_channels)', 'anon'), 'ERR:42703');
  insert into r (label, got, want) values ('nobody can write the view', (has_table_privilege('anon', 'public_donation_channels', 'delete') or has_table_privilege('authenticated', 'public_donation_channels', 'insert'))::text, 'false');
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
