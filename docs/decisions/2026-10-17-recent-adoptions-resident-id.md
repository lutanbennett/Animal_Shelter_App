# public_recent_adoptions gains resident_id (0215)

The /adopt "Happy endings" pictures must link to a page of that animal's
published success stories (`public_adoption_updates`), but the view exposed
only the placement id. Migration 0215 appends `r.id as resident_id` as the
last column (the only change `create or replace view` allows).

- **Privacy:** nothing new is revealed. The view still requires
  `is_public_visible` and excludes Deceased, and `public_resident_cards`
  already exposes resident ids.
- **Restated from the live view**, not the 0061 file: later migrations changed
  the photo column (medical files hidden) and `adopted_on`
  (`shelter_date`). Taken from `pg_get_viewdef` on dev, column for column.
- **Schema first:** the code that reads it is PR #687, after this merges.
