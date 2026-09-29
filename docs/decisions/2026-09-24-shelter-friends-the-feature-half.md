# 2026-09-24 — Shelter Friends, the feature half

The schema half (0076) and its reasons — a separate 1:1 table rather than
columns on `contacts`, and an opt-in per field — are recorded above
("Shelter Friends: a separate public-profile table, per-field opt-ins").
These are the choices made on top of it.

- **The public side reads the view and nothing else.**
  `src/lib/shelter-friends/public.ts` selects from `public_shelter_friends`
  only; `/friends`, the home strip and the `/donate` mention all go through
  it. A public route that joins `contacts` to get a field is the design
  saying no — widen the view instead, in a migration someone reviews.
- **The staff preview mirrors the view, and draws the real card.** The
  contact hub's Preview renders the same `FriendCard` as `/friends`, fed by
  `previewPublicFriend()`, which applies the view's `CASE` columns in
  TypeScript to the rows a manager can read. That duplication is deliberate
  and small: it lets the card be previewed before it is published (and with
  unsaved edits), while the view remains what actually enforces the
  opt-ins on the public page.
- **Links appear only once someone is published.** The header and footer
  link, the home strip and the `/donate` mention are hidden while
  `public_shelter_friends` is empty — the state the site is in on release
  day — so shipping this changes nothing a visitor sees until a manager
  publishes a friend. `hasPublicFriends()` is wrapped in React `cache()`
  and takes no client argument, because `cache()` keys on argument
  identity and the header and footer each create their own client.
- **Link rules live in `src/lib/links/validate.ts`,** shared by the form
  (inline errors as you type) and the server action (the rule that
  counts); the database's `^https?://` check stays as the last line. https
  only: a pasted `http://` link is refused rather than silently upgraded,
  since the site may not serve https; a bare `www.shop.co.th` is given its
  `https://`. Facebook links must be on facebook.com / fb.com or a
  subdomain (checked on the parsed host, so `facebook.com.evil.test` and
  `evil.test/facebook.com` fail). The batch-3 Facebook-link item imports
  this rather than writing its own. The form sets `noValidate`: the
  browser's own `type="url"` check refused `www.…` before the shared rule
  ran, so two rules disagreed; the inputs keep `type="url"` for the phone
  keyboard.
- **One gate for who may become a Friend:** `FRIEND_CONTACT_TYPES` in
  `src/lib/shelter-friends/friends.ts`, currently `["Vendor"]` (shown as
  Supplier). The hub card and the server action both call
  `canBecomeFriend()`, so a `Business` / `Supporter` type is a one-line
  change. A contact that already has a profile keeps its card whatever its
  type.
- **The running order lives under Management, not Settings → Website.**
  0076 lets management write `shelter_friends` (they own contacts), and
  `/admin/website` is admin-only, so Management → Shelter Friends holds the
  order and publish switches; the profile itself is written on the
  contact's page, where the business's details are. Reordering renumbers
  the whole list 0…n-1 so profiles created with equal `sort_order` still
  move one place at a time.
- **The friend actions call `refresh()`.** They are invoked directly from
  the card rather than through a `<form action>`, and in this Next.js
  `revalidatePath` alone left the card showing the old profile until a
  reload (seen in testing) — the same fix as `management/diets/actions.ts`.
- **An unpublish can take up to ten minutes to reach signed-out visitors
  in production.** `/friends` is on the Worker's edge-cache list like every
  other public page (`CACHE_TTL_SECONDS = 600`). Signed-in users and the
  database see it at once. If a business ever withdraws consent and it
  cannot wait, purge the cache for `/friends`.
- **The Thai page title is a placeholder.** "เพื่อนของศูนย์พักพิง" is used
  for "Shelter Friends" until the customer confirms the wording.
