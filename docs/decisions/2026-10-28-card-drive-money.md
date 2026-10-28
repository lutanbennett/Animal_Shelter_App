# Card pass: donations_receipts, bills, outreach_notes, run_appeals driven again (2026-10-28)

A walk, not a change. **No code, no migration, no release note.** The rows are in `docs/card-access-faults.md` under
"Added 2026-10-28 by `claude/card-drive-money`".

## Why each card needed a re-pass

All four were last driven on 2026-10-25 (`claude/card-report-money`). Since then `0268`/`0269` changed the grants of cards 11 to 29,
the #965 app half moved the menu, `0274` and #1004 wired the appeal pickers, and the buttons-follow-cards sweep hid controls a card
cannot use. `0276` touches none of the four. So none of them could be skipped.

## What the walk found, card by card

| card | steps | result against the 2026-10-25 rows |
|---|---|---|
| `donations_receipts` | 6 | **Two rows persist, one is closed, one is new.** "A resident" still shows "No residents match" and "A project" still shows no list. The appeal picker now lists appeals (intended, #1004) but also a **Draft** appeal. The menu no longer offers Residents |
| `bills` | 5 | **Closed.** "What is it for?" now offers maintenance jobs (0268 gave the card a read of `maintenance.jobs`); a bill was matched, cost 123 saved, and the row exists |
| `outreach_notes` | 4 | **Better.** The visit Edit page now has a photo control. Nothing else changed |
| `run_appeals` | 5 | **Two rows closed.** Residents list, and the appeal page names its resident and offers photos, because the card now includes View residents. The publish-on-its-own-card row stands; Publish was **not pressed** this time |

## The one that needs a decision

`donations_receipts` still cannot pick a resident, although `0268` gave it `resident.who_and_where` read and `/residents` opens for it. The form
reads `resident_list_view` (`src/app/management/donations/new/page.tsx`), a security-invoker view over `residents`; `/residents` reads
`resident_who_and_where`. That cause is read from the code and the view's definition, **not proven**: no query was run as that login. If
right, the fix is a one-line change of which view the picker reads, not a new grant. Lutan fixes the log as a set, so it is a row only.

## What I could not tell

- Which activity `src/app/management/donations/new/page.tsx`'s project picker asks; it shows nothing although `projects.folders` read is held.
- Production: no cell was read. Every "production" column says *not established*.
- Operations was in the `run_appeals` menu (the card includes View medical) and was not opened.

## Method notes for the next walker

- The built-in pane stopped painting a page it had navigated to by click, with `requestAnimationFrame` never firing, while the pane was hidden.
  A `screenshot` wakes it. Pixel clicks on the resident chooser's **Done** missed (the screenshot frame is 800x600, the page 1024x768);
  `element.click()` through `javascript_tool` worked. Neither is an app fault, and no row was filed for either.
- `dev-signin.mjs --cards <card>` called twice re-keys the same login each time; only the later snippet is valid.

## Evidence left on dev

Receipts LCA0009011 and LCA0009012 with their donors, one bill attached to a maintenance job, one appeal draft, one outreach visit, all `walk-*`,
and four one-card logins. Disposable; none removed.
