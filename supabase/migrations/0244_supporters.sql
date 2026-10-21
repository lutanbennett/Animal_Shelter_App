-- consumer: src/app/management/donations/actions.ts, src/lib/donations/receipts-server.ts
--
-- Supporters, the schema half (backlog, "Donors get their own supporters list"). Lutan, 2026-10-21: "For the
-- Donors let's keep a separate list", then "not in contacts". The app half (claude/supporters-list-app) builds the
-- list, a supporter's gift history and the inline add on the donation form. Design notes:
-- docs/decisions/2026-10-21-supporters-table.md.
--
-- WHAT IS HERE
--   supporters             one person (or household) who gives. Name and the contact details donations already
--                          collect (email, phone, LINE), a note, and archived_at so the list can hide old entries
--                          without deleting anyone's gift history.
--   donations.supporter_id nullable link, beside contact_id (not replacing it). On delete set null: removing a
--                          supporter never removes a gift; donor_name on the donation still says who gave.
--
-- NOT HERE, on purpose: no Donor value on contact_type (0067 removed it; it stays removed); nothing touches
-- shelter_friends (0076, business sponsors); no back-fill from donations.donor_name (matching free text to people
-- is a judgement nobody has asked for).
--
-- WHO MAY READ IT. Donor contact details are personal data. The same activity that guards donations,
-- donation.receipt (Admin, and Management by one cell), guards supporters: anyone who may see a gift may see who
-- gave it, and nobody else. No anon grant; no other signed-in role.
--
-- Additive and re-runnable. To undo, in a new file: drop the column, then the table.

create table if not exists supporters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (btrim(name) <> ''),
  email       text,
  phone       text,
  line        text,
  note        text,
  archived_at timestamptz,
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists supporters_name_idx on supporters (lower(name));
create index if not exists supporters_live_idx on supporters (lower(name)) where archived_at is null;

comment on table supporters is
  'Individual donors (0244). Separate from contacts by Lutan''s decision of 2026-10-21; not shelter_friends. Guarded by donation.receipt.';

create or replace function supporters_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists supporters_touch on supporters;
create trigger supporters_touch before update on supporters
  for each row execute function supporters_touch();

alter table donations add column if not exists supporter_id uuid references supporters (id) on delete set null;
create index if not exists donations_supporter_idx on donations (supporter_id) where supporter_id is not null;

comment on column donations.supporter_id is
  'The supporter who gave (0244), beside contact_id. Null for a gift not yet linked. Deleting a supporter keeps the gift.';

alter table supporters enable row level security;

drop policy if exists supporters_perm on supporters;
create policy supporters_perm on supporters for all to authenticated
  using ((select has_permission('donation.receipt')))
  with check ((select has_permission('donation.receipt')));

revoke all on supporters from public, anon, authenticated;
grant select, insert, update, delete on supporters to authenticated;
grant all on supporters to service_role;

revoke all on function supporters_touch() from public, anon;
