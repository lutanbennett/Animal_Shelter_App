-- Zones are either physically on-site (internal = true) or off-site, e.g.
-- foster homes / outreach (internal = false). Drives the resident list's
-- Internal/External column. Defaults to internal; set the 'Lifecycle'
-- pseudo-zone and any others to false manually where that's correct.
--
-- Applied manually via Supabase Studio (CLI push was blocked on an access
-- token) — this file documents the resulting schema for local dev/history.

alter table zones
  add column internal boolean not null default true;
