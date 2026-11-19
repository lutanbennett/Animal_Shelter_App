# #lkaud: the product-admin email lookup is recorded, not rate limited (2026-11-19)

**Decision: an audit row.** `product_admin_login_exists(email)` (0418) now writes one row to `public.product_admin_lookups` (0422): who asked (`auth.uid()`), which address (lower-cased), the yes/no answer, and when.

**Why a record and not a limit.** The console calls the lookup on blur as somebody types, so a limit loose enough for that stops nothing. The residual risk is "nothing says it was used", which a record answers and a limit does not.

**Why not `audit_log` / `record_audit()`.** `record_audit()` is a trigger function (no caller can invoke it) and `audit_log.shelter_id` is NOT NULL since 0397, stamped from the `x-shelter-id` header. A platform request names no shelter (0419 found this), so a row there would fail the lookup or need an invented shelter. A small platform table with the same append-only guarantees (select for PADMIN only, update/delete/truncate refused) fits instead. The brief's pointer to `record_audit` was a lead, not the answer.

**Typing speed.** One row per distinct question: a repeat of the same address with the same answer by the same person within 10 minutes writes nothing. The function became VOLATILE (it writes). The gate is unchanged (`is_product_admin()` + aal2), runs first, and a refused caller records nothing. No card, no role key, Admin given nothing.

**Proof.** `supabase/harness/product_admin_lookup_audit.sql` runs as `authenticated` with JWT claims (not the service role): hit and miss recorded, repeat not, direct insert and update refused, aal1 and non-PADMIN record nothing. **Not done: a press as a signed-in product administrator in the browser.** `node scripts/dev-signin.mjs admin --port 3003 --aal2` crashed with `PGRST116 ... contains 2 rows` (a script fault in another stream's area; not changed here), and the console needs a product_admins row anyway.

**Action controls on this screen** (`src/app/platform/`): the lookup action already refuses non-PADMIN and non-aal2 itself (`isProductAdmin()`, `hasTwoStep()`); I did not audit the other console controls: found, not checked.

**Nothing reads the table yet.** A screen to view the record is a possible follow-up for the planner to file.
