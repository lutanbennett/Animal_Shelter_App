-- Rollback harness for 0345_text_approval_card.sql. Dev only. Success is the HARNESS-OK message, raised on purpose so nothing commits.
--   node scripts/run-harness.mjs supabase/harness/0345_text_approval_card_harness.sql
begin;

create function pg_temp.try_as(u uuid, stmt text) returns int language plpgsql as $f$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  begin
    execute stmt;
    get diagnostics n = row_count;
  exception when others then
    n := -1;
  end;
  reset role;
  return n;
end $f$;

do $h$
declare
  u_app uuid := gen_random_uuid();   -- text.approve ONLY (the card)
  u_ed uuid := gen_random_uuid();    -- can edit the resident and the appeal, cannot approve
  r_app uuid; r_ed uuid;
  v_res uuid; v_ap uuid; v_state text; v_by uuid; n int; q int;
begin
  insert into auth.users (id, email) values (u_app, 'h-app@example.invalid'), (u_ed, 'h-ed@example.invalid');
  insert into roles (key, name, kind) values ('h_txt_app', 'h', 'custom') returning id into r_app;
  insert into roles (key, name, kind) values ('h_txt_ed', 'h', 'custom') returning id into r_ed;
  insert into role_permissions (role_id, activity, level) values (r_app, 'text.approve', 2), (r_ed, 'resident.record', 2), (r_ed, 'appeal.run', 2);
  insert into user_roles (user_id, role_id) values (u_app, r_app), (u_ed, r_ed);

  if (select count(*) from card_grants where card = 'approve_text') <> 1
     or not exists (select 1 from card_grants where card = 'approve_text' and activity = 'text.approve' and level = 2) then
    raise exception 'FAIL 1: approve_text does not grant exactly text.approve';
  end if;
  if not exists (select 1 from card_features where card = 'approve_text') then raise exception 'FAIL 2: card not filed under a feature'; end if;

  select id into v_res from residents where is_public_visible limit 1;
  if v_res is null then
    insert into residents (name, species) values ('Harness Dog', 'dog') returning id into v_res;
    update residents set is_public_visible = true where id = v_res;
  end if;
  update residents set bio = 'A harness bio', text_approval = 'public_ok' where id = v_res;

  -- GUARD: an editor cannot approve through a plain update; the approver card alone can use the function
  n := pg_temp.try_as(u_ed, format($q$update residents set text_approval = 'public_ok' where id = %L$q$, v_res));
  if n <> -1 and n <> 0 then raise exception 'FAIL 3: an editor set text_approval through a plain update (%)', n; end if;
  update residents set text_approval = null where id = v_res;
  n := pg_temp.try_as(u_ed, format($q$update residents set text_approval = 'public_ok' where id = %L$q$, v_res));
  if n > 0 then
    select text_approval into v_state from residents where id = v_res;
    if v_state is not null then raise exception 'FAIL 4: editor approved a resident (%)', v_state; end if;
  end if;
  select text_approval into v_state from residents where id = v_res;
  if v_state is not null then raise exception 'FAIL 4b: state is % after refused update', v_state; end if;

  -- the editor cannot call the queue or the function
  n := pg_temp.try_as(u_ed, $q$select * from text_review_queue()$q$);
  if n <> -1 then raise exception 'FAIL 5: an editor read the queue'; end if;
  n := pg_temp.try_as(u_ed, format($q$select set_text_approval('resident', %L, 'public_ok')$q$, v_res));
  if n <> -1 then raise exception 'FAIL 6: an editor called set_text_approval'; end if;

  -- the approver sees the waiting resident, and only prose
  perform set_config('request.jwt.claims', json_build_object('sub', u_app, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*) into q from text_review_queue() where id = v_res and kind = 'resident' and fields ? 'bio' and not fields ? 'name';
  reset role;
  if q <> 1 then raise exception 'FAIL 7: the approver did not see the waiting resident (%)', q; end if;

  -- the approver approves; the stamp records the approver
  n := pg_temp.try_as(u_app, format($q$select set_text_approval('resident', %L, 'public_ok')$q$, v_res));
  if n <> 1 then raise exception 'FAIL 8: the approver could not approve (%)', n; end if;
  select text_approval, text_approval_by into v_state, v_by from residents where id = v_res;
  if v_state <> 'public_ok' or v_by <> u_app then raise exception 'FAIL 9: state % by %', v_state, v_by; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u_app, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*) into q from text_review_queue() where id = v_res;
  reset role;
  if q <> 0 then raise exception 'FAIL 10: an approved resident is still in the queue'; end if;

  -- private only works too
  n := pg_temp.try_as(u_app, format($q$select set_text_approval('resident', %L, 'private_only')$q$, v_res));
  select text_approval into v_state from residents where id = v_res;
  if v_state <> 'private_only' then raise exception 'FAIL 11: private_only not recorded (%)', v_state; end if;
  update residents set text_approval = 'public_ok' where id = v_res;

  -- RESET ON EDIT: an internal column does not reset, a prose column does
  update residents set text_approval = 'public_ok' where id = v_res;
  update residents set is_desexed = true where id = v_res;
  select text_approval into v_state from residents where id = v_res;
  if v_state is distinct from 'public_ok' then raise exception 'FAIL 12: an internal edit reset the state (%)', v_state; end if;
  update residents set bio = 'A changed harness bio' where id = v_res;
  select text_approval into v_state from residents where id = v_res;
  if v_state is not null then raise exception 'FAIL 13: a prose edit did not reset the state (%)', v_state; end if;
  select text_approval_by into v_by from residents where id = v_res;
  if v_by is not null then raise exception 'FAIL 14: the stamp survived the reset'; end if;

  raise exception 'HARNESS-OK';
end
$h$;
rollback;
