# 2026-11-02 — a card that reads the Thai queue and nothing else (0298)

**Card:** `view_translations` ("See the Thai queue") holds `translations.view` only. The `translations` card is unchanged.

**Deliverable 3, how a third activity reaches the screen.** `alsoActivity` is singular and was already spent on
`translations.propose`. Options: an array, a second field, the page guarding itself, or changing the route's own
activity. Chosen: **the route opens on `translations.view`** and drops `alsoActivity`. Why: the screen *is* the queue,
so reading it is what opening it means; all three cards that touch it (`translations`, `propose_translations`,
`view_translations`) hold `translations.view`, so one activity covers them; and it needs no change to how any
other route resolves. The page guards with `requirePermission("translations.view")`. Writing is unaffected: each
control still asks its own activity (`translations.manage`, `translations.propose`) and the database still refuses
without it. Narrowing check: no card grants `translations.manage` or `.propose` without `.view`.
Not done: an array form of `alsoActivity` (wider; no other route needs it).

**Also:** corrected the stale KNOWN GAP comment on `propose_translations` in `cards.ts`; `check-cards-count` is now forty-one.
**Outstanding:** `0298` must be applied to production before anyone can be given the card.
