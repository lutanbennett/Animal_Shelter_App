# A proposed Thai label shows who proposed it (#41yhe)

**Step zero (2026-11-13):** the gap was still there. `TranslationQueue.tsx` compared `draft_proposed_by` with the viewer and said *you* or *someone else*; both dictionary strings existed.

## Mechanism chosen: `label_translations()` returns the name (migration 0366)

A new last column, `draft_proposed_by_name`, resolved inside the function: `full_name`, else `name`, else the part of the email before the `@`. **Never the address** (Lutan, 2026-10-26; same rule as `appUserName()`).

Why: the function is already `security definer` and already refuses anyone without `translations.view` or `translations.manage` Read, so it reveals a name to exactly the people who can already see the proposed Thai, and to nobody else. No card's reach widens. Mechanism copied from 0293 (drop and recreate, because a returning-table function cannot gain a column by `or replace`).

## Rejected

- **Add a translations card to `private.works_with_logins()`.** One line, but it opens the whole `app_users` view (email, display name, role key) to every `translations.view` holder for one panel's sake.
- **Reuse `loadAppUsersById()` from the screen.** It reads `app_users` as the signed-in user, which opens only for maintenance, bills, deliveries, recurring, photos or roles cards. A translations-only login would read zero rows and the panel would show a dash where it said *someone else*: silent, no error.
- **A shared `login_display_name(uuid)` function.** Better if more screens need it; nothing else does today, and it needs its own card gate. Not built; see the prose finding.

## Card judgement

No new card. Showing the proposer is a widening of what `translations.view` already reveals about a draft, not a new ability.

## Proved on screen (dev, 2026-11-13)

A login holding exactly `view_translations` (none of the four login-listing cards) opened Translations, then Waiting, and read `Proposed by Dev Proposer Test · 13 Nov 2026`, not a dash. The seeded draft and the display name were removed afterwards.

## Display-name fallback

A login with no display name reads as the stem of its email (`dev-signin-management` on dev). **Left for Lutan to answer in one line:** stem, or the neutral *someone else* it says today? Built as the stem; a follow-up is one line.

## Prose side: NOT served by this change

`translation_queue` is a view gated by `private.works_with_translations()`, with `reviewed_by` never displayed. A function's own gate does not reach it. Shape if wanted: add a name column to that view the same way (resolve from `auth.users` inside the view's owner context, never the email), or a narrow `login_display_name(uuid)` gated on the two translations cards. Finding for the planner to file.

## Action controls on this screen (deliverable 10)

Approve and Discard ask `translations.manage` (`approve_label_th`, `discard_label_draft`); Propose asks `translations.propose` (0296). The card already takes `canManage` / `canPropose` props. Nothing found ungated; the page's gating was read, not re-driven.
