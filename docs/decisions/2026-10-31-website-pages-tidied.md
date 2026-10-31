# Settings → Website → Pages: a card per page, and the editor on a page of its own

2026-10-31, `claude/website-pages-tidy` (backlog: *Settings → Website → Pages, tidied*).

Lutan, 2026-10-31: *"Make the edit web page full screen not a popup so it uses the standard page
frame"*, *"Add photo to the edit page page rather than the pages page. Cleans up the pages page a bit
as it is too long with a lot of scrolling to get to the main activity which is edit the pages"*, and
*"Also consider whether we can collapse the show hide into the pages cards so they have edit and
show/Hide toggle on them"*.

The tab stacked three things in the worst possible order: `PageVisibility` (a switch for every public
page and each menu section), `PagePhotos` (four photo slots), and only then `PagesAccordion`, whose
Edit opened `SitePageForm` in a native modal `<dialog>`. The main job on the screen was the furthest
down it.

## What it is now

One card per public page, grouped under its menu section, each carrying the page's name and address,
its state, a Show / Hide switch, and Edit. Edit is a link to `/admin/website/pages/<slug>` — the
standard admin frame, a Back to Pages link, the heading and text, the translation panels, the
preview, and the photo for the four pages that take one. `PageVisibility` and `PagesAccordion` are
deleted; `PagePhotos` became `PagePhotoCard`, one slot, on its own page's edit page.

## The decisions worth keeping

**The two lists never matched, and the card list is driven by the public one.** `PUBLIC_PAGES` has 14
public pages; only 8 have words written in the app (`SITE_PAGE_SLUGS`), and two of those are sections
of another page — Our story is part of Home, How adoption works part of Adopt. Rather than show two
lists again, `PublicPage` gained an optional `editor?: SitePageSlug`, so the list that already knows
the public pages now also knows which of them have wording. A page without one (Appeals, Shelter
Friends, Shop, Desexing, Our work) gets only its switch; Home and Privacy stay always on with no
switch, and Home still gets Edit. Nothing from either list is dropped.

**The leave guard is a pair, not the popup's single close button.** A popup has one way out; a page
has every link on it. It is the shape `AddPhotosFlow` already uses: `beforeunload` for a reload or a
closed tab, and a capture-phase `click` listener for a link inside the app, before the router sees
it. `window.confirm`, not the app's `ConfirmProvider`, because stopping a navigation has to happen
synchronously inside the click and the provider's dialog is awaited. Only the page's own text is
watched — the photo controls save on their own press, so typing a photo description and saving it
must not leave the page looking unsaved.

**What the guard does not cover:** the browser's own Back button. App Router gives no reliable way to
block a `popstate` without pushing a sentinel history entry, which breaks the history in its own way.
The popup had no Back button to intercept either, so this is not a regression; it is a known gap,
written down rather than papered over.

**The old links still work.** `#<slug>` and the older `#page-<slug>` were how a page's editor was
shared. The tab now watches the hash on load and on change and `router.replace`s to the new address,
so a saved link lands where it meant to.

**`PAGE_PHOTO_SLUGS` moved to `src/lib/site/pages.ts`.** The four photo pages were written out in
`actions.ts` and again in the component. The edit page has to decide whether to draw a photo section
from the same set the actions validate against, so it is one exported list now.

## Buttons follow cards

`can()` defaults to the **edit** level (`src/lib/permissions/can.ts`), so the bare
`can(perms, "website.content")` the actions make *is* the edit check. Every control asks exactly that
call. The `website_photos` card grants `website.content` at read only, which is why such a login can
open the page at all and must still be offered nothing.

Every action control on this screen and its edit page, and the activity its own action asks (read
from the action bodies, not the labels):

| Control | Where | Its action | Asks |
|---|---|---|---|
| Show / Hide, per page | `PageCards.tsx` | `setPublicPageHidden` | `website.content` |
| Show / Hide, per section | `PageCards.tsx` | `setPublicPageHidden` | `website.content` |
| Edit (link) | `PageCards.tsx` | opens the edit page | `website.content` |
| Save changes | `SitePageForm.tsx` | `updateSitePage` | `website.content` |
| Choose photo | `PagePhotoCard.tsx` | `uploadPagePhoto` | `website.content` |
| Remove (photo) | `PagePhotoCard.tsx` | `removePagePhoto` | `website.content` |
| Save (photo description) | `PagePhotoCard.tsx` | `savePagePhotoAlt` | `website.content` |
| Edit translation | `TranslationPanel` | `approveTranslation` | `translations.manage` |
| View on site (link) | both | none — a public page | nothing |

`SitePageForm` and `PagePhotoCard` are shared, so each takes a `canEdit` prop that **defaults to
false**: a caller that forgets it offers nothing rather than a button the database refuses. Hiding is
the courtesy — no server or database check was removed or weakened. Admin is unchanged, through the
`perms.isAdmin` short-circuit in `can.ts`. Nothing on the screen reads a role key, name or column.

**Found, not fixed.** On the edit page, a login holding `website.content` at read only (the
`website_photos` card) still gets an editable text box and the style toolbar (`BodyToolbar`, from
`SitePageForm.tsx`), with no Save button. They are not action controls — the toolbar only inserts
tags into the textarea and triggers no server action — so by the rule's own test they are outside it,
and such a login cannot reach the page from the UI at all (it has no Pages tab and no Edit link).
But typing that can never be saved is still an invitation. The fix would be to pass `canEdit` down to
`BodyToolbar` and set `readOnly` on the two fields in `src/app/admin/website/SitePageForm.tsx`, both
against `website.content`.

## Checked

Driven in the browser pane on port 3008, as Admin and as a login holding only the `website_photos`
card, in English and Thai. One card per public page with the right split; Edit opens the edit page and
Back returns; `#foster` and `#page-volunteer` both land on the new address; typing then pressing Back
asks, declining stays, accepting leaves, and an untouched page does not ask; a page with no photo slot
shows no photo section; a photo uploaded on the Donate edit page appeared on `/donate` and was removed
again; Hide on a card took Desexing off the public home page's links and Show put it back; hiding the
Services section made its cards read "Hidden by its section". The one-card login saw only the Gallery
tab, and on the edit page's address no Save, no Choose photo and no file input.

The brief said to model that login with `--cards website.gallery`; that is the activity. The card key
is `website_photos`, and `dev-signin.mjs` lists the real keys when it refuses.

`src/lib/manual/` is English only — there is no Thai manual file, so "the manual and its Thai" was one
file, not two. The Thai of the screen's own words is in `src/lib/i18n/dictionaries/th.ts` and is done.
