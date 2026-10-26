# Card review 2, the app half for cards 22–29 (migration 0269) — 2026-10-26

Source: Lutan's answers to the card reports for cards 22–29, and two answers given after `0268` merged ("Make it a yes" on the
medical read for Run appeals; "send to hospital is a medical function so should only be visible through the medical card").
`0268` was the schema half; this is clause (b), plus the one migration this batch carries.

## The four broken saves, each watched failing before the fix (dev, one-card logins, 2026-10-26)

| Save | Before | Cause | Fix |
|---|---|---|---|
| Add Shelter Photos, "I know who it is" | 500 `Not authorized to add attachments.` | `record_attachment()` admitted a resident photo only for `photos.resident_add`; this card holds `photos.shelter_add` | `0269`: admit either; the Shelter-folder rule below it still confines `shelter_add` |
| Approve (a waiting photo) | "could not be approved" | restrictive policy `attachments_update_folder_guard` (0152) refuses any login that cannot publish (`photos.resident_publish`); Approve photos deliberately does not hold it | `0269`: the guard also admits `can_approve_photos()` |
| Wrong animal? | "could not be moved" | same policy (it updates `owner_id`) | same fix |
| Add Shelter Photos, enclosure route | worked before and after | — | — |

After `0269`: the same logins save, approve and move. Remove already worked. The guard still refuses a Medical-only login moving a photo
out of the Medical folder, and nothing here can publish a photo: `0217`'s trigger still marks a Shelter photo waiting.

## The conditional publish warning

Approve asks for confirmation only when the photo's animal is already shown on the website (`residents.is_public_visible`), naming the
animal. It is never shown on every approval: his words were "only if the animal is being published to the website already". The
single-photo path and the ticked-batch path both use it; the batch path keeps its own confirmation and adds this one only for the
public animals in the batch.

## Run fundraising appeals

- **Reads the setting.** The "this animal is not on the website" notice used `is_public_visible ?? false`, so a login that could not
  read the resident (null) was told the animal was hidden. It is now `null` when unreadable and the notice shows only on a real `false`.
  With `0268` the card can read the resident through View residents.
- **No approval step.** Rejected by him: "too many approval steps will create friction in the system".
- **Medical history at read** (`0269`): the card includes View medical. That is the medical read of every medical table plus the clinic
  list, and no edit cell; not Manage medical.

## Send to hospital moves to Manage medical

`placement.hospital` leaves Residents and joins Manage medical (`medical_records`), the action card; I read "the medical card" as that
rather than View medical because sending a resident to hospital is an action. **If he meant View medical, it is a one-line change.**
The buttons were already drawn from the activity (`placementActionsFor`), so they follow the grant with no code change.

**The one-way door.** Read from production on 2026-10-26 (`check-production.mjs role-cards`, run from the main checkout, which holds the
production env file): Residents is held by `management`, `second_in_command` and `staff`; Manage medical by `staff` only. So Management and
the second-in-command lose Send to hospital. **Decided by him, asked directly: let them lose it**; they get it back by being given
Manage medical in Settings → Who does what. The migration prints a NOTICE naming every role that loses a cell.
Production may be behind on migrations; read `--status --env production` before applying.

## Who does what read only

Nothing in the screen writes through `roles.view`: every edit action is `hasAdminRole()` + `hasTwoStep()`, and the page and the details
and features pages only ask `roles.view` / `opensWhoDoesWhat` at read. Nothing to change.

## Not done, on purpose

- The My tasks residents menu entry and all other nav hiding: `card-app-11-21` owns `NavLinks.tsx` and `routes.ts`.
- The page-body "buttons that cannot be used" on the resident page reached from these cards were done by #965 (edit pencil, Send to
  hospital, Foster / adopt, Move enclosure, photo drop zone, spreadsheet); re-checked, nothing further was found on the Add photos or
  Approve photos pages themselves.
- Dev only was written to (migration `0269`, applied once, shared by every stream).
