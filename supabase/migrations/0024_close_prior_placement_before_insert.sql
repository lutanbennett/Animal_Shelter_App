-- Two fixes to close_prior_placement() / placement_history_close_prior (0001),
-- both found while building "move resident between enclosures":
--
-- 1. The trigger was AFTER INSERT, but placement_history_one_active_per_resident
--    (a partial unique index on end_date IS NULL) is checked as the new row is
--    written — before any AFTER trigger runs. So every non-Intake insert for a
--    resident with an open placement failed with a duplicate-key error and the
--    prior placement was never closed. Intake (the only placement type the app
--    had recorded so far) skipped the trigger, which is why this went unnoticed.
--    Closing the prior placement must happen BEFORE the new row is inserted.
--
-- 2. The function ran as the inserting user, so the UPDATE that ends the prior
--    placement was filtered by that user's RLS policies. Volunteers may insert
--    ChangeEnclosure rows (volunteer_insert_change_enclosure) but have no UPDATE
--    policy on placement_history, so for them the close would silently match
--    nothing. Run it as the function owner: closing the prior placement is an
--    internal consequence of a permitted insert, not a separate permission. The
--    function only ever touches end_date on the same resident's open placement,
--    so nothing wider is exposed. search_path is pinned as usual for security
--    definer functions.

alter function close_prior_placement() security definer set search_path = public;

drop trigger if exists placement_history_close_prior on placement_history;

create trigger placement_history_close_prior
  before insert on placement_history
  for each row execute function close_prior_placement();
