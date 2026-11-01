# Proposing a Thai label: the app half (`translations-propose-app`)

2026-11-01. Second half of the two-stream item whose database half was #1160 (`0296`). No migration.

## What changed

- **The gap #1160 left is closed.** `src/lib/permissions/routes.ts` gains `alsoActivity: "translations.propose"`
  for `/management/translations` and the page's guard becomes
  `requireAnyPermission(["translations.manage", "translations.propose"])`, in one change, as `check-permission-catalogue.mjs`
  insists. The tile on Management comes from the same route entry (`cardTile()` re-checks against the route rules), so it
  needed no edit of its own: measured, it is drawn for a login holding the new card alone.
- **The propose control asks `translations.propose`.** `proposeLabelTranslation` (the server action) now checks
  `translations.propose`, the same activity `propose_label_th()` asks, and its old comment saying the split was "deferred" is gone.
  `TranslationQueue` takes a new `canPropose` prop beside `canManage`. The Thai field and the Propose button are drawn on
  either; **Save, Approve, Reject, the "clear" hint and the whole prose panel stay on `translations.manage`**, which is what
  their functions ask. Pressing Enter in the field saves for a login that may, and proposes for one that may only propose,
  so Enter never fires an action its database would refuse.
- **`src/lib/translations/labels.ts` and callers: read, nothing to move.** It only loads rows and builds links; nothing in it
  offers proposing from `translations.manage`.
- **`worker/translations.mjs`: `runLabelDrafts()`**, called from `worker/index.mjs` after `runTranslations()`. It signs in with
  `signInWithPassword` and calls `label_translations()` then `propose_label_th()` with that session, so the access comes from the
  card and from nothing else. Prose keeps using the service key, unchanged. A batch of 2 per run (`LABEL_DRAFT_BATCH`).
- **`scripts/draft-label-thai.mjs`: `--login`** replaces `--access-token`, which is removed (the hand-copied token was the
  procedure this item exists to end). The address and password come from `LABEL_DRAFT_EMAIL` and `LABEL_DRAFT_PASSWORD` in the
  environment, never the command line. `--dev-login` now makes a login holding `propose_translations` alone, the machine
  login's own shape, instead of the wider `translations` card. Header comment lines 18-25 rewritten.

## The secret, by name, and what happens without it

I invented these names; they are not set anywhere. **`LABEL_DRAFT_EMAIL`** (plain var), **`LABEL_DRAFT_PASSWORD`**
(Wrangler secret), **`SUPABASE_ANON_KEY`** (plain var; the anon key is public and sign-in needs it).
If any of the three is absent the Worker logs `labels: ... no label login configured; skipped`, touches no network and
changes nothing. A refused sign-in is logged and ends the label half for that run; it never stops the status alerts or prose.

## What is not done, and is Lutan's

The machine login does not exist. His three steps, in order: apply `0296` to production; create the login and give it the
`propose_translations` card on Who does what; set the password secret (and the two vars), then deploy the Worker.
**No role was given the card, on dev or anywhere. It is now safe to grant.**

## Release note: deliberately none

The truth rule: a note promises users it works now. It does not yet in production (`0296` and the card are outstanding), so
the release-notes line is `n/a` naming that step. The note goes in the PR that closes it.

## Coordination

Stream 22 (`write-paths-list`) may add `/management/translations` to `WRAPPED_WRITE_PATHS`; I did not touch
`src/lib/write-requests.ts`. The action I changed already runs through `runWriteAction`, only its gate moved.
`src/lib/assistant/**` untouched.

## Measured

- Dev, `node scripts/dev-signin.mjs --cards propose_translations --port 3002`, reached by clicking Home, Management,
  Translations: the tile is drawn; the page opens; the only button type on the page is Propose; a proposal landed (the
  card left the Missing list, and Waiting shows "Proposed by you"); no Save, Approve or Reject anywhere.
- `node --test worker/translations.test.mjs`: 9 pass (two new: skip with no login; a refused sign-in calls nothing else).
- `check-permission-catalogue.mjs` ok. `check-hard-coded-security.mjs`: clean before and after, delta none.
- Not driven: the Worker against a real login (none exists), `--login` against a real login (same reason).
