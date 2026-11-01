# The assistant's read-only copy is deleted, not made reachable

2026-11-01, stream `assistant-read-only-copy` (batch 14). Deleted: `assistant.pageSubtitleReadOnly`,
`assistant.volunteerReadOnly` (English and Thai), the `readOnly` turn state and its branch in
`AssistantConversation.tsx`, and one assertion in `assistant-examples-follow-cards.test.mjs` that pinned the branch.

## Who can reach the state "may ask, may not record"

**Nobody, Admin included.** Established by reading, not by driving a browser (said plainly: no one-card login was driven):

- `src/lib/permissions/cards.ts:231-239`: the `assistant` card grants `assistant.ask` and `assistant.record` together, and
  no other card mentions either (grep over `cards.ts`). A card-built login therefore has both or neither.
- `src/lib/assistant/data.ts:227`: `canWrite = can(perms, "assistant.record")`. `src/app/assistant/page.tsx` only renders
  the conversation when `canAsk` is true, so `canWrite` is read by the conversation only for a login that holds `assistant.ask`.
- **Admin:** `can()` answers true for Admin before reading any cell, so `canWrite` is true. The read-only branch is
  unreachable for Admin too, which was the open question. It is not "the one path that still shows it".
- The only remaining way for `canWrite` to be false while `canAsk` is true would be a card edited so one activity is dropped,
  which needs a split of the card: that is the other option below.

## One reachable fault found on the way

`page.tsx` chose the subtitle on `canWrite`. A login **without** `assistant.ask` has an empty context (`canWrite: false`), so
it was shown `pageSubtitleReadOnly` ("Ask where a resident is...") directly above the "not authorised" note. The subtitle now
shows only when `canAsk` is true, and nothing shows otherwise. That is the only user-visible change.

## Why delete rather than split the card

Splitting `assistant` into ask and record cards would make the state reachable, but it undoes `0295`, which Lutan
decided on 2026-10-31: *"the assistant writes ten kinds of thing and every one asks assistant.record"*. His reason (a card
that grants the question and withholds the act half-works) still holds. Nothing in this work is a reason to re-open it.
A split also needs a migration (`0298` is free), which is its own PR. **No migration was added, and none is needed for this
answer.** If Lutan ever wants an ask-only card, that is a new schema stream, and the copy can be rewritten then, against
the card that exists.

The server is unchanged and still refuses a write without `assistant.record` (`src/app/assistant/actions.ts`); `canWrite`
remains in the context and still filters examples and tools. The `noCard` state (a tool needing a further card) is separate and kept.

## The role-bearing key name

`assistant.volunteerReadOnly` carried a role name in its key. It was **deleted, not renamed**, so there is no replacement
key to name. The open item about role-bearing key names loses this instance; no other key was touched.

## Thai

No Thai was written. Two existing Thai strings were deleted, so nothing is added to the unreviewed-Thai item.

## Hard-coded security check

`node scripts/check-hard-coded-security.mjs` before and after: `no coded security outside the Admin bypass`. Delta: none.
`cards.ts` was read, not edited.

## Found, not fixed

Nothing else in the assistant's controls was touched; `src/app/assistant/actions.ts` belongs to another stream.
