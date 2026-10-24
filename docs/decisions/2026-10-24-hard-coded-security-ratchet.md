# Hard-coded security is forbidden: the rule binds, and a check ratchets the known debt (2026-10-24)

## The ruling

Lutan, 2026-10-24, repeatedly: *"Hard coded security in the system is forbidden."* *"I want all hard
coded security removed, we need to start from zero hidden security settings and we build off the cards
only."* And in full:

> *A role is a placeholder that gets no permissions until a card is assigned. The cards assigned will
> define page access and read write permissions. It's that simple and there are to be zero exceptions
> to this rule.* … *New cards will be created for specific activities.*

Settled, none of it open: a role has no property of its own that affects access; page access comes from
the card; read/write comes from the card; an activity with no card gets a new card, so nothing needs a
hard-coded fallback. **Page access is ANSWERED:** it moves onto the card, like the grants `0257` already
moved. The page rules are no longer waiting on a decision, only on the work.

A card applies the access that lets its activity be performed, so there is no state in which a card does
nothing. That invariant is already false on production: `role-cards-coverage` (#911) named four roles on
2026-10-24 (Volunteer and Head of Medical: My tasks; Head of Maintenance and 2IC: maintenance; 2IC: special diets).

## What this PR does

Removes nothing. It puts the rule in `CLAUDE.md`, records the known mechanisms in
`docs/hard-coded-security-registry.json` (a shape the later *Hidden security* screen can read), and adds
`scripts/check-hard-coded-security.mjs` as its own blocking CI job, `hard-coded-security`. No
`continue-on-error`, no change to either audit workflow, not a fifth gate in `gates.mjs`.

## The test

Does it grant or deny the ability to do something, or decide whether a card shows? Then it must be a card.
Does it only decide layout or ordering? Then it is not security. The only survivor found: the order roles
are listed on an admin screen.

## Inventory, baseline `cd933f43` (origin/main), lines in `src/**/*.ts(x)`

| mechanism | refs |
|---|---|
| `roles.opens_app` / `opensApp` | 33 |
| `roles.scope_clinical` / `cardOpens` | 9 |
| `scope_residents`, `scope_contacts`, `scope_photos` | 9 |
| `canUseBills` | 12 |
| page rules (`path:` entries in `routes.ts`) | 45 |
| `JOBS_OF_ROLE` | 2 |
| `OUTSIDE_REGISTRY` | 5 |
| `CURATED_HOME` | 2 |
| `cardTile()` silent drop (`covered` re-check and `!icon \|\| !opens`) | 2 |
| `opensAnyIn` (derived from page rules, not counted twice) | 12 |

The brief counted 55 page rules; the file has 45 `path:` entries at this commit. Recorded as found.
`JOBS_OF_ROLE` mixes access with tile layout: **unseparated**, not split here. Whether removing the
`cardTile()` re-check breaks anything else is **not established**: nobody has read its dependents.

## What the check can and cannot catch

It ratchets the **known** set: a count rising, or a mechanism moving from where the registry says, fails.
A fall prints the new baseline and passes. It **cannot** detect a new *kind* of hard-coded rule nobody has
named, so green means "the known set did not grow", not "there is none". The count is a line-match, so it
catches adding another use of a mechanism, not a rule disguised under a new name.

## Suggested removal order

1. `JOBS_OF_ROLE` and the four `OUTSIDE_REGISTRY` predicates: the smallest genuine wins.
2. The `cardTile()` re-check, likely one line, once its dependents are read.
3. `CURATED_HOME`, then the role columns (`opens_app`, `scope_*`), then `canUseBills`' first line.
4. The page rules: the large piece. They move onto the card; the work is big but the decision is made.
