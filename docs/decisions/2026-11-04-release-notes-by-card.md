# Release notes carry no role tags any more (2026-11-04)

Backlog `#5lxim`. `TAGGED_ROLES` in `release-audience.ts` selected content by role key at runtime, and still named the retired `staff`.

## Shape chosen: a hybrid of the brief's (a) and (b), decided on counting the notes

All 128 role-tagged history notes (129 `roles:` hits, one of them the type declaration) fall in 24 distinct combinations. Only two are mechanical:

| Combination | Notes | Converted to |
|---|---|---|
| `[admin]` alone | 32 | `{ text, admin: true }`. Same audience as before (Admin only), now expressed without a role key. |
| everything else (22 combinations) | 96 | the plain string, i.e. everyone's |

The other 22 combinations are `[admin, management]` (44), `[admin, management, second_in_command]` (10), and 20 more that are fuzzy mixes, including the retired `staff`. They are not a mapping decided once. "management" is not a card; it was a bundle of cards that is being rebuilt. Choosing a card per note would mean inventing 96 audiences on notes whose tags were themselves loose (several tell everyone with a login about a phone-layout fix). The role bundles those tags described will not exist after the card assignments are rebuilt, so the targeting being given up is targeting of a grouping that is going away.

**What is lost:** on 96 history notes, a reader who is not in the old tagged group now sees the note instead of having it greyed under "Show everything". It widens, which is the house default. **What is kept:** all 32 Admin-only notes still reach Admin and nobody else.

If Lutan later wants real per-card audiences on history, that is a separate piece of editorial work, note by note. Not done here.

## Changes
- Deleted `TAGGED_ROLES`, `ReleaseRole`, `RetiredReleaseRole`, the `{ text, roles }` variant, `noteRoles`, and `src/lib/manual/filter.ts` (`isForRole`/`isForAnyRole`: nothing else imported it).
- Note text untouched; only the audience expression changed.
- One behaviour change worth knowing: the 32 Admin-only notes used to show to a reader with no permissions (signed out). As `admin: true` they are now refused to that reader too (`isNoteListed`), the same as any other Admin-only note.
- Admin's path (`perms.isAdmin` short-circuit) not touched. `check-hard-coded-security.mjs` not touched.

## Found, not fixed
None.
