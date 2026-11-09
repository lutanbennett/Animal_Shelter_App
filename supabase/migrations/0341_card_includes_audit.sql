-- consumer: src/lib/audit/recent-changes.ts, src/lib/audit/undo.ts, src/app/admin/recent-changes/page.tsx
--
-- A CHANGE TO WHICH CARDS INCLUDE WHICH NOW LEAVES A TRAIL (#q8m4t). 0257 gave card_grants an audit trigger and card_includes
-- none, so a change to what a card brings with it changed access for every login holding that card with no row in audit_log
-- and nothing on Settings → Recent changes. docs/decisions/2026-11-09-card-includes-audit.md.
--
-- WHY AN id COLUMN FIRST, AND NOT JUST THE THREE TRIGGER LINES OF 0257. record_audit() (0195) writes audit_log.row_id, which is
-- `uuid not null` (0121), from the row's `id`, else its `user_id`. card_includes has neither: its key is (card, included_card).
-- The trigger alone would make every insert, update and delete on card_includes fail on that not-null and roll back, so no card's
-- includes could be changed at all. Giving the table an id (card_grants already has one) is additive and leaves record_audit(),
-- which every audited table shares, untouched. The primary key stays (card, included_card); nothing that reads the table changes.
--
-- card_includes_recompute (0257) is NOT touched: it recomputes role_permissions and stays a trigger of its own, so a recompute
-- failure can never eat an audit row and the reverse. RLS is unchanged: card_includes keeps 0257's policies.
--
-- Re-runnable: add column if not exists, create unique index if not exists, drop trigger if exists.

alter table card_includes add column if not exists id uuid not null default gen_random_uuid();
create unique index if not exists card_includes_id_key on card_includes (id);

drop trigger if exists audit_card_includes on card_includes;
create trigger audit_card_includes
  after insert or update or delete on card_includes
  for each row execute function record_audit();
