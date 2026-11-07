# The meme screens read residents through `resident_who_and_where` (`#ay3d6`, meme half)

**Found.** `/memes/new`, `/memes/make` and `/memes/[id]/edit` built their resident list from `resident_list_view`, a
`security_invoker` view whose row filter asks `has_permission('resident.record', 'read')`. The meme cards
(`meme_library`, `meme_add`) carry `resident.who_and_where` at read and never `resident.record`, so such a login read
zero rows and the picker was empty.

**Chose.** One loader, `loadMemeResidents` (`src/lib/memes/residents.ts`), which calls the existing
`loadPickableResidents` rather than a second query. Reason: it already reads `resident_who_and_where`, already falls
back to the tables for Admin/Management (the view is empty for them), and sorts by the shelter's own zone order. I
added one option, `includeInactive`, because the meme screens deliberately keep Deceased and Adopted (a meme in a
resident's memory is a real case) and the other callers drop them. Default behaviour of every other caller is unchanged.
No migration, no new card, no widening: the entitlement was already granted. **`resident.record` was not added to a
meme card**, which would hand the social library the whole record.

**Empty state.** The picker no longer says nothing when the list is empty. `emptyKind` is `none` when the login holds
`resident.who_and_where` or `resident.record` at read (and the read did not error), otherwise `cannot`. Both strings
are in both dictionaries (`memes.form` and `memes.maker`). **The Thai is unreviewed** (`#y1dqu`, not chased here).

**What Lutan saw (deliverable 1).** Measured 2026-11-07 14:28Z on dev (`qxkmhwybjggxvsfxsxbd`): `residents` 2 rows,
`memes` 0 rows, the same as the planner's 13:35Z reading. Admin's own server-rendered `/memes/new` and `/memes/make`
carry the resident fields, so Admin's picker is **not** empty with residents present: his sighting was the cleared test
data (PR #1377), not a fault. Read server-side with the signed-in cookie rather than in the pane, which avoids the
`requestAnimationFrame` hydration trap but does **not** show a click-through; he can confirm by opening the picker.

**Card-only proof.** `--cards meme_library` and `--cards meme_add` both got the resident fields on `/memes/new` and
`/memes/make`. Not driven through the modal in the pane (same trap); read from the rendered pages.

**Controls on these pages, and what each action asks** (read from `src/app/memes/actions.ts`): Save meme, Upload image
and Back on the form, and the maker's Save, all ask `social.library` at edit, the same activity the pages themselves
require, so none can show to a login the action would refuse. Delete and manage actions live on other pages
(`social.library_manage`) and are not here. Found, not fixed: nothing.

**Not done on purpose.** `/photos/add` half of `#ay3d6` belongs to another stream; `docs/backlog.md` not edited and
`#ay3d6` not ticked.
