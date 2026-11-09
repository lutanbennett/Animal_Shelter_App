# 2026-11-09 — Recent changes names a card by its title; the manual stops assuming a menu

Backlog `#p6dhc` and `#j4m8t`. Stream `claude/card-names-on-screen`. No migration, no card change.

## Step zero

Both gaps were real on `main` at `be6228c9`: `role_cards` and `card_grants` printed the raw key (the title lookup was
guarded by `table === "card_includes"`), and `src/lib/manual/en.ts` said "At the bottom of the menu…" with no condition.

## Recent changes (`#p6dhc`)

#1412's lookup is `cardTitle()` in `src/app/admin/recent-changes/page.tsx` (`isCardKey` then `CARDS[key].label(t)`). It
generalises as it stands, so no second lookup was written. `toEntry()` now sets `AuditEntry.cardRef` (`card`, and for a
grant the `activity`) for `role_cards` and `card_grants`; `recordCell` shows `Title` for a role's card and
`Title: activity` for a grant. The activity stays its key: the item was about cards, and activities have no titles.

**A key with no matching card falls through to the key itself**, as `card_includes` already does: never a blank and never
another card's name. A row with no `card` at all keeps the old `NAME_FROM_IMAGE` text. No new string, so no dictionary
change.

## The manual (`#j4m8t`)

Line 175 now follows line 79's pattern ("for a login that has a menu") and says a login with no menu finds this manual,
Release notes and Change password as tiles on its home screen. The Accounts and roles topic's "Change password at the
bottom of the menu" (about line 2180) was the same fault and got the same wording.

`path: "Security (bottom of the menu)"` (two topics) is **not** the same fault: both topics are `adminOnly`, Admin always
has the menu, and Security is not one of the tiles #1436 added.

## Not done

`#j4m8t` is filed only on the `backlog` branch, not on `main`, so it cannot be ticked in this PR (for the planner to tick).
