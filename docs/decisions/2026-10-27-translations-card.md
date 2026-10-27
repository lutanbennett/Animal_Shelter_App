# 2026-10-27 — A Translations card (0271)

**Lutan, 2026-10-27, asked whether anyone other than Admin should triage translations:** *"Management will also do translations so a card is required for this"*.

## What was built
- **Card `translations`**, name "Translations", opening `/management/translations`.
- **Grants, in the same migration as the card** (`0271_translations_card.sql`): `translations.view` and `translations.manage`, both yes/no activities (level 2, as every yes/no grant in `0268`). `private.works_with_translations()` (0263) already opens `translation_queue` and `translatable_fields` to either activity, and the page and its actions already ask `translations.manage`, so the card opens the page and its writes with no code change beyond the card list.
- Card count 32 -> 33 (`check-cards-count.mjs`, `cards.test.mjs`); `docs/card-walkthrough.md` regenerated; feature `website_public_pages` in `card_features`; label and description in both dictionaries.

## Not done, on purpose
- **No role holds the card.** Giving it to Management is an assignment Lutan makes in Settings -> Who does what, not a line of code. Until then the card does nothing for any login, which is why the release-notes line is `n/a` in this PR.
- **Admin is untouched** and is given nothing: the `perms.isAdmin` short-circuit stays as it is. No existing card's grants changed.

## Why no role name appears anywhere
The change names two activities and one card key. Nothing is keyed on `management` or any other role key, and no `role_cards` row is inserted, so a shelter can rename its roles, or give the card to a role that does not exist yet, without this code noticing. That is the rule in `CLAUDE.md` ("Hard-coded security is forbidden", "No code may fall back to a role BY NAME").

## One-way-door reading
Nothing is moved or removed, so there is no door. The brief asked for a production `role-cards` reading before writing; this worktree has no `.env.deploy.production` and the test read failed with a network error, so **no reading was taken** — it was not needed for an additive card nobody holds.

## Proof, on dev (2026-10-27)
A login holding only `translations` opened `/management/translations` with the queue; a login holding only `view_residents` was sent to "You don't have access to this page"; Admin opened the page. `check-card-grants` (95 rows, 42 roles) and `check-hard-coded-security` ("no coded security outside the Admin bypass") clean.
