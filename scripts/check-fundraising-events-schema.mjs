// 0312 (fundraising events, the schema half) exercised on dev without keeping anything: assertions run under a real admin,
// a login holding only the new card, a login without it, and anon, and a final raise rolls it all back.
//
//   node scripts/check-fundraising-events-schema.mjs
//
// The assertion that matters is the last block: the card opens events and nothing else.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { exitWith } from "./lib/exit.mjs";
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
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
-- Runs as the table owner but with a session identity, so the BEFORE INSERT approval stamp sees auth.uid().
create function pg_temp.as_owner(p_uid uuid, p_sql text) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  execute p_sql;
  perform set_config('request.jwt.claims', '', true);
end $f$;
create temp table r (n serial, label text, got text, want text);
do $$
declare a uuid; m uuid; n uuid; rn uuid; rn2 uuid; ev uuid; res uuid; att uuid; att2 uuid; att3 uuid; att4 uuid;
begin
  select ur.user_id into a from user_roles ur join roles x on x.id = ur.role_id where x.key = 'admin' and ur.archived_at is null limit 1;
  -- m holds exactly the new card; n holds exactly View residents (no events.run). Existing logins re-roled inside this rolled-back transaction.
  select user_id into m from user_roles where archived_at is null and user_id <> a order by user_id limit 1;
  select user_id into n from user_roles where archived_at is null and user_id not in (a, m) order by user_id limit 1;
  delete from user_roles where user_id in (m, n);
  insert into roles (key, name, kind, home_path) values ('harness_events', 'Harness: events', 'custom', '/home') returning id into rn;
  insert into role_cards (role_id, card) values (rn, 'run_fundraising_events');
  insert into user_roles (user_id, role_id) values (m, rn);
  insert into roles (key, name, kind, home_path) values ('harness_no_events', 'Harness: no events', 'custom', '/home') returning id into rn2;
  insert into role_cards (role_id, card) values (rn2, 'view_residents');
  insert into user_roles (user_id, role_id) values (n, rn2);
  select id into res from residents order by id limit 1;
  insert into r (label, got, want) values ('logins and a resident found', (a is not null and m is not null and n is not null and res is not null)::text, 'true');

  insert into r (label, got, want) values ('anon cannot read events', pg_temp.q(null, '(select count(*) from fundraising_events)', 'anon'), 'ERR:42501');
  insert into r (label, got, want) values ('a login without events.run cannot create', pg_temp.try(n, $q$insert into fundraising_events (title, event_date) values ('X', current_date)$q$)::text, '-1');
  insert into r (label, got, want) values ('the card holder creates an event', pg_temp.try(m, $q$insert into fundraising_events (title, event_date) values ('Probe event', current_date)$q$)::text, '1');
  select id into ev from fundraising_events where title = 'Probe event';
  insert into r (label, got, want) values ('created_by comes from the session', (select created_by from fundraising_events where id = ev)::text, m::text);
  insert into r (label, got, want) values ('a login without events.run sees no events', pg_temp.q(n, '(select count(*) from fundraising_events)'), '0');
  insert into r (label, got, want) values ('admin creates one too', pg_temp.try(a, $q$insert into fundraising_events (title, event_date) values ('Admin event', current_date)$q$)::text, '1');
  insert into r (label, got, want) values ('end before start refused', pg_temp.try(m, format($q$update fundraising_events set end_date = current_date - 1 where id = %L$q$, ev))::text, '-2');
  insert into r (label, got, want) values ('a cancelled event cannot be published', pg_temp.try(m, format($q$update fundraising_events set status = 'cancelled', published = true where id = %L$q$, ev))::text, '-2');
  insert into r (label, got, want) values ('http link refused', pg_temp.try(m, format($q$update fundraising_events set social_links = array['http://facebook.com/x'] where id = %L$q$, ev))::text, '-2');
  insert into r (label, got, want) values ('https link accepted', pg_temp.try(m, format($q$update fundraising_events set social_links = array['https://www.facebook.com/x/posts/1'] where id = %L$q$, ev))::text, '1');
  insert into r (label, got, want) values ('the card holder can publish', pg_temp.try(m, format($q$update fundraising_events set published = true where id = %L$q$, ev))::text, '1');
  insert into r (label, got, want) values ('publishing stamps published_at', (select published_at is not null from fundraising_events where id = ev)::text, 'true');

  -- The gallery: an event photo must be an image attachment filed under that very event, and it WAITS for approval.
  perform pg_temp.as_owner(m, format($q$insert into attachments (owner_type, owner_id, drive_file_id, file_name) values ('event', %L, 'harness-1', 'day.jpg')$q$, ev));
  perform pg_temp.as_owner(m, format($q$insert into attachments (owner_type, owner_id, drive_file_id, file_name) values ('event', %L, 'harness-2', 'notes.pdf')$q$, ev));
  perform pg_temp.as_owner(m, format($q$insert into attachments (owner_type, owner_id, drive_file_id, file_name) values ('resident', %L, 'harness-3', 'dog.jpg')$q$, res));
  perform pg_temp.as_owner(a, format($q$insert into attachments (owner_type, owner_id, drive_file_id, file_name) values ('event', %L, 'harness-4', 'approver.jpg')$q$, ev));
  select id into att from attachments where drive_file_id = 'harness-1';
  select id into att2 from attachments where drive_file_id = 'harness-2';
  select id into att3 from attachments where drive_file_id = 'harness-3';
  select id into att4 from attachments where drive_file_id = 'harness-4';
  insert into r (label, got, want) values ('an event photo from a non-approver waits', (select approved_at is null from attachments where id = att)::text, 'true');
  insert into r (label, got, want) values ('an event photo from an approver is approved', (select approved_at is not null from attachments where id = att4)::text, 'true');
  insert into r (label, got, want) values ('a resident photo from a non-publisher still waits (0309 unchanged)', (select approved_at is null from attachments where id = att3)::text, 'true');
  insert into r (label, got, want) values ('the card holder cannot approve the photo', pg_temp.try(m, format($q$update attachments set approved_at = now() where id = %L$q$, att))::text, '0');
  insert into r (label, got, want) values ('and it is still waiting afterwards', (select approved_at is null from attachments where id = att)::text, 'true');
  insert into r (label, got, want) values ('the card holder can put the image in the gallery', pg_temp.try(m, format($q$insert into fundraising_event_photos (event_id, attachment_id, is_meme) values (%L, %L, true)$q$, ev, att))::text, '1');
  insert into r (label, got, want) values ('a non-image file is refused', pg_temp.try(m, format($q$insert into fundraising_event_photos (event_id, attachment_id) values (%L, %L)$q$, ev, att2))::text, '-2');
  insert into r (label, got, want) values ('another owner type is refused', pg_temp.try(m, format($q$insert into fundraising_event_photos (event_id, attachment_id) values (%L, %L)$q$, ev, att3))::text, '-2');
  insert into r (label, got, want) values ('a login without events.run cannot touch the gallery', pg_temp.try(n, format($q$insert into fundraising_event_photos (event_id, attachment_id) values (%L, %L)$q$, ev, att4))::text, '-1');
  insert into r (label, got, want) values ('record_attachment still refuses event until the app half', pg_temp.q(m, format($q$(select count(*) from record_attachment('event', %L, null, 'harness-5', 'x.jpg', null))$q$, ev)), 'ERR:P0001');

  -- NOTHING ELSE BECAME WRITABLE for the card holder.
  insert into r (label, got, want) values ('card holder cannot create an appeal', pg_temp.try(m, format($q$insert into appeals (resident_id, title, target_amount) values (%L, 'X', 100)$q$, res))::text, '-1');
  insert into r (label, got, want) values ('card holder cannot change a project folder', pg_temp.try(m, $q$update project_folders set is_public = true$q$)::text, '0');
  insert into r (label, got, want) values ('card holder cannot write residents', pg_temp.try(m, $q$update residents set name = name$q$)::text, '0');
  insert into r (label, got, want) values ('the card grants exactly one activity', (select string_agg(activity, ',' order by activity) from card_grants where card = 'run_fundraising_events'), 'events.run');
  insert into r (label, got, want) values ('events.run is granted by that card alone', (select string_agg(card, ',' order by card) from card_grants where activity = 'events.run'), 'run_fundraising_events');
  insert into r (label, got, want) values ('no role holds the card outside this rolled-back harness', (select count(*) from role_cards where card = 'run_fundraising_events' and role_id <> rn)::text, '0');
  insert into r (label, got, want) values ('the Thai queue is registered for the title', (select count(*) > 0 from translatable_fields where table_name = 'fundraising_events' and column_name = 'title')::text, 'true');
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
if (!m) { console.log(res.status, msg.slice(0, 2000)); await exitWith(1); }
else {
  const rows = JSON.parse(m[1]);
  let bad = 0;
  for (const x of rows) {
    const ok = x.got === x.want;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"} ${x.l}: got ${x.got}${ok ? "" : ` want ${x.want}`}`);
  }
  console.log(bad ? `${bad} FAILED` : `all ${rows.length} held (rolled back, nothing kept)`);
  process.exitCode = bad ? 1 : 0;
}
