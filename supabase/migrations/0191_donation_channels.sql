-- consumer: src/app/donate/page.tsx, src/app/admin/website/ (Settings -> Website -> Donate), added by the `donate-channels` app PR
--
-- Ways to give, as data: one row per PayPal / DonorBox / Wise link, bank account, PromptPay ID or other way, so /donate
-- can show a button or a copy card for each instead of lines of plain text (backlog: "Donate page: a button for each way
-- to give", Lutan 2026-10-12). Schema half only; Settings and the page are the next PR.
--
-- WHO MAY WRITE: whoever edits the website (website.content at Edit), the same cell as impact_baselines (0156).
-- WHO MAY READ THE TABLE: website.content at Read. Anon has NO grant on it.
--
-- WHAT IS PUBLIC, AND HOW A HIDDEN ROW STAYS OUT: this table deliberately holds bank account numbers and a PromptPay
-- ID, and the point is that supporters can read them, but only the rows that are shown. Anon reads
-- public_donation_channels, an owner-run view (like public_impact_figures) whose WHERE clause is `shown`. The view
-- runs as its owner, so the row filter in the view is the only thing standing between anon and a hidden row: there
-- is no RLS to fall back on. A hidden row is therefore absent from the view, not filtered in the app. The view also
-- names its columns, so created_by / updated_by never leave the database.
--
-- LINKS: a database check backs the app's validation. A link must be https:// and, for PayPal, DonorBox and Wise,
-- on that company's own domain (the host must END in the company's domain, directly after `https://` and any
-- subdomain labels, then / ? # or the end). `https://paypal.com.evil.test`, `https://paypal.com@evil.test` and
-- `https://evil.test/paypal.com` all fail. "other" and bank/PromptPay rows may carry any https link or none.
--
-- THAI: `label` and `note` are prose a person types, so their Thai lives in the translations queue
-- (translatable_fields + queue triggers, 0056), not a paired column. Account numbers, bank names and the PromptPay
-- ID are the same in both languages and are not translated.
--
-- Additive and re-runnable. To undo: drop the view, drop the table (cascade removes triggers and policies), delete
-- the two translatable_fields rows and the table's translations rows, restore is_public_drive_file() from 0123.

-- ---------------------------------------------------------------------------
-- 1. The table
-- ---------------------------------------------------------------------------
create table if not exists donation_channels (
  id uuid primary key default gen_random_uuid(),
  way text not null,
  label text not null,
  url text,
  bank_name text,
  account_name text,
  account_number text,
  promptpay_id text,
  qr_drive_file_id text,
  note text,
  sort_order integer not null default 0,
  shown boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint donation_channels_way_check
    check (way in ('paypal', 'donorbox', 'wise', 'bank_transfer', 'promptpay', 'other')),
  constraint donation_channels_label_not_blank check (btrim(label) <> ''),
  constraint donation_channels_url_https check (url is null or url ~* '^https://[^\s]+$'),
  constraint donation_channels_url_own_domain check (
    url is null
    or case way
         when 'paypal'   then url ~* '^https://([a-z0-9-]+\.)*(paypal\.com|paypal\.me)([/?#]|$)'
         when 'donorbox' then url ~* '^https://([a-z0-9-]+\.)*donorbox\.org([/?#]|$)'
         when 'wise'     then url ~* '^https://([a-z0-9-]+\.)*wise\.com([/?#]|$)'
         else true
       end
  )
);

create index if not exists donation_channels_order_idx on donation_channels (sort_order, created_at);

comment on table donation_channels is
  'One way to give (0191): a payment link, or bank / PromptPay details to copy. Written with website.content Edit; every change is in audit_log. Anon never reads this table: it reads public_donation_channels, which leaves out hidden rows.';
comment on column donation_channels.way is
  'paypal | donorbox | wise | bank_transfer | promptpay | other. The first three must link to the company''s own domain (donation_channels_url_own_domain).';
comment on column donation_channels.label is
  'The name shown on the button or card. Staff-typed: its Thai is in translations (translatable_fields).';
comment on column donation_channels.url is
  'https:// link for ways that have one. Null for details-only ways.';
comment on column donation_channels.qr_drive_file_id is
  'Optional PromptPay QR image (a Drive file id). Served publicly by the photo proxy only while the row is shown (is_public_drive_file).';
comment on column donation_channels.shown is
  'false hides the row from /donate: it is absent from public_donation_channels, not filtered by the app.';

-- ---------------------------------------------------------------------------
-- 2. Access: website.content, as impact_baselines (0156)
-- ---------------------------------------------------------------------------
alter table donation_channels enable row level security;

drop policy if exists donation_channels_select_perm on donation_channels;
create policy donation_channels_select_perm on donation_channels for select to authenticated
  using ((select has_permission('website.content', 'read')));

drop policy if exists donation_channels_insert_perm on donation_channels;
create policy donation_channels_insert_perm on donation_channels for insert to authenticated
  with check ((select has_permission('website.content')));

drop policy if exists donation_channels_update_perm on donation_channels;
create policy donation_channels_update_perm on donation_channels for update to authenticated
  using ((select has_permission('website.content')))
  with check ((select has_permission('website.content')));

drop policy if exists donation_channels_delete_perm on donation_channels;
create policy donation_channels_delete_perm on donation_channels for delete to authenticated
  using ((select has_permission('website.content')));

revoke all on donation_channels from anon, authenticated, service_role;
grant select, insert, update, delete on donation_channels to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Stamps from the session, never the request; audit
-- ---------------------------------------------------------------------------
create or replace function donation_channels_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function donation_channels_stamp() from public, anon, authenticated;

drop trigger if exists donation_channels_stamp on donation_channels;
create trigger donation_channels_stamp
  before insert or update on donation_channels
  for each row execute function donation_channels_stamp();

drop trigger if exists audit_donation_channels on donation_channels;
create trigger audit_donation_channels
  after insert or update or delete on donation_channels
  for each row execute function record_audit();

-- ---------------------------------------------------------------------------
-- 4. Thai through the translations queue
-- ---------------------------------------------------------------------------
insert into translatable_fields (table_name, column_name, tier) values
  ('donation_channels', 'label', 'reviewed'),
  ('donation_channels', 'note', 'reviewed')
on conflict do nothing;

drop trigger if exists donation_channels_queue_translations on donation_channels;
create trigger donation_channels_queue_translations
  after insert or update on donation_channels
  for each row execute function queue_translations();
drop trigger if exists donation_channels_drop_translations on donation_channels;
create trigger donation_channels_drop_translations
  after delete on donation_channels
  for each row execute function drop_translations();

-- No back-fill: the table starts empty.

-- ---------------------------------------------------------------------------
-- 5. What anon reads: shown rows only, named columns only
-- ---------------------------------------------------------------------------
create or replace view public_donation_channels as
select c.id,
       c.way,
       c.label,
       c.url,
       c.bank_name,
       c.account_name,
       c.account_number,
       c.promptpay_id,
       c.qr_drive_file_id,
       c.note,
       c.sort_order,
       private.approved_translations('donation_channels'::text, c.id) as translations
  from donation_channels c
 where c.shown;

comment on view public_donation_channels is
  'The ways to give that /donate shows (0191). Owner-run, so `where shown` is the only thing keeping a hidden row (and its account number) from anon.';

grant select on public_donation_channels to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_donation_channels from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. The photo proxy may serve a shown row's QR image
-- ---------------------------------------------------------------------------
-- 0123's body with one more branch. Still invoker: it reads only the public views.
create or replace function is_public_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public_site_content where hero_drive_file_id = p_drive_file_id
    union all
    select 1 from public_site_content_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_projects where cover_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_profiles where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_recent_adoptions where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_cards where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_donation_channels where qr_drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';
