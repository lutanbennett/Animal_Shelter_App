# 2026-09-26 — My tasks (`/my`): one task shape, one loader per source

The page is "what I need to do today" for the signed-in person. Version 1
has one source, maintenance, but the item was explicit that vet trips,
medication rounds and stock orders plug in later, so the contract is
written down here for the stream that builds the next one.

- **The contract is `MyTask` in `src/lib/my-tasks/types.ts`:** `key`
  (unique across sources, `"<source>:<id>"`), `source`, `title`, optional
  `code`, `about` (the place or resident it concerns), `due` (a shelter
  `YYYY-MM-DD`, or null), `href` (the full record), `others` (who else is
  on it), `status` and `action`. A loader returns a `MyTaskSection`
  (`{ source, tasks, error }`); the page pushes one per source the reader's
  role can read, and the list groups each section by `dueBucket()` —
  overdue, today, later, none. A new source is: a member of
  `MyTaskSource`, a loader beside `maintenance.ts`, a line in
  `src/app/my/page.tsx`, its heading and "open full list" link in the
  dictionaries and `SOURCE_META`, and — if it has a quick action — a member
  of `MyTaskAction` with its buttons in `MyTaskList.tsx`.
- **Text leaves the loader already in the reader's language.** The page is
  a server component that re-renders on a language switch, so the loader
  picks the approved title translation (0057) and the Thai place name
  itself. The list never needs to know where a string came from, which is
  what keeps it source-agnostic.
- **The action is a tagged description, not a function.** A server
  component can't hand a closure to a client one, so `action` says what to
  do (`{ kind: "maintenanceStatus", jobId, status }`) and the list maps the
  kind to an *existing* server action — `setMaintenanceStatus`, the same
  one the board's drag-and-drop calls. `/my` has no write path of its own,
  as the item asked. `action` is null where the role may read but not
  write (volunteers on a maintenance team), so the row shows the status
  without buttons rather than buttons RLS would refuse.
- **`status` is typed as a maintenance status for now.** Widening it to a
  per-source union is the next source's job, when there is a second
  vocabulary to widen it with; a generic label-and-tone object today would
  be guessing at a shape nobody needs yet.
- **Completed leaves the list at once, with Undo.** `setMaintenanceStatus`
  also moves the job's Drive folder, which took several seconds on dev, so
  the row disappears and the "marked Completed — Undo" line shows straight
  away rather than after the action returns. Undo calls the same action
  with the previous status.
- **The nav badge counts due-today-or-overdue only, not every open job.**
  A badge that is never zero stops being read. It is one head-only count
  query in `NavPane` (`countMyUrgentMaintenance`), not the page's loader,
  because it runs on every page. A later source adds its own count there.
- **`/my` is the app's home page (Lutan, 2026-09-26, on #138).** `/` stays
  the public home for everyone; a staff sign-in with no `?next=` lands on
  `/my` instead of `/residents`, and so do "Open the app" in the public
  header and "continue" after a forced password change. All three read
  `DEFAULT_SIGNED_IN_PATH` (`src/lib/auth/next-path.ts`), so moving the
  home again is one line. A `?next=` still wins, and a public viewer still
  lands on `/` (#135) — `signedInLandingPath()` is unchanged apart from
  the constant.
