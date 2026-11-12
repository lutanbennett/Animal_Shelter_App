-- consumer: src/app/management/foundation-papers/page.tsx, src/app/management/foundation-papers/actions.ts, src/app/management/foundation-papers/board-ids/page.tsx, src/lib/permissions/catalogue.ts, src/lib/permissions/cards.ts, src/lib/permissions/routes.ts, src/app/api/documents/[fileId]/route.ts
--
-- A DOCUMENT STORE FOR THE FOUNDATION'S OWN PAPERS (backlog #98se8; docs/decisions/2026-11-12-foundation-document-store.md is the paper).
-- The shape the item names: a table, a can_see_drive_file() case and a card. Not a second way to serve files: the existing
-- /api/documents/<id> route serves these, because can_see_drive_file() now answers for them.
--
-- WHAT IS HERE
--   1. TWO ACTIVITIES, TWO CARDS (the item's narrower-audience question, answered in the decision file):
--        foundation.papers      (level)  the bylaws, certificates, minutes, statements, tax ID, bank statements and reconciliations.
--                                        Card foundation_papers, held at Edit (read, file, remove).
--        foundation.id_copies   (level)  copies of board members' Thai national ID cards and household registrations.
--                                        Card foundation_id_copies, held at Edit. A much narrower audience, so its own card.
--      Nothing is given to any role and Admin gets nothing: who holds a card is an assignment in Settings then Who does what.
--   2. foundation_documents: one row per filed document, category, optional month, the Drive file id. Row level security asks the
--      activity the row's category belongs to, so a login without foundation.id_copies cannot read, list or open an ID copy even
--      when it holds foundation.papers.
--   3. can_see_drive_file() gains one branch (body is 0324's, the live definition). It stays security invoker, so the new branch is
--      answered by foundation_documents' own policies as the caller: /api/documents/<id> needs no change.
--
-- THE STORE SITS EMPTY on purpose. Nothing real is loaded until Lutan says the information protection is right (2026-11-09).
-- Re-runnable. To undo, in a new file: drop the branch from can_see_drive_file(), drop the table, delete the card_grants,
-- card_features and permission_activities rows.
-- String literals carry no semicolon and no double dash (scripts/check-migration-grants.mjs splits on both).

insert into permission_activities (key, kind, area, sort)
values ('foundation.papers', 'level', 'management', 90),
       ('foundation.id_copies', 'level', 'management', 91)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into card_grants (card, activity, level)
values ('foundation_papers', 'foundation.papers', 2),
       ('foundation_id_copies', 'foundation.id_copies', 2)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select c.card, f.id from (values ('foundation_papers'), ('foundation_id_copies')) c(card), features f where f.key = 'finances_and_reports'
on conflict (card) do update set feature_id = excluded.feature_id;

-- ---------------------------------------------------------------------------
-- The table
-- ---------------------------------------------------------------------------
create table if not exists foundation_documents (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in (
                 'establishment', 'registration', 'board_list', 'board_id_copy', 'minutes',
                 'financial_statements', 'tax_id', 'bank_statement', 'bank_reconciliation')),
  title        text not null check (btrim(title) <> ''),
  -- The month a bank statement or reconciliation covers, stored as its first day. Required for those two, optional otherwise.
  period       date check (period is null or extract(day from period) = 1),
  note         text,
  drive_file_id text not null,
  file_name    text not null,
  content_type text,
  created_by   uuid references auth.users (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  constraint foundation_documents_period_for_bank check (category not in ('bank_statement', 'bank_reconciliation') or period is not null)
);

create index if not exists foundation_documents_category_idx on foundation_documents (category, period desc nulls last, created_at desc);
create index if not exists foundation_documents_drive_file_idx on foundation_documents (drive_file_id);

comment on table foundation_documents is
  'The foundation''s own papers (0362, #98se8). Files live on Drive and are served only through /api/documents/<id> via can_see_drive_file(). A board_id_copy row is guarded by foundation.id_copies, every other category by foundation.papers.';

alter table foundation_documents enable row level security;

-- The activity a category belongs to is the whole of the rule: the ID copies and nothing else need the narrower card.
drop policy if exists foundation_documents_select on foundation_documents;
create policy foundation_documents_select on foundation_documents for select to authenticated
  using ((select has_permission(case when category = 'board_id_copy' then 'foundation.id_copies' else 'foundation.papers' end, 'read')));

drop policy if exists foundation_documents_insert on foundation_documents;
create policy foundation_documents_insert on foundation_documents for insert to authenticated
  with check ((select has_permission(case when category = 'board_id_copy' then 'foundation.id_copies' else 'foundation.papers' end, 'edit')));

drop policy if exists foundation_documents_delete on foundation_documents;
create policy foundation_documents_delete on foundation_documents for delete to authenticated
  using ((select has_permission(case when category = 'board_id_copy' then 'foundation.id_copies' else 'foundation.papers' end, 'edit')));

-- No update policy and no update grant: a wrong entry is removed and filed again, so a row never changes under the file it names.
revoke all on foundation_documents from public, anon, authenticated;
grant select, insert, delete on foundation_documents to authenticated;
grant all on foundation_documents to service_role;

-- ---------------------------------------------------------------------------
-- can_see_drive_file(): one more branch. Body is 0324's plus the last line.
-- ---------------------------------------------------------------------------
create or replace function can_see_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from attachments where drive_file_id = p_drive_file_id
    union all
    select 1 from project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from maintenance_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from community_outing_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from medication where label_drive_file_id = p_drive_file_id
    union all
    select 1 from stock_medications where label_drive_file_id = p_drive_file_id
    union all
    select 1 from pending_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from memes where drive_file_id = p_drive_file_id
    union all
    select 1 from reels where drive_file_id = p_drive_file_id
    union all
    select 1 from donation_receipts where drive_file_id = p_drive_file_id
    union all
    select 1 from residents where deceased_summary_drive_file_id = p_drive_file_id
    union all
    select 1 from residents where deceased_index_drive_file_id = p_drive_file_id
    union all
    select 1 from foundation_documents where drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';
