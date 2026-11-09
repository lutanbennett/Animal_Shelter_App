-- consumer: src/app/admin/website/actions.ts
--
-- Backlog #ipf1z (b): site_content is a one-row table (id boolean, check (id)) with select and update policies but NO insert
-- policy, so Settings -> Website could not create the row when it was missing. This adds the insert, asked of the same
-- card as the update: website.content. The check also requires id = true, which together with the singleton check
-- and primary key means a second row can never exist. authenticated already holds table-level insert (0077).
-- Re-runnable.

drop policy if exists admin_insert_site_content on site_content;
create policy admin_insert_site_content on site_content for insert to authenticated
  with check ((select has_permission('website.content')) and id);
