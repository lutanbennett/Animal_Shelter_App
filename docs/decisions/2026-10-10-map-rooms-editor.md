# Map rooms editor: rooms are written by id, and 0175's three leftovers are dropped later

2026-10-10, `claude/map-rooms-editor`. The build half of **Map rooms: add more rooms, and give each a description**
(parts 2 and 3). The schema half is `0175` and
[2026-10-10-map-rooms-names-and-descriptions.md](2026-10-10-map-rooms-names-and-descriptions.md).

## The three drops are deferred, not taken

`0175` kept three things only so the old editor kept working while the new one was built:

- the `map_rooms_one_per_kind` unique rule,
- the `map_rooms_name_from_kind` trigger and its function,
- `map_room_kind_name()`.

Its handover said to drop all three "in one migration" in this stream. **This stream did not**, because the batch
gave the only migration number (`0176`) to `receipt-issuer-server-side`, and only one in-flight branch may carry
schema. Taking a number anyway would have put two streams on the same number, as happened with `0067`.

Deferring is safe, and that was measured rather than assumed (`scripts/check-map-rooms.mjs`, on dev):

- **The unique rule cannot stop anyone adding a room.** A new room has no `kind` at all, and a unique constraint lets
  any number of NULLs through. Two kind-less rooms were added in one transaction; both stored.
- **The trigger never overwrites a typed name.** It only fills `name` when `name` is empty, and the editor always
  sends one (`cleanRoomName` refuses an empty name before the database is asked). A typed name was kept on a new
  room, on a legacy `medical` row, and on renaming that row in both languages.

What makes them safe to leave is the change below: once no write goes through `kind`, the three are dead code in
the database. The drops (and `kind` itself, which nothing reads either) are a backlog item for the next schema PR.

## Every room write is by its primary key

The old editor wrote rooms with `upsert(..., { onConflict: "kind" })`, which is exactly what tied it to the
one-per-kind rule. Now:

| Action | Write |
|---|---|
| Add room | `insert` with a name and a shape, no `kind` |
| Draw again / move to another plan | `update map_id, shape where id = …` |
| Rename, describe | `update name, name_th, description where id = …` |
| Delete room | `delete where id = …` |
| Undo a replace that cleared the shapes | `upsert … on conflict (id)` with the room's names and description |

`check-map-rooms.mjs` deliberately does not assert the rule or the trigger exist, so it stays green when they go.

## A room only exists drawn, so "take it off the plan" became Delete

`shape` is `not null`. A zone or an enclosure can be off the map and still exist; a room cannot. So the room list
offers Draw again and Delete (behind a confirm), not the bin-means-unplace of the zone and enclosure lists, and Add
room asks for the name first and stores nothing until the room is drawn. A cancelled add leaves no row.

Two existing paths delete rooms as a side effect, and now say so on screen because a room carries text:

- **Remove plan** cascades to the rooms on it (`on delete cascade`, `0157`). The confirm now says rooms go with the
  plan; zone and enclosure shapes are still kept.
- **Replace this plan → Clear them** deletes the rooms on the plan. The history snapshot now keeps each room's id,
  names and description, so **Undo the replace** puts the room back whole. One loss remains: the description's
  translation row is dropped with the room and re-queued when it comes back, so an approved Thai description has to
  be approved again. Snapshotting translations too was judged not worth it for a rare path that is itself an undo.
  Snapshots written before this change hold only `kind`; they come back as kind-less rooms with the three original
  names.

## Who sees the description in Thai: a known gap

The card shows the approved translation when the reader's language is the translation's, and the description as
typed otherwise (`localizedField`). The translation is read with the viewer's own session, and `translations` is
readable only with `translations.view` (management, staff) or `translations.manage`. **So the 2IC, the heads and
volunteers see the description as typed, in English, even once it is translated.** Admin and management see it in
Thai.

Not fixed here, deliberately: it needs a read policy (approved `map_rooms` translations readable with app access, as
`map_rooms` itself is), which is schema, and this stream had no number. Reading them with the service-role client
was considered and rejected: `src/lib/supabase/admin.ts` is for admin-gated actions only, and a volunteer page is
not one. The policy is part of the same backlog item as the drops.

## Smaller choices

- **Names are typed, not queued.** A room's name is a label (`name` / `name_th`, typed in the editor in both
  languages); its description is prose (one box, its Thai written in the TranslationPanel under it or on
  Management → Translations). This is `0175`'s split, kept on purpose.
- **The editor never moves on to another room by itself** after one is drawn, unlike enclosures. The other rooms
  are on their own plans, and drawing one here would move it.
- `roomKinds` is gone from both dictionaries; every room has a stored name. The only copy of the three original
  words left in app code is `LEGACY_ROOM_NAMES` in the facility-map actions, for restoring an old snapshot.
- The Translations page files the description under **Places**, beside the room's name, and links its label to
  Settings → Facility map.
