# 2026-11-09: reference.types ruled Admin-only; the audit check gains its third question

## #j8vt4: reference.types is Admin-only on purpose

Lutan, 2026-11-09: *"Keep it as only admin for now, it should be a set list that very rarely requires adjustments."*
`reference.types` at `read` and at `edit` moved from `foundNotRuled` to `adminOnlyOnPurpose` in
`docs/ungranted-activities-allowlist.json`. `check-ungranted-activities.mjs`: before `3 Admin-only on purpose, 16 UNRULED`,
after `5 Admin-only on purpose, 14 UNRULED`. No card is built. A Set up diets holder still cannot add a unit and asks the
administrator; that is now intended (`#q7dn3` is the separate policy fault, untouched).

## #v3qmz: a table that decides access must carry an audit trigger

`check-audited-tables.mjs` asked only "is a triggered table listed" and "is a listed table triggered", so a table with
neither passed (card_includes, 0257 to 0341). Third question added in `scripts/lib/access-tables.mjs`.

**Chosen: derive the set, do not hand-declare it.** Any table the migrations create (following drops and renames) whose
name matches `ACCESS_NAME` (`roles`, `user_roles`, `role_*`, `card_*`, `*permission*`) must have an audit trigger, found by the
existing `audit-triggers.mjs` scanner. A hand list is added to by someone who does not know it exists; a name is chosen
by the author anyway. Two small hand-kept records remain, each needing a reason and each failing when stale:
`NOT_ACCESS` (named like access, decides nothing: `permission_activities`, `role_groups`, `role_home_tiles`) and
`KNOWN_UNAUDITED` (empty; for a gap that cannot be fixed in the same change). The failure message names the table and says where to add an excuse.

**Limit:** a permissions table named outside the pattern is not caught. Found while building: `role_extras` and `role_home_tiles` were both dropped (0261, 0243), so the real repository is clean.

**Proof it fails:** `scripts/check-audited-tables.test.mjs` builds throwaway migrations; a `role_overrides` table with no trigger fails, with one passes.
