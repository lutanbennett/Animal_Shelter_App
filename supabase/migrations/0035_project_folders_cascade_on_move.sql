-- Fix: 0034's category cascade never fired on a move.
--
-- project_folders_after_move was declared `after update of
-- top_level_category`, but a move only sets parent_folder_id — the
-- before-trigger derives the new category — so the column is never in the
-- statement's SET list and Postgres skipped the trigger. Descendants of a
-- folder moved across categories kept the old category. Found by the
-- begin…rollback harness before any UI existed; fire on every update and
-- let the function's old/new comparison decide.

drop trigger if exists project_folders_after_move on project_folders;
create trigger project_folders_after_move
  after update on project_folders
  for each row execute function project_folders_after_move();
