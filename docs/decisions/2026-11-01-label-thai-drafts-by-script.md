# Thai label drafts: a script, because the cron is not allowed to propose one (2026-11-01)

Two backlog items, folded because they are one pipeline: *"Draft Thai for production's own missing
labels"* (`## Management`) and *"Teach `translations-open` about label drafts"* (`## Security`).

## 1. The question that had to be answered first: script, or teach the existing cron?

The item asked for a repo script. But a machine-translation cron already exists and already does the
same *kind* of work: `worker/translations.mjs` runs on the 15-minute trigger in test **and
production**, takes `pending` rows from the `translations` queue, has an engine
(`worker/translate-engines.mjs`) write the other language, cleans and checks the output, and saves it
as a **draft** that only a person can approve. It already holds the service key and an `ai` binding.
Teaching it labels looks obviously right: no credential anywhere new, and it keeps working for the
next sweep instead of being a script somebody has to remember to run.

**It cannot be done, and this is measured rather than reasoned.** Against dev, 2026-11-01:

```
service-role rpc propose_label_th     -> 42501 translations.manage is required to propose a Thai label
service-role insert into label_drafts -> 42501 permission denied for table label_drafts
```

`has_permission()` (`0196`) answers from `auth.uid()`. The Worker holds `SUPABASE_SERVICE_ROLE_KEY`
and no session, so it has no uid, so `propose_label_th()` raises; and `0293` grants `service_role`
`select` on `label_drafts` and nothing else, so the direct write is refused too. **There is no path
from the service key to a label draft.** The prose cron does not hit this because it `PATCH`es the
`translations` table over REST, where the service key does have grants — labels are a different
mechanism, not a different table in the same mechanism.

So teaching the cron needs one of two things, and both are schema:

- the `translations.propose` activity that `0293`'s own header names and argues for — which needs a
  row in `permission_activities` **and** an entry in `src/lib/permissions/catalogue.ts` (or
  `npm run lint` fails) **and** a card to carry it, because an activity no card grants is a card that
  does nothing, which the rule forbids; or
- a grant letting the service key write `label_drafts`.

Schema lands first as its own PR, and this brief forbade a migration. On top of that the cron shape
needs a **Worker deploy**, which is Lutan's own step, so even with the schema it could not have
produced a single draft today.

**A script can hold a session.** That is the whole of the difference, and it is why the item's
original answer turns out to be the right one. The decision is therefore *script now*, and the cron
remains the better long-run home: when `translations.propose` exists, `runTranslations()` can grow a
label arm and this script becomes the manual path for a sweep. That is filed, not done here.

## 2. Where the Thai comes from, and what the script actually is

**No engine is reachable from a checkout.** The `ai` binding is a Worker runtime binding, `OLLAMA_URL`
is unset, and `.env.local` holds no model key (`@anthropic-ai/sdk` is a dependency but its key is a
Worker secret). So the script does **not** translate, and inventing Thai nobody can vouch for would
be worse than saying so. It is three steps instead:

1. **Survey.** Read `translatable_labels` and then each registered table by name, and classify every
   row the way the Translations screen does: blank English is not a label, a blank Thai is `missing`
   unless a draft is waiting (`proposed`) or the pair is `optional` (`as_typed`), and Thai written
   against English that has since changed is `stale`. `--out <file>` writes the `missing` ones as a
   JSON list with an empty `text_th` each.
2. **Fill in `text_th`** — by a Thai speaker, by a session with the list in hand, or by the cron once
   it is allowed to propose. Not the script's business.
3. **Land it.** `--drafts <file>` checks each proposal and reports per group; `--apply` writes them
   through `propose_label_th()`.

Three things about the shape are deliberate:

- **The pairs are read from the registry at run time, not listed in the file.** The `translations-open`
  check *has* to list them literally (`TRANSLATION_ARMS`), because its SQL must be one statement with
  every column named. A script has no such constraint, so a pair registered by a later migration is
  picked up with no edit here and the two can never drift.
- **Every string goes through the engine seam's own `checkOutput()`** before it can land: non-empty,
  not the English handed back, in the Thai script, not absurdly long or short, and every number in the
  English present in the Thai. That last one matters for labels specifically (`Front Zone 0`,
  `5 kg bag`), which is why the `machine` tier's check is used rather than `reviewed`. Reusing the
  seam means the script and the cron will accept and reject the same strings. Whether the Thai *reads
  well* is still for a Thai speaker — that is what the draft is for.
- **Nothing is written without `--apply`**, `--apply` needs a session, and writing to production needs
  `--confirm production` as well. `approve_label_th()` is never called from this file.

`proposed_by` comes out **null** on anything the script lands, because the disposable dev login is
deleted afterwards and the column is `on delete set null`. The screen will therefore say *"Proposed by
someone else"*. That is arguably the right answer for a machine-made proposal and needs no schema, but
it is worth knowing before anyone reads too much into it.

## 3. What was proven, and on which database

**Dev, 2026-11-01.** The survey reproduces `translations-open` line for line — 385 labels missing, 113
shown as typed — and splits the 385 into **313 with nothing** and **72 already waiting** (the
2026-10-31 sweep's drafts). 13 real `features.name` proposals were then landed through
`propose_label_th()`: `label home` went from *13 missing* to *13 waiting*, and `features` still has
**no live Thai on any row**, so nothing a shelter user reads changed. Re-running replaced the same 13
rather than duplicating them (`0293`: one draft per label). The disposable login and its throwaway role
were both gone afterwards, checked by counting them before and after. All four validation guards were
made to fire on a deliberately bad file: English handed back, empty text, an unregistered pair, and a
plainly-English string.

**Production: NOT RUN, and not because anything refused.** Lutan said on 2026-11-01 that this stream
may write production drafts. It cannot, for a reason that has nothing to do with permissions:
`scripts/worktree.mjs` copies `.env.local` and `.dev.vars` into a new worktree and **not**
`.env.deploy.production`, so a worktree holds no production values at all and
`node scripts/apply-migrations.mjs --status --env production` stops with *".env.deploy.production is
missing or empty"*. Every production figure in the brief was taken in the main checkout, which is
where the file lives. **So the production run is the planner's**, from the main checkout, in two steps:

```
node scripts/draft-label-thai.mjs --env production --out production-labels.json
node scripts/draft-label-thai.mjs --env production --drafts production-labels.json --apply --confirm production --access-token <jwt>
```

with the `text_th` fields filled in between. The `--access-token` is a session token from a signed-in
login holding the `translations` card (or Admin); the script never prints or logs it. **That token
requirement is the one unavoidable manual step**, and it is the same fact as §1: nothing without a
session can write a label draft. Closing it is the `translations.propose` item.

## 4. The check

The edit is the one written out in the comment beside `translations-open`, unchanged: a `left join
label_drafts` in the `label_state` CTE, and `proposed` as a state counted apart from `missing`. The
precedence matches `label_translations()` exactly — `proposed`, then `as_typed`, then `missing`.

Two things worth recording:

- **The caveat is kept, not deleted.** The reason this waited — a check's SQL is wrapped in a
  `do $o$ … $o$` block and must be one statement, so every relation is resolved at plan time and
  naming a table the database lacks makes the whole check *stop* — does not expire now that
  `label_drafts` exists. The next relation a migration has not yet carried to production must still
  stay out. Deleting the comment would lose that.
- **Proposals are shown, not just subtracted.** If `missing` simply fell by 72 with nothing said, the
  release manager would read it as work that got done. The summary line and every per-group line now
  carry a *waiting to be approved* count.

Confirmed before making the edit, rather than taken on trust: production is 296 of 296 and `0293`,
`0294` are applied there — read from the main checkout's status output as quoted in the backlog item,
since this worktree cannot ask production itself (§3).

## Not done here

- **The production run** (§3): the planner's, from the main checkout.
- **No migration**, as instructed. The two things that would let the cron do this are both schema and
  are filed.
- **The wording of the Thai** is a draft in every case. Nobody has approved any of it, on either
  database, and this stream approved nothing.
- Six `harness_cards_*` roles from 29–30 October are sitting on dev, left by other harnesses. None is
  this stream's (counted before and after). Filed on the backlog rather than cleaned up here, because
  deleting another stream's fixture mid-batch is how a running check fails for no visible reason.
