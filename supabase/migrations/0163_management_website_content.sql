-- consumer: src/app/admin/website/, src/lib/permissions/routes.ts
--
-- Management runs the public website (Lutan, 2026-10-08; docs/decisions/2026-10-07-management-settings-split.md):
-- the Director is Admin at night on her PC and Management by day on her phone, and the website is her job. #448 moved
-- Settings -> Website into the Management menu, but no role held website.content, so only Admin's bypass opened it.
--
--   1. the cell     management gains website.content at Edit
--   2. the tables   site_content, site_content_photos and site_pages still wrote on is_admin() (0153), so the cell
--                   alone would open the page and every save would be refused. Their write policies now ask the cell,
--                   as impact_baselines (0156) already does. Same policy names, same commands, only the expression.
--
-- Accepted consequence: anyone holding the Management role can change the public site. The 2IC is deliberately NOT
-- given the cell; the decision named Management only.
--
-- Admin is unchanged: has_permission() admits Admin first. public_viewer gains nothing (it holds no rows).
-- Written to be safely re-runnable. To undo: delete the cell and restore the three is_admin() expressions from 0153.

-- ---------------------------------------------------------------------------
-- 1. The cell
-- ---------------------------------------------------------------------------
insert into role_permissions (role_id, activity, level)
select r.id, v.activity, v.level
  from roles r
  join (values ('management', 'website.content', 2)) as v(rkey, activity, level) on v.rkey = r.key
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 2. The three tables the Website page writes
-- ---------------------------------------------------------------------------
alter policy admin_update_site_content on site_content
  using ((select has_permission('website.content'))) with check ((select has_permission('website.content')));
alter policy admin_write_site_content_photos on site_content_photos
  using ((select has_permission('website.content'))) with check ((select has_permission('website.content')));
alter policy admin_update_site_pages on site_pages
  using ((select has_permission('website.content'))) with check ((select has_permission('website.content')));
