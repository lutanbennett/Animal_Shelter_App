# Buttons follow cards, fifth slice: the money and content surfaces (2026-10-28)

Same rule and pattern as slices 1-4. Server and database checks untouched; no role named; Admin unchanged. No migration.

## Decision: does a suggestion count as a control?

**Yes, when it is a ready-made request that this login's cards guarantee will be refused.** The Assistant's "Try something like" examples only fill the text box; they do not act. But the rule's purpose is that a login is never offered something and then turned away, and "Send Panda to hospital today" is offered to a login whose confirm step is then refused (`assistant.record`). A suggestion that only prefills a box and could still succeed (a lookup) is not gated. Later slices: **a suggestion is gated when it names one specific action and the activity that action asks is missing**; free-text hints are not.

## Fixed

`AssistantConversation` draws the write examples only when `context.canWrite` (`can(perms, "assistant.record")`, the activity the confirm step asks in `assistant/actions.ts`). Without it the three lookup examples remain. Guard: `src/components/assistant/assistant-examples-follow-cards.test.mjs` (narrow: asserts the filter is present).

## Every action control on the surfaces, and what it asks

- `/bills`: page and Save/Delete/photo actions `canUseBills` (delivery, visit edit, or maintenance bills); match targets are only loaded for the activity each asks; the Deliveries link `stock.delivery` (gated). Fine.
- `/management/appeals` (+ `[id]`, preview): page `appeal.run`; every action asks `appeal.run`; medical-photo tick `appeal.medical_photo` (gated, prop); gifts section, Record link and move gifts `donation.receipt` (gated; moves also `appeal.run`, which the page already requires). Fine.
- `/management/donations/*`: every page `requirePermission("donation.receipt")`, every action the same. Fine.
- `/contacts`, `/contacts/[id]`: Manage in admin, Archive, `contacts.directory` (gated); shelter-friend controls `friends.manage` (gated). Fine.
- `/management/contacts`: page and actions `contacts.directory`. Fine.
- `/outreach` (+ new, edit): New, Edit `community.outings` (gated; pages and actions ask it); Make meme `social.library` (gated). Fine.
- `/admin/website`: content tabs only drawn for `website.content`, actions ask it; hero and gallery `website.gallery` (gated by `canChange`/`canEdit`); appeals link `appeal.run` (gated). Fine.
- `/assistant`: examples, fixed above.

## Found, not fixed

- **No card grants `assistant.record`.** 0268 deleted its only grant (`card_grants` assistant). So `canWrite` is false for every login except Admin: the Assistant records nothing for anyone else, and the page subtitle says "Recording changes is for staff and management." A card fault, not a button fault; it belongs with `docs/card-access-faults.md` (row added). The gate above is correct and starts working the day a card grants it.
- Pages the menu adds that no walkthrough opens were all in the list above (each guarded by `requirePermission` on the same activity its actions ask).

## Not done

Driven in both directions: **no, and the hidden-vs-shown pair is unobservable for non-admins**, because no card grants `assistant.record` (above). Admin sees the write examples; any other login sees the lookups only. Gate plus unit test is the proof.
