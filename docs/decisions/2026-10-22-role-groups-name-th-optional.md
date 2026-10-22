# role_groups.name_th is optional (0246)

Lutan, 2026-10-21: a group needs only an English name. `0241` had `name_th text not null check (btrim(name_th) <> '')`.

- `0246` drops only the `not null`. The check stays: NULL passes a check, so "no Thai name" is stored as NULL, while an empty or blank string is still refused. The app half must therefore write NULL, never `''`.
- Existing rows all have a Thai name, so nothing is back-filled.
- Showing the English name in Thai when `name_th` is NULL is the app half's job (`who-does-what-add-group`); the readers are `who-does-what/actions.ts`, `who-does-what/page.tsx` and `src/lib/home/roles.ts`. Until that ships they still type `name_th` as a string, which no row violates yet.
- Applied to dev 2026-10-22. Not other nullable-worthy columns: none noticed.
