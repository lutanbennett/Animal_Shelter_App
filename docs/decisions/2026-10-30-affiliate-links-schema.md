# Shop for the shelter: the schema half (0285)

Backlog: *Affiliate links get their own public page, and staff can add a Shelter Friend to it* (Fundraising). Lutan, 2026-10-29:
*"For the affiliate links, can we create a separate page (and also an ability to add a shelter friend to the affiliate links page
as well)"*. **This PR is the schema half only. Merging it does not finish the feature; the item stays open.**

## Shape

One table, `shop_links`, one row per entry on the page.

- `friend_id` null: a shop or product (title, photo, link, note, price hint).
- `friend_id` set (unique, so one entry per Friend, `on delete cascade`): a Shelter Friend. The row holds only the Friend's *own*
  referral link, note and price hint. `title` must be null on these (`shop_links_friend_has_no_own_title`).
- **Nothing of a Friend's public profile is copied.** `public_shop_links` joins `public_shelter_friends` (0076/0164), so the
  name and logo come from there; renaming the Friend, unpublishing it or archiving its contact changes the page with no second
  switch. The harness proves all three.

Chosen over two tables (shops, and Friend placements) because the page is one ordered list and both kinds share every field the
public sees. One `sort_order`, one `shown`.

## Link rule

`link_url` must match `^https://[^\s]+$` and be at most 2000 characters (`shop_links_url_https`). **Copied from
`donation_channels_url_https` (0191)**, not from the Friends table: the Friends' own links (`shelter_friends.website_url`,
0076) still check `^https?://`, so they allow `http://`. The brief said "https only as Friends' links are"; that is true of the
newer tables, not of Friends. Tightening the Friends check is a separate item and is not done here.

## The card decision

**`friends.manage` does not fit, so there is a new activity and a new card.** `friends.manage` is held by Publish Shelter
Friends and means deciding how a local business is thanked. A marketplace affiliate link is a different decision made by
possibly different people, and a shop is not a Friend. Reusing it would make Publish Shelter Friends silently grant control of a
commission-earning page.

- Activity `shop.manage` (level: read = see the entries, edit = write them), area `settings`, sort 73 (catalogue max is 72).
- Card `manage_shop_page`: `card_grants` row (`shop.manage`, 2) and a `card_features` row under *Website and public pages*.
  The card does something the moment it is held: it is the only thing that lets a login write the table.
- **No role is given the card.** Lutan builds assignments after the cards are done. Admin is never given cards; it passes through
  the `is_admin` short-circuit, and the harness proves Admin can read, write and delete while holding no cell.
- Policies are the four `*_select/insert/update/delete_perm` pattern of 0191, each `has_permission('shop.manage'…)`. No role key.

## What anon can read

`public_shop_links` exposes exactly: `id, friend_id, name, logo_drive_file_id, photo_drive_file_id, link_url, note, price_hint,
sort_order, translations`. `name` is the entry's title, or the Friend's public name. **Not exposed:** `created_by`,
`updated_by`, timestamps, `shown`, and every Friend field other than name and logo (blurb, help, discount, website,
Facebook, phone, email, LINE, address, map). A Friend entry appears only while the Friend is published and its contact is not
archived. The table itself is revoked from anon. The view is added to `PUBLIC_VIEWS` in `scripts/check-public-views.mjs`
(one line; that file belongs to another stream this batch, so expect a trivial merge there).
`is_public_drive_file()` gains one branch so the photo proxy can serve a shown entry's photo; it is rebuilt from 0245's body,
all earlier branches kept (the harness checks two of them).

The anon grants are declared in `docs/hard-coded-security-registry.json` (`database.declared`) as the check requires.
`check-hard-coded-security` is clean.

## Proof

`node scripts/check-shop-links.mjs` (dev, `begin … rollback`): http, javascript:, blank title and a Friend with its own title
refused; one entry per Friend; shown shop and published-Friend entry visible; hidden shop, unpublished Friend and archived
Friend not; rename follows; unpublish removes; editor writes, reader reads only, no-card login nothing; anon cannot touch the
table or write the view; Admin does everything holding no card; deleting a Friend takes its entry. Result: HARNESS-OK.

## Hand-over: what the app half must build

- `src/lib/permissions/catalogue.ts`: add `shop.manage` (level, area settings, sort 73). `cards.ts`: add `manage_shop_page`
  (grants `shop.manage` 2). The migration already holds both in the database; the parity checks will want the files to agree.
- Public page "Shop for the shelter" reading `public_shop_links`; management screen writing `shop_links`; gate every control
  on `can(perms, "shop.manage", …)`; validate with `src/lib/links/validate.ts` (https only) before the database's last line.
- Links render with `rel="sponsored noopener"`, and the page carries a plain-English disclosure that the shelter earns from them.
- Click recording, dictionaries (title, note, price hint go through `translatable_fields`) and the manual topic.
- Friend picker: a Friend can be added once; show its name and logo from the Friend, never ask for them again.

## Publication waits on the tax question

Whether commission income has a tax or status implication must be answered before the page is published on production. It does
not block building. Also still the Director's: which schemes, whether a supplies wish-list, who checks links. Production is
not touched by this PR (it is three migrations behind on purpose).
