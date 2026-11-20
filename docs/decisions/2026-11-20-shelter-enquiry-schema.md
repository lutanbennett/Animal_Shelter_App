# 2026-11-20 — Shelter enquiry: the schema half (#shsup, migration 0427)

Lutan, 2026-11-20, asked directly, chose shape (a): **an enquiry**. The form records who asked and emails him; nothing is created until he creates the shelter on the console. No shelter row, role, login or invitation comes from an enquiry, ever. Shape (b) (approve/reject queue) is not built and shape (c) (self-service) is ruled out. The `status` column exists so he can mark an enquiry he has dealt with by hand; it drives nothing.

Step zero: `git grep shelter_enquiries origin/main`, a search of `supabase/migrations` and `docs/decisions` for enquir/signup/applic, and `git log -S` found nothing (0297 is an unrelated `signup_request_id` on desexing). 0426 and 0419 record no enquiry.

## 2. How a stranger writes, and how that passes `check-hard-coded-security.mjs`

**A stranger never writes to the database directly.** The table grants nothing to `anon` and nothing to `authenticated` for insert (the check refuses any grant to anon/public). The only writer is the **service role**, from one named call site in the app (the form's server action), which the app half records under `serviceRoleSites` in `docs/hard-coded-security-registry.json`, like the adopter sites. Its guard is its own validation, a honeypot and a throttle, not a person's identity.

The four policies (product-admin select, update, a restrictive aal2 on update, `definer_all`) do not resolve through `has_permission()` or `is_admin()`, so they are declared under `database.declared` in the registry, exactly as 0411 and 0425 did for the PADMIN list. They are recorded under `outsideTheCardSystem.productAdmin`. **This is not the adopter/website-account exception and does not cite or widen it**, and it is no precedent. Output after the declarations: `no coded security outside the Admin bypass`. Before them it printed `4 failed` with those four policies named; the check was not edited.

## 3. Reading

A product administrator only, through `is_product_admin()` (0411), the one place that is asked. No role name is read. Updating `status` needs aal2, as 0411's writes do. A restrictive policy does this, so it only ever narrows.

## 4. Specification for the form stream (`shelter-enquiry-form`)

Table `public.shelter_enquiries`, installation-level (no `shelter_id`; recorded in `docs/tenancy-shared-tables-registry.json`, export `none`).

1. `id uuid` — generated. Do not send.
2. `created_at timestamptz` — default now(). Do not send.
3. `shelter_name text` — **required**, 1–200 characters after trimming.
4. `contact_name text` — **required**, 1–200 after trimming.
5. `email text` — **required**, shape `x@y.z`, at most 320. Trim it in the app first.
6. `phone text` — optional, at most 60.
7. `location text` — optional, at most 200 (town or country).
8. `message text` — optional, at most 4000.
9. `status text` — default `'new'`; do not send. Values `new|contacted|created|declined`.
10. `status_note text`, `status_at timestamptz` — console-only; do not send.

How to call: with the **service-role client**, `insert ... on conflict do nothing` into the table (`.upsert(row, { onConflict: ..., ignoreDuplicates: true })` cannot target a partial index, so use a plain insert and treat Postgres error `23505` as success). **Read back nothing**: no `.select()`, no returning, no id passed to the visitor.

Errors and what the visitor sees: **every outcome answers the same "thank you, we will be in touch"** — success, a duplicate (`23505` on `shelter_enquiries_one_open_per_email`: one open enquiry per address, case-insensitive), and a database failure (log it server-side). Only a **validation failure of the visitor's own fields** may say what to fix, and it must not say anything about existing shelters or accounts. A `23514` (check violation) means the app's validation drifted from the table; treat it as a bug and log it. The form never checks whether an email or shelter exists.

Public-form protections the app half owns: a honeypot field, a per-IP throttle, a length cap before the insert, and no reflection of input in the response.

## 5. The email

Nothing in `src/`, `worker/` or `scripts/` sends general mail today. `src/app/login/forgot/actions.ts` only asks Supabase Auth to send a recovery link, and `scripts/send-reset-email.mjs` is a one-off script. So there is **no mail mechanism to reuse**, and choosing one is the form stream's decision to record. It must: send after a successful insert, never block or fail the visitor's answer on mail failure, send to Lutan only (the release mail rule: other admins unverified on purpose), put the enquirer's text in the body as data (never as a header or a link target), and not add a paid service (zero ongoing cost). **No mail is sent by this migration.** If no free mechanism exists, the enquiry is still recorded and the console is where he will see it; say so in that PR.

## Columns, why

Only what the item names: who asked (`shelter_name`, `contact_name`), how to reach them (`email`, `phone`), where (`location`, because it tells him whether it is a shelter he can serve), what they said (`message`), when (`created_at`), and what state (`status`, `status_note`, `status_at`). No column serves (b) or (c): no approval, no proposed key or host, no link to a created shelter.

## Proof on dev (rolled back)

`begin … do $$ … rollback` on dev, ending `PROOF PASSED (rolled back)`: service role inserts; a case-differing duplicate open address is refused by the index and absorbed by `on conflict do nothing` (one row, not two); two enquiries have distinct ids; a bad address is refused; anon can neither insert nor read; a signed-in non-administrator reads 0 rows and cannot insert; a product administrator reads both rows; an aal1 update changes 0 rows, an aal2 update changes 1, and the other row stays `new`.
