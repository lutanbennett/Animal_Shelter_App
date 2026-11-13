-- consumer: src/lib/permissions/cards.ts, src/app/management/foundation-papers/page.tsx
--
-- A READ-ONLY CARD FOR THE FOUNDATION'S OWN PAPERS (backlog #t1zyc part B; Lutan, 2026-11-13: "Deploy a card that will allow access for an
-- accountant"). Both cards from 0362 grant EDIT, so neither could be given to an outside accountant. foundation.papers is a level activity,
-- so it already has a read: no new activity is needed, only a card that holds it at read (1).
--
-- It covers foundation.papers ONLY. The board members' ID copies (foundation.id_copies) are a separate activity and a much narrower
-- audience, and an accountant has no reason to hold copies of named people's identity documents. Row level security on foundation_documents
-- and can_see_drive_file() already answer by activity, so no policy changes: at read the holder lists and opens the papers, and the
-- insert and delete policies (edit) refuse everything else.
--
-- Nothing is given to any role and Admin gets nothing: who holds the card is an assignment in Settings then Who does what. Re-runnable.

insert into card_grants (card, activity, level)
values ('view_foundation_papers', 'foundation.papers', 1)
on conflict (card, activity) do update set level = excluded.level;

insert into card_features (card, feature_id)
select 'view_foundation_papers', f.id from features f where f.key = 'finances_and_reports'
on conflict (card) do update set feature_id = excluded.feature_id;

notify pgrst, 'reload schema';
