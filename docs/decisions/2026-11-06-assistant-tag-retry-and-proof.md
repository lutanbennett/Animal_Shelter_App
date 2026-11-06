# Assistant: the tags-not-linked notice can be forced on dev; no in-place retry (#bqs1w, #a7r3k)

## 1. Can the link write fail while the note write succeeds? Yes (deliverable 1)

Two separate statements, read on 2026-11-06 at `main` `6fc5497b`:

- `src/app/assistant/actions.ts` `runWrite`: `const result = await write(supabase, t, note);` is the note write.
- Directly after, `if (!("error" in result) && tags.length > 0 && subject) { notice = (await linkMentions(...)) ?? undefined; }` is the link write, a second round trip, not one transaction.
- `linkMentions` (same file) re-finds the saved rows, then calls `syncNoteTagPicks`, itself select/delete/insert (`src/lib/note-tags/sync.ts:31`) returning `{ ok:false, code }`; `42501` is the link policy refusing the login (`noteTagFailure`, `sync.ts:91`).

So a single transaction ("a link failure fails the note") is not available without moving the whole save into SQL. The shape stays what `2026-11-05-assistant-tag-save-silent.md` chose: keep the note, tell the person. Save activity unchanged: `assistant.record` (`runWrite`) plus the link policies. No new card.

## 2. How to force the failure on dev (deliverable 2)

Chosen shape: **an environment flag**, `ASSISTANT_FORCE_TAG_FAILURE`, read by `src/lib/assistant/force-tag-failure.ts` and used in `linkMentions` in place of the `syncNoteTagPicks` call.

- `denied` → behaves as a `42501` (shows `assistant.tagsNotAllowed`); `failed` → any other failure (shows `assistant.tagsNotLinked`).
- Acts only when `NODE_ENV === "development"`, i.e. `next dev`. Every deployed build is `production`, so it does nothing there. It can only make a link fail, never grant anything, so it is not access control.
- Why a flag, not a test-only card state: a card state would be a second way to change what a card does (the rule in `CLAUDE.md`). Why not unit test alone: it would not put the notice on a screen. A unit test (`force-tag-failure.test.mjs`) pins the flag's own on/off rules.

Step: `ASSISTANT_FORCE_TAG_FAILURE=denied node scripts/worktree.mjs dev`, sign in with a login holding the `assistant`, `residents`, `view_residents` cards and the card the write needs, then confirm a note that carries a tagged resident.

## 3. Seen on a screen? NO — and why (deliverable 3)

Driven on 2026-11-06 on dev (port 3005) with the flag on: a weight note saved fine. **No tagged resident reached the card**, so `tags.length` was 0 and `linkMentions` never ran. Tagged residents come only from the model (`mentions.ts`: "The model proposes them"), and dev has no `ASSISTANT_LLM_MODEL` configured, so the keyword parser never proposes any. The flag is correct but cannot be reached from the UI until dev has a model (a local Ollama model is enough). **Not seen on a screen.** Needs: a dev model, or a person to run it where one exists.

## 4. Retry control: none, with the reason (deliverable 4)

Not built. A retry must re-find the saved row(s) by exact note text (the write helpers do not all return an id) and re-run the link step. That needs a second server action that takes a table name, note text and resident ids from the browser, which are exactly the inputs the save path refuses to trust, plus its own idempotency claim and activity check. The notice already tells the person to re-tag from the resident's page, where tagging works. Not worth a second write path for a failure that has never been seen live; revisit if it is seen in practice.

## 5. Other

New strings: none (no Thai added). No migration. Release note: none, nobody would notice a dev-only switch.
