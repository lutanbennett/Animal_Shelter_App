# 2026-10-09 — Multi-tenancy spike: pool the database, but move the views and functions to an owner that cannot see past the tenant line

2026-10-09, `multi-tenancy-spike`. Backlog: *Spike: can the app hold several shelters in one
database? Measure it, do not estimate it.* Nothing in this branch's schema is merged; this file,
the backlog tick and the test plan are the deliverable.

## In plain English

- **Yes, several shelters can share one database.** The "one rule per table" idea in the backlog
  item works for the tables themselves. It was measured on dev, not guessed.
- **But that rule alone would have put other shelters' dogs on Lanna's public website.** 9 of the
  13 public pages' data sources showed the second shelter's dogs, photos, projects, friends or
  totals. Staff pages had the same problem in 17 places, and a Lanna admin could change another
  shelter's dog's microchip.
- **There is a fix that closes almost all of it at once**, instead of rewriting about 100 views and
  functions by hand. It was tested: with it, the public website showed **nothing** from the other
  shelter, and Lanna's own pages did not change at all.
- **The build is about 50 hours of Claude work** (range 40–65), spread over 2 to 3 weeks of
  streams. The item was right to wait until Lanna is live.
- **What you give up:** one database means one bad migration can take all seven shelters down at
  once. A separate database per shelter could not, but it would cost money every month, forever.
- **Your decision, separately:** the name. All 10 Cooper `.org` names on the shortlist are still
  free (checked today). See the end of this file.

## What was measured, and how

No migration file was written and nothing was kept. `scripts/spike-multi-tenancy.mjs` (in this
branch's history at `3761a29d`, removed before the PR) runs one transaction against dev and ends
in a deliberate `raise exception` carrying the evidence, so it cannot commit. It:

1. creates `shelters` with Lanna and a second "canary" shelter, adds `shelter_id` to every tenant
   table, and adds **one restrictive policy per table**, the `0100` pattern;
2. records an md5 of the full output of every view a Lanna admin can read, and of every object
   anon can read;
3. plants shelter B: clones of rows the site already shows (a public dog with its placement,
   photos, vaccination and prescription; a recent adoption; a public project and its photos; a
   published friend; an enclosure; an impact baseline);
4. takes the md5s again. **A view whose output changed is reading across the tenant line**,
   whether the leak is a row, a photo id or one number in a total. Searching for a canary's name
   would miss the totals (`public_shelter_stats`, `public_impact_figures`); this does not;
5. as the Lanna admin, counts B's rows in every base table and calls the security-definer RPCs
   that write to a resident on B's dog, then on a Lanna dog as the control.

`--reown` adds the fix (below) between steps 2 and 3 and takes a third snapshot, so any difference
from step 2 is a **regression for Lanna** and not a leak.

### The counts the item quoted, against dev today

| | item (2026-09-28) | dev, 2026-10-09 |
|---|---|---|
| tables | ~45 | 69, of which 63 are per-shelter and 6 stay global |
| policies | 181 | 282 (11 already restrictive) |
| `security definer` functions | 53 | 58 (57 public, 1 private) |
| views | 58 | 51 (45 public, 6 private): **39 run as their owner, 12 as the reader** |
| `public_*` views (anon) | — | 13 |

### Result, as the item describes it (one restrictive policy per table)

```
schema: 63 tables got shelter_id + 1 restrictive policy each in 232 ms
BASE TABLES as Lanna admin: 62 checked, B rows visible in: []
VIEWS as Lanna admin: 45 snapshotted, changed when B got rows: [current_placement(OWNER) immunization_compliance(OWNER) medical_photo_residents(OWNER) medication_list_residents(OWNER) picker_contacts(OWNER) public_enclosures(OWNER) public_impact_figures(OWNER) public_project_photos(OWNER) public_projects(OWNER) public_recent_adoptions(OWNER) public_resident_cards(OWNER) public_resident_profiles(OWNER) public_shelter_friends(OWNER) public_shelter_stats(OWNER) resident_current_state(OWNER) stock_vendors(OWNER) translation_queue(OWNER)]
ANON on Lanna's site: 14 objects snapshotted, changed when B got rows: [public_enclosures(OWNER) public_impact_figures(OWNER) public_project_photos(OWNER) public_projects(OWNER) public_recent_adoptions(OWNER) public_resident_cards(OWNER) public_resident_profiles(OWNER) public_shelter_friends(OWNER) public_shelter_stats(OWNER)]
RPC as Lanna admin: resident_is_deceased=false; set_resident_microchip= -> chip now 999000000000777; set_resident_drive_folder= -> folder now CANARY_FOLDER; set_resident_drive_folder on a Lanna dog= -> folder now LANNA_FOLDER
```

**The item's load-bearing claim holds for tables:** one restrictive policy per table, not a rewrite
of 282, and a Lanna admin saw none of B's rows in any of 62 tables. It was generated by a loop and
took a quarter of a second.

**It does nothing for anything that runs as its owner.** Every view in this schema that is not
`security_invoker` is owned by `postgres`, and on Supabase `postgres` has `BYPASSRLS`. The tenant
policy is never consulted inside it. Every leak above is an owner-run view; none of the 12
invoker views leaked. And the RPCs are worse than a read leak: **the Lanna admin could not read B's
dog through the table, and still wrote its microchip and its Drive folder** through
`set_resident_microchip` and `set_resident_drive_folder`.

So the item's estimate of where the cost lies was right. What it under-counted is that the anon
tier sits **entirely** on the expensive side: all 13 `public_*` views are owner-run.

### Result with the fix (`--reown`)

```
re-owned: 38 owner-run views + 58 security-definer functions in 77 ms (auth.users grant: granted)
snapshot ms: before 151, after re-own 353, after B planted 351
REGRESSION for Lanna from re-own (s0 vs s1): []
BASE TABLES as Lanna admin: 62 checked, B rows visible in: []
VIEWS as Lanna admin: 45 snapshotted, changed when B got rows: [translation_queue(OWNER)]
ANON on Lanna's site: 14 objects snapshotted, changed when B got rows: []
RPC as Lanna admin: resident_is_deceased=false; set_resident_microchip=ERR P0002 Resident not found. -> chip now null; set_resident_drive_folder= -> folder now null; set_resident_drive_folder on a Lanna dog= -> folder now LANNA_FOLDER
```

## The decision: re-own, do not hand-edit

**Pooling stands**, for the reason the item gave: a silo cannot meet "ongoing cost as close to zero
as possible". This spike decides **how** to pool.

Make the owner of every owner-run view and every `security definer` function a dedicated role
(`spike_definer` in the harness) that does **not** have `BYPASSRLS`, and give that role one
permissive `using (true)` policy per table. Inside a view or definer function the existing
permissive policies were never meant to apply, and with this they still do not. The one
restrictive tenant policy, however, now applies *everywhere*, because restrictive policies are
AND-ed for every role. The tenancy check stops being something each of ~100 objects must remember
and becomes something none of them can forget.

Measured: 9 public leaks → 0; 17 staff-view leaks → 1 (a trigger, below); cross-tenant RPC writes
refused while the same RPC on a Lanna dog still works; and **no change at all** to what Lanna's
admin or Lanna's anonymous visitor sees through any of 59 objects.

The tenant of a request comes from `current_shelter_id()`, which stays owned by `postgres` because
`user_roles`' own policy calls it:

- a signed-in user's shelter is their `user_roles` row, shaped like `current_user_vet_id()` (`0102`);
- **anon's comes from the site being visited**: the Worker maps the request's host to a shelter and
  the Supabase client sends it as a header, which PostgREST exposes in `request.headers`. The anon
  key is public, so anyone can forge the header, but forging it only shows another shelter's
  *public* pages, which that shelter publishes anyway. No header means no shelter, which means no rows.
- callers that are not an API user (service role, migrations, scripts, the worker) are trusted with
  every shelter, as they are today (`is_trusted_caller()`).

### What it costs that hand-editing would not

- **Views get slower.** The full sweep of 59 objects went from 151 ms to 353 ms (×2.3), because
  policies are now evaluated inside the views. Invisible at Lanna's size; watch it at seven.
- **Every future migration must create views and definer functions as that role.** Postgres cannot
  default an object's owner, so a migration that forgets is back to `BYPASSRLS` silently. That is
  the reason for the catalogue lint below; it is not optional.

## How we would know every public view is tenant-scoped

The brief said an hours figure without this answer would be the wrong figure. Two checks, because
each catches what the other cannot:

1. **A catalogue lint** (`check-public-views.mjs` already enumerates the API from the catalogue, so
   a new object is checked without anyone listing it): every relation anon or authenticated can
   `select` is either `security_invoker` or owned by the tenant role; every `security definer`
   function they can execute is owned by the tenant role, with an allow-list of exactly
   `current_shelter_id()` and `is_trusted_caller()`; every `public` table has `shelter_id` and the
   restrictive policy, or is on the global list. This is the check that catches the forgotten
   owner above.
2. **The canary diff, made permanent**: plant shelter B and fail if any anon-readable object's
   md5 changes. It is the only kind of check that catches a leak through **data**, not schema: it
   found the `translation_queue` trigger leak below, which every structural rule passes. Proven
   both ways on dev: red with 9 leaks against the item's design, green with 0 against the fix. For
   the build it must plant into **every** tenant table generically (one cloned row per table,
   foreign keys re-pointed), not the ten the spike chose by hand.

`0101`/`0103` and #182/`0105` were both "the obvious place was fixed and a less obvious one still
leaked". The lint closes the class for objects; the diff closes it for rows.

## What fought back

1. **Every owner-run view and definer function** (above). The item's design leaves all 13 public
   views open. Re-owning fixes it.
2. **`auth.users` has RLS on with no policies, and `postgres` cannot add one** (Supabase owns
   `auth`). So `private.app_users`, which joins it, returned **0 rows** once re-owned. It stays
   owned by `postgres` and takes the tenant filter by hand in its join to `user_roles`. With that,
   no regression. The one hand-written exception, so the lint allow-lists it by name.
3. **Triggers that write a second table stamp it with the wrong shelter.** Creating B's dog fired
   `queue_translations`, which inserted a `translations` row with Lanna's default `shelter_id`. B's
   dog's name then appeared in Lanna's translation queue. Six functions insert derived rows:
   `queue_translations`, `record_audit`, `record_label_sources`, and the three `reset_*_rounds`.
   Each must copy `NEW.shelter_id`. The column default cannot do it, because the default is the
   *caller's* shelter, and a trusted caller has none.
4. **Singletons that are singletons for the whole database.** `site_content`'s primary key is a
   **boolean**: there can be one website for the whole database, so the spike could not even plant
   B's. Same shape: `facility_maps_one_overview` (`unique ((true))`), `map_rooms_one_per_kind`,
   `diet_types_one_standard` (which `set_standard_diet` relies on).
5. **19 unique keys that are really per-shelter** and would stop shelter B from naming a zone
   "Dogs" because Lanna has one: names on `zones`, `medication`, `diet_types`, `frequency`,
   `immunization_types`, `procedure_types`, `blood_test_types`, `community_places`,
   `fixed_outgoings`; `residents.resident_code`, `maintenance.job_code`, `site_pages.slug`,
   `impact_baselines.key`, `rounds.key`/`sort_order`, `roles.key`/`roles_one_per_legacy_role`, root
   `project_folders` names,
   `donation_receipts.number`. Each becomes `(shelter_id, …)`. **`residents.microchip_number` is
   the exception worth deciding**: kept global, an insert that collides tells shelter A that
   shelter B has that chip. That is a leak, and it is also how a dog moving between shelters would
   be noticed.
6. **The receipt issuer: contained in code, not in the database.** `receiptIssuer()` really is the
   one accessor, with one caller (`src/app/management/donations/actions.ts:74`); the PDF never reads
   `RECEIPT_ISSUERS`. But `issue_donation_receipt` hard-codes the series `'LCA'` in
   `receipt_counters` and the number prefix, so every shelter's receipts would be numbered as
   Lanna's. Under the item's design it would also issue a receipt for **another shelter's**
   donation, because its existence check runs as `postgres`. That is a financial document naming
   the wrong legal entity, the exact outcome the item warned of. Re-owning fixes the second; the
   first is per-shelter data (Admin-only, audited, as the item said).
   **Found in passing, true today, not a tenancy problem:** the RPC takes `p_issuer` as a parameter
   from the caller. Anyone with `donation.receipt` can call it through the API with any name and
   address, which gets round the deliberate hard-coding. At tenancy the RPC should read the issuer
   itself. Reported, not fixed (not this stream's to fix).
7. **33 service-role call sites in 10 files bypass all of it**, plus direct use of the service key in
   `src/app/api/status/alerts/route.ts`, `src/lib/status/run.ts` and three worker files. `createAdminClient()` is trusted
   with every shelter by design. `/admin/recent-changes` reads `audit_log` with it and
   `/admin/security` lists users with it, so a Lanna admin would see every shelter's audit log and
   users. Each needs an explicit shelter filter. The canary diff cannot see these, because they are
   not database roles; they need their own check in the build.
8. **One login, one shelter, for now.** `user_roles` has one row per user (`on conflict (user_id)`),
   and `current_user_role()` returns one value. Membership in several shelters means a shelter
   picker and a claim in the JWT. Not needed for v1: a vet who serves two shelters gets two logins,
   and each shelter enters its own clinics. If the Chiang Mai five want shared clinics, that is a
   deliberate cross-tenant table, designed then.
9. **Hard-coded Lanna in 26 source files** outside the manual (layout, public nav, PDFs, archive
   HTML, release mail, status mail, `GOOGLE_DRIVE_ROOT_FOLDER_ID` read in 12 places). Some go with
   the product rename, some become per-shelter settings.
10. **Small, and fine for now:** `shelter_time_zone()` is the constant `'Asia/Bangkok'`. All seven
    shelters are in Thailand.

## The number

The spike itself: about **15 minutes of wall-clock measurement** (first catalogue query 19:46, final
evidence runs 20:01, on 2026-10-09; commits `1d4725f4` and `3761a29d`), plus the write-up. It was
quick because the harness pattern already existed (`check-user-roles-aal2.mjs`); the build is not
that kind of work.

The build, from the counts above, in Claude session-hours:

| Work | Hours |
|---|---|
| Schema: `shelters`, 63 × `shelter_id` + backfill + index, 63 restrictive policies, helpers, re-runnable migration and its harness | 4 |
| Re-own: role, grants, 63 `definer_all` policies, 38 views + 58 functions, `app_users` by hand | 4 |
| Catalogue lint (owner, invoker, `shelter_id`, policy, allow-list) | 3 |
| Permanent canary diff over every tenant table, plus cross-tenant calls for every RPC that takes an id | 8 |
| 6 triggers, 19 unique keys + the microchip decision, 4 singletons, receipt series + issuer per shelter | 8 |
| 33 service-role call sites + the worker + a check for them | 5 |
| Anon tenant from host: Worker routing, header on the 3 Supabase client constructors, photo proxy | 5 |
| De-Lanna the 26 files into per-shelter settings (not the rename) | 6 |
| Production rehearsal on a copy, apply, verify | 4 |
| Per-shelter export (a shelter leaving takes its data) | 3 |
| **Total** | **50** (range 40–65) |

Not included because they are their own items: *Per-shelter Drive*, *Send all auth mail from one
sender domain*, the product rename and domain, and onboarding itself.

Hand-editing instead of re-owning would add roughly 25–30 hours (38 views and 58 functions, each
with its own tenant clause and test). It would also leave every future view and function one
forgotten `where` away from the public internet, which is the class of miss this codebase has
already shipped twice.

## What is given up

**One blast radius.** A bad migration, a runaway query or a restore takes all seven shelters at
once, where a silo could roll shelter by shelter. The weekly backup becomes all-or-nothing. A
restore that rewinds one shelter's mistake rewinds everyone, so per-shelter export (in the table)
is the mitigation, not a nicety. The recommendation is still pooling, because the alternative's
cost is money every month, forever, for a gift.

## Effect on other items

- **Send all auth mail from one sender domain:** Supabase Auth has one SMTP sender per project, so
  a pooled database **forces** one sender. As that item suspected, this is a consequence, not a
  choice; the wording work is the whole item.
- **Per-shelter Drive:** `GOOGLE_DRIVE_ROOT_FOLDER_ID` is read in 12 places, and
  `is_known_drive_file` (the photo proxy's gate) is one of the re-owned functions, so it becomes
  tenant-scoped for free once anon carries a shelter.
- **Regional adoption listing:** under this design a combined Chiang Mai listing is one deliberate
  exception: a view owned by `postgres` that names the shelters that opted in. Cheap, as that item
  says, and it is the one place the catalogue lint must allow-list by name.

## For Lutan: the name

All ten shortlisted names are **still unregistered** on 2026-10-09 (checked against the `.org`
registry's RDAP; the five known-taken names still answer as taken, so the check is live):

`cooperscare.org` · `coopercare.org` · `coopershaven.org` · `cooperskeeper.org` ·
`coopersheart.org` · `coopersden.org` · `cooperspaws.org` · `friendsofcooper.org` ·
`cooperslegacy.org` · `cooperscircle.org`

A registry premium price shows only at checkout, so check the price in Cloudflare Registrar when
you choose. The choice is yours. It goes into the Worker routes, the Supabase and Google OAuth
redirect URLs, release mail's sender and the manual, so it comes before the build.
