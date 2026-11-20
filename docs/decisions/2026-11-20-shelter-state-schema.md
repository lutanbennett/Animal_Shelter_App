# 2026-11-20 — Shelter state: account holder, *the* website, archive (`#pacon`, schema half)

Migration `0428_shelter_state.sql`, applied to dev 2026-11-20. Harness `supabase/harness/shelter_state.sql` (rolled back; passes with `HARNESS OK pacon schema`).
Requirements are Lutan's, in `2026-11-20-product-admin-console-requirements.md` (A, B, E). **`#pacon` is deliberately NOT ticked:** this is its schema half; the redesign (`console-cards-redesign`) is the app half. **This file is written to be quoted.**

**Step zero:** `contact_name`/`contact_phone` were on `shelter_enquiries` (0427) and `site_content` only, never on `shelters`; `shelters` had no `archived_at`; `shelter_hosts` had no notion of a primary. The gap was there, so the work went ahead.

## 1. Columns

| table.column | type | null rule | set by, and when |
|---|---|---|---|
| `shelters.account_holder_name` | text, 1–200 chars when set | nullable (existing shelters have none) | `product_admin_set_shelter_account_holder` (required there); `product_admin_carry_enquiry` fills it only if null |
| `shelters.account_holder_email` | text, email-shaped, ≤320 | nullable | same two |
| `shelters.account_holder_phone` | text, ≤60 | nullable | same two |
| `shelters.account_holder_location` | text, ≤200 | nullable | same two |
| `shelters.enquiry_id` | uuid → `shelter_enquiries(id)`, `on delete restrict`, **unique where not null** | nullable (Lanna and any shelter made without an enquiry) | `product_admin_carry_enquiry` only |
| `shelters.archived_at` | timestamptz | null = open | `product_admin_set_shelter_archived(id, true)` stamps now (a second press keeps the first time); `(id, false)` clears |
| `shelter_hosts.is_primary` | boolean not null default false; **one true per shelter** (partial unique index); check: never true when `shelter_id` is null | not null | a trigger marks a shelter's **first** address; `product_admin_set_primary_host` moves it |

**The account holder is the person responsible for the relationship** (Lutan: the Admin, or a director who delegates it). It is **stored, never derived from the Admin login**, and they may never sign in. The card shows name, email, phone; location is there because the enquiry already collects it.

## 2. What the screen reads

`product_admin_shelters()` keeps every column of 0424 and **adds eight, in this order**: `primary_host text`, `account_holder_name`, `account_holder_email`, `account_holder_phone`, `account_holder_location`, `enquiry_id uuid`, `archived_at timestamptz`, `public_site text` (`public_site` was held since 0426 and never shown). **Archived shelters are listed**, so they can be reopened. Readable at aal1 by a product administrator, empty for anyone else.

## 3. *The* website

**Shape chosen: a flag on `shelter_hosts`, not a pointer on `shelters`.** Removing an address removes its claim with it, so nothing can dangle; a pointer would need a second write on every remove. The unique index makes two websites impossible. **Readers of `shelter_hosts` checked, none affected:** `resolve_shelter_host`, `shelter_host_kind`, `resolve_shelter_site` (select by `host`), `product_admin_shelters`, 0414/0421's map/unmap-host functions (insert/delete a row; the trigger handles the insert), `scripts/check-deployed-hosts.mjs`, `scripts/lib/deployed-hosts.mjs`, `src/app/login/actions.ts` (a comment only).
- A shelter's **first** address becomes its website automatically. **Backfill marked only shelters with exactly one address** (not a guess); one with several shows **no primary** until chosen. **The screen shows `primary_host`, and when it is null and `hosts` is not empty, shows the first of `hosts` and offers "make this the website".**
- **Removing the primary address leaves the shelter with no primary** (not auto-promoted). Same fallback applies.
- Front-door addresses (`shelter_id` null, e.g. `cooperjaidee.org`) are never primary and never belong on a shelter card: they are the console's own.

## 4. Archive: the exact rule

**Off means unreachable, not gone.** Setting `archived_at` changes **only that column**: no row of the shelter's records, photos, backups, Drive folder or credentials, hosts, roles or logins is touched, and `public_site` is not changed. Clearing it restores everything exactly.

**May do while archived:** nothing, in the app and on the public website, by any login (including that shelter's Admin). **Product administrators still see and can unarchive it** on the console (the platform host has no shelter, so the console never depended on one).

**How both doors close, in one place.** `resolve_shelter_site(host)` (0426) is the only function that turns a request's host into a shelter. For an archived shelter it now returns `{"id": null, "site": null, "archived": true}`. The Worker forwards **no** `x-shelter-id`; "no header means no rows" (0383/0392) and every restrictive `shelter_scope_*` policy refuses rows to staff **and** public. No policy-by-policy change, no Worker change. `archived` is the extra key so the app can say **"this shelter is closed"**, not "this site is not set up" (**app half: read it**; the Worker currently ignores it, which is safe).
- **Effective within 60 seconds** (the Worker remembers a lookup that long).
- Unarchive is the same: within a minute.

**Question (a): archived-means-unreachable at the database or in the app?** At the database, in the one resolver, which the app's rows already depend on. **What the app still owes:** (1) show a closed notice instead of an empty site when `archived` is true; (2) the sign-in page, so a staff member sees why; (3) **three things this does not stop, found by reading, not fixed:** (i) trusted callers (service role, cron, the Worker's own jobs such as backups, label drafts, translations) are unfiltered by design, so **scheduled jobs that loop over every shelter will keep working on an archived one unless told to skip `archived_at is not null`: the app half must decide per job, I did not measure each**; (ii) a request that carries an `x-shelter-id` straight to Supabase with a valid login is filtered only by that header: the header is Worker-set, so this predates and is not widened by 0428; (iii) a database-level second lock (making `current_shelter_id()` null for archived shelters) needs a `security definer` function reading `shelters`, which `check-hard-coded-security` refuses unless declared; it would be a defence in depth, left for the planner to weigh.

**Question (b): should `public_site` follow `archived_at`?** It **follows by derivation, not by storage**: an archived shelter reads as having no shelter at all, so its site is closed regardless of `public_site`, and the stored value is untouched so it returns on unarchive. They stay independent otherwise: a shelter can be publicly `off`/`locked` with staff open.

`#tstsh`: the `test123` shelter on production can now simply be archived; no delete exists or is added.

## 5. Writes (each: product administrator **and aal2**, one named shelter)

- `product_admin_set_shelter_account_holder(p_shelter, p_name, p_email, p_phone, p_location)`: name required; email optional but must be email-shaped; empty strings become null. Errors in words: `the account holder needs a name…`, `that does not look like an email address`.
- `product_admin_set_shelter_archived(p_shelter, p_archived boolean)`.
- `product_admin_set_primary_host(p_shelter, p_host)`: error `that address does not belong to this shelter`.
- `product_admin_carry_enquiry(p_shelter, p_enquiry)`: see section 6.

## 6. The enquiry → shelter carry

**Link shape: `shelters.enquiry_id`** (unique where not null: one enquiry, one shelter). On the shelter, not on the enquiry, because the shelter is the thing created *from* the enquiry and `shelter_enquiries` has no shelter to point at when written.
`product_admin_carry_enquiry` copies `contact_name → account_holder_name`, `email`, `phone`, `location`, **only into columns still null (a typed value is never overwritten)**, sets `enquiry_id`, and marks the enquiry `status = 'created'`, `status_at = now()`. Repeating the same pair is a no-op. Refused, in words: another enquiry already on this shelter; a `declined` enquiry; an enquiry already another shelter. **Nothing in 0428 creates a shelter**: the console calls this right after `product_admin_create_shelter`, next batch.

## 7. The two card states (Lutan, 2026-11-20: yes, two different states)

**Derivable from existing data; no column added.** Evaluate in this order, first match wins:
1. **Archived**: `archived_at is not null`. Show only "Closed" and **Reopen**.
2. **Something is broken**: `drive_status = 'dead'` or `calendar_status = 'dead'` (a connection that worked and stopped: `token_status = 'dead'`). Red.
3. **Still being set up**: any of `has_host`, `has_admin_role`, `has_admin_login`, `has_receipts`, `has_defaults` is false. Grey/neutral; lead with "→ Next step: …", the first false in that order (0417's list).
4. **Ready**: none of the above.
`incomplete` Drive/Calendar is *being set up*, not broken. **Lanna caveat (0417's finding, unchanged):** a shelter with no credentials row reads `not_started`, indistinguishable from one on the shared environment-variable setup; do not call that broken. **Not derivable, and not added:** live reachability of Drive right now, and the system-wide checks (database, release, Pi, backup, cron), which belong to the whole system and must be labelled as the system's, not a shelter's.

## 8. What was and was not verified

Applied to dev; harness passes (primary flag, two-primary refusal, door open/archived/reopened, unknown host, `public_site` and hosts untouched by archive, aal1 refusal, carry never overwriting a typed name). Hard-coded-security, card-count, card-grants and platform-files checks pass; the five new definer functions are declared in `docs/hard-coded-security-registry.json` under the product-administrator precedent (same wording as 0424), not as debt. Not exercised: the Worker end to end against an archived host (the resolver was run directly).
