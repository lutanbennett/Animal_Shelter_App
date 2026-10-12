# /r/ and /e/ are public but not edge-cached; hosts and public pages are each one list

2026-10-12, stream `public-lists-unify` (architecture review S5 and C3).

## What /r and /e are

`/r/<code>` is the address on a resident's RFID card; `/e/<id>` is the address on
an enclosure's QR code. A signed-out visitor sees the public card
(`public_resident_cards`, 0068) or the enclosure and who lives there
(`public_enclosures`, 0079); a signed-in user is redirected to the hub.

## Decision: not edge-cached

The Worker (`worker/index.mjs`) keeps signed-out HTML for public pages for 10
minutes. `/r/` and `/e/` are left out, and now on purpose (before, the two lists
simply disagreed with nothing saying why):

- They are per-item and read live from views whose membership changes (a
  resident adopted, withdrawn or made non-public; an enclosure emptied). A
  10-minute-old copy can show a card that should already be gone.
- A scan is the moment someone wants the current state, and traffic is a few
  scans, so caching saves almost nothing.

Behaviour is unchanged: they were not cached before and are not now. Revisit only
with a measured load problem, and then cache the enclosure page before the
resident one.

## One list each

- `src/lib/public-paths.ts` exports `PUBLIC_PAGE_PREFIXES`; `isPublicPage`,
  `PUBLIC_PATH_PREFIXES` and the Worker's `isEdgeCachedPage` derive from it.
  `NOT_EDGE_CACHED_PAGE_PREFIXES` is the explicit exception list.
  Membership was proven identical to the old lists on 120 probes (0 differences).
- `src/lib/site-hosts.ts` is the one host list for `serverActions.allowedOrigins`
  and `same-origin.ts`. `scripts/check-site-hosts.mjs` checks the cloudflared
  `httpHostHeader` values against it. No hostname was changed.
