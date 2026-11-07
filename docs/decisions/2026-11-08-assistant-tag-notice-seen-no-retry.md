# Assistant: the tags-did-not-attach notice, seen on a screen; still no in-place retry (#a7r3k, #bqs1w)

Follows `2026-11-05-assistant-tag-save-silent.md` and `2026-11-06-assistant-tag-retry-and-proof.md`.

## 1. The shape question (re-read 2026-11-08, after the sync)

Unchanged from 2026-11-06 section 1, re-read against `main` after the sync: the note and the links are two statements
in `src/app/assistant/actions.ts`: `const result = await write(supabase, t, note);` and then `linkMentions(...)`, which
finds the saved rows and calls `syncNoteTagPicks` (`src/lib/note-tags/sync.ts`, select / delete / insert, each returning
`{ ok: false, code }`). So the link write can fail while the note write has succeeded, and one transaction is not
available without moving the whole save into SQL. **Chosen: keep the note, name the residents that did not attach.**
No new table, trigger or function; no migration; no new card or activity (`assistant.record` plus the link policies).

## 2. The notices name the residents (deliverable 6)

Commit `c6994c7e` makes `assistant.tagsNotLinked` and `assistant.tagsNotAllowed` functions of the names. It survived the
sync and is **fully done**, not partly: seen on a screen on 2026-11-08 in both cases (below). The Thai wording is
unreviewed (`#y1dqu`, not this stream's).

## 3. Seen on a screen, and the steps (the item's Done-when)

Dev's only residents are `Test 1` and `Test 2`. The stand-in model read names as letters only, so it found one name
("Test") and the "also tag" chip never appeared; and a lookup that matched both rows returned no id. Fixed in
`scripts/dev-assistant-model.mjs` (a trailing number is part of a name; with several rows it takes the one named exactly),
with a test. Steps, repeatable by anyone:

1. `node scripts/dev-assistant-model.mjs --dev --force-tag-failure denied` (or `failed`), from your own worktree.
2. `node scripts/dev-signin.mjs --cards assistant,residents,view_residents,medical_records --port <your port>`, paste the
   snippet in `javascript_tool` on `localhost:<port>`, then click the **Assistant** button in the header.
3. Type `Test 1 weighs 4.2 kg, bitten by Test 2`. The card shows "Also tag in the note: #Test 2". Confirm. One weight a
   day is allowed, so pick a date not yet used.
4. Seen: `denied` -> "The note was saved, but your cards do not let you link residents in it, so these tagged residents
   were not linked: Test 2." `failed` -> "The note was saved, but these tagged residents could not be linked: Test 2. Open
   each one and re-tag them in the note."
5. Stop the previous run first: a leftover process holds port 11500 and the new stand-in refuses to start (`EADDRINUSE`).

## 4. Retry control: still none, with the reason

Not built. The notice is now specific (who did not attach), and the fix it offers, re-tagging from the resident's own
page, works and is already card-gated. A button would need a second server action taking a table, note text and resident
ids from the browser (the inputs the save path refuses to trust), its own idempotency claim and a card check, to repair
a failure that in normal operation needs a database fault or a link policy the person's cards refuse; for the second a
retry would be refused again. Revisit if the notice is seen in real use.

## 5. This flow's action controls

The card's Confirm and Cancel, and the chip's remove (x): the server action `runWrite` asks the write's own activity
(for a weight, `medical.weight` at edit) and the link policies; the card only draws for a login that can reach the
assistant. Found, not fixed: none.
