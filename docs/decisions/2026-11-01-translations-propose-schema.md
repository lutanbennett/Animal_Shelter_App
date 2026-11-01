# Proposing a Thai label is its own activity: `translations.propose` (0296)

2026-11-01. Schema half of a two-stream item; the app half is `translations-propose-app`.
Migration `0296_translations_propose_activity.sql`. Branch `claude/translations-propose-schema`.

## What changed

- **`translations.propose`** — `yesno`, `management`, sort 74 — declared in `src/lib/permissions/catalogue.ts`
  and `permission_activities` in the same change.
- **`propose_label_th()`** asks it. **`approve_label_th()` and `discard_label_draft()` are untouched** and keep
  asking `translations.manage`: approving and rejecting are the reviewer's acts.
- **A new card, `propose_translations`**, holds `translations.propose` and `translations.view` and nothing else.
  It is the only way to hold proposing without holding approving.
- **The existing `translations` card gains `translations.propose`.** Without that line every holder of it would
  press Save as a proposal and be refused by the database, which is the half-working card `0295` closed.
- `card_features`: the new card is filed under the translations card's feature.
- Dictionaries (English and Thai): the card's title, its description on Who does what, and the activity's name.
- `check-cards-count.mjs` says forty cards now.

No role is given the new card. Nothing is granted to Admin, which stays outside the card system.

**Why sort 74.** `check-permission-catalogue.mjs` compares each key's sort with the migration that seeded it.
Putting the new row beside `translations.manage` (47) and `translations.view` (56) would renumber everything after
it and put each of those out of step with its own file. 74 follows the highest (73).

## 1. The design question: how does a caller with no session satisfy a card-derived grant?

**It cannot, and it should not. The shape that works is a login.**

`has_permission()` answers from `auth.uid()`. The service key has no uid, so it passes nothing; measured on
2026-11-01 it gets `42501` from `propose_label_th()` and `42501` from a direct insert into `label_drafts`
(`0293` grants it `select` only). `prove-translations-propose.mjs` re-measured the first of those against the new
gate (proof 6): still `42501`.

The ways to make a session-less caller pass, and why each is wrong:

| Way | Verdict |
|---|---|
| Let `service_role` through inside `propose_label_th()` (`or auth.role() = 'service_role'`) | **Forbidden.** An ability granted by something other than a card. It is also blanket: every holder of the service key could draft any label, and a card can no longer take it away. |
| Grant `service_role` insert on `label_drafts` | Same fault, one layer down, and it skips the function's checks (registered pair, row exists). |
| A card-shaped table of "machine identities" the function consults | The same hard-coded identity with a table in front of it. A card already *is* the table of who may do what; this would be a second one. |
| **A machine login: an ordinary auth user whose role holds `propose_translations`, that signs in** | **Works, and needs no rule bent.** The access comes from the card and from nothing else; taking the card away stops the caller; nothing is special-cased. |
| An emailed one-time code | A person's route, not a cron's. Needs email sign-in enabled in Supabase Auth on production, which nothing in the repo can see. Not planned around. |

**The machine login is what `scripts/draft-label-thai.mjs --dev-login` already does on dev** (a disposable user
holding a card, signed in with a password), and what `scripts/dev-signin.mjs` does. What is new is only that
production would keep one, because the cron runs unattended.

What the app half needs, in order:

1. `worker/translations.mjs` signs in as that login (`signInWithPassword` with the anon key, a password held as a
   Wrangler secret like `SUPABASE_SERVICE_ROLE_KEY`) and calls `propose_label_th()` with the resulting access
   token. It keeps using the service key for everything it uses it for today.
2. `scripts/draft-label-thai.mjs` can take the same login's credentials instead of a hand-copied `--access-token`,
   which removes the procedure of Lutan opening DevTools and a helper reading the token off his clipboard.

**This needs Lutan, and it is one sentence:** *may a machine login exist as a user in production Auth, holding
the Propose a Thai label card, with its password kept as a Worker secret?* Giving a role a card is Admin at
2-step on Settings → Who does what in any case, and the Worker deploy is his by instruction of 2026-10-02, so
nothing here can happen without him; this PR does not ask him to do any of it. **That login does not exist and is
not created by this PR.**

## 2. Which card holds it

Two cards, because the point is a card that proposes *without* approving:

- **`propose_translations`** — proposing plus the read of the label list. For the machine login, or a person who
  drafts and does not approve. Includes `translations.view` because a card that can propose blind is not usable:
  `label_translations()` is what lists the labels.
- **`translations`** — gains proposing, so today's holders lose nothing.

**Not asked of Lutan:** whether the machine login's role should hold the new card alone (yes, by construction) is
not a choice. Which *people* hold `propose_translations` is his answer on Who does what once someone other than
him reads Thai; the backlog item's "card question for Lutan" is that, and it is still open and still his.

## 3. Does the new card do something a person can reach? Found, not fixed.

**No. This PR leaves a gap, and the rule says there must be none.** The argument both ways, because the brief
asked for it:

*For "it satisfies the rule":* the activity is not dead. `propose_label_th()` asks it, a login holding the card
can call that and write a draft (proof 1), and the machine caller the card exists for reaches it by RPC with no
screen at all. By the rule's wording, "a card applies the access that lets its activity be performed", the access
is applied.

*Against, and I find it the stronger side:* `/management/translations` is registered on `translations.manage`
(`src/lib/permissions/routes.ts:347`), and its page guards on the same. **A person holding `propose_translations`
alone cannot open the screen.** Worse, `cardTile()` re-checks the card against the page rules, so the tile is
silently *not drawn*: no message, no record. That is the exact failure `CLAUDE.md` describes. Today it is
latent because nobody holds the card; the day a role is given it, it is live.

Found, not fixed, because the files are other streams' this batch:

| What | File | Should ask |
|---|---|---|
| The route entry for the page | `src/lib/permissions/routes.ts` (the `/management/translations` entry) | `alsoActivity: "translations.propose"` |
| The page guard | `src/app/management/translations/page.tsx` | `requireAnyPermission(["translations.manage", "translations.propose"])`, which `check-permission-catalogue.mjs` will insist matches the route entry |
| The propose control | the Translations screen's propose action (stream 19's file this batch) | `can(perms, "translations.propose")`, not `translations.manage` |
| Approve / discard controls | same screen | stay on `translations.manage` |

**Recommendation: do not give any role `propose_translations` until those three land.** Nothing in this PR does.

## 4. Handover to `translations-propose-app`

Must do:

1. The three rows in the table above. The route and page guard first, together, or `check-permission-catalogue`
   fails.
2. Look at `src/lib/translations/labels.ts` and its callers for any place that decides to offer propose from
   `translations.manage`.
3. `worker/translations.mjs`: sign in as the machine login and draft labels as it drafts prose, once Lutan has
   answered the question in §1. **A Worker deploy is his.** Until he answers, build it behind "no login configured,
   skip" so it is safe to merge.
4. `scripts/draft-label-thai.mjs`: take login credentials as an alternative to `--access-token`.
5. Update the comment in `scripts/draft-label-thai.mjs` lines 18–25, which describes this as unbuilt.
6. Release note, card-tagged, only when a person can reach it. Tick no release-note line before then.

Left by this PR: the machine login itself (Lutan), who holds the card (Lutan), and the item's *Done when* clauses
"the propose control is drawn only when the login holds it" and "driven in the browser", **which are not done**.

## Measured

- **Dev:** `0296` applied. `node scripts/prove-translations-propose.mjs` (new, real sessions, real PostgREST calls
  as `authenticated`, nothing kept): a login holding only `propose_translations` proposes (1); is refused approve
  with `42501` (2) and discard with `42501` (3); the `translations` card still proposes (4) and discards (5); the
  service key with no session is still refused with `42501` (6). `prove-label-drafts.mjs` still passes.
  Why a second script: the existing proof runs as the database owner and its header says it cannot exercise grants;
  the thing being changed *is* a grant.
- **`check-hard-coded-security.mjs`:** `no coded security outside the Admin bypass` before (`origin/main`) and
  after. Delta: none. (The brief expected `NOT CLEAN`; it was clean on `main` today.) The first draft of `0296`
  *did* fail it: its report block filtered on `roles.kind`, and the check attributed that read to the function
  above it. The report no longer reads roles by kind or key; it names roles by id.
- **Dev ran the earlier text of `0296`.** That edit changed only the `do $report$` block's notices, not any
  schema. It was made after dev applied the file and before anything merged, as `0294` records for itself.
  Production will run the final text. Dev's `schema_migrations` row is the same file name.
