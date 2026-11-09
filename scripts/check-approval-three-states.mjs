// Rollback harness for 0318_approval_three_states.sql against DEV only. One transaction, a deliberate
// `raise exception` carrying the evidence, so nothing commits.   node scripts/check-approval-three-states.mjs
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $h$
declare
  r uuid; v_user uuid; a uuid; n_total int; n_ok int; n_blank int; n_priv int;
begin
  -- 1. back-fill identity: every row approved today is Public ok, nothing was made blank or private
  select count(*), count(*) filter (where approved_at is not null), count(*) filter (where approved_at is null),
         count(*) filter (where approval = 'private_only')
    into n_total, n_ok, n_blank, n_priv from attachments;
  if (select count(*) from attachments where approved_at is not null and approval is distinct from 'public_ok') > 0 then raise exception 'FAIL 1a approved row not public_ok'; end if;
  if (select count(*) from attachments where approved_at is null and private_only_at is null and approval is not null) > 0 then raise exception 'FAIL 1b blank row has a state'; end if;
  if n_priv <> 0 then raise exception 'FAIL 1c % rows already private_only', n_priv; end if;

  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0318', 'Dog', true, 'R-H318A') returning id into r;
  v_user := gen_random_uuid(); insert into auth.users (id, email) values (v_user, 'h-nonapprover-' || v_user || '@example.invalid'); -- a disposable login holding no card, so the test never depends on who holds photos.approve on dev

  -- 2. a non-publisher files a photo: it waits (blank), and cannot pre-set Private only
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_by, private_only_at)
    values ('resident', r, 'h0318a', 'a.jpg', 'Shelter', v_user, now()) returning id into a;
  if (select approval from attachments where id = a) is not null then raise exception 'FAIL 2 new photo not blank'; end if;
  begin
    update attachments set private_only_at = now() where id = a;
    raise exception 'FAIL 3 a non-approver marked Private only';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;

  -- 4. an approver (script) refuses it: Private only, stamped, not public
  perform set_config('request.jwt.claims', '', true);
  update attachments set private_only_at = now() where id = a;
  if (select approval from attachments where id = a) <> 'private_only' then raise exception 'FAIL 4a not private_only'; end if;
  if (select approved_at from attachments where id = a) is not null then raise exception 'FAIL 4b still approved'; end if;
  set local role anon;
  if is_public_drive_file('h0318a') or exists (select 1 from public_resident_photos where drive_file_id = 'h0318a') then reset role; raise exception 'FAIL 4c Private only photo is public'; end if;
  reset role;

  -- 5. both answers at once is refused
  begin
    update attachments set approved_at = now(), private_only_at = now() where id = a;
    raise exception 'FAIL 5 both answers accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;

  -- 6. changing its mind: approve -> Public ok, clears Private only, and is public
  update attachments set approved_at = now(), private_only_at = null where id = a;
  if (select approval from attachments where id = a) <> 'public_ok' then raise exception 'FAIL 6a not public_ok'; end if;
  set local role anon;
  if not is_public_drive_file('h0318a') then reset role; raise exception 'FAIL 6b approved photo not public'; end if;
  reset role;

  -- 7. and back to Private only, then cleared to not reviewed
  update attachments set private_only_at = now(), approved_at = null where id = a;
  if (select approval from attachments where id = a) <> 'private_only' then raise exception 'FAIL 7a'; end if;
  update attachments set private_only_at = null where id = a;
  if (select approval from attachments where id = a) is not null then raise exception 'FAIL 7b not cleared'; end if;

  raise exception 'HARNESS-OK back-fill identity (% rows: % public_ok, % not reviewed, 0 private_only) | non-approver cannot set Private only | Private only never public | both answers refused | switching clears the other | clearing returns to not reviewed', n_total, n_ok, n_blank;
end;
$h$;
rollback;
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
