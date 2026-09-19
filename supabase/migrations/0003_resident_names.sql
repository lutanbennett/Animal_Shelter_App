-- Adds Thai name and other/AKA names to residents, for the main resident list
-- view: "Full name" displays as `name (thai_name)` when a Thai name is set.
--
-- Applied manually via Supabase Studio (CLI push was blocked on an access
-- token) — this file documents the resulting schema for local dev/history.

alter table residents
  add column thai_name text,
  add column other_names text;
