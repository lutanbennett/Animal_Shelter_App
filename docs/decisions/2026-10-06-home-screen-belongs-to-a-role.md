# 2026-10-06 — `home-screen-belongs-to-a-role`: a home belongs to the role, and a role a shelter makes starts with the derived one

Settles the item `management-role` (#375) filed, `docs/decisions/2026-10-05-management-role.md` §4: a four-tile phone home keyed on
the string `management`, so a shelter-made manager role with Management's exact cells gets the generic home.

## 1. The call: neither candidate. The generic home is correct for a role until someone curates it

A home is a **property of the role** (§8 of `docs/roles-and-permissions.md` already says so). What was undecided is *where a
curated one is stored*, and the answer today is: nowhere a shelter can reach yet, so a shelter-made role has the derived home.
That home (`homeTilesFor`, second half) shows a tile if and only if the role holds the cell the page needs, so a manager role
made in Settings gets every page it may open and no tile that refuses. That is the invariant #375 pinned, and it holds with no
curated screen at all. The "bug" was only a bug if a new role *should* inherit Management's four tiles, and nothing says it should:
the four are what the Director chose for her own day, not a property of "being a manager".

The code change is deliberately small and does not alter any role's home: `managementDay` is looked up in `CURATED_HOME` in
`src/lib/home/tiles.ts` rather than reached by `if (key === "management")`. That makes "which roles have a chosen home" one
visible list, and the place a stored home will later feed. `check-home-screens.mjs` now proves a role under another key
with Management's exact cells gets the derived home, loses a tile when its cell goes, and keeps Residents when every cell goes.

## 2. Why not A, `roles.home_path`

- **The premise was wrong.** The backlog says a vet uses `home_path`. It does not: the `vet` row (`0132`) leaves it null, and
  `/home` sends a vet to `/appointments` by *scope* (`scopes.clinical === "own_clinic"`, `VET_HOME_PATH`). The only rows with
  `home_path` set are Head of Medical, Head of Maintenance and the 2IC, to `/home`, which is the page itself: a no-op.
  So there is no working precedent, only a column and a redirect that nothing needs.
- **It points at a page; a curated home is a list.** `home_path` is a redirect target (`redirect(safeNextPath(...))`). The
  Director's screen is four tiles on `/home`. Storing it there would mean adding a second mechanism next to it and calling it the
  same thing, or pointing it at a new page per curated home, which is worse than the tile list.
- **Cost, had it been chosen:** a `/home/management` route that hard-codes the same four tiles (so the string moves, it does not
  go), plus a data fix so the Director's row carries it. Nothing gained.

## 3. Why not B, a job list

`2026-10-05-management-role.md` §5 says it already: Management is a *template* role whose cells are wider than her home (48 cells,
four tiles). Putting her in `JOBS_OF_ROLE` would make "the cells equal the union of the bundles" impossible to check for her, and
removing a job would imply removing rights she is meant to keep. A job-built role shows its jobs and nothing else, so it is a
different thing from a curated view over wide rights. Cost, had it been chosen: invent four jobs for her, relax the job-built
invariant, and a manager role would still need its jobs chosen one by one.

## 4. What this means for the Settings matrix (the stream waiting on this)

- **No schema now, and no `home_path` to wire.** Creating a role needs no home: it starts with the derived one.
- **When a shelter wants to curate one**, the shape is an ordered list of tile keys on the role (a `home_tiles` column or table),
  read by the same code that reads `CURATED_HOME`, each tile still filtered by the role's cells. That is a schema PR of its own
  and is not worth pre-building; Management's list would move from code into that column then.
- **`home_path` is a landing redirect and should stay that.** Leave it out of the create-role form unless a role really
  needs to land on one page; the three `'/home'` values are harmless and could be cleared.
- **The rule to keep:** a tile appears if and only if the role holds the cell its page needs, in both the derived and curated
  branches. `check-home-screens.mjs` pins it for Management and now for a shelter-made role.

## 5. Not done

- No role's home changes, so there is no release-notes line and no manual change.
- `src/app/my/page.tsx` still redirects a vet by name (`role === "vet"`), as its comment says; that is the same keying habit and
  is not touched here.
