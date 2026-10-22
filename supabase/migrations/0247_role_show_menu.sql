-- consumer: src/app/layout.tsx
--
-- (The menu-removal stream, a later batch, reads it to decide whether to render NavPane; it does not exist at this commit.)
-- Per-role "Show the menu" setting, schema half (backlog: tiles instead of the left-hand menu; Lutan, 2026-10-13: the
-- removal must be reversible role by role without a release). One column on roles:
--
--   roles.show_menu   true = the role's logins see the left-hand menu (NavPane); false = tiles only.
--
-- DEFAULT TRUE for every role, so nothing a user sees changes on the day this lands, and nothing reads it yet.
-- Admin keeps the menu whatever this says (the Director's desk view); that rule is the app half's, not the column's.
--
-- WRITE POLICY: no new policy. roles already has roles_admin_all (Admin only), the restrictive aal2 insert/update/delete
-- policies (Admin writes at the authenticator-app step, 0132) and the audit_roles trigger, which logs the whole row, so a
-- flip of this column is audited with who and when. Column-level grants are table-wide, so none to add.
--
-- Re-runnable: add column if not exists. To revert: alter table roles drop column show_menu.
alter table roles add column if not exists show_menu boolean not null default true;

comment on column roles.show_menu is
  'Whether this role''s logins see the left-hand menu (NavPane); false = tiles only (0247). Default true. Admin always keeps the menu. Written by Admin at 2-step; audited by audit_roles.';
