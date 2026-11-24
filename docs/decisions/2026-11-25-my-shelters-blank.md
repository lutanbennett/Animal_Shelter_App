# #shmis: "My shelters" says what it found, and is the one door

**Step zero:** `0433:36` was still an inner join on `is_primary`, `page.tsx:34` was still `notFound()` on an empty list, and `0438` was the highest migration. Gap present.

## The states `my_shelters()` could and could not tell apart (before)

| State | Before | Now |
|---|---|---|
| Not linked (no role there) | not returned | **still not returned, on purpose**: it would reveal a shelter the caller is not part of |
| Linked, live, has a primary address | returned | returned, linked |
| Linked, live, **no primary address** | **dropped** (inner join) | returned with `host` null, listed without a link: "No address yet" |
| Linked, **closed** (`archived_at`) | **dropped** (only live shelters were walked) | returned with `archived` true, listed without a link: "Closed" |

So before, the function could not tell the last three apart from the first; it could only show the one it linked.

## What changed

- **`0439`** drops and recreates `my_shelters()` (the return type gains a column, which `create or replace` cannot do): `(shelter_id, name, host, archived)`. `host` is the primary address or null (a scalar subquery, not a join); every shelter is walked, closed ones included. **Unchanged:** no argument, answers only for `auth.uid()`, only shelters the caller holds a role at, `rls_definer` ownership, revoke from public/anon, grant to authenticated. `is_primary` keeps its meaning and the host rule is untouched: a shelter with no primary address is shown **without a link**, never as though it worked.
- **Page:** `notFound()` at the empty list is gone; an empty list is a sentence. Entries with no address or closed are a plain box with the reason and a note, not a link.
- **The door:** the "not for this sign-in" page on `/platform` now has one button, **My shelters**, to `/platform/shelters` (was "Go to the app", which assumed one app). The product page's third sign-in link is renamed **My shelters** too. The person pressing it is not asked whether they work at several.

## Decisions

- **Exactly one shelter: still show the list**, not an automatic jump. The list now carries states a jump would hide (no address, closed), and a jump to a shelter with no address is impossible, so the behaviour would differ by state. Same answer as `2026-11-21-shelter-chooser-page.md`.
- **Empty list:** a sentence, "This sign-in does not hold a role at any shelter yet…", not a 404 and not a blank.
- **Closed shelter:** listed, "Closed", no link. A person with a role there should be able to tell it was closed rather than wonder whether their access failed.
- **Not a widening of access.** The function shows only what the login already holds a role at. No role key is read anywhere; Admin unaffected.

## Deliberately still omitted

A shelter the login holds no role at (never revealed). Making an address answer (`#hstau`). The `/platform` wrong-door wording itself (`#cjred`).

## For the planner

`my_shelters()` is still a definer function, now with a changed signature: the tenancy catalogue (`tenancy-catalogue-seven`) lists it by name, so check whether its entry needs the new column list. The registry entry in `docs/hard-coded-security-registry.json` still cites `0433`; the reason holds, only the migration moved.
