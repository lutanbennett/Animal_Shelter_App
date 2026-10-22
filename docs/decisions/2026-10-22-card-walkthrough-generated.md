# 2026-10-22 — The card walkthrough is generated from `cards.ts`, and walked as a one-card login

Stage 1 of the walkthrough item (backlog, *Next up*): the building half only. The runs are six later streams, one
per card group; this stream makes them possible and does not run a single card.

## Why the script is generated, not written

`docs/card-walkthrough.md` is written by `scripts/gen-card-walkthrough.mjs` from `CARDS` and `cardOpens`
(`src/lib/permissions/cards.ts`), the activity labels in the English dictionary, and the two tiles that are not cards
of their own (My tasks, Residents). A typed script goes stale silently: card twenty-seven would simply not appear, and
nobody would know a card had never been walked. Generated, it appears the day the card is added.

The steps come from each card's *own* bundle. An activity held at edit, or a yes/no activity, is something to do; a read
is something to see. Where the catalogue says where a write must show (`READBACK` in the generator: book a visit, move a
job on, mark a recurring task done, register a resident, move a resident) the step names the read-back. **Where it does
not, the step is a `TODO:` with a one-line question, not an invented job.** A fabricated step is a trap for whoever runs
it; a named gap is something the person running that group answers first. Every card also gets a **Refused** step: open
a page the login does not hold and expect a refusal.

At the time of writing most write steps are `TODO:`. That is the honest state, and the PR lists them.

## What `scripts/check-card-walkthrough.mjs` guarantees

It fails when (a) a card has no steps beyond opening its page, (b) `docs/card-walkthrough.md` differs from what the
generator would write now (so a card added or changed without regenerating is caught), (c) `READBACK` names an activity
the catalogue lacks, or (d) a non-card tile points at a card that is gone or opens a different page. It reads only the
repo, so CI runs it as its own advisory job, `card-walkthrough`, mirroring `cards-count`. It is **not** in `gates.mjs`:
the neighbouring `check-cards-*.mjs` checks are not wired there either (`cards-count` is a CI job), and that file belongs
to `checkout-cache-prune` this batch.

## Why a card-scoped login and not Admin

`node scripts/dev-signin.mjs --cards a,b --port N` makes a throwaway role per set of cards (`dev_signin_cards_<hash>`),
hands it exactly those cards through `set_role_cards()` with the bundle `cards.ts` computes, and signs in a login holding
that role and nothing else: no extras, no other cards. Admin passes every check, so a card that silently leans on another
card's permission would pass for Admin and fail in front of a real person. With a one-card login it fails here.
`--remove` deletes the logins and the card roles (`role_cards` and `role_permissions` rows first). Dev project only, like
the role mode; the password is random and never printed.

The role mirrors the throwaway role in `check-cards-schema.mjs`: opens the app, residents scope `who_and_where`, clinical
scope `any`, other scopes at their defaults.

## Proven, and the limit

Two logins, then stop, as briefed: a `view_residents` login showed one tile (View residents) on the home screen and
`/residents` opened; a `bills` login was sent to `/no-access` for `/management/dashboard`. Both at 375 px. aal1 only, as
for every dev-signin login.

`--remove` is unchanged for role logins and still removes **every** `dev-signin-*` login, including another stream's.
It reported `dev-signin-admin@example.invalid: Database error deleting user` on this run: that login cannot be deleted
(an existing fault, not looked into here).
