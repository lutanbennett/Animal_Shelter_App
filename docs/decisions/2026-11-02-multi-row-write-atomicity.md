# Multi-row wrapped writes: "can't tell" is accepted, and the message now tells the truth

Measured on branch `claude/multi-row-write-atomicity` at `efe24a61` (= `main` after batch 1), 2026-11-02.
No migration, no change to `runWriteAction()`.

## 1. How many actions write more than one row

`runWriteAction(` appears at **298 call sites**. In **29** the body makes two or more
`.insert/.update/.upsert/.delete/.rpc` calls (counted by a script that splits each file at the call and counts
those calls in the text up to the next `export async function`; the list: diets/recipe, enclosures, facility-map
x3, recent-changes, security x3, shop, website x2, who-does-what, zones, maintenance x2, bills, appeals, clinic
doctors x2, donations, recurring-jobs, shelter-friends, translations, units, memes, residents new /
adoption-updates / edit). It is a **lower bound** (writes made inside helper functions are not seen) and an
**upper bound on real risk** (some pairs are a row plus an audit entry, which a partial failure hurts little).
So: roughly a tenth of the wrapped actions, not two and not a hundred. `check-wrapped-write-paths.mjs --all`
still reports 149 of 149.

## 2. Can `runWriteAction()` offer a transaction? No.

Confirmed from the code, not assumed. `body()` is ordinary JavaScript making separate PostgREST calls; each is
its own transaction and supabase-js has no transaction handle. A Postgres transaction cannot span them. The only
way to get "all or nothing" is to move the rows behind **one RPC** (a migration plus a rewrite of that action),
which is per action, not an option on `WriteOptions`. The type cannot carry it.

**Decision: do not build that now.** Reasons:
- The claim is left open on purpose (the comment in `action-result.ts`: the availability cost). A throw cannot
  tell "never happened" from "happened, answer lost"; guessing "never happened" re-runs a write. Safety first.
- Rewriting 29 actions as RPCs is a programme, and it makes a retry finish the job only if the RPC is itself
  idempotent. Where an action genuinely must be all-or-nothing (money, a move that touches two ledgers), write
  that one as an RPC when it is next touched. The one-RPC shape already exists (`record_intake`).

## 3. The real fault found: the message promised something false

`saveUnknown` said *"Press Save again to find out — it will not be saved twice."* But `use-write-form.ts` keeps
the request id while the answer is "can't tell", and the database answers an open claim with `in_flight` every
time. So pressing Save again **cannot find anything out**: it returns the same sentence for ever, until the page
is reloaded (a reload makes a new id, which runs the whole save again). After a partly written save (the case a
power cut produces) the person was sent in a circle.

**Chosen: one generic message, not per path.** It tells the person to look at the page for their changes, and if
they are not there to reload and enter them again. That is true for every path, safe (looking first prevents the
double entry), and a per-path message would need 298 strings for little gain. Keys changed:
`t.common.saveUnknown` in `en.ts` and `th.ts` only. No `t.validation.*` key touched.

## 4. Does this change the (D) sweep's conclusion?

No. The sweep is complete and no write runs twice; this is the question after it.

## Not done, said plainly
Not built: any RPC, any release of an open claim, any per-path wording. For the planner to file if wanted: a
fix for the "stuck on in_flight until reload" experience itself (for example the browser dropping the kept id
after a second can't-tell), which is a change to `useWriteCall`, not to the wrapper.
