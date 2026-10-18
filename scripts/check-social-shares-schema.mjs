// social_shares / memes / meme_residents (0223): who can read and write, and that a signed-out caller gets nothing.
// Against DEV only. One transaction that always rolls back; assertions are `raise exception 'FAIL …'`.
//
//   node scripts/check-social-shares-schema.mjs
//
// Callers: editor (social.library Edit + photos.resident_manage + resident.record Read), reader (social.library Read
// only), photoman (photos.resident_manage + resident.record Read, no library), nobody (a login with no cells), and anon.
//   memes + meme_residents   editor writes and reads; reader reads, cannot write; photoman, nobody and anon see nothing
//   social_shares (meme)     editor writes; reader reads only; photoman, nobody and anon see nothing
//   social_shares (photo)    editor and photoman write; reader (no resident.record) sees none; nobody and anon nothing
//   guards                   a photo share on a non-resident or missing photo, a meme share on no meme, a bad platform,
//                            a non-https link: refused; recorded_by is the caller, not what they sent; deleting the
//                            photo or the meme takes its shares
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { exitWith } from "./lib/exit.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error((() => { try { return JSON.parse(text).message ?? text; } catch { return text; } })());
  return text ? JSON.parse(text) : [];
}

let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };
const pass = (m) => console.log(`ok   ${m}`);

const P = ["editor", "reader", "photoman", "nobody"];
const U = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const lit = (id) => `'${id}'::uuid`;

const harness = `
do $h$
declare
  v_res uuid; v_photo uuid; v_doc uuid; v_meme uuid; v_meme2 uuid; v_share uuid; n bigint; r record;
  v_ed uuid; v_rd uuid; v_pm uuid; v_no uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-shares-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(U[p])})`).join(",")}) as u(who, id);

  insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
    values ('harness_sh_editor', 'Harness editor', 'custom', true, '/home', 'all', 'any', 'name_type', 'all', false) returning id into v_ed;
  insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
    values ('harness_sh_reader', 'Harness reader', 'custom', true, '/home', 'all', 'any', 'name_type', 'all', false) returning id into v_rd;
  insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
    values ('harness_sh_photoman', 'Harness photoman', 'custom', true, '/home', 'all', 'any', 'name_type', 'all', false) returning id into v_pm;
  insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
    values ('harness_sh_nobody', 'Harness nobody', 'custom', true, '/home', 'all', 'any', 'name_type', 'all', false) returning id into v_no;

  insert into role_permissions (role_id, activity, level) values
    (v_ed, 'social.library', 2), (v_ed, 'photos.resident_manage', 2), (v_ed, 'resident.record', 1),
    (v_rd, 'social.library', 1),
    (v_pm, 'photos.resident_manage', 2), (v_pm, 'resident.record', 1);
  insert into user_roles (user_id, role_id) values (${lit(U.editor)}, v_ed), (${lit(U.reader)}, v_rd), (${lit(U.photoman)}, v_pm), (${lit(U.nobody)}, v_no);

  select id into v_res from residents limit 1;
  if v_res is null then raise exception 'FAIL the dev database has no resident to hang a photo on'; end if;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder)
    values ('resident', v_res, 'harness-shares-photo-' || gen_random_uuid(), 'harness.jpg', 'Shelter') returning id into v_photo;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name)
    values ('maintenance', v_res, 'harness-shares-doc-' || gen_random_uuid(), 'harness.jpg') returning id into v_doc;

  -- the editor adds a meme, features a resident, records a meme share and a photo share
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(U.editor)}, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  insert into memes (drive_file_id, title, caption_en, tags, created_by)
    values ('harness-meme-' || gen_random_uuid(), 'Harness meme', 'a caption', array['appeal'], ${lit(U.nobody)}) returning id into v_meme;
  insert into meme_residents (meme_id, resident_id) values (v_meme, v_res);
  insert into social_shares (owner_type, owner_id, platform, post_url, note, recorded_by)
    values ('meme', v_meme, 'facebook', 'https://example.com/post/1', 'boosted', ${lit(U.nobody)}) returning id into v_share;
  insert into social_shares (owner_type, owner_id, platform) values ('attachment', v_photo, 'instagram');
  reset role;
  if (select created_by from memes where id = v_meme) <> ${lit(U.editor)} then raise exception 'FAIL created_by was taken from the caller, not the database'; end if;
  if (select recorded_by from social_shares where id = v_share) <> ${lit(U.editor)} then raise exception 'FAIL recorded_by was taken from the caller, not the database'; end if;
  if (select shared_on from social_shares where id = v_share) <> shelter_today() then raise exception 'FAIL shared_on should default to the shelter''s today'; end if;

  -- the editor can read and change what it made
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(U.editor)}, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*) into n from social_shares; if n <> 2 then raise exception 'FAIL editor should see 2 shares, saw %', n; end if;
  select count(*) into n from memes; if n < 1 then raise exception 'FAIL editor should see the meme'; end if;
  update memes set archived = true where id = v_meme;
  get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL editor could not archive a meme'; end if;
  reset role;

  -- the guards (as the editor, so the policies pass and the trigger is what refuses)
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(U.editor)}, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  begin insert into social_shares (owner_type, owner_id, platform) values ('attachment', v_doc, 'facebook'); raise exception 'FAIL a share on a non-resident file was accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin insert into social_shares (owner_type, owner_id, platform) values ('attachment', gen_random_uuid(), 'facebook'); raise exception 'FAIL a share on a missing photo was accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin insert into social_shares (owner_type, owner_id, platform) values ('meme', gen_random_uuid(), 'facebook'); raise exception 'FAIL a share on a missing meme was accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin insert into social_shares (owner_type, owner_id, platform) values ('meme', v_meme, 'myspace'); raise exception 'FAIL an unknown platform was accepted';
  exception when check_violation then null; end;
  begin insert into social_shares (owner_type, owner_id, platform, post_url) values ('meme', v_meme, 'facebook', 'javascript:alert(1)'); raise exception 'FAIL a non-https link was accepted';
  exception when check_violation then null; end;
  begin insert into social_shares (owner_type, owner_id, platform) values ('thing', v_meme, 'facebook'); raise exception 'FAIL an unknown owner type was accepted';
  exception when check_violation or insufficient_privilege then null; end;
  begin insert into memes (drive_file_id, title) values ('harness-blank-' || gen_random_uuid(), '   '); raise exception 'FAIL a blank title was accepted';
  exception when check_violation then null; end;
  reset role;

  -- reader: sees memes, the meme share and the meme's residents, writes nothing, sees no photo share
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(U.reader)}, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*) into n from memes where id = v_meme; if n <> 1 then raise exception 'FAIL reader should see the meme'; end if;
  select count(*) into n from meme_residents where meme_id = v_meme; if n <> 1 then raise exception 'FAIL reader should see the meme''s residents'; end if;
  select count(*) into n from social_shares where owner_type = 'meme'; if n <> 1 then raise exception 'FAIL reader should see the meme share'; end if;
  select count(*) into n from social_shares where owner_type = 'attachment'; if n <> 0 then raise exception 'FAIL reader (no resident.record) saw a photo share'; end if;
  begin insert into memes (drive_file_id, title) values ('harness-r-' || gen_random_uuid(), 'x'); raise exception 'FAIL reader added a meme';
  exception when insufficient_privilege then null; end;
  begin insert into social_shares (owner_type, owner_id, platform) values ('meme', v_meme, 'line'); raise exception 'FAIL reader recorded a meme share';
  exception when insufficient_privilege then null; end;
  begin insert into meme_residents (meme_id, resident_id) values (v_meme, v_res); raise exception 'FAIL reader linked a resident';
  exception when insufficient_privilege or unique_violation then null; end;
  update memes set title = 'changed' where id = v_meme; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL reader edited a meme'; end if;
  delete from social_shares where owner_type = 'meme'; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL reader deleted a meme share'; end if;
  reset role;

  -- photoman: records and sees photo shares, cannot see or touch the library
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(U.photoman)}, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*) into n from social_shares where owner_type = 'attachment'; if n <> 1 then raise exception 'FAIL photoman should see the photo share, saw %', n; end if;
  select count(*) into n from social_shares where owner_type = 'meme'; if n <> 0 then raise exception 'FAIL photoman saw a meme share'; end if;
  select count(*) into n from memes; if n <> 0 then raise exception 'FAIL photoman saw a meme'; end if;
  select count(*) into n from meme_residents; if n <> 0 then raise exception 'FAIL photoman saw a meme-resident link'; end if;
  insert into social_shares (owner_type, owner_id, platform, shared_on) values ('attachment', v_photo, 'tiktok', current_date);
  begin insert into social_shares (owner_type, owner_id, platform) values ('meme', v_meme, 'line'); raise exception 'FAIL photoman recorded a meme share';
  exception when insufficient_privilege then null; end;
  begin insert into memes (drive_file_id, title) values ('harness-p-' || gen_random_uuid(), 'x'); raise exception 'FAIL photoman added a meme';
  exception when insufficient_privilege then null; end;
  reset role;

  -- nobody: nothing at all, and every write refused
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(U.nobody)}, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*) into n from social_shares; if n <> 0 then raise exception 'FAIL a login with no cells saw % share(s)', n; end if;
  select count(*) into n from memes; if n <> 0 then raise exception 'FAIL a login with no cells saw a meme'; end if;
  select count(*) into n from meme_residents; if n <> 0 then raise exception 'FAIL a login with no cells saw a meme-resident link'; end if;
  begin insert into social_shares (owner_type, owner_id, platform) values ('attachment', v_photo, 'facebook'); raise exception 'FAIL a login with no cells recorded a photo share';
  exception when insufficient_privilege then null; end;
  begin insert into memes (drive_file_id, title) values ('harness-n-' || gen_random_uuid(), 'x'); raise exception 'FAIL a login with no cells added a meme';
  exception when insufficient_privilege then null; end;
  reset role;

  -- anon: no grant, so permission denied before any policy runs (the check-public-views.mjs probe asserts the same over HTTP)
  set local role anon;
  begin perform 1 from memes limit 1; raise exception 'FAIL anon read memes'; exception when insufficient_privilege then null; end;
  begin perform 1 from meme_residents limit 1; raise exception 'FAIL anon read meme_residents'; exception when insufficient_privilege then null; end;
  begin perform 1 from social_shares limit 1; raise exception 'FAIL anon read social_shares'; exception when insufficient_privilege then null; end;
  begin insert into social_shares (owner_type, owner_id, platform) values ('meme', v_meme, 'facebook'); raise exception 'FAIL anon wrote a share'; exception when insufficient_privilege then null; end;
  reset role;

  -- deleting the owner takes its shares
  delete from attachments where id = v_photo;
  select count(*) into n from social_shares where owner_type = 'attachment' and owner_id = v_photo;
  if n <> 0 then raise exception 'FAIL deleting a photo left % share(s) behind', n; end if;
  delete from memes where id = v_meme;
  select count(*) into n from social_shares where owner_type = 'meme' and owner_id = v_meme;
  if n <> 0 then raise exception 'FAIL deleting a meme left % share(s) behind', n; end if;
  select count(*) into n from meme_residents where meme_id = v_meme;
  if n <> 0 then raise exception 'FAIL deleting a meme left its resident links'; end if;

  raise exception 'shares-harness-ok';
end $h$;
`;
try {
  await sql(harness);
  fail("the harness did not finish");
} catch (e) {
  if (String(e.message).includes("shares-harness-ok")) pass("memes, meme_residents and social_shares: write/read follow the activities, anon and a no-cell login get nothing, guards refuse bad owners, platforms and links, deleting an owner takes its shares");
  else fail(`harness: ${e.message}`);
}

console.log(failed ? `\n${failed} FAILED` : "\nAll checks passed.");
await exitWith(failed ? 1 : 0);
