-- A hook line and an "ideal home" section for a resident's public page
-- (backlog, "Public site redesign", part 3: the resident page). Schema half
-- only; no code reads these columns yet.
--
-- The redesign's /adopt/[id] shows a one-line hook under the name ("Loves a
-- lap and a long walk"), story and ideal-home sections, and size in the
-- quick facts. The item said hook, ideal-home and size "may need schema".
-- Two of them do:
--
--   hook_line    One sentence that sells the animal. Free text, nullable;
--                length is the form's business, not a check here.
--   ideal_home   A short paragraph: the home this animal would thrive in
--                ("A quiet house without cats, with someone home most of
--                the day"). Free text, nullable. Distinct from the
--                good_with_* fields (0060), which are the structured facts
--                behind it; this is the prose that explains them.
--
-- Size needs nothing: residents.size (0051, Small / Medium / Large) is
-- already on public_resident_profiles and already shown on /adopt/[id].
--
-- Both are TRANSLATABLE, like bio, temperament_notes and past_story_notes
-- (0056): they are prose shown to the public, a Thai visitor should read
-- them in Thai, and a paired `_th` column cannot tell that the English
-- changed after the Thai was written — the translations table's source
-- snapshot can. (Paired columns are for short labels that are a second
-- value, like thai_name; a hook line is a sentence, not a name.) So each
-- gets a translatable_fields row, tier 'reviewed', and residents' existing
-- queue trigger (0056, generic over translatable_fields) queues them with
-- no further change. Nothing to back-fill: both columns start empty.
--
-- Exposed on public_resident_profiles — the view /adopt/[id] reads through
-- src/lib/residents/public.ts — appended after 0060's last column, the one
-- shape of change `create or replace view` allows; the grants (0025) are
-- restated so the file stands alone. NOT added to public_resident_cards
-- (0068): that is the card-shaped slice of every resident behind /r/<code>,
-- and 0068 kept adoption-listing copy (past_story_notes) off it; a hook and
-- an ideal home are the same kind of copy. The approved translations reach
-- the page through the view's existing `translations` column.
--
-- The two lines here that are NOT a copy of 0060 are schema-qualified.
-- 0082 moved approved_translations() to `private` (views must now write
-- private.approved_translations), and the status subquery names
-- private.resident_current_state. 0086 moved that view to `private` and put
-- a gated view of the same name in `public` that answers nothing to anon or
-- a public viewer. The existing public_resident_profiles followed the move
-- by oid, but re-creating it from 0060's text would bind the unqualified
-- name to the gate: for a visitor every status would read null, coalesce to
-- 'Resident', and adopted and deceased residents would be back on /adopt.
--
-- Additive and nullable. residents' RLS policies and table grants cover the
-- new columns. Re-runnable: guarded columns, `on conflict do nothing`,
-- `create or replace view`, idempotent grants.

alter table residents add column if not exists hook_line text;
alter table residents add column if not exists ideal_home text;

comment on column residents.hook_line is
  'One public line that sells the animal, under the name on /adopt/[id]. Translatable (0056 queue). Null = not shown.';
comment on column residents.ideal_home is
  'Public prose: the home this animal would thrive in, shown on /adopt/[id]. Translatable (0056 queue). Null = not shown.';

insert into translatable_fields (table_name, column_name, tier) values
  ('residents', 'hook_line', 'reviewed'),
  ('residents', 'ideal_home', 'reviewed')
on conflict do nothing;

create or replace view public_resident_profiles as
select
  r.id,
  r.name,
  r.species,
  r.breed,
  r.sex,
  r.ready_for_adoption,
  r.bio,
  r.temperament_notes,
  r.past_story_notes,
  r.profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size,
  private.approved_translations('residents', r.id) as translations,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  r.colour,
  r.is_desexed,
  exists (
    select 1 from immunization_records i where i.resident_id = r.id
  ) as is_vaccinated,
  r.hook_line,
  r.ideal_home
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_resident_profiles from anon, authenticated;

notify pgrst, 'reload schema';
