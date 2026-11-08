-- consumer: src/lib/photos/approval.ts, src/app/photos/approve/EventPhotoQueue.tsx
--
-- Backlog #yacd2, part 1. An approver sees "A fundraising event" instead of the event's name, because fundraising_events
-- is readable only with events.run (0312). Lutan, 2026-11-08: show the name — the title and date only, not the rest of the
-- event. Row-level security cannot limit COLUMNS, so a second select policy keyed on photos.approve would hand an approver
-- the whole row (appeal, project folder, notes, published). Hence a function.
--
-- WHY A SECURITY-DEFINER FUNCTION OVER THE OTHER TWO SHAPES:
--   * A second policy on the table: whole row, more than he agreed to. Rejected.
--   * A security_invoker view: the view runs as the caller, so the table's policy still decides and an approver reads
--     nothing; a view without security_invoker runs as its owner and has no per-caller test but a where clause that is
--     the same has_permission() call as here, plus it could not carry the "has a photo waiting" restriction as cleanly.
--   * This function: returns id, title, event_date only, ONLY for events that have a photo waiting (the same test the
--     queue uses: owner_type event, not approved, not private-only), and only when the caller holds photos.approve, the
--     activity every approve action asks (src/app/photos/approve/actions.ts). Admin passes through has_permission().
-- No role key, no role name. A login without photos.approve gets no rows.
create or replace function waiting_event_titles()
returns table (id uuid, title text, event_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.title, e.event_date
    from public.fundraising_events e
   where coalesce((select public.has_permission('photos.approve')), false)
     and exists (
       select 1 from public.attachments a
        where a.owner_type::text = 'event'
          and a.owner_id = e.id
          and a.approved_at is null
          and a.private_only_at is null
     );
$$;
revoke all on function waiting_event_titles() from public, anon;
grant execute on function waiting_event_titles() to authenticated, service_role;
comment on function waiting_event_titles() is
  'Title and date of each fundraising event that has a photo waiting for approval (0334). Rows only for a caller holding photos.approve; nothing else about the event is exposed.';
