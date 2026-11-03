# A release note can be flagged `admin: true` (2026-11-03)

Lutan answered option (a) on 2026-11-03: a note may carry an explicit `admin: true`. Options (b) and (c) are not built.

- `ReleaseNote` gains `{ text, admin: true }`. `isNoteListed()` and `isNoteForReader()` in `src/lib/release-audience.ts` show it to a
  login whose `perms.isAdmin` is true and to nobody else. `/releases` drops it before the "Show everything" view too, and a non-app
  reader (no permissions) does not see it either. An untagged note is still everyone's.
- **Admin is still given no card.** The flag is read through the same `perms.isAdmin` short-circuit `can.ts` uses. Nothing is keyed on a
  role name, and nothing in `can.ts`, the cards or the database changed. Admin is not debt and not a precedent.
- **Mail (deliverable 3).** `buildReleaseMail` sends every line to admins unfiltered, by design (the mail is the admins' record). An
  `admin: true` note is for exactly that audience, so page and mail agree: Admin sees it in both, nobody else sees it on the page, and
  the mail only ever goes to admins. Nothing needed changing beyond a comment and the test.
- **`ReleaseRole` (deliverable 2): LIVE, not removed, for the planner to file.** `ReleaseRole` is read only as a TYPE inside
  `releases.ts`, for the closed `roles:` tag on history notes. At runtime `noteRoles()` feeds `isForAnyRole` in `release-audience.ts`
  against a hard-coded `TAGGED_ROLES` list of the same role keys, and an unrecognised reader role is widened, never narrowed. So it still
  selects content by role NAME, which `CLAUDE.md`'s no-role-by-name rule forbids for new code. It is closed to new notes
  (`2026-10-26-release-notes-by-card.md`) and only history uses it; removing it means re-tagging the historical notes by card (or
  dropping their tags) and deleting `TAGGED_ROLES`. Not done here.
