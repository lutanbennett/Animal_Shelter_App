# Back to residents keeps the filter (2026-10-28)

Lutan: filtering the Residents list, opening a resident and pressing "← Back to residents" lost the filter.

**What changed.** The list's own query is carried to the resident as `?list=<encoded query>` (the table's row click and name link, from `useSearchParams()`), and the hub builds its back link from it with `residentsListHref()` in `src/lib/residents/list-view.ts`. No `resolveListView()` change: the filters were already in the address.

**Why the address and not `sessionStorage`.** The address survives a reload and a shared link, and nothing is stored. The cost is one extra parameter on the resident's address.

**Safety.** The helper takes only a bare query and always prefixes `/residents?`, so the link cannot leave the site. A value such as `https://evil.example/x` yields `/residents?https://evil.example/x`: still the list, with a query the list ignores. No `list` gives plain `/residents` (checked: a resident opened by its own address).

**Found, not fixed (the item asked for these; left for a follow-up so this stayed small).**
- The hub's section pages (`/residents/<id>/<section>`, `edit`, `photos` and so on) do not carry `list`, so after moving into a section and back to the hub, Back to residents goes to the plain list. Carrying it needs every hub tile/tab link to append the parameter.
- `src/app/residents/page.tsx:406` is the list's own "Clear" link and correctly stays `/residents`. The deceased banner and the edit pages' return links still use the fixed `/residents`.

**Fix two (cloudflared self-update in `scripts/pi/setup.sh`)** was already in `main` (commit 1cb85ccb: section 2a, plus the `docs/pi-hosting.md` line). Only the backlog tick was missing. The live Pi was not touched.
