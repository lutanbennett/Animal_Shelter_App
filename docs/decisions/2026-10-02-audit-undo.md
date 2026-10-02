# 2026-10-02: Undo on Recent changes: newest change only, edits and deletes, admin only

Backlog DB-6 part 3, which closes the item. No migration: `audit_log.old_row`
(0121) is the whole mechanism. The button is on `/admin/recent-changes`
(`src/app/admin/recent-changes/actions.ts`, `src/lib/audit/undo.ts`).

## What happens when the row has changed since: refuse

An entry can be undone only while it is the **newest** audit row for its record.
A before-image is one moment, so restoring it over later edits would silently
throw them away; showing a diff of "what will be overwritten" would be a second
screen for something rare. The page offers the button only on the newest entry
and says "changed since, undo the newer change first" on the rest; the action
checks again on the server (the page's check is advisory). The way back through
a run of edits is to undo them newest first, each one a change of its own.

A race guard sits behind that: the edit's `update` also requires the changed
columns to still hold their after-values (plain scalars only; timestamps and
json are skipped so PostgREST's comparison parsing can never cause a false
refusal). Zero rows matched means "changed or deleted since", said in words.

An edit undo writes **only the columns that edit changed**, never the whole image,
because 0121 leaves `microchip_number` and `microchip_implanted_on` out of
residents and a whole-row write would wipe them.

## The undo is a change, and it is logged

It is an ordinary `update` or `insert` through the **admin's own client**, not a
database function and not the service role, so the 0121 trigger fires and
records `actor = auth.uid()` = the admin who clicked. Checked, not assumed:
`scripts/check-audit-undo.mjs` asserts one new UPDATE row (edit) or INSERT row
(delete) per undo, with the admin as actor. The list shows an undone delete as
**Added** and an undone edit as **Edited**; there is no "Undone" label, because
that needs a marker column and this part has no schema. The log's own order
(the accident, then the correction) is what reads it.

## Which record types get which

| Entry | Offered | How |
|---|---|---|
| Edit of resident, contact, prescription, visit, weight, vaccination | yes | changed columns written back |
| Hard delete of contact, prescription, visit, weight, vaccination | yes | `old_row` inserted |
| Archive / Restore (the four medical types and contacts) | no | the record's own Restore (part 1); a second path would duplicate it |
| Add (INSERT) | no | nothing to put back; archive it |
| Delete of a **resident** | no | `old_row` has no chip fields (0121), so it would come back without them; a resident cannot be deleted while weights, diets, placements and so on point at it, so those would have to come back first, in order |
| Any change to a **file** (attachments) | no | 0124 left attachments out on purpose: #252's delete trashes the Drive file, so a restored row would point at the bin; an edit could re-publish a photo |

Medical deletes are now Archive in the app, so a hard delete is a vet's own delete
or an admin's console work; the table is still the net for those.

## Who may undo: admin only

Not staff and management (the part 1 precedent), because the page and its table
are admin-only: only an admin can read `old_row`, and an undo is read from
`old_row`. Giving others the button would mean reading the log on their behalf.
The vet exclusion in part 1 (their own archive cannot be undone) does not arise.
The action checks the role itself, and RLS decides what the write may touch.

## Collisions with rows created since

0124's unique keys are partial on live rows. Exercised in
`scripts/check-audit-undo.mjs` against real dev tables: putting back a deleted
weight whose day has since been taken by a live reading raises 23505 (reported
as "something else now holds its place"); once that reading is archived the same
insert succeeds. A prescription whose visit is gone raises 23503 ("the resident
or visit no longer exists"). Anything else unexpected is logged with a reference.
