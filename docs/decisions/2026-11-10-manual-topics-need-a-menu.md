# A manual topic that describes the menu is not shown to a login with no menu

Backlog `#qtgb4` and `#566lo`, 2026-11-10 (stream `manual-menu-and-examples`).

## The flag

`ManualTopic.needsMenu?: true` (`src/lib/manual/types.ts`). `topicView(topic, perms, hasMenu = true)` returns `notMine`
for a flagged topic when `hasMenu` is false, so the page, the PDF and the contents list all follow with no other change.
`isForTopic`, `topicInCopy` and `screenshotSrcs` carry the same optional argument. The default is `true`, so scripts
that load `for-topic.ts` directly (`acceptance-matrix`, `check-multi-role-build`) are unchanged.

The answer comes from `showMenuForLogin()` (`src/lib/menu/show-menu.ts`), read in `/manual` and `/manual/pdf`. It is a
property of a role (`roles.show_menu`, 0247), never its key or name, so this is not a named-role fallback; and it is
content marking, not access, so it is not hard-coded security. Admin always has a menu, so Admin is unaffected.
`showMenuForLogin()` itself is untouched. The flag is on `navigation` and `release-notes`.

## What a tiles-only reader would have lost, and where it went

Lutan chose to hide the whole of *Finding your way around*. But since #1434 that topic opened with the home screen,
the front-page tiles, the header (language, Sign out, Assistant) and the "no access" page, which a tiles-only reader needs
most. Chosen: split it. A new topic **Your home screen and the header** (`home-screen`, `everyone`) holds all of that, plus a line saying Release notes,
Change password and the manual are tiles. `navigation` keeps only the two menu steps and is renamed *Finding your way
around: the menu*. A login with a menu sees both. Not chosen: leaving them nothing.

## `confirm-and-offline`

Stays `everyone`, not hidden. The named examples (archive/delete a login, temporary password, reset 2-step) were
Settings → Security, Admin-only; replaced by "a photo, a note or a record". The `Delete zone "Quarantine"?` sample was
also an Admin-only page and was dropped; the sentence still says the box names what you will lose. Cancel-preselected
and Esc/outside-tap stay. Step 2 is untouched.

## Thai

The manual is English-only (the Thai page carries `englishNotice`), so no dictionary string was added or changed and
there is no new Thai to review.

## Found, not fixed

A topic cannot be checked mechanically for "describes the menu"; the flag is applied by reading. Not tried again.
