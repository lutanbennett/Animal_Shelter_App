# Page-level classification: which of the 70 default-level pages need read or edit (2026-11-06)

Backlog item `#q0wc0`. No behaviour changes in this PR, no migration, nothing loosened in the database.

## 1. Step zero and the re-count

Method: every `src/app/**/page.tsx` that calls `requirePermission(` with one argument. Result on `main` at
`b90a81de`: **70** (the item's 64 was measured 2026-11-03). Not already built: `require.ts:25` still defaults to `edit`.

**New finding: the count overstates the question.** `requirePermission` has two overloads
(`require.ts:22-23`): a **yes/no** activity takes no level at all, a **level** activity takes one. Of the 70,
**33 ask a yes/no activity**, where "read or edit" is not a meaningful question and the type system refuses a
second argument. Only **37** can carry a level. Those 33 need no classification; they are listed in section 4.

## 2. The 37 level-capable pages: all classified `edit`, now passed explicitly

Read from what each page does, not from its comment or the default. Every one draws a write control
unconditionally (a create form, a save button, an add link, or a keypad that records), none gates it with
`can(...)`, so `read` would offer a read-only login controls the action then refuses (the buttons-follow-cards
rule). `edit` is the correct level and is now a decision. Wrongly withheld pages found: **none**.

| Area | Activity | Files (all `edit`) |
|---|---|---|
| Reference lists | `reference.types` | admin/blood-test-types, diets, diets/[id], diets/ingredients, diets/ingredients/[id], immunization-types, medications, procedure-types, units |
| Facility | `facility.enclosures` | admin/enclosures, admin/facility-map, admin/zones |
| Medical forms | `medical.*` | blood-tests/new, clinic-visits/[id]/edit, diets/new, diets/[id]/edit, immunizations/new, prescriptions/new, prescriptions/[id]/edit, procedures/new, weight/new, weight/[id]/edit, medical/weight (records via keypad) |
| Management | `reports.cashflow`, `clinics.list`, `contacts.directory`, `website.content` | cashflow/fixed-outgoings, clinics, contacts, contacts/new, sterilisation-drives, sterilisation-drives/new, sterilisation-drives/[id] |
| Community, library | `community.outings`, `social.library` | outreach/new, outreach/[id]/edit, memes/make, memes/new, memes/[id]/edit, reels/new, reels/[id]/edit |

`memes/*` were held for #1346; it merged (`b90a81de`), so they are done here.

A possible later improvement, **not done**: the list pages in that table that are pure browse plus an add button
(admin/diets lists, sterilisation-drives list, management/contacts, management/clinics) could become `read`
if their add/archive controls were gated on `edit`. That is a control change plus a guard change per page, which
this PR does not make.

## 3. Pages needing two cards together

None found among the 37.

## 4. The 33 yes/no pages (no level possible), and the carve-outs

Activities: `appeal.run`, `bills.sites`, `bills.utilities`, `clinics.doctors`, `contacts.browse`, `donation.receipt`,
`events.run`, `friends.manage`, `photos.approve`, `photos.medical_add`, `recurring.manage`, `reports.dashboard`,
`resident.correct_intake_date`, `resident.register`, `stock.count/delivery/purchasing/usage`, `system.status`,
`translations.view`, `visit.book`.
Reported only, files untouched as briefed: `bills/settings` and `bills/utilities` (bill-cards-to-one),
`photos/approve` and `management/events/*` (events-card-reads). All are yes/no, so nothing to classify.

## 5. The default flip: deliberately not taken

Do not flip `require.ts` to `read`. A page that forgets its level would then become too open instead of too
closed, the worse direction. Agreed with the item. Stronger alternative, for the planner to file: make the level
**required** for level activities in the overload (no default), so forgetting it is a compile error. With this PR
all 37 pass one, so that change would now compile.
