# Ask first, then start the transition: why Discard froze the whole app

2026-10-18. Photos to approve (`/photos/approve`): Discard, Remove, and approving several at once
froze the entire app, side nav included. A reload cleared it; nothing was lost.

## Mechanism

`ConfirmProvider` opens its dialog by calling `setOptions(...)` synchronously inside the promise
executor of `confirm()`. Those three call sites did `startTransition(async () => { await confirm(...) })`,
so that state update belonged to the transition. A transition cannot finish until its async function
returns, and that waits for the person to click the dialog, which cannot commit because its own update
is held by the unfinished transition. Deadlock. Next's App Router runs client navigation through
transitions too, so every later click queued behind the stuck one. That is why the nav died and not
just the button, and it is what ruled out the earlier theories (a hanging Drive call, an RLS refusal).

## Fix

Await the confirm first, return on cancel, then `startTransition` the work (the house pattern in
`EnclosuresTable.tsx`). `PendingQueue.discard`, `ApproveQueue.remove` and `ApproveQueue.approve`
(bulk branch only). The two transitions with no confirm (`assign`, `reassign`, single approve) were
correct and are untouched. No schema, no server-action change.

## Guard

`scripts/check-confirm-outside-transition.mjs` fails, naming file and line, when `await confirm(`
appears inside a `startTransition(` callback anywhere in `src/`. It is a script rather than an ESLint
rule: it matches the repo's other `check-*.mjs` harnesses, and a rule would need callback tracking for
one pattern. It runs as part of `npm run lint` (so in `gates.mjs` and CI) and was shown to fail on the
pre-fix `PendingQueue.tsx`. Comments and string contents are blanked before matching.

Reaches production only on the next Pi deploy.
