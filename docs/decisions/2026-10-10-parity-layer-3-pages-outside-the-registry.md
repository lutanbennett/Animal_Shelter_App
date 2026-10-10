# 2026-10-10 — Parity layer 3: every page is in one of three buckets

`parity-layer-3`. Scripts only, no migration, no app change. Closes the gap
`2026-10-09-parity-check-layers-reconciled.md` named under "Layer 3 in detail": the
37 registered pages were pinned (section E), and nothing pinned the other 71.

## What the check does now

`scripts/check-permission-catalogue.mjs` (already in `npm run lint`) gained
**section F**. It walks every `page.tsx` under `src/app` and requires each to be in
**exactly one** bucket:

1. **The route registry** (`src/lib/permissions/routes.ts`), checked by section E
   as before. **37 pages.**
2. **`PINNED`**, in the script: the page's guards *word for word* (whitespace aside),
   and the set of `can(…, "activity"[, "read"])` calls in its body. The guards are the
   whole set on the page (`requirePermission`, `requireFullResident`,
   `requireAnyPageIn`, `requireAdminUser`, `requireRole`, and any
   `if (…) refuseFor(…)`), so a guard added, dropped or changed fails, and so does a
   `can()` that appears, disappears or changes key or level. **44 pages.**
3. **`EXEMPT`**, in the script: no permission guard, and a written reason why none is
   needed. An exempt page that gains a guard fails (pin it instead); one marked public
   is checked against `src/lib/public-paths.ts`, the list the proxy lets through signed
   out; its body's `can()` calls are pinned the same way. **27 pages.**

A page in none of them fails with *"A new page: add it to PINNED … or to EXEMPT"*. A
listed path with no `page.tsx` fails as STALE. Proven by adding a throwaway page and
watching `npm run lint` go red (test plan).

Why in section E's script and not a new one: it is the same question about the same
files, it is already in lint, and E's list (the registry) is one of the buckets.

## Each guard was read against what the page does

The brief's warning was the point: pinning each page to whatever it says today pins
any bug in place. So every `PINNED` entry was read against the page: does it write?
Then its guard is Edit, or its form sits behind a body `can()` at Edit.

**Four pages write and open at Read.** Each renders an edit form for its row with no
Edit check anywhere on the page:

| Page | Guard today | Should be |
|---|---|---|
| `/weight/[id]/edit` | `requirePermission("medical.weight", "read")` | `requirePermission("medical.weight")` |
| `/prescriptions/[id]/edit` | `requirePermission("medical.prescriptions", "read")` | `requirePermission("medical.prescriptions")` |
| `/diets/[id]/edit` | `requirePermission("medical.diet", "read")` | `requirePermission("medical.diet")` |
| `/clinic-visits/[id]/edit` | `requirePermission("medical.visits", "read")` | `requirePermission("medical.visits")` |

Their server actions do not ask `can()` either; **the database is the backstop**: the
tables' update policies ask `has_permission(…)` at Edit (`0135`, `0145`), so a
Read-only login (a volunteer holds all four at Read, `0132`; the Head of Medical holds
`medical.diet` at Read, `0140`) is shown a form whose save then fails. A wrong door, not
a data leak — so a backlog item, not an alarm. Their `/new` pages next door are
correctly at Edit, which is what makes this look like a slip, not a choice.

These four are pinned at **Edit** with a `known` entry naming what they say today and
the backlog item. The check prints them as `KNOWN` on every run and does not fail;
**the day a page is fixed, its `known` entry turns STALE and fails** until removed. So
the list states the right answer and cannot defend the wrong one (the same rule as the
parity check's `known` tightenings).

**Two more open at Read on purpose and were checked, not assumed:**
`/maintenance/new` and `/maintenance/[id]/edit` open at Read and show a reader
"read only" instead of the form, behind `can(perms, "maintenance.jobs")` (Edit). That
body `can()` is pinned with them.

How the rest were checked: for every pinned page, its guard was listed alongside the
`can()` calls and the form or editor components it renders; add/edit pages were
compared with their `/new` siblings and with the server action's own check; detail
pages (`/clinics/[id]`, `/contacts/[id]`, `/enclosures/[id]`, `/projects/[id]`,
`/maintenance/[id]`) open at their list's level and pass every write control a
`can()` flag.

## Bucket three, every page and why

All but the public ones are behind the proxy's gate first (`src/lib/supabase/proxy.ts`):
signed in, and a role that opens the app.

| Page | Why no permission |
|---|---|
| `/` | Public home page; reads the session only to choose the header. |
| `/login`, `/login/forgot`, `/login/request` | Sign-in and its own pages: no one to ask yet. |
| `/privacy` | Static notice Google's consent screen links to. |
| `/adopt`, `/adopt/[id]`, `/adopt/international` | Public website, the anonymous tier (`public_resident_profiles`, site_content). |
| `/our-work`, `/our-work/[id]` | Public website, `public_projects` (0042). |
| `/foster`, `/volunteer`, `/donate`, `/friends/join` | Public website, a `site_pages` page, same text for everyone. |
| `/friends` | Public website, `public_shelter_friends` (0076). |
| `/r/[code]` | A resident's RFID card: the public card for anyone; a reader is sent on by the body's `can(resident.record, read)`. |
| `/e/[id]` | An enclosure's QR code: the public enclosure; a reader is sent on to `/enclosures/[id]` (registry). |
| `/no-access` | The refusal page itself. It must open with no permission, or a refusal loops. |
| `/account/password` | Changing your own password; every login must be able to. |
| `/home` | Dispatcher: sends each role to its home, or shows tiles derived from the registry. Refuses a role that does not open the app. |
| `/my` | Your own tasks; each list is loaded behind its own `can()` (pinned). |
| `/manual` | Manual text for every app role. |
| `/releases` | Release notes for every app role; the environment line is behind `can(system.status)`. |
| `/assistant` | A role without `assistant.ask` gets the "can't use" note and nothing is loaded. |
| `/management/medication-list` | A redirect to `/operations/medication-list` (registry), kept for old links. |
| `/residents` | Every app role reads residents at least as who-and-where (§5, 0134); the view and RLS decide the rows. |
| `/residents/[id]` | The record hub. See below. |

**`/residents/[id]` is the weakest of these, and is named rather than hidden.** It has
no `requirePermission("resident.record", "read")` of its own: a who-and-where login is
redirected to `/r/` by a role-name check (`readsWhoAndWhereOnly`, the one place the app
says "volunteer"), and for everyone else RLS decides what comes back (a doctor sees
only its clinics' residents, else the card). Its sub-pages all use
`requireFullResident()`; the hub does not. No role can see more than RLS allows, so it
is not a hole, but it is the only resident page whose door is the database alone. It
is a backlog item (*"`/residents/[id]` has no permission guard of its own"*), not
changed here (this stream does not change app guards).

## What remains unchecked

Be clear what the green means:

- **A `decides` pin proves the call is there with that key, not what it gates.**
  `/residents/[id]/move` contains `can(perms, "placement.move")`; the check does not
  know that the form only renders when it is true. That is read by a person, and was
  for each page below.
- **The in-body decisions, page by page** (all now pinned by key, none checked for
  what they gate):
  - `/residents/[id]/edit` — `resident.record` (Edit)
  - `/residents/[id]/move` — `placement.move`
  - `/residents/[id]/hospital`, `/hospital/return` — `placement.hospital`
  - `/residents/[id]/rehome`, `/rehome/return` — `placement.rehome`
  - `/residents/[id]/deceased` — `placement.death`; `/deceased/undo` — `placement.death_withdraw`
  - `/residents/[id]/adoption-updates/new`, `[updateId]/edit` — `resident.adoption_news`, in the shared `AdoptionUpdatePage.tsx`
  - `/residents/[id]/[section]` — `medical.archive`, `resident.adoption_news`, `resident.microchip`; its entry activity per tab is the page's `SECTION_READS` map, which *is* pinned entry by entry
  - `/maintenance/new`, `/maintenance/[id]/edit` — `maintenance.jobs` (Edit) gates the form
  - the detail pages' write controls, and the exempt pages' `can()` calls listed above
- **`can()` asked in a component the page imports** is not seen, except the one
  shared component named with `in:`. Nor are calls whose activity is not a string
  literal (`/admin/role-draft` loops over keys).
- **Server actions** are not part of this check. The four findings above show they
  often ask nothing and lean on RLS; layer 1 of the parity check is what tests the
  database answers.
- **The cells behind every guard** are layer 0's (`check-permission-parity.mjs`),
  which needs dev credentials and is not in CI.
