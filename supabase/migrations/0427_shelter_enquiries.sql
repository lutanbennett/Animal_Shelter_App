-- consumer: none yet. The app half (#shsup, stream shelter-enquiry-form) inserts with the service role from the public form on cooperjaidee.org;
-- the console (#pacon) reads. Nothing reads or writes this table today.
--
-- #shsup SCHEMA HALF. A stranger's enquiry to join the platform: who asked, how to reach them, what they said, when, and its state.
-- Lutan, 2026-11-20: shape (a), an ENQUIRY. Nothing is created by one: no shelter, role, login or invitation. It is a message with a name on it.
--
-- HOW A STRANGER WRITES WITHOUT ANY GRANT TO anon (the hard-coded-security check refuses a grant to anon/public): the table grants nothing to
-- anon or authenticated for insert. The only writer is the service role, from ONE named call site in the app, recorded in serviceRoleSites,
-- with its own throttling. The database therefore never accepts an anonymous write directly.
-- READ: a product administrator only, through is_product_admin() (0411), the one place that is asked; aal2 on the update, as 0411's writes.
-- No shelter_id: an enquiry exists because there is no shelter yet. Recorded as installation-level in docs/tenancy-shared-tables-registry.json.
-- Re-runnable. TO UNDO: drop table public.shelter_enquiries.

create table if not exists public.shelter_enquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  shelter_name  text not null check (char_length(btrim(shelter_name)) between 1 and 200),
  contact_name  text not null check (char_length(btrim(contact_name)) between 1 and 200),
  email         text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 320),
  phone         text check (phone is null or char_length(phone) <= 60),
  location      text check (location is null or char_length(location) <= 200),
  message       text check (message is null or char_length(message) <= 4000),
  status        text not null default 'new' check (status in ('new', 'contacted', 'created', 'declined')),
  status_note   text check (status_note is null or char_length(status_note) <= 2000),
  status_at     timestamptz
);

-- One open enquiry per address: a repeat press or resend is absorbed (the app uses on conflict do nothing) and still answers "thank you".
create unique index if not exists shelter_enquiries_one_open_per_email on public.shelter_enquiries (lower(email)) where status = 'new';
create index if not exists shelter_enquiries_created_idx on public.shelter_enquiries (created_at desc);

alter table public.shelter_enquiries enable row level security;
revoke all on public.shelter_enquiries from anon, authenticated;
grant select, update on public.shelter_enquiries to authenticated;
grant select, insert, update, delete on public.shelter_enquiries to service_role;

drop policy if exists shelter_enquiries_select on public.shelter_enquiries;
create policy shelter_enquiries_select on public.shelter_enquiries for select to authenticated using (public.is_product_admin());
drop policy if exists shelter_enquiries_update on public.shelter_enquiries;
create policy shelter_enquiries_update on public.shelter_enquiries for update to authenticated
  using (public.is_product_admin()) with check (public.is_product_admin());
drop policy if exists shelter_enquiries_update_requires_aal2 on public.shelter_enquiries;
create policy shelter_enquiries_update_requires_aal2 on public.shelter_enquiries as restrictive for update to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2') with check ((select auth.jwt() ->> 'aal') = 'aal2');

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    drop policy if exists definer_all on public.shelter_enquiries;
    create policy definer_all on public.shelter_enquiries for all to rls_definer using (true) with check (true);
  end if;
end $$;
