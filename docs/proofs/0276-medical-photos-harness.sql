begin;
do $$
declare
  v_res uuid; v_uid uuid; r record; n_shelter int; n_med int; n_other int;
  v_fold text[] := array['Shelter','Medical','medical ',E'Medical\t','MEDICAL'];
  i int; report text := '';
begin
  select id into v_res from public.residents limit 1;
  for i in 1..array_length(v_fold,1) loop
    insert into public.attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name)
    values ('resident', v_res, v_fold[i], 'harness-'||i, 'h'||i||'.jpg');
  end loop;
  for r in
    select distinct on (ro.key) ro.key, ro.id from public.roles ro
     where ro.key in ('admin','volunteer','doctor','management','head_of_medical','second_in_command','head_of_maintenance')
        or ro.id = (select ro2.id from public.roles ro2 join public.role_cards c on c.role_id = ro2.id where c.card = 'view_medical' and ro2.key like 'dev_signin_cards_%' limit 1)
        or ro.id = (select ro2.id from public.roles ro2 join public.role_cards c on c.role_id = ro2.id where c.card = 'view_residents' and ro2.key like 'dev_signin_cards_%' limit 1)
        or ro.id = (select ro2.id from public.roles ro2 join public.role_cards c on c.role_id = ro2.id where c.card = 'medical_records' and ro2.key like 'dev_signin_cards_%' limit 1)
        or ro.id = (select ro2.id from public.roles ro2 join public.role_cards c on c.role_id = ro2.id where c.card = 'add_medical_photos' and ro2.key like 'dev_signin_cards_%' limit 1)
  loop
    v_uid := gen_random_uuid();
    insert into auth.users (id, aud, role, email) values (v_uid, 'authenticated', 'authenticated', 'h-'||v_uid||'@example.invalid');
    insert into public.user_roles (user_id, role_id) values (v_uid, r.id);
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) filter (where sub_folder = 'Shelter'),
           count(*) filter (where lower(btrim(sub_folder)) = 'medical' or sub_folder like E'Medical\t'),
           count(*) filter (where sub_folder not in ('Shelter','Medical','medical ',E'Medical\t','MEDICAL'))
      into n_shelter, n_med, n_other
      from public.attachments where owner_id = v_res and owner_type = 'resident' and drive_file_id like 'harness-%';
    reset role;
    report := report || format(E'\n%-45s shelter=%s medical-like(of 4)=%s', r.key, n_shelter, n_med);
  end loop;
  raise exception 'REPORT%', report;
end $$;
rollback;
