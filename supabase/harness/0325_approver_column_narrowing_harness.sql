-- Harness for 0325_approver_column_narrowing.sql. Everything is rolled back; a failed assertion surfaces as an error.
-- Run: node scripts/run-harness.mjs supabase/harness/0325_approver_column_narrowing_harness.sql
-- Logins are simulated by setting request.jwt.claims and `set local role authenticated`, so RLS and the trigger both run.
begin;
do $$
declare
  u_appr uuid := gen_random_uuid();   -- holds photos.approve ONLY
  u_ev   uuid := gen_random_uuid();   -- holds events.run ONLY
  u_pr   uuid := gen_random_uuid();   -- holds projects.photos ONLY
  r_appr uuid; r_ev uuid; r_pr uuid;
  a_ev uuid; a_pr uuid; a_ev2 uuid; a_pr2 uuid;
  v_msg text; v_cap text; v_ts timestamptz;
begin
  insert into auth.users (id, email) values (u_appr, 'h-appr@example.invalid'), (u_ev, 'h-ev@example.invalid'), (u_pr, 'h-pr@example.invalid');
  insert into roles (key, name, kind) values ('h_appr', 'h', 'custom') returning id into r_appr;
  insert into roles (key, name, kind) values ('h_ev', 'h', 'custom') returning id into r_ev;
  insert into roles (key, name, kind) values ('h_pr', 'h', 'custom') returning id into r_pr;
  insert into role_permissions (role_id, activity, level) values (r_appr, 'photos.approve', 2), (r_ev, 'events.run', 2), (r_pr, 'projects.photos', 2);
  insert into user_roles (user_id, role_id) values (u_appr, r_appr), (u_ev, r_ev), (u_pr, r_pr);

  -- four waiting photos, written as the database owner (no session user, so the guard is not involved)
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, caption, approved_at) values ('event', gen_random_uuid(), 'h-ev-1', 'a.jpg', 'orig', null) returning id into a_ev;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, caption, approved_at) values ('project', gen_random_uuid(), 'h-pr-1', 'a.jpg', 'orig', null) returning id into a_pr;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, caption, approved_at) values ('event', gen_random_uuid(), 'h-ev-2', 'b.jpg', 'orig', null) returning id into a_ev2;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, caption, approved_at) values ('project', gen_random_uuid(), 'h-pr-2', 'b.jpg', 'orig', null) returning id into a_pr2;
  update attachments set approved_at = null where id in (a_ev, a_pr, a_ev2, a_pr2);

  perform set_config('request.jwt.claims', json_build_object('sub', u_appr, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1. approver CAN approve both kinds (the thing the card is for)
  update attachments set approved_at = now() where id = a_ev;
  update attachments set approved_at = now() where id = a_pr;
  select approved_at into v_ts from attachments where id = a_ev;  if v_ts is null then raise exception 'FAIL 1: event not approved'; end if;
  select approved_at into v_ts from attachments where id = a_pr;  if v_ts is null then raise exception 'FAIL 1: project not approved'; end if;

  -- 1b. approver can mark Private only
  update attachments set private_only_at = now() where id = a_ev2;
  select private_only_at into v_ts from attachments where id = a_ev2;  if v_ts is null then raise exception 'FAIL 1b: private only refused'; end if;

  -- 2. approver is REFUSED the caption, on both kinds, and for other columns
  begin update attachments set caption = 'hacked' where id = a_ev; raise exception 'FAIL 2: event caption accepted';
  exception when others then get stacked diagnostics v_msg = message_text;
    if v_msg not like 'An approver may only change%' then raise exception 'FAIL 2: wrong error: %', v_msg; end if; end;
  begin update attachments set caption = 'hacked' where id = a_pr; raise exception 'FAIL 2: project caption accepted';
  exception when others then get stacked diagnostics v_msg = message_text;
    if v_msg not like 'An approver may only change%' then raise exception 'FAIL 2: wrong error: %', v_msg; end if; end;
  begin update attachments set phase = 'x', sort_order = 9 where id = a_pr2; raise exception 'FAIL 2: phase/sort_order accepted';
  exception when others then get stacked diagnostics v_msg = message_text;
    if v_msg not like 'An approver may only change%' then raise exception 'FAIL 2: wrong error: %', v_msg; end if; end;
  begin update attachments set approved_at = now(), caption = 'sneaky' where id = a_pr2; raise exception 'FAIL 2: approve+caption accepted';
  exception when others then get stacked diagnostics v_msg = message_text;
    if v_msg not like 'An approver may only change%' then raise exception 'FAIL 2: wrong error: %', v_msg; end if; end;

  -- 3. the owning cards still edit captions
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_ev, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update attachments set caption = 'by events.run' where id = a_ev;
  select caption into v_cap from attachments where id = a_ev;  if v_cap <> 'by events.run' then raise exception 'FAIL 3: events.run could not edit caption'; end if;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_pr, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update attachments set caption = 'by projects.photos' where id = a_pr;
  select caption into v_cap from attachments where id = a_pr;  if v_cap <> 'by projects.photos' then raise exception 'FAIL 3: projects.photos could not edit caption'; end if;

  reset role;
  raise exception 'HARNESS PASSED: approver approves + private-only, refused caption/phase/sort_order/mixed on event and project; events.run and projects.photos still edit captions';
end $$;
rollback;
