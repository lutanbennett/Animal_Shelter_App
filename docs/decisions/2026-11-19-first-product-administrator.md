# The first product administrator, and the script that places one

**2026-11-19.** Lutan, in chat: *"use my gmail account as the first product admin
(lutan.bennett2@gmail.com)"*. Done, and `scripts/add-product-admin.mjs` is the instrument that did
it — written because `#pdmin` asked for one and because the alternative was hand-written SQL that
nothing would record.

## Why a script was needed at all

`0411_product_admins.sql` seeds nobody **on purpose**: the repository is public, so no real person
is named in a migration. Its insert policy is `with check (public.is_product_admin())`, which means
**the list cannot bootstrap itself through the app** — only a product administrator may add one, and
there were none. `docs/decisions/2026-11-18-product-admin-list-schema.md` says the first row is
placed with the service role, which bypasses RLS.

**Nothing did that.** `grep -rn product_admins scripts/` was empty, so the documented procedure had
no instrument. The consequence reached users twice: `0.47.3` shipped the Product admin screen live
and unreachable, and `0.47.4` published a **second** capability on the same screen. Both release
records say so, and the state was measured rather than assumed — `--list` against production
answered *"The product-administrator list is EMPTY"*.

## What was done

| | |
|---|---|
| Account | `lutan.bennett2@gmail.com` → `auth.users.id` `0131ea0c-6539-420b-82eb-ef6506fd1e6b` |
| Database | production, `dbkodyyxxhtygxcxmfcu` |
| Row | `product_admins(user_id, note)`, added `2026-11-19 07:48:24 UTC` |
| Authenticator | **verified factor present**, so the `aal2` writes on the screen will work |

Verified by an independent `--list` re-read afterwards, and by running the same command again, which
answered *"is ALREADY a product administrator… Nothing to do."* rather than writing twice.

## What the script is, and what it is not

**It is not a way around the card system.** PADMIN is a list of people — no role, no card, no cell —
and is the third named exception to the zero-exceptions rule, after Admin and the adopter website
account. It is explicitly **not a precedent**, and everything a product administrator does inside a
shelter's own data stays card-governed like anyone else's. Adding a person to that list is the
mechanism working as designed, not a bypass of it.

**Identity is `auth.users.id`, never the email.** `0411` gives the reason and the script keeps it: an
id survives an email change, while a list keyed on an address would silently lose the person — or
hand the seat to whoever next held it. The email is only how a human names the account on the command
line; it is resolved to an id, and the id is what is stored.

## The guards, each because of something it would otherwise let through

- **Dry run by default**, `--apply` to write, and on any environment `--apply` also needs
  `--confirm <the address>`. The same shape as `scripts/correct-resident.mjs`.
- **Idempotent.** Already on the list → says so and exits 0. The insert carries
  `on conflict (user_id) do nothing` as well, so even a race cannot double-write.
- **It refuses to remove the last product administrator**, because an empty list cannot be added to
  through the app: removing the only one would need this script again to recover. That is the same
  one-way-door reasoning `CLAUDE.md` applies to the Admin bypass.
- **It reports the authenticator state before writing, not after.** Every write on the screen needs
  an `aal2` session, and `#shmgt` records that a PADMIN with no authenticator **cannot set one up
  themselves** — first setup is opened by a shelter Admin. So a PADMIN without a verified factor can
  open the screen and do nothing on it. The script prints that in full as a warning, and stayed
  silent here because Lutan's account already has one.
- **A missing table is explained rather than thrown.** On an environment behind on migrations it says
  `0411 is not applied there yet` instead of failing with a bare `42P01`.
- **An address matching no account, or more than one, stops.** Guessing which person was meant is
  exactly what it must not do.

## Two things that remain true and are not this script's job

- **A PADMIN who is not also a shelter Admin reaches the screen only by typing its address**, because
  the tile lives on the Settings landing page. Found by #1709 and not fixed.
- **The screen does not yet show which onboarding steps a shelter has had** — #1716's own note says
  so. Creating a shelter, mapping its addresses and giving it an Admin role and first login are
  separate actions with no progress shown across them.

## Where it ran from, and why that is worth a line

The script was exercised from the **main checkout**, because a fresh worktree gets `.env.local` from
`worktree.mjs` but not `.env.deploy.production`, and copying a production credentials file into a
worktree to make a command convenient is not something to do. The module resolves its own imports,
and `loadEnv` reads the environment files relative to the working directory, so running it by path
from the checkout that legitimately holds those files works without moving a secret.
