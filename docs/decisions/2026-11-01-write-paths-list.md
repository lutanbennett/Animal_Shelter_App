# (D) the listing: 146 addresses on `WRAPPED_WRITE_PATHS`, the Worker now replays a write on each

Stream `write-paths-list`, 2026-11-01. This is the PR in the Pi-failover programme that changes runtime
behaviour: every address added makes `worker/origin.mjs` replay a POST there after the Pi fails to answer it
clearly. Authority: `2026-10-31-write-request-wrapper.md`, the five `2026-11-01-write-paths-*.md` files and
`2026-11-01-header-writes-wrapped.md`.

## 1. What was listed, and what was held back

`WRAPPED_WRITE_PATHS` went from 1 address to **146**. **Three of the 149 page addresses are held back**, each
already a backlog item under `## Security`:

| Address | Why held back |
|---|---|
| `/admin/security` | its module returns a temporary password (`createUser`, `issueTemporaryPassword`), and `finish_write_request()` stores a wrapped result for seven days |
| `/admin/security/verify` | `startTwoStepSetup` returns the TOTP secret, same reason |
| `/services/desexing` | writes as anon; `claim_write_request()` needs `auth.uid()`, and anon cannot supply the sign-up's own `id` |

`node scripts/check-wrapped-write-paths.mjs` ends `every path on WRAPPED_WRITE_PATHS has all its reachable writes
wrapped (146 listed)` and still reports exactly those three as unwrapped under `--all`.

## 2. THE BUG THE LIST WOULD HAVE HAD: `[id]` is not a URL

The check names addresses as the app folder spells them (`/residents/[id]/edit`; 44 of the 146 have a bracketed
segment). The Worker tests `url.pathname`, which is what the browser posted to (`/residents/42/edit`).
`isWrappedWritePath()` compared exactly, so **44 entries would have been literals no request ever matches**: the
list would have looked complete and the failover would not have worked on resident pages, the pages that matter
most. `isWrappedWritePath()` now treats a `[name]` segment as any one non-empty segment (it never crosses a `/`).
Found by reading the matcher, not the list. Two edge cases fixed in the same change: `"/"` ends in a slash, so the
old prefix rule would have made it match every address (caught by a test that `/admin/security` is not wrapped);
it is now exact.

`scripts/check-worker-origin.mjs` used `/residents/new` as its "an unwrapped path" subject and `/admin` as its
"near miss"; both are now listed addresses. They now use `/admin/security` (permanently unlisted until its item
lands), and a new case pins the `[id]` matching. That is a change to a check that blocks in CI, kept to those lines.

## 3. How each address was verified

The check is module-granular: a module passes if its source calls `runWriteAction()` anywhere, so one unwrapped
action in a wrapped module is invisible. So, beyond the check:

1. **Every exported function of every `"use server"` module (77)** was scanned for `runWriteAction` or the
   module's own wrapper (`wrapped()`, `write(t)`, `runWrite()`). The only ones without are the declared ones
   (`login`, `login/forgot`, `assistant/interpret`, `enclosures/map`), the three held-back modules, and two
   read-only helpers inside wrapped modules: `previewRecurrence` (an `rpc("recurrence_dates")`, pure) and
   `eligibilityForLink` (`role_can` rpc, read). `fetchAssistantContext` is read-only.
2. **Writes before the claim:** for every function that does claim, any write-shaped call (`insert`, `update`,
   `upsert`, `delete`, `updateUser`, storage, `fetch`, admin client) appearing *before* the claim in the function
   was looked for. None.
3. **Inline `"use server"`** (the check only reads module-level): none exist in `src`.
4. **Route handlers:** the 16 `POST` handlers all live under `/api/**`, which no listed address matches.
5. **The two helpers #1162 named, re-read, not taken on trust.** `createVisits()` (admin client) first selects
   by `calendar_event_id` and returns early for an event it has imported, then inserts; `dismissEvent()` PATCHes
   one private flag. Both are called only from inside the wrapped `confirmCalendarEntry`/`dismissCalendarEntry`
   bodies (and `createVisits` also from the calendar poll, which is not a page POST). Convergent, and claimed.
6. **`assistantLookup`** claims in `lookups.ts`. The assistant's `runWrite` claims before the card check and the
   audit row, as `header-writes-wrapped` says.

**Not verified, and said so:** the nested claim in `assistant/actions.ts` (`recordImmunization` claims again
inside the assistant's claim) is the known backlog item under `## Architecture`. It does not change what an
address does on replay: the outer claim returns the stored answer before the body runs. It was not driven.
`/management/translations` is listed as it is on this branch; stream 23 is changing who may open it, which is a
permission change and not a write-path change.

## 4. The count: 149, and 148 was a miscount

The check reports **149 address rows** on this branch (146 complete + 3 unwrapped), and `find src/app -name
"page.tsx"` finds **149** pages. #1159's 148 is what you get by counting the rows that start with seven spaces
and missing the one with the `LISTED ` marker, `/admin/units`, which was then the only listed address. The
number does not depend on the tree except that a new page adds one. **The programme's 149 was right.**

## 5. Replay proof, driven (dev, Admin, port 3001, `requestAnimationFrame` firing, reached by click-through)

On `/projects/[id]` (a bracketed address, so it also proves the matcher on a real URL): the "New folder" POST was
captured and re-sent twice unchanged; **both answered the stored first result** (`{"ok":true,"folderId":
"3731e8a4-…"}`). The control, the same request with a fresh id, **reached the body** and was refused ("A folder
with that name already exists here."). The parent page lists exactly **one** folder of that name.

**Not driven:** every other address. They share the mechanism and the earlier streams drove their own samples
(`write-paths-tail-b` §6 lists ten flows), but nothing here re-drove them. What this PR adds that no earlier
stream could test is the Worker's path test on a real URL, covered by `check-worker-origin.mjs`, not by a browser
with the Pi down: **no drill with the Pi stopped was run for the 146.**

## 6. Rollback, and a caution

Reverting this PR returns `WRAPPED_WRITE_PATHS` to `["/admin/units"]` and the matcher to its old shape. Nothing is
live on production until `0292` is applied there (`scripts/deploy.mjs` refuses otherwise), and the first Pi
outage after that is the first real test of the other 145. No release note: nothing a shelter user sees changes
today.
