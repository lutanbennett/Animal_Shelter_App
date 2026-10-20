# 2026-10-20 — `correct-resident.mjs --enclosure-moves`: a duplicate's enclosure changes go with it

Lutan asked for R-0048 (Tun, ตุ่น) to be removed as a duplicate of R-0065
(Dtoon, ตูน). The script refused for two reasons: the names do not look alike,
and R-0048 had one `ChangeEnclosure` since intake. He confirmed in chat that
they are the same dog (so `--force-names`, which exists for exactly that) and
asked for an option to let the move through.

**`--enclosure-moves` lets `ChangeEnclosure` placements be deleted with the
duplicate. Nothing else changes.** Foster, adoption, hospital and every other
placement type still refuse, and they refuse with or without the flag.

Why enclosure moves and not "any move":

- A duplicate sits in the app as if it were a real dog, so staff move it with
  the original. Its enclosure changes record where a dog was that the kept
  record already describes; deleting them loses nothing about the animal.
- A foster, adoption or hospital stay is an event with people and dates
  attached. If the duplicate carries one, someone recorded it against the wrong
  record and has to decide where it belongs. That stays a person's call in the
  app, as in `2026-10-09-resident-corrections-script.md`.

It is a flag rather than the default so the dry run still stops and says the
moves are there. Without it, a duplicate whose only history is enclosure
changes now gets a refusal that names the flag, instead of "sort it out in the
app", which had no app step behind it.

The delete already removed every placement row of the duplicate; the flag only
widens the check, so the in-transaction re-checks and receipt are unchanged.
