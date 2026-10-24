// hidden-public-pages-schema (0256): the record defaults empty, only website editors write it, the database
// refuses Home/Privacy/unknown keys, a change is audited, and a signed-out read through the public view works.
// Against DEV only, one transaction that is always rolled back; it applies 0256's own text inside it, so it
// works before and after the file is applied for real.
//
//   node scripts/check-hidden-public-pages-schema.mjs     (from the repo root; dev only)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync("supabase/migrations/0256_hidden_public_pages.sql", "utf8");

const harness = `
begin;
create temp table res (k text, v text);
grant all on res to public;
${migration}

do $t$
declare
  v_admin uuid; v_mgmt uuid; v_vol uuid; n int; ok boolean;
begin
  insert into res select 'default_nonempty', count(*)::text from site_content where cardinality(hidden_public_pages) > 0;
  insert into res select 'rows', count(*)::text from site_content;

  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id where r.key = 'admin' and ur.archived_at is null limit 1;
  select ur.user_id into v_mgmt from user_roles ur join roles r on r.id = ur.role_id where r.key = 'management' and ur.archived_at is null limit 1;
  select ur.user_id into v_vol from user_roles ur join roles r on r.id = ur.role_id where r.key = 'volunteer' and ur.archived_at is null limit 1;
  insert into res values ('have_users', (v_admin is not null)::text || '/' || (v_mgmt is not null)::text || '/' || (v_vol is not null)::text);

  -- a website editor (Management has website.content) writes it, through RLS
  if v_mgmt is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_mgmt, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    update site_content set hidden_public_pages = array['page:desexing', 'section:services'];
    get diagnostics n = row_count;
    insert into res values ('editor_rows', n::text);
    reset role;
    insert into res select 'editor_value', hidden_public_pages::text from site_content;
    insert into res select 'audit_rows', count(*)::text from audit_log where table_name = 'site_content' and new_row ? 'hidden_public_pages' and actor = v_mgmt;
    update site_content set hidden_public_pages = '{}';
    -- reset above is the owner; undo its audit noise is unnecessary, the transaction rolls back
  end if;

  -- someone who cannot edit the website changes nothing
  if v_vol is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_vol, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    update site_content set hidden_public_pages = array['page:foster'];
    get diagnostics n = row_count;
    insert into res values ('volunteer_rows', n::text);
    reset role;
    insert into res select 'volunteer_value', hidden_public_pages::text from site_content;
  end if;

  -- the database refuses Home, Privacy, the card/QR paths and a typo
  foreach ok in array array[true] loop
    declare k text;
    begin
      foreach k in array array['page:home', 'page:privacy', 'page:r', 'page:e', 'page:fostr', 'foster'] loop
        begin
          update site_content set hidden_public_pages = array[k];
          insert into res values ('refused_' || k, 'ACCEPTED');
        exception when check_violation then
          insert into res values ('refused_' || k, 'refused');
        end;
      end loop;
    end;
  end loop;

  -- signed out: anon reads the column through the public view, and not the base table
  update site_content set hidden_public_pages = array['page:desexing'];
  set local role anon;
  insert into res select 'anon_view', hidden_public_pages::text from public_site_content;
  begin
    perform 1 from site_content;
    get diagnostics n = row_count;
    insert into res values ('anon_base_rows', n::text);
  exception when insufficient_privilege then
    insert into res values ('anon_base_rows', 'denied');
  end;
  reset role;
end $t$;

do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await r.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${r.status}): ${msg.slice(0, 2000)}`);
const rows = JSON.parse(m[1]);
const get = (k) => rows.find((x) => x.k === k)?.v;

let fails = 0;
const check = (k, want, what) => {
  const v = get(k);
  if (v === want) console.log(`ok    ${what} (${v})`); else { fails++; console.log(`FAIL  ${what} - got ${v}, wanted ${want}`); }
};
check("default_nonempty", "0", "default hides nothing");
check("rows", "1", "one settings row");
console.log(`INFO  users admin/management/volunteer present: ${get("have_users")}`);
check("editor_rows", "1", "a website editor (Management) can write it");
check("editor_value", "{page:desexing,section:services}", "the editor's value stuck");
check("audit_rows", "1", "the change is audited with the editor as actor");
check("volunteer_rows", "0", "a Volunteer cannot write it");
check("volunteer_value", "{}", "the Volunteer's value did not stick");
for (const k of ["page:home", "page:privacy", "page:r", "page:e", "page:fostr", "foster"]) check(`refused_${k}`, "refused", `${k} refused by the database`);
check("anon_view", "{page:desexing}", "signed-out read through public_site_content works");
check("anon_base_rows", "denied", "signed-out read of site_content itself is denied");
if (fails) { console.log(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall ok");
