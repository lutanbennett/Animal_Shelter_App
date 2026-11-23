# One shelter name, typed once (#nmcol), 2026-11-23

**Fix, in one sentence:** `name` is NOT legacy (Google connect and the Drive-token alert read it as the shelter's label), so the three
columns are kept in step by the write paths: creating a shelter sets `name`, `display_name` and `short_name` from the one name typed
(short name defaults to it, editable), and saving the names also writes `name` = the full name. Migration `0437`.

| Column | Read by | Means |
|---|---|---|
| `name` | `src/lib/google/shelter-drive-tokens.ts`, `src/lib/google/shelter-google-connect.ts`, console headings in `ProductAdminPanel.tsx` | the shelter's label |
| `display_name` | `src/lib/shelter-settings.ts` (pages, PDFs, mail), console names form | full name |
| `short_name` | `src/lib/shelter-settings.ts` (mail senders, subjects), console names form | short name |

The `?? s.name` fallback in `ProductAdminPanel.tsx` is kept: the migration backfills NULLs so it no longer fires, but the column type is nullable and the fallback is harmless.

**Data step for existing rows (NOT run; production is not reachable from a worktree).** 0437 backfills NULL `display_name`/`short_name`
from `name` and overwrites nothing. A row where the three DISAGREE (e.g. `test555`, retyped by hand) needs the planner to run, on production
after applying 0437, naming `display_name` as the winner (it is what the person typed last and what pages show):
`update public.shelters set name = display_name where display_name is not null and name <> display_name;` Review the rows first
(`select key, name, display_name, short_name from public.shelters`); do not run it on `lanna` without looking.
