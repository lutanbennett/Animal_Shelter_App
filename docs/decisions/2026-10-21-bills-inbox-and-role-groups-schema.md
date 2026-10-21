# bills-and-groups-schema: two unrelated migrations, one schema PR

Folded into one PR because only one branch may carry migrations at a time; kept as two files so the
permission change is not reviewed as a side effect of the seeding one.

## 0240 — a clinic login may not use the bills inbox

Lutan ruled 2026-10-21 that a visiting vet must not use the shared bills inbox. `can_use_bills_inbox()`
(0189) let in anyone holding `medical.visits`, which the doctor role got in PR 766.

**Narrowed by scope, not by dropping `medical.visits`.** The function now refuses a clinic login
(`is_clinic_login()`, scope_clinical = own_clinic) and otherwise asks exactly what it did. That is the
fence `canUseBills()` in `src/lib/bills/access.ts` already drew, so the app needed no change and the
doctor was never offered the screen; only the database door was open. Dropping `medical.visits`
instead would have shut out shelter roles that file clinic bills, which is the worse bug the brief
warned about.

After: admin, management, the 2IC (stock.delivery), the Head of Maintenance (maintenance.bills) and any
shelter role with `medical.visits` use the inbox; the doctor and volunteer do not. `check-bills-roles`:
5 failed before, 96/96 after, script unchanged.

## 0241 — role_groups

Option (b) of the tile-groups item. `role_groups` (role, name, Thai name, icon key, position) and a
nullable `role_cards.group_id` (on delete set null). A group grants nothing; nothing in the
permission recompute reads it. Same RLS as `role_cards`; fixed roles take none; a trigger refuses a
card pointing at another role's group.

**Seeding choice.** "Seed from today's Operations and Management membership so no home changes" can't
mean moving cards into groups — that would change every home the moment the app reads the column. So
each role gets an Operations and/or Management group exactly where it holds a card opening a page in
that section today (the landings it reaches from its cards), and every `group_id` stays null. The
role-home-app stream decides what moves inside; if it wants the old landings reproduced, the card →
section map is in the migration's seed.

`set_role_cards()` upserts on (role, card) updating position only, so a card's group survives a save
on Who does what; a card removed and re-added comes back ungrouped.

`check-cards-schema` reports two role_permissions drifts on dev (the doctor and a dry-run account);
neither migration touches role_permissions, so they predate this branch.
