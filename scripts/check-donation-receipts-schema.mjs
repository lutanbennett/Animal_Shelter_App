// 0168 (donation receipts) exercised on dev without keeping anything: assertions run under real
// management, 2IC and anon sessions inside begin…, and a final raise rolls it all back, the
// receipt counter included.
//
//   node scripts/check-donation-receipts-schema.mjs
//
// Covers: who writes (the donation.receipt cell: management yes, 2IC and anon no), the line
// constraints (in kind is null, never 0), issuing takes consecutive numbers and a refused issue
// does not advance the counter (no gaps), one live receipt per donation, a receipt cannot be
// inserted directly, rewritten or deleted, a void needs a reason and cannot be undone, a re-issue
// after a void takes the next number, the counter is closed to the API, and the audit log
// records the receipt.
//
// And the issuer (0176): every issue here passes a FORGED issuer, and the receipt must store the
// real one regardless, built by receipt_issuer() in SQL. The expected value is read from
// src/lib/donations/issuer.ts, so the SQL copy and the TypeScript copy cannot drift apart without
// this going red. If this fails on "forged issuer ignored", anyone holding donation.receipt can
// mint a receipt in any organisation's name again: do not "fix" the test, fix the function.
//
// And the content (0177): every issue here also passes FORGED content (a million baht, another
// donor), and the receipt must store what the donation says, built by receipt_content() in SQL. The
// expected value is built by receiptContentFor() in src/lib/donations/donations.ts, for the probe
// donations here (lines entered out of order, in kind, satang, a Thai name, a linked contact under
// another name, no lines) and for every real donation on dev. Compared as text, so a stored 1200.50
// where the app prints 1200.5 fails too. If "forged content ignored" fails, anyone holding
// donation.receipt can issue a receipt for an amount nobody gave; if a "mirrors receiptContentFor"
// line fails, the two copies have drifted and every new receipt says something the app would not
// have printed. Fix the function, never the test.
import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
// donations.ts imports "./receipt" without an extension, as Next resolves it; Node needs the .ts.
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith(".") && ctx.parentURL?.endsWith(".ts") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
const { receiptIssuer } = await import(pathToFileURL(join(root, "src/lib/donations/issuer.ts")).href);
const want = (c) => JSON.stringify(receiptIssuer(c)).replaceAll("'", "''");
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { receiptContentFor } = await import(pathToFileURL(join(root, "src/lib/donations/donations.ts")).href);

async function query(q) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  return { res, body: await res.json().catch(() => null) };
}
const lit = (v) => (v == null ? "null" : "'" + String(v).replaceAll("'", "''") + "'");
// What the app would print, as SQL text. Through jsonb, so only the values count, not key order.
const wantContent = (donor, lines) => `(${lit(JSON.stringify(receiptContentFor(donor, lines)))}::jsonb)::text`;

// Probe donations (rolled back): each line is [description, amount as the database returns it, position].
// Lines are inserted in the order given, so the first case stores position 1 before position 0.
const cases = [
  { label: "several lines, entered out of order", donor: "Probe several", method: "bank_transfer", lines: [["Second", "250.00", 1], ["First", "1000.10", 0], ["Third", "0.05", 2]] },
  { label: "satang that floats would get wrong", donor: "Probe satang", method: "cash", lines: [["A", "0.10", 0], ["B", "0.20", 1]] },
  { label: "the largest amount a line takes", donor: "Probe large", method: "bank_transfer", lines: [["Big", "9999999999.99", 0], ["Small", "0.01", 1]] },
  { label: "in kind (no amounts, total 0)", donor: "Probe in kind", method: "in_kind", lines: [["Rice, 20 kg", null, 0], ["Blankets", null, 1]] },
  { label: "a Thai donor name", donor: "บริษัท ทดสอบ จำกัด (คุณสมศรี)", method: "promptpay", lines: [["ค่าอาหารสุนัข", "2500.50", 0]] },
  { label: "a linked contact: the donor name typed, not the contact's", donor: "Probe typed name", method: "cash", contact: true, lines: [["Gift", "100.00", 0]] },
  { label: "a description with quotes and a backslash", donor: `Probe "O'Brien" \\ co`, method: "cash", lines: [[`Food "premium" \\ 2 bags`, "42.00", 0]] },
];
const want_ = (c) => wantContent(c.donor, [...c.lines].sort((a, b) => a[2] - b[2]).map(([description, amount]) => ({ description, amount })));

// Every real donation on dev, read now and built by the app's own function.
const real = await query(
  "select d.id, d.donor_name, coalesce((select json_agg(json_build_object('description', l.description, 'amount', l.amount::text) order by l.position) from donation_lines l where l.donation_id = d.id), '[]') as lines from donations d order by d.created_at",
);
if (!Array.isArray(real.body)) { console.log(real.res.status, JSON.stringify(real.body).slice(0, 2000)); process.exit(1); }

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
  issue text := 'issue_donation_receipt(%L, %L, current_date, ''{"name":"Forged Org Ltd","addressLines":["1 Fake Street"],"registrationLines":["Tax ID: 000"],"statementLines":["No goods or services were provided"]}''::jsonb, ''{"donorName":"Forged donor","lines":[{"description":"Forged gift","amount":1000000}],"total":1000000,"currency":"THB"}''::jsonb)';
  cid uuid; cn text; px uuid; pn text;
  th text := ('${want("TH")}'::jsonb)::text;
  us text := ('${want("US")}'::jsonb)::text;
begin
  select ur.user_id into m from user_roles ur join roles x on x.id = ur.role_id where x.key = 'management' and ur.archived_at is null limit 1;
  select ur.user_id into s from user_roles ur join roles x on x.id = ur.role_id where x.key = 'second_in_command' and ur.archived_at is null limit 1;  -- the 2IC: Staff until 0173 retired it
  insert into r (label, got, want) values ('logins found', (m is not null and s is not null)::text, 'true');
  select next_value into c0 from receipt_counters where series = 'LCA';

  insert into r (label, got, want) values ('mgmt records donation', pg_temp.try(m, $q$insert into donations (received_on, donor_name, method) values (current_date, 'Probe ผู้บริจาค จำกัด', 'cash')$q$)::text, '1');
  insert into r (label, got, want) values ('2IC records donation', pg_temp.try(s, $q$insert into donations (received_on, donor_name, method) values (current_date, 'Staff probe', 'cash')$q$)::text, '-1');
  insert into r (label, got, want) values ('anon records donation', pg_temp.try(null, $q$insert into donations (received_on, donor_name, method) values (current_date, 'Anon', 'cash')$q$, 'anon')::text, '-1');
  insert into r (label, got, want) values ('bad method refused', pg_temp.try(m, $q$insert into donations (received_on, donor_name, method) values (current_date, 'X', 'crypto')$q$)::text, '-2');
  insert into r (label, got, want) values ('blank donor refused', pg_temp.try(m, $q$insert into donations (received_on, donor_name, method) values (current_date, '  ', 'cash')$q$)::text, '-2');
  select id into d from donations where donor_name = 'Probe ผู้บริจาค จำกัด';
  insert into r (label, got, want) values ('recorded_by from session', (select recorded_by from donations where id = d)::text, m::text);
  insert into r (label, got, want) values ('line with amount', pg_temp.try(m, format($q$insert into donation_lines (donation_id, position, description, amount) values (%L, 0, 'Dog food', 1200.50)$q$, d))::text, '1');
  insert into r (label, got, want) values ('in-kind line, null amount', pg_temp.try(m, format($q$insert into donation_lines (donation_id, position, description) values (%L, 1, 'Blankets')$q$, d))::text, '1');
  insert into r (label, got, want) values ('zero amount refused', pg_temp.try(m, format($q$insert into donation_lines (donation_id, position, description, amount) values (%L, 2, 'Zero', 0)$q$, d))::text, '-2');
  insert into r (label, got, want) values ('amount keeps satang', (select amount from donation_lines where donation_id = d and position = 0)::text, '1200.50');
  insert into r (label, got, want) values ('2IC reads donations', pg_temp.q(s, '(select count(*) from donations)'), '0');
  insert into r (label, got, want) values ('anon reads donations', pg_temp.q(null, '(select count(*) from donations)', 'anon'), 'ERR:42501');

  n1 := pg_temp.q(m, format('(' || issue || ').number', d, 'TH'));
  insert into r (label, got, want) values ('mgmt issues: the next number', n1, 'LCA' || lpad(c0::text, 7, '0'));
  insert into r (label, got, want) values ('issued_by from session', (select issued_by from donation_receipts where number = n1)::text, m::text);
  insert into r (label, got, want) values ('forged issuer ignored: TH receipt stores the real issuer', (select issuer::text from donation_receipts where number = n1), th);
  insert into r (label, got, want) values ('forged content ignored: the receipt says what the donation says', (select content::text from donation_receipts where number = n1), ${wantContent("Probe ผู้บริจาค จำกัด", [{ description: "Dog food", amount: "1200.50" }, { description: "Blankets", amount: null }])});
  insert into r (label, got, want) values ('receipt_issuer(TH) mirrors issuer.ts', pg_temp.q(m, $q$receipt_issuer('TH')$q$), th);
  insert into r (label, got, want) values ('receipt_issuer(US) mirrors issuer.ts', pg_temp.q(m, $q$receipt_issuer('US')$q$), us);
  insert into r (label, got, want) values ('receipt_issuer(FR) refused', pg_temp.q(m, $q$receipt_issuer('FR')$q$), 'ERR:22023');
  insert into r (label, got, want) values ('second live receipt refused', pg_temp.q(m, format('(' || issue || ').number', d, 'TH')), 'ERR:23505');
  insert into r (label, got, want) values ('refused issue did not advance the counter', (select next_value from receipt_counters where series = 'LCA')::text, (c0 + 1)::text);
  insert into r (label, got, want) values ('2IC issue refused', pg_temp.q(s, format('(' || issue || ').number', d, 'TH')), 'ERR:42501');
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
  insert into r (label, got, want) values ('forged issuer ignored: US receipt stores the US issuer', (select issuer::text from donation_receipts where number = n2), us);
  insert into donations (received_on, donor_name, method) values (current_date, 'Probe two', 'in_kind') returning id into d2;
  n3 := pg_temp.q(m, format('(' || issue || ').number', d2, 'TH'));
  insert into r (label, got, want) values ('another donation: the next again', n3, 'LCA' || lpad((c0 + 2)::text, 7, '0'));
  insert into r (label, got, want) values ('forged content ignored: a donation with no lines prints none, total 0', (select content::text from donation_receipts where number = n3), ${wantContent("Probe two", [])});
  insert into r (label, got, want) values ('donation with receipts cannot be deleted', pg_temp.try(m, format($q$delete from donations where id = %L$q$, d))::text, '-2');
  insert into r (label, got, want) values ('counter closed to authenticated', pg_temp.q(m, '(select count(*) from receipt_counters)'), 'ERR:42501');
  insert into r (label, got, want) values ('counter write closed to authenticated', pg_temp.try(m, 'update receipt_counters set next_value = 1')::text, '-1');
  select id into rid from donation_receipts where number = n1;
  insert into r (label, got, want) values ('audit: issue, sent and void recorded; refused writes left none', (select count(*) from audit_log where table_name = 'donation_receipts' and row_id = rid)::text, '3');

  -- receipt_content() mirrors receiptContentFor(), on probe donations, then on issue with forged content.
  select id, name into cid, cn from contacts where name is not null order by created_at limit 1;
  insert into r (label, got, want) values ('a contact to link', (cid is not null)::text, 'true');
${cases
  .map(
    (c) => `  insert into donations (received_on, donor_name, method, contact_id) values (current_date, ${lit(c.donor)}, '${c.method}', ${c.contact ? "cid" : "null"}) returning id, donor_name into px, pn;
${c.lines.map(([desc, amt, pos]) => `  insert into donation_lines (donation_id, position, description, amount) values (px, ${pos}, ${lit(desc)}, ${amt == null ? "null" : `${amt}::numeric`});`).join("\n")}
  insert into r (label, got, want) values (${lit(`receipt_content mirrors receiptContentFor: ${c.label}`)}, pg_temp.q(m, format('receipt_content(%L)', px)), ${want_(c)});
  perform pg_temp.q(m, format('(' || issue || ').number', px, 'TH'));
  insert into r (label, got, want) values (${lit(`forged content ignored: ${c.label}`)}, (select content::text from donation_receipts where donation_id = px and voided_at is null), ${want_(c)});`,
  )
  .join("\n")}
  insert into r (label, got, want) values ('the linked contact is named otherwise', (cn is distinct from 'Probe typed name')::text, 'true');
  insert into r (label, got, want) values ('receipt_content of no donation is null', coalesce(pg_temp.q(m, $q$receipt_content(gen_random_uuid())$q$), 'null'), 'null');
  insert into r (label, got, want) values ('2IC cannot read a donation through receipt_content', coalesce(pg_temp.q(s, format('receipt_content(%L)', d)), 'null'), 'null');
  insert into r (label, got, want) values ('anon cannot call receipt_content', pg_temp.q(null, format('receipt_content(%L)', d), 'anon'), 'ERR:42501');

  -- Every real donation on dev, as it stands: what the database would store against what the app would send.
${real.body
  .map(
    (x) => `  insert into r (label, got, want) values (${lit(`receipt_content mirrors receiptContentFor: real donation ${x.id.slice(0, 8)}`)}, pg_temp.q(m, ${lit(`receipt_content('${x.id}')`)}), ${wantContent(x.donor_name, x.lines)});`,
  )
  .join("\n")}
end $$;
do $$ begin raise exception 'RESULT%RESULT', (select json_agg(json_build_object('l', label, 'got', got, 'want', want) order by n) from r); end $$;
`;
const { res, body } = await query(sql);
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
