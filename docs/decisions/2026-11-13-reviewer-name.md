# The prose translation queue names its reviewer (#v3knd)

**Step zero (2026-11-14):** the gap was still there. `reviewed_by` was read but never shown, and `login_display_name` did not exist.

## Shape taken: (a) a narrow `login_display_name(uuid)` (migration 0370)

`security definer`, returns the display name else the part of the email before the `@`, never the address. It asks `translations.view` or `translations.manage` Read and returns null for anyone else, so it reveals a name only to people who already see the reviewed text. `queries.ts` `loadLoginNames()` calls it for the page's reviewer ids and the page passes a map to `TranslationQueue`, which draws "Reviewed by NAME · date" above a reviewed prose row. A third screen with the same gap calls `loadLoginNames()` or the function directly.

## Why the view could not do what 0366 did

`label_translations()` is a function: its body runs as owner and can read `auth.users` for the caller. `translation_queue` is a view; it has no body in which to resolve a name on the caller's behalf, and the screen cannot read `app_users` (`works_with_logins()` asks maintenance, bills, deliveries or recurring cards, none of them a translations card), so a translations-only login would read a dash with no error.

## Rejected

- Widen `works_with_logins()`: hands every `translations.view` holder every login's name, email and role key.
- (b)/(c) and a name column on the view: (a) with another call site, or more moving parts. A view rewrite also has to restate every grant.

## Card judgement

No new card. Showing the reviewer widens what `translations.view` reveals about a string, not what it can do. No fallback, no role read.

## Proved on screen (dev, 2026-11-13)

A login holding exactly the `translations` card (none of the four login-listing cards) opened Management, then Translations, and read `Reviewed by Dev Reviewer Test · 13 Nov 2026` on a seeded row, not a dash. The seeded reviewer and name were removed afterwards.

## Label screen

It already resolves the proposer inside `label_translations()` (0366). It could call this function instead and drop the inline subquery, but nothing is wrong with it. For the planner to file if wanted; not changed here.

## Found, not fixed

`row.reviewed_by` shows only when a name resolves; a login deleted since leaves no line rather than a dash. Intended.
