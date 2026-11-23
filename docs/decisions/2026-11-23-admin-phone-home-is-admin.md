# Admin's Home on a phone goes to /admin, on every device (#chadm)

**Lutan, 2026-11-23:** *"regression of chips and role based cards showing on admin home, these should be under the who does what page"*, then *"it just happens on mobile and when i click home it takes me to the sub page under who does what"*.

**Cause.** `src/app/home/page.tsx` sent a phone Admin to `/home/<role>` for the role keyed `management`, else `roles[0]`. A role home draws `HomeSwitch` (a chip per role). That is also a named-role read with an arbitrary fallback, which `CLAUDE.md` forbids ("No code may fall back to a role BY NAME").

**Decision.** Admin goes to `/admin` on every device. The device branch is gone. Chosen because it makes Admin's landing one decision rather than two, Admin holds no cards so a role's home is the wrong place for it, and nobody asked for a card-derived Admin home. `/admin` is what a desktop Admin already saw.

**Not changed.** `HomeSwitch.tsx` (it orders and labels roles, which is allowed) and the simulate page under Who does what, which is where the chips belong. No registry entry: this was the last unrecorded named-role selection on that path and it no longer exists.

**No check can catch this class.** `check-hard-coded-security.mjs` passes before and after, because the line selected a destination and granted nothing. A user found it, on a phone.
