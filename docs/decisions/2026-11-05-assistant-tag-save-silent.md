# Assistant: a note saved without its tag links now says so (#bqs1w)

## What reading found (deliverable 1)

The link write **can fail on its own** while the note write succeeds. They are separate statements, not one transaction:

- `src/app/assistant/actions.ts` `runWrite`: `const result = await write(supabase, t, note)` is the note write; the link write is a second call, `linkMentions(...)`, made only after the first returned.
- `linkMentions` wraps everything in `try/catch` and only `console.error`s (both the no-row-found case and a failed `syncNoteTagPicks`); nothing reached the person.
- `src/lib/note-tags/sync.ts` `syncNoteTagPicks` is itself several statements (select existing, delete, insert), returning `{ ok:false, code }` on error; `42501` is the link policy refusing the login.

## Choice: (b), keep the note and tell the person

Losing a note someone has just written because a tag would not attach is the worse outcome, so (a) was rejected. `linkMentions` now returns words (null when all links landed); `runWrite` returns `{ ok: true, notice }`; each card passes `notice` into its "done" outcome and the conversation shows it under the confirmation. `42501` gets the "your cards do not let you link" wording, anything else the generic one (same split as `noteTagFailure`). New strings: `assistant.tagsNotLinked` / `tagsNotAllowed`, en and th. **The Thai is mine and unreviewed** (collected under #y1dqu).

## Not done / limits

- No in-place retry button: the words tell the person to re-tag from the resident's page, where tagging already works. A retry is a follow-up if wanted.
- Forcing the failure from a dev session was not attempted: it needs a login whose cards allow the note write but refuse the link insert, or a faulted database, and I did not fake one.
