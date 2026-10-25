# Removing the role-keyed security from the database (2026-10-25)

Branch `claude/security-db-half`, migration `0259`. The second and last half of Lutan's rule,
*"Hard-coded security is forbidden"* (`CLAUDE.md`). The app half was #920
(`docs/decisions/2026-10-25-remove-hard-coded-security.md`), which ended by naming what the database still held.

His instruction, given four times on 2026-10-24 before it was understood and twice more since:
*"A role is a placeholder that gets no permissions until a card is assigned. The cards assigned will define page access
and read write permissions. It's that simple and there are to be zero exceptions to this rule."*
*"No more little bit here and then fix some other stuff I want it all gone right now."*
And, 2026-10-25: ***"No creating cards just remove permissions."***

## What replaced each function, and why that shape

**The shape is the whole decision, so it comes first.** In every one of the 108 row policies that called these
predicates, the role-column predicate sits **beside** a card check — the policy asks `has_permission()` of its own
activity, *and then* `sees_all_residents()` as well. **The card was already the grantor. The role column only ever
subtracted from what the card gave.**

So removing the hard-coded security means those predicates **stop subtracting**, and the card check beside them becomes
the whole decision. Each predicate was redefined so that it reads no role column, which reaches all 108 policies and all
13 views at once without rewriting any of them.

| function | read | now | direction |
|---|---|---|---|
| `sees_all_residents()` | `scope_residents` | `true` | granted; stops narrowing |
| `may_open_resident_record()` | `scope_residents` | `true` | granted; stops narrowing |
| `sees_all_clinical()` | `scope_clinical` | `true` | granted; stops narrowing |
| `sees_all_contacts()` | `scope_contacts` | `true` | granted; stops narrowing |
| `on_volunteer_floor()` | `scope_residents` | `false` | **restricted** (callers ask `NOT …`); stops holding roles back |
| `is_clinic_login()` | `scope_clinical` | `false` | both polarities; stops both |
| `photos_medical_only()` | `scope_photos` | `false` | **restricted**; stops confining to the Medical folder |
| `can_use_bills_inbox()` | via `is_clinic_login()` | the three card checks it already had | clause deleted outright |
| `record_attachment()` | via `is_clinic_login()`, `photos_medical_only()` | card checks only; five dead clinic branches deleted | clause deleted outright |
| `holds_app_role()` (`private.has_app_access()`) | `opens_app`, then `r.key <> 'public_viewer'` | Admin, or a role holding at least one cell | **reshaped — see below** |
| `reassign_recurring_job()` | `opens_app` | the same test as `holds_app_role()` | clause replaced |
| `my_permissions()` | all five columns | reports no scopes and no `opens_app` | clause deleted outright |
| `volunteer_contacts`, `doctor_contacts` | via the above | **dropped** | existed only to serve a narrowed column |
| `roles.sees_login_emails` | — | **column dropped**, with its six places in `src/` | nothing consumed it |

### Two shapes that were available and were NOT taken

**A different card requirement in place of the role column** — for instance `sees_all_residents()` becoming
`has_permission('resident.record', 'read')`. An earlier draft of this work proposed exactly that mapping. It is wrong,
and not by a little: it turns a card into **a requirement list checked against the role**, which `CLAUDE.md` forbids in
those words (*"A card applies the access that lets its activity be performed. It is not a requirement list checked
against the role."*). It would also have **narrowed** any role holding the activity's own card but not the second one —
inventing a refusal nobody asked for, in a PR whose whole job is removal.

**Dropping the functions and the conjuncts.** Purer, and it would leave no constant predicates behind. It means
rewriting 108 policies and 13 view bodies in the same migration, which is a large mechanical change with real room for
error, and it is **tidy-up, not security**: a constant predicate reads no role column, which is all the rule asks.
Recorded as a follow-up rather than done here.

### The one function that could not simply stop deciding

`private.has_app_access()` gates every private view. Left `true`, every authenticated session — `public_viewer`
included — is inside the app; left `false`, nobody is. So it takes the **same shape the app half already shipped** for
`entersApp()` in `src/lib/permissions/can.ts`: **Admin, or a role that holds at least one cell**, which is to say at
least one card that gives something. `public_viewer` holds no cards, so it stays out **on its cards rather than on its
name**. This is the only place the removal changed a shape instead of deleting a clause, and it is the same rule, in the
same words, as the app.

**This was also the stale-definition trap the brief warned about, and it caught something real.** The brief listed
`private.has_app_access()` as reading `roles.opens_app` (`0132`). By the time this stream read the **live** definition
it no longer did: it called `holds_app_role()`, which tested `r.key <> 'public_viewer'`. A `create or replace` grep
would have missed it. Reading live definitions also found **three functions the brief's list of eleven did not name** —
`my_permissions()`, `photos_medical_only()` and `reassign_recurring_job()` — plus `holds_app_role()` itself. The list
grew by four, which is the ratchet's known blind spot working as `CLAUDE.md` says it must: by someone reading carefully.

`sees_all_translations()`, named in the brief, **does not exist** in the live database. Nothing was done for it.

## Admin, which is untouched

`has_permission()`'s `r.key = 'admin'` short-circuit (`0196:137`) is **not altered by this migration**. Admin holds no
cards and no cells on dev and on production, so two places have to keep letting Admin through explicitly or the
Director — who is on Admin on production today — would be locked out: `holds_app_role()` and the "can still sign in"
test in `reassign_recurring_job()`. Both use the same `r.key = 'admin'` test `has_permission()` already uses. **No card
was given to Admin anywhere.** See `CLAUDE.md`: Admin is outside the card system, is not debt, and is not a precedent.

### The acceptance target, proved with a real login

Lutan read production on 2026-10-25: **286 current residents, plus 13 Deceased, plus 1 Adopted — 300 records.** That is
a measurement with a date on it, not a standing property of the system.

**The mechanism, read on dev before anything was changed, because the brief required knowing it:** the `admin` role's
own `scope_residents` was `'all'`, and it holds **zero cards and zero cells**. So Admin's resident access came
*entirely* from the clause this migration deletes, and `sees_all_residents()` has no admin check of its own — the
resident policies call it *beside* `has_permission()`, so the admin short-circuit does not cover it. Deleting the clause
without the predicate becoming `true` would have narrowed Admin to nothing. **That is the trap, and it was live.**

Proved after the change with a real signed-in Admin login (`scripts/dev-signin.mjs admin --port 3001`), all three sets
separately, because deceased and adopted are reached by different paths:

| set | dev, through a real Admin login |
|---|---|
| current | `92 residents` |
| plus deceased | `101 residents · including 9 deceased` |
| plus adopted | `4 residents — Showing adopted residents only` |

An adopted record was opened in full, which is the `may_open_resident_record()` (`0249`) path, and
Settings → Who does what still loads and still says *"Admin: Everything, always."*

## What this cost, measured rather than guessed

Every role's reads were measured on dev by impersonating one real login per role through RLS, before the migration and
again after (`docs/test-plans/security-db-half.md` has the method). **The result is the thing worth remembering:**

**There were no losses. Every single measured change was a role reading MORE, not less** — 33 widenings across five
roles, 103 surfaces unchanged, and **Admin unchanged on every surface.** That follows from the shape above: a predicate
that only ever subtracted cannot, when removed, take anything away.

His ruling of 2026-10-24 — *"just apply what is required to each card, if someone loses some access I will fix that
later"* — anticipated losses. **It did not anticipate gains, and the gains are what need his eye.** They split in two,
and `docs/card-access-faults.md` holds both in full:

- **The card decides now, which is the rule working.** The volunteer, Head of Maintenance and doctor each hold
  `view_residents`, which grants `resident.record` at read; a role column was overriding their own card. If that is too
  much access, **the card is wrong**, and fixing the card is Card review 2.
- **Six views with no card gate at all** — `current_placement`, `translation_queue`, `immunization_compliance`,
  `immunization_duplicate_check`, `resident_current_state`, `app_users`. They were gated by `has_app_access()` **and a
  role column and nothing else**, so removing the role column leaves every login in the app reading them in full. **No
  card was created to close this**, per his instruction; each is held for Card review 2.

And one fault that **predates this migration**: `resident_who_and_where` has no `has_app_access()` gate at all, so
`public_viewer` reads every resident row. True before `0259` and still true after it; found while measuring.

## What was deliberately left

- **The four remaining scope columns and `opens_app` are still on `roles`.** Nothing reads them for access any more —
  nothing in the database after this file, nothing in `src/` since #920 — so they grant nothing. Dropping them reaches a
  dozen live-database check scripts that still insert and assert on them, which is bookkeeping with a wide blast radius.
  Its own small PR.
- **`readsWhoAndWhereOnly()` and its six callers.** `on_volunteer_floor()` is now constant `false`, so the function
  always answers `false` and the six resident pages it guards take the ordinary path. Dead weight, not a rule. Removing
  it changes resident pages, which is beyond this PR's boundary.
- **`role_extras`.** The brief offered its removal as a bounded tail. Not taken: it reaches eight scripts including
  `check-card-grants.mjs`'s harness, and it is already scheduled as its own stream.
- **No cards, no `card_grants` rows, no cells were created** — not for any role, and specifically not for the doctor.
