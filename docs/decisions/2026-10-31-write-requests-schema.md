# `write_requests`: the Pi failover record, and the four decisions behind it

Stream `pi-failover-schema`, stream **(B)** of the PI FAILOVER programme, 2026-10-31. One migration,
`supabase/migrations/0292_write_requests.sql`, applied to dev the same day.

**This file is written for whoever is briefed on stream (C), the shared wrapper.** The migration's own header
is the short version; this is the reasoning, and the last section is the list of things (C) must do that the
table cannot do for itself.

Authority above this file: `docs/decisions/2026-10-02-pi-failover.md` (the agreed paper and the drill results)
and Lutan's decision of 2026-10-19, *"I want to go for option 1 - the bigger build but proper fix. Let's do it
right the first time."*

## What the table is for, in one paragraph

The app runs on a Raspberry Pi behind a Cloudflare tunnel with a Worker in front. A 502 or a timeout can
arrive **after** the Pi has already written, and a thrown fetch cannot tell *"never arrived"* from *"arrived,
then the answer was dropped"*. The 2026-10-28 drills measured it: with the app wedged, **4 of 85 writes hit
the client's 30 s limit, were seen as failures, and landed anyway** once the app resumed. Replaying those on
the Worker would have recorded each write twice, which is what #250 did. Because the Pi and the Worker write
to the **same** Supabase database, the duplicate can be closed at the database instead of guessed at the edge
— and once it is closed, retrying on the Worker is always safe.

So: every write carries a client-generated request id; the id is recorded under a unique key **in the same
transaction as the write**; a replay returns the first result instead of writing again.

## (a) The unique key: the request id scoped to the login

**`primary key (user_id, request_id)`**, and `user_id` is taken from `auth.uid()` **inside** the functions —
it is never a parameter, so a caller cannot name someone else's row.

The alternative was the request id alone. Scoping it is better for one reason that matters: with a bare id, a
second login that ever generated the same uuid would collide with a stranger's row, and the function would
then have to choose between **returning that stranger's result** (an information leak) and **refusing a
legitimate write** (losing data). Scoped, there is no third party and no such choice — two logins with the
same uuid simply get two rows.

**What is left, said plainly:** a login that collides with *itself* (the same person on two devices, say the
Director on the PC and the phone) would have its second genuine write deduped and be handed the first one's
result. With a v4 uuid the chance is negligible, and generating one properly is **(C)'s** duty, not the
table's. Nothing worse than that is reachable: a client that submits a repeated or forged id only ever burns
a slot in its own namespace.

**And that is the answer to "what stops a bad or repeated id being used to read back someone else's
result":** the key is scoped, and the scope comes from the session, not from the request body. The table
imposes it; (C) cannot opt out of it.

## (b) What it stores: the result, not a reference, not a flag

`result jsonb` holds the action's **own serialised answer**, so a replay returns the first result verbatim
with no per-table knowledge — one record works for an intake, a stocktake and an attachment row alike. A row
reference would have forced a per-table read path, and a bare *"yes, this happened"* would not satisfy the
item's *"returns the first result"*: the caller would still have to go and find out what happened.

`completed_at` separates the two things that a single column would confuse:

| state | `completed_at` | what a replay is told | what (C) must do |
|---|---|---|---|
| fresh | — no row — | `{"status":"claimed"}` | do the write |
| claimed and finished | set | `{"status":"replay","result":…}` | return the stored result |
| claimed, no result | null | `{"status":"in_flight"}` | **never report success**; surface it |

The third state should be unreachable if (C) honours the single transaction, because a claim only commits
when the write commits. It exists anyway, and is refused rather than guessed, because the one failure this
programme cannot afford is a replay that *looks* like a success.

`action` is recorded but is **not** part of the key. The id identifies the attempt; the action is there for
diagnosis and so that the same id replayed against a *different* write path is **refused** rather than
answered with the other path's result. That refusal is deliberate: fail closed.

## (c) How a row goes away: 7 days, by pg_cron, inside the database

`purge_write_requests()` deletes rows older than **7 days**, scheduled daily at 03:29 UTC. This is the shape
**`0227_assistant_retention.sql`** set for exactly this question, and it is the reason the answer needed no
invention: the delete runs inside the database, so it needs **no key, no deploy, and nobody to remember it**.

Why 7 days and not hours: a retry happens within seconds, so the retry window needs almost nothing. The week
is for **reading an incident back afterwards** — the drills are run ad hoc at the Pi and the failover cases
worth understanding are the ones nobody noticed at the time. Seven days bounds the table at about a week of
the shelter's writes, which is small.

**One deliberate difference from 0227.** `purge_assistant_actions()` is `security definer`; this one is
**`security invoker`**. pg_cron runs it as the role that scheduled it, which already owns the table, so
definer rights buy nothing — and a definer function that calls no card function would need a named exception
in `docs/hard-coded-security-registry.json` that it does not need. Less privilege and one fewer declared
exception. No login can call it either way: `execute` is revoked from `public`, `anon` and `authenticated`.

## (d) Who may write to it: no card, deliberately

**This table gets no card, and that is the correct answer rather than a gap.**

`CLAUDE.md` is explicit that only a card may grant the ability to do something, and that a card **applies the
access that lets its activity be performed** — there must be no state in which a card does nothing. Apply
that test here: claiming a request id lets a login do **nothing it could not already do**. The write itself
is still gated by its own card, unchanged. There is no activity a person performs called "record a request
id"; it is plumbing the app writes on every save. A card for it would be a card that grants nothing, which is
precisely the fault the `role-cards-coverage` check exists to catch.

So the access is expressed as a closed door rather than as a permission:

- **RLS on, and no policies at all.** A direct read or write is refused however the grants later change.
- **No table rights for `anon` or `authenticated`.** `service_role` only, for support reads.
- **The only door is `claim_write_request()` / `finish_write_request()`**, both `security definer`, both
  scoped to `auth.uid()`, both executable by `authenticated` and not by `anon`.
- **Their gate is `holds_app_role()`** — *"is this login in the app at all"* — which since `0259` is itself
  **card-derived** (Admin, or a role holding at least one cell) and reads no role key, no role name and no
  role column. There is no role rule anywhere in this file.

Both functions are declared in `docs/hard-coded-security-registry.json` under `database.declared` as
*definer-but-grants-nothing*, which is the same shape `my_permissions definer` already carries.
`node scripts/check-hard-coded-security.mjs` prints **`no coded security outside the Admin bypass`** with
them in place.

## The `-- consumer:` header: `none`, and why not a path

`-- consumer: none`. The honest alternative was a path to the file (C) will write, and that is the exact fault
**#1113** shipped — a merged migration whose header pointed at a file that did not consume it.

`none` is not merely honest-today. The header feeds one mechanism: `apply-migrations.mjs` warns when a
migration's consumer is **not yet in the release assumed live**, so you do not apply schema whose reader has
not shipped. Nothing reads `0292` on the day it is applied, so there is nothing for that warning to say, and a
path to a file not on `main` would produce a warning that is pure noise.

**The gap this leaves, named rather than hidden:** the ordering that actually matters here is the **reverse**
one — (C)'s code must not deploy before `0292` is on production — and this header cannot express that. (C) has
no migration of its own to carry a header, so the guard has to be a line in (C)'s release note and in
`docs/release-procedure.md`'s ordering, not a header here. **Production is currently three migrations behind
(`0289`, `0290`, `0291` all pending), so `0292` will not be live for a while; that is the release manager's
business, and it is harmless because nothing reads the table.**

## What (C) must do, because the table cannot do it alone

1. **One transaction.** Each write must reach the database as **one statement or RPC** that calls
   `claim_write_request()`, does the write, then `finish_write_request()`. Over two PostgREST round trips each
   call is its own transaction and the record degrades to best-effort — the invariant is lost. This is the
   single most important line in this file.
2. **Generate the id properly** (v4, client-side, stable across retries of the same attempt). The table scopes
   it to the login but cannot tell a careless id from a careful one.
3. **Handle `in_flight` as an unknown**, never as a success and never as a licence to write again.
4. **Expect a refusal** when the same id arrives against a different action, and treat it as a bug in the
   caller rather than retrying.
5. **A client-side time limit on writes**, because the wedge drill showed a wedged app returns no status at
   all within 30 s. That is the paper's own point and it is (C)'s.
6. **Re-run `node scripts/prove-write-requests.mjs`** after any change to the two functions.

## The proof, and what it does not cover

`scripts/prove-write-requests.mjs` exercises the table against **real rows** inside one
`begin … do $$ … $$ … rollback`, so nothing is kept (checked afterwards: `write_requests` holds 0 rows on dev).
Ten numbered proofs, each a `raise exception` that the Management API surfaces as an error: a fresh id is
claimed; the same id cannot be recorded twice; a replay returns the first result verbatim; an unfinished claim
reads as `in_flight`; a different action is refused; finishing twice or finishing an unmade claim is refused; a
second login claiming the same id gets its own row; an aborted write leaves no claim, so its retry is free;
retention takes an 8-day-old row and leaves a fresh one; and the table is closed (RLS on, no policies, no
rights for `anon`/`authenticated`, functions executable by `authenticated` only, purge by neither, cron job
scheduled).

**It was verified to be capable of failing** — a deliberately inverted assertion reported
`1 FAILED: a fresh request id returned {"status": "claimed"} and should have returned claimed`. A proof that
cannot fail proves nothing.

**What it does not cover, said rather than implied:** the Management API runs as the database owner, so the
grants are read from the catalogue (`has_table_privilege`, `has_function_privilege`) rather than exercised as
`authenticated`. `auth.uid()` is set through `request.jwt.claims`, which is how the functions read it in
production, but the SQL role is not switched. And it has only ever run against **dev** — a worktree cannot
read production.

## Not in this stream

(C) the shared wrapper and the Worker replay rule, and (D) the sweep over every write path, are later
batches, by `CLAUDE.md`'s one-migration-in-flight rule. **No `src/` and no `worker/` file was touched.** The
drills at the Pi — the power-pull and the wedge test — are Lutan's and moved on 2026-10-30 to *PI TESTS AT THE
PI*.
