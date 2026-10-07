-- consumer: none
--
-- The "see translations" cell (backlog 2026-10-06, filed by perm-convert-settings; decisions/2026-10-07-see-translations-cell.md).
-- 0150 let management and staff read every translations row through a stand-in, sees_all_translations()
-- (sees_all_residents() AND roles.opens_app), because reading had no activity. This gives it one, so the policy asks
-- has_permission() like every other table and the function goes.
--
--   translations.view   Yes/No (the house shape for "may look at this", as audit.view), held by management and staff.
--                       Read only: the Translations page and every write stay on translations.manage, which stays
--                       management's alone. Nobody who could not read before can now, and nobody who could translate
--                       before cannot.
--
-- translations read policy: translations.view, or translations.manage at Read (so a role that may translate still reads
-- what it translates, as before). public_viewer is kept out by has_permission() itself, not by a second condition:
-- it holds no cells, which is the whole reason the stand-in needed its opens_app half and this does not.
--
-- One difference, a tightening: a CUSTOM role with scope_residents = all and no cell used to read every row through
-- sees_all_residents(). It now needs the cell. No such role exists on dev or production, and a shelter that creates one
-- ticks "See the translations" in Settings. vet_read_translations and volunteer_read_translations (0056/0108) are
-- not touched: they are perm-convert-vet's.
--
-- New activities start at None for every role but Admin (§6 rule 8); the two cells below are today's answer, not a
-- widening. Written to be safely re-runnable. To undo: re-create sees_all_translations() and the 0150 policy from that
-- file, drop the cells and the activity.

insert into permission_activities (key, kind, area, sort)
values ('translations.view', 'yesno', 'management', 56)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into role_permissions (role_id, activity, level)
select r.id, 'translations.view', 2
from roles r
where r.key in ('management', 'staff')
on conflict (role_id, activity) do nothing;

drop policy if exists translations_select_perm on translations;
create policy translations_select_perm on translations for select to authenticated
  using ((select has_permission('translations.view')) or (select has_permission('translations.manage', 'read')));

drop function if exists sees_all_translations();
