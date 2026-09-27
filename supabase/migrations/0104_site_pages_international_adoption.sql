-- The Pet relocation page becomes the International adoption page
-- (backlog, "Hide the Pet relocation page, and give International adoptions
-- a page instead", 2026-09-27; schema half — the feature half removes
-- /relocation, adds the new route, starter text, links and illustration).
--
-- Lutan reversed #171: relocation is the Director's own private work, not
-- something the shelter offers, so it does not belong on the shelter's
-- site. What the shelter does do is international adoption — an adopter
-- abroad taking one of its animals home. The page is REPURPOSED, not
-- replaced (decided 2026-09-27; a new page under a fresh slug was
-- considered and turned down): the site_pages row 0099 seeded keeps its id
-- and all the plumbing built around it, and only the slug and the words
-- change.
--
--   slug   relocation -> international-adoption, and site_pages.slug's
--          check constraint (0099) lists the new slug instead of the old.
--   title  'International adoption'. Whatever the row was titled, under the
--          old slug it was a relocation title.
--   body   cleared, for the same reason: any body saved under the old slug
--          is relocation text, and the new page should start from its own
--          starter text (the app shows the dictionaries' starter while the
--          body is empty). On dev 2026-09-27 the body was already empty.
--
-- The row's translations follow on their own: site_pages' queue trigger
-- (0056) marks the title's Thai stale-or-pending against the new English
-- and deletes the body's translation once the body is empty.
--
-- Until the feature half ships, the app on `main` still asks for
-- 'relocation': /relocation renders without a saved row and its editor on
-- /admin/website has nothing to save into. Neither has reached production
-- (#171 is still in `unreleased`), and the feature half removes both.
--
-- Re-runnable: the constraint is dropped before the update and re-added
-- after it, and the update only matches a row still on the old slug, so a
-- second run cannot clear text an admin has since typed into the new page.

alter table site_pages drop constraint if exists site_pages_slug_check;

update site_pages
   set slug = 'international-adoption',
       title = 'International adoption',
       body = ''
 where slug = 'relocation';

alter table site_pages add constraint site_pages_slug_check
  check (slug in (
    'our-story', 'how-to-adopt', 'foster', 'volunteer', 'donate',
    'international-adoption', 'shelter-friends-join'
  ));

notify pgrst, 'reload schema';
