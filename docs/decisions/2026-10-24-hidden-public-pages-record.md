# The record of hidden public pages (migration 0256, schema half)

Lutan, 2026-10-24: the Director wants to go live with most public pages and hold a couple back. This is part (1)
of the backlog item "Show or hide public website pages": the record only. Nothing in `src/` or `worker/` reads
it yet, and the default hides nothing.

## Shape: a column, not a table

`site_content.hidden_public_pages text[] not null default '{}'`. The app asks "is this page (or section)
hidden?" on every public request, in the app and in the Worker. A column rides along on the one row of site
settings those requests already read, through `public_site_content`; a table would be a second read per request
for a list a dozen entries long. The cost of a column (one array to edit as a whole) is nothing here: the
Admin screen saves the whole list in one go.

## Keys

Each entry is `page:<key>` or `section:<key>`. The prefix is needed because Adopt is both a page and a section.

| Section | Pages |
|---|---|
| `section:adopt` | `page:adopt` (Meet the residents), `page:adopt-international` |
| `section:get-involved` | `page:foster`, `page:volunteer`, `page:donate`, `page:appeals`, `page:friends`, `page:friends-join` |
| `section:services` | `page:desexing` |
| (no section) | `page:our-work`, `page:about` |

The page keys are `PublicSection` in `src/app/adopt/PublicHeader.tsx`, minus `home`. `donate` is in the list
because the item does not exclude it; the app half should decide whether the Donate button itself can be hidden.
Sections follow the header's groups (`key` of each group in `allEntries`).

## Exclusions are enforced in the database

A check constraint requires the array to be contained in the list above. Home, Privacy, `/r/` and `/e/` are not
in it, so they cannot be stored, whoever writes (including a script or a hand edit). The same constraint refuses
a typo, which would otherwise silently hide nothing. The price: **adding a new public page means a migration
that widens the constraint.** That is deliberate. The app half should still not offer switches for the
excluded pages.

## Who writes, who reads, audit

- Write: unchanged. `admin_update_site_content` (`website.content`, 0163) covers the new column, so exactly the
  people who can change Admin -> Website can set it. No new role test.
- Read: `site_content` is not readable by visitors (0195). The column is appended to `public_site_content`,
  which is granted to `anon`. Proven: signed out reads it through the view and is refused on the table.
- Audit: `record_audit()` cannot sit on `site_content` (boolean id), so a dedicated trigger writes the same
  `audit_log` shape for this column only, as 0254 does. `site_content` is not yet in `AUDITED_TABLES`
  (`src/lib/audit/recent-changes.ts`) for this column: **that is the app half's job and is outstanding.**

## Proof

`node scripts/check-hidden-public-pages-schema.mjs` (dev, rolled back): default empty; Management writes it;
Volunteer cannot; the change is audited with the editor as actor; Home, Privacy, `r`, `e`, a typo and an
unprefixed key are all refused; signed-out read works through the view and is denied on the table.

## Left (parts 2 to 6 of the item)

One page list in code, hidden semantics (menu, footer, home, sitemap, Not found, staff banner), Admin -> Website
screen, edge-cache note, Desexing sign-up refusal, and adding the column to the Recent changes list.
