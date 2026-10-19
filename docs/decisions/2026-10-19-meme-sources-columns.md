# Meme sources: nullable columns on `memes`, not a `meme_links` table (2026-10-19)

Migration `0228_meme_sources.sql`, schema half of the meme-maker widening. The app half is a later stream.

**Chose columns** (`source_kind`, `outing_id`, `maintenance_id`, `project_id`, `source_photo_ref`) because:

- A meme is made from one photo, once, and never changes source. A link table would hold exactly one row per meme.
- Real foreign keys (`on delete set null`) give integrity; a polymorphic link table needs guard triggers, as `social_shares` does.
- "All memes made from outreach" is one indexed predicate; a job's or project's Memes list is an indexed lookup.
- A check constraint stops an outing id on a non-outing meme.

`source_kind` values: resident, outing, maintenance, project, website, upload. Null means unrecorded (existing memes).
Outreach notes are `community_dog_outings`; projects are `project_folders`. Medical photos are not referenced.
RLS unchanged (existing memes policies cover the columns). Revisit only if a meme ever needs several sources.
