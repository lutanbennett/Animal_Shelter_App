# 2026-10-31 — `assistant.record` goes back on the `assistant` card (0295)

**Lutan, asked directly this morning:** the grant goes on the `assistant` card,
restoring the pairing `0257` had and `0268` deleted. It needs no new card and
nothing for him to assign, so whoever can ask the assistant can also let it
write. The alternative weighed and **not** built was a second card for *acting*
as against *asking*; a later item may split it. Do not re-ask.

## What was wrong

`0257_card_grants.sql:338-339` gave the `assistant` card both `assistant.ask` and
`assistant.record`. `0268_card_review_2_cards.sql:144` deleted the record grant,
on the reasoning in its own line 19 — that the activity *"can do nothing alone"*.
**That was true when it was written.** The assistant answered questions and wrote
nothing. Six streams later it writes ten kinds of thing, and every one of those
writes is checked against `assistant.record` in `src/app/assistant/actions.ts:77`.
No card granted it, so every assistant write was refused for every login except
Admin, who passes by the `perms.isAdmin` short-circuit outside the card system.
That is why #1129's browser drive had to be run as Admin.

It is the half-working card `CLAUDE.md` forbids — *"there must be no state in
which a card does nothing"*: the app offered the write, the person pressed
Confirm, and the database refused the row.

## `0295` is one row, and the triggers do the rest

`insert into card_grants values ('assistant', 'assistant.record', 2)`. `0257`'s
triggers recompute `role_permissions` as the union of a role's cards' grants, so
it reaches every holder the moment it commits, however the card was given. No
activity is created (`catalogue.ts:98` and `permission_activities` have declared
it since `0132`), no policy is touched, no card is created, no role is handed a
card, and nothing is granted to Admin.

**`-- consumer: src/lib/permissions/cards.ts`**, and the reasoning rather than a
copy of a neighbour. `0292` chose `none` because nothing read its tables yet;
`0293` chose a real file because the app half read its functions. Here no column,
view or function is added at all, so the usual question — *which code reads this?*
— has no direct answer. The file that must be live **with** this row is the mirror:
`check-card-grants.mjs` part 1a asserts `card_grants` equals `cards.ts` cell for
cell, and Who does what shows the card's bundle from `cards.ts`. Applying `0295`
to a database whose app still carries the old bundle is the state the header exists
to warn about. `src/app/assistant/actions.ts` was considered and rejected: it is
already live and unchanged, so naming it would be silent in exactly the case that
matters. (The dry-run printed no warning today, correctly: the comparison is
against `origin/main`, where the `cards.ts` change is not yet merged.)

## The declared crossing: one `src/` file

The brief forbade `src/`. Deliverable 1 needs it anyway, and this is the reason:
`scripts/check-card-grants.mjs` part 1a compares `card_grants` with `cards.ts`
**cell for cell** and fails on a row either side lacks. A grant in the database
with no entry in the bundle is a divergence, and Who does what would then display
a card the database does not apply. So `src/lib/permissions/cards.ts` gains
`{ activity: "assistant.record" }` on the `assistant` card, and nothing else in
`src/` is touched. `docs/card-walkthrough.md` is generated from `cards.ts`, so it
is regenerated, and `scripts/gen-card-walkthrough.mjs` gains a `READBACK` entry so
the new step reads as an instruction rather than a `TODO`.

## Two harnesses asserted the old truth

`scripts/check-public-stories-schema.mjs` and
`scripts/check-assistant-refused-client.mjs` both used **the Assistant card** as
their fixture for *a login that can ask and cannot record*, to prove `0214`'s
policy: an asker may record a refusal, and only its own. After `0295` an Assistant
login records on purpose, so both would have gone red for the right reason.

Both now use **`do_maintenance`**, which grants `assistant.ask` and not
`assistant.record` (`0257:296`). What `0214` asserts is the policy, so the fixture
has to be whichever card grants the ask alone, not whichever card is named after
it. `check-public-stories-schema.mjs` now asserts that fixture property (B0) before
relying on it, and `scripts/prove-assistant-record-card.mjs` proof 6 asserts it too,
so the day `do_maintenance` gains the record grant, three places say so instead of
one quietly passing.

## The proof harness

`scripts/prove-assistant-record-card.mjs`, nine proofs in one `begin … rollback`,
every fixture built from cards and never from a role key. The one that matters is
the **join** nothing was asserting before: a login holding exactly the `assistant`
card really inserts a `confirmed` `assistant_actions` row as `authenticated`, under
the live `0150`/`0214` policies, and a login holding no card does not. It also
covers `user_id = auth.uid()` biting in both directions, the triggers unapplying the
grant when the card is taken away, the ask-only fixture above, that every holder of
the card holds the cell, and that Admin stays outside the card system.

Verified capable of failing: inverting proof 2's card-holder check exits 1;
restored, it exits 0.

## The browser drive, and what it found

Three logins, each holding cards and nothing else, on dev at port 3003.

**`--cards assistant`.** The write examples (*"Panda weighs 12.4 kg"*, *"Send Panda
to hospital today"*, …) and a **LOG WEIGHT preview card with a Confirm button** are
now drawn. `src/lib/assistant/data.ts:234` gates those on
`can(perms, "assistant.record")`, so that alone is the visible proof the grant
reached a card-only login — before `0295` the panel offered lookups only. **But the
resident picker is empty and the lookup answers *"Which resident do you mean?"***

> **A FINDING, and it is not this item's fault.** `src/lib/assistant/data.ts:123`
> reads `resident_list_view`, a `security_invoker` view over `residents`, whose only
> select policy (`residents_select_perm`) asks **`resident.record` at read**. The
> `assistant` card grants `resident.who_and_where`. So does `record_weight`. The
> narrow view that activity exists for — `resident_who_and_where` (`0134`, `0192`) —
> is **not** what the assistant reads. Measured: of `assistant`, `record_weight` and
> `view_residents`, only `view_residents` grants `resident.record`, and only with it
> can the assistant name an animal at all. Every card deliberately narrowed to
> who-and-where by card review 2 is therefore blind inside the assistant. Filed; it
> needs a `src/` change (point the lookup at `resident_who_and_where`) and is a
> different fault from this one.

**`--cards assistant,view_residents`.** The resident matched, the weight skipped the
confirm (#1129), and the write **reached the database** — refused there by the
`weight` table's own RLS, `new row violates row-level security policy for table
"weight"`. That is the `assistant.record` gate passing and only `medical.weight`
missing, which is the design: each write is checked against its own thing's
activity on top of `assistant.record`.

**`--cards assistant,view_residents,record_weight`.** *"Done — Walkassistant
(R-8383) recorded at 12.4 kg on 31 Oct 2026."* Confirmed in the database: a `weight`
row (12.4 kg, `2026-10-31`, notes *via the assistant — "Walkassistant weighs 12.4
kg"*) and a `confirmed` `assistant_actions` row under that login's own `user_id`.
**An assistant write completed end to end by a non-Admin login whose access comes
only from cards**, which is the item's "done when" and was impossible yesterday.

`Walkassistant` is a disposable dev resident made for the drive and left in place;
dev data is disposable.

## Why there is no release note

`src/lib/releases.ts` is untouched and §7 is `n/a`. The grant works the moment it is
applied, but **nobody at the shelter can use it until the `assistant` card is given
to a role on Settings → Who does what, which is Lutan's own step.** A note saying
the assistant can now record would promise users something that is still waiting on
him — the fault that sent #518's false note to every admin
(`docs/decisions/2026-10-11-release-note-truth-rule.md`). The note belongs in the
change that closes the step.

## The comment-string convention

`0295`'s string literals carry no `;` and no `--`, like `0292`, `0293` and `0294`,
because `scripts/check-migration-grants.mjs` splits on semicolons and strips
double-dash comments without tracking string literals, so either one inside a
literal swallows the next statement and reads as a missing `revoke`. The file says
so itself. Fixing the script is a filed backlog item, not this stream's business.
