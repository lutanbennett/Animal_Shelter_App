# Map rooms get stored names and descriptions; the fixed list of three goes (0175)

2026-10-10, `claude/map-rooms-schema`. Schema half of the backlog item **Map rooms: add more rooms, and give each a
description of what it is for, shown when it is tapped on the map**. The editor and the room card are the next
stream (`map-rooms-editor`).

## This supersedes 0157's fixed list

`0157_map_rooms.sql` made `kind` a fixed list of three (`medical`, `kitchen`, `storage`), one row each, with the
comment *"kind is a fixed list on purpose (no room editor was asked for)"*. On 2026-10-09 Lutan asked for exactly that
editor: Add room, Rename, Delete. So the reason for the fixed list no longer holds, and `0175` removes it:

- the value check on `kind` is dropped and `kind` becomes nullable; a room added from now on has no kind;
- every room has a stored `name` (not null) and `name_th`, back-filled for the three existing rows from today's
  dictionary words (`enclosures.map.roomKinds`: Medical room / ห้องพยาบาล, Kitchen / ครัว, Storage / ห้องเก็บของ).

## Two kinds of text, two routes, on purpose

The 2026-09-21 split (`docs/decisions.md`): **labels** carry their Thai in a paired `_th` column; **prose** carries it
in the `translations` table. A room has one of each:

| Column | What it is | Route | Registered in |
|---|---|---|---|
| `name` / `name_th` | a label, "Medical room" | paired column, as zones and enclosures | `translatable_labels` (`places` group), with the `label_sources` trigger |
| `description` | prose, "Simple procedures; medication is stored here." | `translations` queue, machine-translated then reviewed | `translatable_fields` (`reviewed`), with the queue and drop triggers |

They look inconsistent side by side in one file. They are not: each follows the rule for its kind of text. The
migration says so in its header so a later session does not move one onto the other's route. Both appear on
Management → Translations — the name among the places, the description in the prose queue, labelled
"Map room · <name>" and linked to Settings → Facility map.

## Why the one-per-kind rule stays, for now (a deliberate departure from the brief)

The item and the brief both say to drop the one-per-kind unique rule. It is **kept** in `0175`, because the live
Settings → Facility map (`src/app/admin/facility-map/actions.ts`, `saveRoom` and `restoreShapes`) writes rooms with
`upsert(..., { onConflict: "kind" })`, and `on conflict (kind)` needs a unique constraint on `kind`. Dropping it in a
schema-only PR would break placing a room on the map from the moment the migration applies until the editor ships —
the exact situation the schema-first rule exists to avoid.

Keeping it costs nothing for the new feature: a unique constraint allows any number of NULLs, and new rooms have no
kind. Only the three legacy rows are constrained, and they are one each anyway.

For the same overlap, a `before insert or update` trigger (`map_rooms_name_from_kind`) names a row from its legacy
kind when no name is given, so today's kind-only upsert still passes `name not null`. A room with neither a name nor a
legacy kind is refused.

**The editor stream drops all three together** once nothing upserts on `kind`: the `map_rooms_one_per_kind`
constraint, the `map_rooms_name_from_kind` trigger and function, and `map_room_kind_name()`; and then decides whether
the `kind` column itself goes. The column is kept here because a dropped column cannot be un-dropped in a hotfix.

## Measured, not reasoned

On dev, in rolled-back transactions: the file run twice in a row; today's kind-only upsert (insert and conflict path)
names the room in both languages; a second `medical` still refused; any other kind value accepted with a name; several
kind-less named rooms accepted; a room with no name and no kind refused (`not_null_violation`); a description queued
one `translations` row, which `private.translation_queue` labels "Map room · Quarantine" with path
`/admin/facility-map`; the name recorded in `label_sources`; deleting the room removed both. The back-fill turned three
nameless legacy rows into the three dictionary names (dev has no rooms drawn, so this was simulated).
