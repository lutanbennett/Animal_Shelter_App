# 2026-09-29 — Microchip feature split: entry, display and scanner search first

Follows `2026-09-29-microchip-number-on-residents-15-digits-staff-only.md`. The
feature half was too big for one stream, so it was split at the seam the brief
suggested (Lutan agreed in chat).

**This PR:** number and implant date on Edit resident and the intake Health step,
shown on the hub with a gentle "no chip" nudge for a resident ready for adoption,
and the Scan a chip box on `/residents`.

**Later streams:** a vet-scoped write path (needs a security-definer function, so a
schema PR first: vets have read but no update on `residents`), the "Record the chip
number?" prompt after a Microchipping procedure, the deceased archive PDF and index,
vet-visit and procedure views, "Microchipped: yes" on `/adopt/[id]` (a boolean, never
the number), the dashboard count and a "No microchip" filter.

- **No migration; intake writes the chip after `record_intake`.** The RPC predates
  the columns. The action checks for a duplicate first, so a taken number is refused
  before a resident exists; if the follow-up write still fails (a race), the person
  lands on the edit page rather than losing the intake.
- **The jump is by exact match on 15 digits only**, taken from a query that is only
  digits, spaces and dashes. A name search is unchanged, so `residents-filter-adopted`
  is not affected. Deceased and every filter are bypassed for a chip match, on purpose.
- **RLS decides what a vet finds.** The lookup runs as the caller, so a vet scanning a
  chip outside their clinic's scope sees "no resident", and is not offered a new one.
- **There is no header search or R-code search in the app today**, so only `/residents`
  is covered; the manual is English-only, so there is no Thai manual text.
