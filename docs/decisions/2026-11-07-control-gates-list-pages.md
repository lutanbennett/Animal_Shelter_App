# Control gates on four list pages (#q0wc0, the remainder)

Step zero: the gap was still there (all four pages guard at edit). Nothing here loosens a policy, an RPC or a server check; the default of `requirePermission` is untouched. Carve-out: none of the seven other-stream pages is one of these four.

## What each page DOES, and the level it needs (read from the actions and policies, not comments)

| Page | Guard before -> now | Why |
|---|---|---|
| `/management/sterilisation-drives` (list) | `website.content` edit -> **read** | Rows come from `desexing_drives` / `desexing_drive_signups`, whose select policies ask `website.content` at **read** (`0233_desexing_drives.sql`). Every write asks it at edit (`actions.ts` `allowed()`). |
| `/management/contacts` | `contacts.directory` edit, **unchanged** | The list is read through `contacts_select_perm`, which since `0264` asks `contacts.browse` (yes/no), not `contacts.directory`. A login holding `contacts.directory` at read alone would open an empty table; opening it would need a policy change, which is forbidden here. Reading contacts is the `/contacts` page (`contacts.browse`). Every control asks `contacts.directory` edit (`contacts/actions.ts`), the same as the guard. |
| `/management/clinics` | `clinics.list` edit, **unchanged** | The page is the editor for clinics; `createClinic`, `updateClinic`, `deleteClinic` all ask `clinics.list` edit. Reading clinics is `/clinics` (`clinics.list` read). A read-only version would repeat that page. |
| `/admin/diets` (+ ingredients) | `reference.types` edit **and** `stock.diets` edit, **unchanged** | **Two cards together**: `canEditItemSettings` (item-settings.ts) asks both, because the table write policies ask `stock.diets`. Reported, not hidden. Every action (`actions.ts`, `recipe-actions.ts`) asks the same pair. |

## Controls on the drives list (the one change)

| Control | Drawn when | The action's own check |
|---|---|---|
| Start a drive (link to `/new`) | `can(perms, "website.content", "edit")` | `createDrive`: `website.content` edit (`sterilisation-drives/actions.ts`) |
| Drive title link (opens the editor) | same | `saveDrive`, `deleteDrive`, `setSignupStatus`, `deleteSignup`: the same |

A read login sees the title as plain text, so it is never offered a link to a page it is then refused. The registry entry in `routes.ts` gets `level: "read"` to agree with the guard (`check-permission-catalogue` passes).

## Proved on screen, one-card logins (dev, port 3002)

- Exactly `website_photos` (holds `website.content` at read): the list opens, shows the drive and its sign-up count, and the only link in the page is the back link.
- Exactly `website` (`website.content` edit): the same page also has Start a drive and the title link.
- A login with no website card: unchanged, still refused (the guard still needs read).

## More open or not?

No. Before: only logins with `website.content` edit opened the list. Now: logins with read or edit open it. Read already reads these rows through the policies, so it sees nothing it could not already select. No policy, RPC or server check was touched; every write still asks edit.

## Found, not fixed / observations

- Detail and `/new` pages stay edit: they are editors.
- If `requirePermission` defaulted to read, a page that forgot its level would be too open; left alone as the item says.
