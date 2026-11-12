-- Rollback harness for 0365_refusal_keys_doctors_cards_attachments.sql. Dev only.
-- Success is the HARNESS-OK message, raised on purpose so nothing commits.
--   node scripts/run-harness.mjs supabase/harness/0365_refusal_keys_doctors_cards_attachments_harness.sql
--
-- Every probe asserts the REFUSAL MESSAGE IS THE KEY, not merely that the call was refused: an
-- English sentence here would pass a "did it refuse?" test and still be the fault being fixed.
-- Fixtures are named "ZZ fixture ..." and nothing is committed.
begin;

-- Runs one statement as a given login and returns the message it raised, or 'NO ERROR'.
create function pg_temp.err_as(u uuid, aal text, stmt text) returns text language plpgsql as $f$
declare e text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated', 'aal', aal)::text, true);
  set local role authenticated;
  begin
    execute stmt;
    e := 'NO ERROR';
  exception when others then
    e := sqlerrm;
  end;
  reset role;
  return e;
end $f$;

-- The same, as the owner (no login): for set_role_cards, whose own raises come before any policy.
create function pg_temp.err_owner(stmt text) returns text language plpgsql as $f$
declare e text;
begin
  begin
    execute stmt;
    e := 'NO ERROR';
  exception when others then
    e := sqlerrm;
  end;
  return e;
end $f$;

do $h$
declare
  u_none  uuid := gen_random_uuid();  -- no cards at all
  u_doc   uuid := gen_random_uuid();  -- clinics.doctors, not admin
  u_admin uuid := gen_random_uuid();  -- the real Admin role, for fixture rows a trigger guards
  u_ev    uuid := gen_random_uuid();  -- events.run
  u_res   uuid := gen_random_uuid();  -- photos.resident_add only
  u_pub   uuid := gen_random_uuid();  -- may publish resident photos
  r_none uuid; r_doc uuid; r_ev uuid; r_res uuid; r_pub uuid; r_admin uuid; r_cards uuid; r_other uuid;
  d_a uuid; d_b uuid; d_c uuid; v_clinic uuid; v_res uuid; v_detail text;
  seen int := 0; missed text := '';
  got text;
begin
  ---------------------------------------------------------------- logins and roles
  insert into auth.users (id, email) values
    (u_none, 'zz-fixture-none@example.invalid'), (u_doc, 'zz-fixture-doc@example.invalid'),
    (u_admin, 'zz-fixture-admin@example.invalid'), (u_ev, 'zz-fixture-ev@example.invalid'),
    (u_res, 'zz-fixture-res@example.invalid'), (u_pub, 'zz-fixture-pub@example.invalid');

  insert into roles (key, name, kind) values ('zz_fixture_none', 'ZZ fixture none', 'custom') returning id into r_none;
  insert into roles (key, name, kind) values ('zz_fixture_doc', 'ZZ fixture doctors', 'custom') returning id into r_doc;
  insert into roles (key, name, kind) values ('zz_fixture_ev', 'ZZ fixture events', 'custom') returning id into r_ev;
  insert into roles (key, name, kind) values ('zz_fixture_res', 'ZZ fixture resident photos', 'custom') returning id into r_res;
  insert into roles (key, name, kind) values ('zz_fixture_pub', 'ZZ fixture publisher', 'custom') returning id into r_pub;
  insert into roles (key, name, kind) values ('zz_fixture_cards', 'ZZ fixture cards', 'custom') returning id into r_cards;
  insert into roles (key, name, kind) values ('zz_fixture_other', 'ZZ fixture other', 'custom') returning id into r_other;

  -- clinics.list at read as well as clinics.doctors: the doctors SELECT policy asks clinics.list,
  -- so without it merge_doctors reads nothing and answers not_found before reaching its later checks.
  insert into role_permissions (role_id, activity, level) values
    (r_doc, 'clinics.doctors', 2), (r_doc, 'clinics.list', 1), (r_ev, 'events.run', 2),
    (r_res, 'photos.resident_add', 2), (r_pub, 'photos.resident_publish', 2), (r_pub, 'photos.resident_add', 2);

  select id into r_admin from roles where key = 'admin';
  if r_admin is null then raise exception 'FAIL setup: no admin role on this database'; end if;

  insert into user_roles (user_id, role_id) values
    (u_none, r_none), (u_doc, r_doc), (u_admin, r_admin), (u_ev, r_ev), (u_res, r_res), (u_pub, r_pub);

  ---------------------------------------------------------------- merge_doctors fixtures
  insert into clinics (name) values ('ZZ fixture clinic') returning id into v_clinic;
  insert into doctors (name) values ('ZZ fixture doctor A') returning id into d_a;
  insert into doctors (name) values ('ZZ fixture doctor B') returning id into d_b;
  -- A doctor WITH a login: doctors_guard_login only lets an admin at aal2 link one, so this is
  -- written through that login rather than as the owner.
  insert into doctors (name) values ('ZZ fixture doctor C') returning id into d_c;
  got := pg_temp.err_as(u_admin, 'aal2', format('update doctors set user_id = %L where id = %L', u_none, d_c));
  if got <> 'NO ERROR' then raise exception 'FAIL setup: could not give a fixture doctor a login: %', got; end if;

  -- 1. the up-front has_permission check
  got := pg_temp.err_as(u_none, 'aal2', format('select merge_doctors(%L, %L)', d_a, d_b));
  if got = 'merge.doctors_not_allowed' then seen := seen + 1;
  else missed := missed || format(' [1 merge.doctors_not_allowed -> %s]', got); end if;

  -- 2. neither doctor exists
  got := pg_temp.err_as(u_doc, 'aal2', format('select merge_doctors(%L, %L)', gen_random_uuid(), gen_random_uuid()));
  if got = 'merge.doctors_not_found' then seen := seen + 1;
  else missed := missed || format(' [2 merge.doctors_not_found -> %s]', got); end if;

  -- 3. both have a login
  got := pg_temp.err_as(u_admin, 'aal2', format('update doctors set user_id = %L where id = %L', u_ev, d_b));
  if got <> 'NO ERROR' then raise exception 'FAIL setup: second login: %', got; end if;
  got := pg_temp.err_as(u_admin, 'aal2', format('select merge_doctors(%L, %L)', d_c, d_b));
  if got = 'merge.doctors_both_have_logins' then seen := seen + 1;
  else missed := missed || format(' [3 merge.doctors_both_have_logins -> %s]', got); end if;

  -- 4. one has a login and the merger is not an admin
  got := pg_temp.err_as(u_admin, 'aal2', format('update doctors set user_id = null where id = %L', d_b));
  if got <> 'NO ERROR' then raise exception 'FAIL setup: unlink: %', got; end if;
  got := pg_temp.err_as(u_doc, 'aal2', format('select merge_doctors(%L, %L)', d_c, d_a));
  if got = 'merge.doctors_login_admin_only' then seen := seen + 1;
  else missed := missed || format(' [4 merge.doctors_login_admin_only -> %s]', got); end if;

  -- 5. the row-level-security-filtered delete raises the SAME key, and it CANNOT be provoked -- not
  --    because the harness is short of a fixture, but because no such login exists any more. Read on
  --    dev 2026-11-12: doctors_delete_perm asks has_permission('clinics.doctors'), which is exactly
  --    what the function's own first check asks, so a login that reaches the delete always passes it.
  --    The guard dates from 0147, when visit.book let someone add a doctor without being able to
  --    remove one; that combination is gone. It is kept as it was -- this change converts messages,
  --    it does not remove guards -- and the finding is reported rather than acted on here.
  missed := missed || ' [5 merge.doctors_not_allowed via the filtered delete: NOT PROVOKABLE, doctors_delete_perm asks the same activity as the function''s own check]';

  ---------------------------------------------------------------- set_role_cards
  -- 6. the same card twice. This is the function's first check, before any policy.
  got := pg_temp.err_owner(format('select set_role_cards(%L, array[%s])', r_cards, quote_literal('add_photos') || ',' || quote_literal('add_photos')));
  if got = 'role_cards.card_twice' then seen := seen + 1;
  else missed := missed || format(' [6 role_cards.card_twice -> %s]', got); end if;

  -- For the two photo-approver refusals there must be NO approver left anywhere else, which on a
  -- shared dev database there is. Scrubbed here and rolled back with everything else.
  delete from role_permissions where activity = 'photos.approve';
  delete from role_cards where card = 'approve_photos';

  -- 7. handing out Add resident photos when nobody could approve them
  got := pg_temp.err_owner(format('select set_role_cards(%L, array[%s])', r_cards, quote_literal('add_photos')));
  if got = 'role_cards.needs_an_approver_first' then seen := seen + 1;
  else missed := missed || format(' [7 role_cards.needs_an_approver_first -> %s]', got); end if;

  -- 8. taking the last approver away while other roles still add photos -- and the ONLY key in this
  --    group that carries a parameter, so the detail JSON is read back and checked too.
  insert into role_cards (role_id, card) values (r_other, 'add_photos');
  insert into role_permissions (role_id, activity, level) values (r_cards, 'photos.approve', 2);
  begin
    perform set_role_cards(r_cards, array[]::text[]);
    missed := missed || ' [8 role_cards.last_approver -> NO ERROR]';
  exception when others then
    got := sqlerrm;
    get stacked diagnostics v_detail = pg_exception_detail;
    -- The detail must be readable JSON naming the roles that still add photos. The fixture role is
    -- asserted by name; the real dev roles beside it are whatever this database holds today.
    if got = 'role_cards.last_approver'
       and (v_detail::json ->> 'roles') like '%ZZ fixture other%' then
      seen := seen + 1;
    else
      missed := missed || format(' [8 role_cards.last_approver -> %s detail %s]', got, coalesce(v_detail, '(none)'));
    end if;
  end;

  ---------------------------------------------------------------- record_attachment
  insert into residents (name, species) values ('ZZ fixture resident', 'Dog') returning id into v_res;

  -- 9. an unknown purpose, the function's first check
  got := pg_temp.err_as(u_pub, 'aal2', format(
    'select record_attachment(%L::attachment_owner_type, %L, %L, %L, %L, null, null, %L, %L)',
    'resident', v_res, 'zz-file', 'zz.jpg', 'Shelter', 'nonsense', 'photo'));
  if got = 'attachment.purpose_invalid' then seen := seen + 1;
  else missed := missed || format(' [9 attachment.purpose_invalid -> %s]', got); end if;

  -- 10. an unknown media kind
  got := pg_temp.err_as(u_pub, 'aal2', format(
    'select record_attachment(%L::attachment_owner_type, %L, %L, %L, %L, null, null, %L, %L)',
    'resident', v_res, 'zz-file', 'zz.jpg', 'Shelter', 'bill', 'nonsense'));
  if got = 'attachment.media_kind_invalid' then seen := seen + 1;
  else missed := missed || format(' [10 attachment.media_kind_invalid -> %s]', got); end if;

  -- 11. a login holding nothing
  got := pg_temp.err_as(u_none, 'aal2', format(
    'select record_attachment(%L::attachment_owner_type, %L, %L, %L, %L, null, null, %L, %L)',
    'resident', v_res, 'zz-file', 'zz.jpg', 'Shelter', 'bill', 'photo'));
  if got = 'attachment.add_not_allowed' then seen := seen + 1;
  else missed := missed || format(' [11 attachment.add_not_allowed -> %s]', got); end if;

  -- 12. events.run, but no such event
  got := pg_temp.err_as(u_ev, 'aal2', format(
    'select record_attachment(%L::attachment_owner_type, %L, %L, %L, null, null, null, %L, %L)',
    'event', gen_random_uuid(), 'zz-file', 'zz.jpg', 'bill', 'photo'));
  if got = 'attachment.event_not_found' then seen := seen + 1;
  else missed := missed || format(' [12 attachment.event_not_found -> %s]', got); end if;

  -- 13. the Medical folder without photos.medical_add
  got := pg_temp.err_as(u_res, 'aal2', format(
    'select record_attachment(%L::attachment_owner_type, %L, %L, %L, %L, null, null, %L, %L)',
    'resident', v_res, 'zz-file', 'zz.jpg', 'Medical', 'bill', 'photo'));
  if got = 'attachment.medical_folder_not_allowed' then seen := seen + 1;
  else missed := missed || format(' [13 attachment.medical_folder_not_allowed -> %s]', got); end if;

  -- 14. a login that may add resident photos but not publish them, filing outside Shelter
  got := pg_temp.err_as(u_res, 'aal2', format(
    'select record_attachment(%L::attachment_owner_type, %L, %L, %L, %L, null, null, %L, %L)',
    'resident', v_res, 'zz-file', 'zz.jpg', 'Foster', 'bill', 'photo'));
  if got = 'attachment.shelter_folder_only' then seen := seen + 1;
  else missed := missed || format(' [14 attachment.shelter_folder_only -> %s]', got); end if;

  -- 15. an adoption update that is not this resident's
  got := pg_temp.err_as(u_pub, 'aal2', format(
    'select record_attachment(%L::attachment_owner_type, %L, %L, %L, %L, null, %L, %L, %L)',
    'resident', v_res, 'zz-file', 'zz.jpg', 'Shelter', gen_random_uuid(), 'bill', 'photo'));
  if got = 'attachment.update_not_this_residents' then seen := seen + 1;
  else missed := missed || format(' [15 attachment.update_not_this_residents -> %s]', got); end if;

  ---------------------------------------------------------------- verdict
  raise exception 'HARNESS-OK 0365: % of 15 raises provoked and each gave its KEY, not a sentence.%',
    seen, case when missed = '' then ' Nothing missed.' else ' MISSED:' || missed end;
end $h$;

rollback;
