-- The page behind an enclosure's QR code, for visitors (backlog, Facility:
-- "A public view behind enclosure QR codes"; docs/decisions.md, 2026-09-24).
--
-- /r/<code> already answers a visitor who scans a resident's card (0068).
-- /e/<id> still sends them to sign-in, because nothing public describes an
-- enclosure. A visitor who scans the code on a kennel is looking at the
-- animals in it, so the answer is the enclosure and who lives there —
-- decided with Lutan on 2026-09-24 over "the enclosure only".
--
-- One row per physical enclosure: its name and Thai name, its zone's name
-- and Thai name, and `residents`, a json array of the public_resident_cards
-- rows of everyone currently placed there (ordered by name, `[]` when
-- empty). The cards are embedded whole rather than re-listed column by
-- column, so what a visitor may see about a resident is decided in one
-- place: 0068. Widen or narrow the card there and this page follows.
--
-- Deliberately not here:
--   capacity, notes, occupancy against capacity, maintenance — staff-only.
--     The array's length is a head count, which the visitor can make by
--     looking into the kennel; capacity and fullness are not.
--   The Lifecycle pseudo-zone (Unassigned, Hospital, Fostered, Adopted,
--     Deceased) — status buckets, not places, and naming who is in
--     Hospital or Fostered is exactly what 0068 keeps off the public tier.
--     Recognised by zone name, as resident_current_state and the app do.
--     Because every deceased and adopted resident is placed in one of
--     those buckets, excluding them also keeps the dead and the rehomed
--     off every kennel's list; no separate status filter is needed.
--
-- This does add one thing 0068 withheld: for a resident in a physical
-- enclosure, where they live. That is the point of the page, and it is
-- what a visitor walking round can already read off the kennels. External
-- (outreach) zones are included on the same reasoning: a code posted at the
-- Temple describes the dogs a visitor there can see.
--
-- Ordinary view (owner's rights, like the other public_* views), SELECT
-- only for anon / authenticated / service_role; checked by
-- check-public-views.mjs and exercised by check-public-enclosures.mjs.
-- Schema half only: claude/enclosure-public-view reads it once this is on
-- main. Re-runnable.

create or replace view public_enclosures as
select
  e.id,
  e.name,
  e.name_th,
  z.name as zone_name,
  z.name_th as zone_name_th,
  coalesce(
    (select jsonb_agg(to_jsonb(c) order by c.name, c.resident_code)
       from resident_current_state s
       join public_resident_cards c on c.id = s.resident_id
      where s.current_enclosure_id = e.id),
    '[]'::jsonb
  ) as residents
from enclosures e
join zones z on z.id = e.zone_id
where z.name <> 'Lifecycle';

grant select on public_enclosures to anon, authenticated, service_role;
revoke insert, update, delete, truncate, references, trigger
  on public_enclosures from anon, authenticated;

notify pgrst, 'reload schema';
