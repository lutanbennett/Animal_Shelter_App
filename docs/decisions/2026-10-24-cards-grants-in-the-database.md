# 2026-10-24: what a card requires lives in the database, and a role's access is exactly its cards (0257)

Schema half of the backlog item *URGENT, LIVE ON PRODUCTION: a card given to a role does not reliably give that role the access the card needs*. **The app half is not built, so the item stays open.** Lutan's ruling the same evening: *"all security restrictions should be driven by cards only"*; *"If I assign a card the required access to perform that cards action is to be derived and applied"*; *"I just want it simplified, just apply what is required to each card, if someone loses some access I will fix that later."*

**Production is NOT fixed by merging this.** It is fixed when `0257` is applied there, which is a release step and Lutan's.

## What `0257_card_grants.sql` does

- `card_grants (card, activity, level)`: 68 rows, seeded from `CARDS[...].bundle` in `cards.ts` exactly as it stood on 2026-10-24, nothing edited. Admin at 2-step writes it; audited like `role_permissions`.
- `card_includes (card, included_card)`: the three `includes` edges (Residents, Medical records and Book clinic visits each include View residents). Kept as edges, not flattened into `card_grants`, so a change to an included card reaches every card that includes it. This is the one addition to the item's wording; without it the seed would not be "exactly" the bundles, or an included card could drift.
- **Triggers recompute `role_permissions` in the database** as the union of the role's cards' grants (levels flow through the includes). `role_cards` changes recompute that role; `card_grants` / `card_includes` changes recompute every role. A direct insert into `role_cards` (as `0251` did) now grants the access.
- `set_role_cards` keeps its signature; **`p_bundle` is ignored.** The photo-approver guards (0221/0222/0224) are kept as they are live (they test `photos.approve`, not `photos.resident_publish`; `0224` rewrote them in place by text replacement, so `0222:16` was not the current text). One change: "does the edited role approve after this call" now reads the grants of the cards it is handed instead of the caller's bundle.
- **`role_extras` stops counting.** `cards_effective()` and `recompute_role_permissions()` ignore it. Why: an extra is access that no card requires, and the ruling is that there is none. The table is **not dropped**: the app still reads it (Who does what's *Also allowed* part) until the app half lands. **Drop it in a later cleanup, once nothing reads it.**
- Every role is recomputed in the file. Fixed roles (Admin, public viewer) are never touched: Admin is not built from cards.

## The loss report

The migration raises a `NOTICE` per role (`ROLE x: ADDED … | REMOVED …`), but **the Management API that `apply-migrations.mjs` uses does not return notices**, so nothing printed when it ran. The same facts are in the audit log, because every cell the recompute changed is audited. After applying, read them with this, in the Supabase SQL editor or `psql` (role and activity names only; set the time to just before the apply):

```sql
select r.key as role, a.op, coalesce(a.new_row, a.old_row) ->> 'activity' as activity,
       a.old_row ->> 'level' as was, a.new_row ->> 'level' as now
  from audit_log a join roles r on r.id = (coalesce(a.new_row, a.old_row) ->> 'role_id')::uuid
 where a.table_name = 'role_permissions' and a.at > '<apply time>'
 order by r.key, a.op, activity;
```

**Production's list is not in this file**: it could not be read from this checkout (no production credentials, and ad-hoc production reads are refused), and a prediction would be a guess. It is produced by the apply itself. The expected shape, from the 2026-10-24 production cell counts: Management 59 cells against 15 cards (42 extras), Staff 10, Doctor 9, 2IC 3, Head of Medical 1: the removals fall mainly on those, and Head of Medical and the Volunteer should gain the cell or cells their cards need (not measured).

### Dev (applied 2026-10-24), real roles only, from the audit log

On dev every card was already covered, so **nothing was added to any real role**. Removed (all of it access no card requires):

- **doctor** removed: medical.blood_tests, medical.diet, medical.immunizations, medical.prescriptions, medical.procedures, medical.weight (edit); photos.resident_add; reference.add_while_recording; resident.adoption_news (read); resident.microchip. Lowered: medical.visits edit to read.
- **head_of_medical** removed: facility.enclosures (read), stock.count.
- **management** removed (37): assistant.ask, assistant.record, clinics.doctors, clinics.list, community.outings, contacts.add, contacts.browse, contacts.directory, donation.receipt, facility.enclosures (read), friends.manage, friends.view, maintenance.delete, maintenance.jobs, maintenance.photos, maintenance.progress, medical.archive, medical.blood_tests, medical.immunizations, medical.prescriptions, medical.procedures, medical.visits, projects.folders, projects.photos, projects.publish, reference.add_while_recording, stock.correct, stock.count, stock.delivery, stock.diets, stock.medications, stock.purchasing, stock.usage, translations.manage, translations.view, visit.book, website.content. Lowered: medical.diet and reports.cashflow edit to read.
- **second_in_command** removed (8): assistant.record, contacts.browse, maintenance.delete, medical.immunizations, medical.prescriptions, reports.dashboard, resident.microchip, stock.correct. Lowered: medical.diet edit to read.
- **staff** (retired) removed (9): clinics.list, contacts.add, contacts.directory, friends.view, projects.folders, projects.photos, projects.publish, reference.add_while_recording, translations.view.
- **volunteer** removed: assistant.ask.

Do not read dev's list as production's: the roles' cards differ.

## Things to know

- **Not blocked by anything new, and nothing hard-coded added.** The remaining hard-coded rules (`routes.ts` page activities, `OUTSIDE_REGISTRY`, `roles.scope_*`, `opens_app`) were not touched. Any card whose page one of them still blocks is a job for the security rebuild.
- **`scripts/check-cards-schema.mjs` will now disagree** with the database for any role that held extras, and its part 2 assumes the old bundle-from-caller recompute. It is the app half's to retire or rewrite (this stream was held to one new script). `check-card-grants.mjs` is the replacement proof.
- **`card_grants` is not in `AUDITED_TABLES`** (`src/lib/audit/recent-changes.ts`), so its rows show unlabelled in Recent changes. The database audits it; the app half adds the label.
- **A direct write to `role_permissions` still sticks** until the role's next recompute; making that impossible is a rebuild question, not this item's.
- Proof: `node scripts/check-card-grants.mjs` (seed equals `cards.ts`; every role equals the union of its cards; then a rolled-back transaction covering direct insert/delete, grant changes reaching all holders, includes, `role_extras` ignored, `p_bundle` ignored, Admin untouched with a login, and both photo-approver refusals plus the retired-role rule).
