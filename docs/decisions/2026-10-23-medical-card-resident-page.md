# The resident page opens for a medical edit, and the list offers only what a login can use

**Decided 2026-10-23 (stream `medical-card-resident-page`). Builds on
`2026-10-22-medical-card-opens-the-record.md` and migration `0249`.**

## What changed

- `/residents/[id]` redirects a who-and-where login to `/r/<id>` **unless** `may_open_resident_record()` is
  true for it. The app asks the database function itself (`mayOpenResidentRecord()` in
  `src/lib/residents/who-and-where.ts`) rather than re-deriving "who_and_where role holding a `medical.*`
  edit" in TypeScript, so the page and the read policies cannot drift apart.
- Such a login gets the hub **read-only outside the medical sections** (`opensRecordReadOnly()`): no edit
  pencil, no housing actions (move, hospital, foster/adopt), no record-death, no microchip edit, no
  adoption-news add, no appeals, no translations. The six medical "add" buttons follow `can(..., "edit")` for
  each activity, for everyone, so Head of Medical (weight only) is offered only Log weight.
- The edit, move, hospital, rehome, death and adoption-news pages keep refusing a who-and-where login
  (`requireFullResident()` unchanged by default). Only the hub and the `[section]` tabs pass
  `allowMedicalCard: true`. Writes are refused by the database regardless (every write policy still asks
  `sees_all_residents()`).
- The doctor is `own_clinic`, so `readsWhoAndWhereOnly()` is false for them: neither the redirect nor the new
  read-only mode touches them. Confirmed by `scripts/check-medical-card-reads-record.mjs` (doctor unchanged).

## `/residents` buttons: hide, not refuse

A login with no resident card (a facility card) could see New resident, Book clinic visit, Log immunizations
and Download. Nothing wrote (the targets refuse), so this was tidiness and trust, not a hole. **Hidden, not
refused**: it matches what the hub now does, and refusing the page would take away a list a card may
legitimately read. Each button follows the permission its target page asks (`resident.register`,
`visit.book`, `medical.immunizations` edit, and for the download the export route's own rule).

## Not done, reported

- The **Operations tile and top-menu entry** come from `opensAnyIn(perms, "operations")`
  (`src/lib/home/tiles.ts`, `NavLinks.tsx`), a different system that asks which pages a login opens. Not a small
  gating change; left for its own item.
- Resident photos/attachments and adoption updates still ask `sees_all_residents()` (0152/0189/0223/0144), so a
  who-and-where login sees those sections empty. Known, named in `0249`'s header; a separate schema stream.
- `scripts/dev-signin.mjs --cards` makes a **scope `all`** role, so it cannot exercise this path. Use
  `head_of_medical` or `second_in_command` (real who-and-where roles holding a medical edit).
