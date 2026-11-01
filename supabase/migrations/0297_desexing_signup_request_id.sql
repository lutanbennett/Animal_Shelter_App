-- consumer: src/app/services/desexing/actions.ts, src/app/services/desexing/SignupForm.tsx
--
-- Pi failover: lets the public desexing sign-up be replayed without taking a second place.
-- docs/decisions/2026-11-01-desexing-anon-id.md is the paper for this file.
--
-- anon cannot claim_write_request() (no auth.uid()), so the browser's request id becomes the ROW'S OWN id: a replay
-- hits the primary key instead of adding a second row. Two parts:
--   1. grant insert (id) to anon. The policy (status = 'new') is unchanged and needs no widening.
--   2. desexing_signups_gate() answers an anon insert whose id already exists by returning NULL (skip the row, no
--      error). The gate otherwise runs BEFORE the key check, so a replay after the last place was taken would meet
--      'desexing_drive_full' -- a false error. Checking first makes the replay a quiet "already done".
-- The check reads the table inside a security-definer function, so it shows anon nothing: the answer is the same
-- "ok" whether the id was new or not. A concurrent duplicate that slips past the check still hits the primary key
-- (23505), which the app treats as done. Everything else in the function is 0233's, unchanged.

grant insert (id) on desexing_drive_signups to anon;

create or replace function desexing_signups_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d desexing_drives%rowtype;
  contact_n integer;
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.drive_id := old.drive_id;
    new.created_at := old.created_at;
    if new.status is distinct from old.status then
      new.handled_by := auth.uid();
      new.handled_at := now();
    end if;
  end if;

  -- A replay of an anon sign-up (0297): the request id is the row id. Already stored means already done, and it
  -- must be answered before any limit below, or a replay after the last place went would meet "full".
  if tg_op = 'INSERT' and auth.role() = 'anon'
     and exists (select 1 from desexing_drive_signups s where s.id = new.id) then
    return null;
  end if;

  -- Limits apply to the public only; staff entering a sign-up by hand may go over capacity.
  if tg_op = 'INSERT' and auth.role() = 'anon' then
    new.status := 'new';
    new.handled_by := null;
    new.handled_at := null;

    -- Lock the drive so two simultaneous sign-ups cannot both take the last place.
    select * into d from desexing_drives where id = new.drive_id for update;
    if not found or d.status <> 'open' or d.drive_date < shelter_today()
       or (d.signups_close_on is not null and d.signups_close_on < shelter_today()) then
      raise exception 'desexing_drive_not_open' using errcode = 'P0001';
    end if;
    if not (new.pet_species = any (d.species)) then
      raise exception 'desexing_drive_species_not_taken' using errcode = 'P0001';
    end if;
    if d.capacity is not null and
       (select count(*) from desexing_drive_signups s
         where s.drive_id = d.id and s.status in ('new', 'confirmed')) >= d.capacity then
      raise exception 'desexing_drive_full' using errcode = 'P0001';
    end if;

    select count(*) into contact_n from desexing_drive_signups s
     where s.drive_id = d.id and s.status in ('new', 'confirmed')
       and ((nullif(btrim(new.owner_phone), '') is not null
             and regexp_replace(s.owner_phone, '[^0-9+]', '', 'g') = regexp_replace(new.owner_phone, '[^0-9+]', '', 'g'))
         or (nullif(btrim(new.owner_email), '') is not null
             and lower(btrim(s.owner_email)) = lower(btrim(new.owner_email))));
    if contact_n >= 3 then
      raise exception 'desexing_signup_too_many_for_contact' using errcode = 'P0001';
    end if;

    if (select count(*) from desexing_drive_signups s
         where s.created_at > now() - interval '1 hour') >= 60 then
      raise exception 'desexing_signup_rate_limited' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function desexing_signups_gate() from public, anon, authenticated;
