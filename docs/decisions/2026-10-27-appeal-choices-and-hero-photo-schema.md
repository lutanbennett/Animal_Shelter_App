# Appeal choices view and the hero photo function (migration 0274) — 2026-10-27

Schema half of the backlog item *Card review 2 schema follow-ups*. The app half (`claude/appeal-choices-app`) reads both.

## Appeals list: a view, `appeal_choices`

`id, title, resident_name, status, target` over appeals with `status <> 'closed'` (the cut the donation form already makes:
draft, live and funded are open). Owner-run, with `has_permission('donation.receipt')` in the WHERE, so any other login reads no
rows. Granted to `authenticated` only. Not a new activity: the item decided `donation.receipt`, and the card already holds it.
The raised figure is not in the view (not in the item's column list); the form keeps getting it from `donations` as it does today.

## Hero photo: function versus column policy — **function**

A column policy is not available. Row-level security is per row, and column grants are per database role (`authenticated`), so
neither can ask `has_permission('website.gallery')`. Granting the column to `authenticated` would let every signed-in login set
the hero. The only shape that makes a card the sole gate is a security-definer function:
`set_hero_photo(p_drive_file_id text)`, which raises `42501` unless `website.gallery` is held, and clears the photo when passed
null or blank. `website.content` edit keeps its direct update untouched. The function updates one column of one row, so it hands
over nothing else in `site_content`.

Nothing is granted to Admin and no role is named; `check-hard-coded-security.mjs` still prints `no coded security outside the Admin bypass`.

## Left for the app half

Ask `website.gallery` in `uploadHeroPhoto` / `removeHeroPhoto` and call `set_hero_photo` instead of the direct update; read
`appeal_choices` in the donation form; hide the controls without the activity. Both pieces are unreachable until then.
