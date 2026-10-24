# Hiding public pages: the app half (parts 3 to 6)

Lutan, 2026-10-24. The Director wants to go live with most pages and hold a couple back. The record
landed as 0256 and the one list of pages as #910; this reads them. **No migration.**

## One check, in the list

`isPageHidden(key, hidden)` in `src/lib/public-pages.ts`. A page is hidden if `page:<key>` is stored
**or** `section:<its menu group>` is. Home and Privacy (`neverHidden`) answer false whatever is stored.
The header, phone menu, footer, home page and sitemap all call it; none of them has its own rule.
Un-hiding a section brings back the pages not hidden individually because the two kinds of entry are
independent. A menu group left with no visible links already dropped out, so a hidden section loses its
heading with no second rule.

## Not found for the public, the page for a website editor

`requirePageVisible(key)` (`src/lib/public-page-access.ts`) is the first line of every public page on the
list: `notFound()` unless the viewer holds `website.content`, the same activity that writes the record.
`PublicHeader` shows the "This page is hidden from the public" bar to exactly that viewer. A Volunteer
login has no `website.content`, so it sees Not found. A 404 is not edge-cached (the Worker keeps only
complete 200s without cookies, and a signed-in editor carries the auth cookie), so an editor's view never
reaches the public cache.

**Pages under a page follow their parent**: `/adopt/<id>` and `/adopt/stories/<id>` under Adopt,
`/our-work/<id>` under Our work, `/appeals/<id>` under Appeals. Hiding "Meet the residents" and leaving
every animal's page open would not be hidden. The sitemap drops them too.

## What the home page loses

Hero buttons (Meet the animals, Help feed them), the Appeals strip, the Shelter Friends strip (its Become a
Friend button and tile separately, on `friends-join`), the matching How-to-help cards (the whole block when
none are left; the care card points at Appeals only while that page is shown), the Pet-of-the-week card
(it leads into `/adopt/<id>`), and the About / Our work links under the story.

## Decisions

- **Donate**: the 0256 note left it to this half. Hiding the Donate page removes the header Donate button
  (both widths). The page is a page like the others, and a button to Not found is worse than none.
- **Appeals and Shelter Friends keep their own data rules** (live appeals; someone to thank). They do not
  move onto the switch: their rule is automatic and the switch is a person's choice, and replacing one with
  the other would make the Director remember to flip Friends each time a business joined. Both now apply: a
  page shows only if the switch is on **and** its data rule passes.
- **Edge cache (part 5): "up to ten minutes", no purge on save.** The only purge path is
  `scripts/purge-cache.mjs`, which runs on the deploy machine with `CLOUDFLARE_PURGE_TOKEN` from
  `.env.deploy.*`; `2026-10-18-purge-from-the-deploy-machine.md` keeps that token off the internet-facing
  Pi on purpose. The running app has no purge token, and giving it one for a switch used a few times would
  put a zone-wide credential where it was deliberately not. The wait is said beside the switch, in the
  manual and in the release note.
- **Desexing sign-up (part 6)** reads `public_site_content` as anon, like the insert, and refuses with
  "Sign-ups are not open right now." while the page is hidden. A failed read refuses too rather than
  letting a sign-up through.
- **Audit**: 0256's trigger already writes the change to `audit_log` with the editor as actor. Adding
  `site_content` to `AUDITED_TABLES` in `src/lib/audit/recent-changes.ts` is **left to `cards-grants-app`**,
  which owns that file this batch; until then the row is in `audit_log` but not listed on Recent changes.

## Left alone, noted

`/friends/join`, `/volunteer` and `/foster` have no server action of their own that stores a submission,
so nothing else needs a refusal like Desexing's. `/r/` and `/e/` are not on the list.

## What "Not found" is, measured on dev

A hidden page's address returns the root's plain "404 This page could not be found." to a visitor, with
`noindex` in the head and none of the page's content or sign-up form in the response. **The HTTP status is
200, not 404**, because `src/app/loading.tsx` lets the shell stream before the page runs `notFound()`; every
existing not-found under the root (a bad `/adopt/<id>`) behaves the same. A search engine drops it on the
`noindex`. The page's `<title>` and share tags (its public name, nothing else) are still in the head, since
`generateMetadata` runs before the guard. A true 404 would mean checking in the proxy on every public request
or removing the root loading boundary: neither belongs in this change, and either is a follow-up if the
Director wants the status itself.
