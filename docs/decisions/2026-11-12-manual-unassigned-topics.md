# The last two UNASSIGNED manual topics (#1wb6g)

Lutan, from the Bill Management login on Test: the manual showed "Operations: the daily work" and a "My tasks" section
that login cannot reach. Both were topics left in the deliberate `unassigned` state (shown to everyone, marked).

- **`shelter-operations`** now sets `opensSection: "operations"`. `cardsOfTopic()` derives its cards as those whose bundle
  makes `opensAnyIn(perms, "operations")` true, the same question the menu link and the home tile ask (25 cards today).
  This is a small addition to `for-topic.ts` and the `ManualTopic` type (a new optional field); the `unassigned` state is
  unchanged. No list of card keys is written by hand, so a card that changes needs no edit here.
- **`needsMenu: true`** was added to match its neighbours. It was **not** the cause: it asks whether the login has any menu,
  not whether it has Operations.
- **`home-covering-another-role`** is `everyone: true`: its own note described exactly that (a second set of cards for a
  while, which no card grants). No card was invented.
- **Placement (deliverable 4, mine to decide): moved to Getting started**, just before the Operations topic. It is about the
  Home layout, not My tasks, and there is no Home section; leaving it in My tasks would have kept that section alive for
  everyone. With it gone, My tasks survives only for logins holding `recurring.do_own` (and the Admin-only access-requests topic).
- Thai: `src/lib/manual/` has no Thai edition (no `th.ts`), so nothing to move or write.
- The old test asserted `home-covering-another-role` must not be `everyone`, which only encoded its unassigned state; it now
  lists just the topics that really must not be.
- Another section vanishing for someone who needs it: none found. Only My tasks loses its unassigned topic.

Driven by card with no role: a login holding exactly `bills` (and `bills`+`bill_sites`) gets `notMine` for every My tasks topic
and Operations, and `mine` for covering-another-role, measured against the real manual and `topicView()`. Cards that open
Operations (e.g. `do_maintenance`) get it. The in-browser click-through was not done (see the test plan).
