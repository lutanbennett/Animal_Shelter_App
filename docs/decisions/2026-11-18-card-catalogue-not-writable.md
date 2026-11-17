# The shared card catalogue is not writable by any login (#ctlg8, migration 0407)

**What.** `card_grants` and `card_includes` (the catalogue itself, shared by every shelter) had one policy each, `for all ... is_admin()`
(0257). `is_admin()` has no shelter condition, so a second shelter's Admin could rewrite what a card grants for every shelter. 0407 drops
both `for all` policies and replaces each with `for select using (is_admin())` (reads exactly as before) and revokes insert/update/delete
from `anon` and `authenticated`. There is no permissive write policy left. Migrations and the service role bypass row security and keep
working. `scripts/check-card-catalogue-writes.mjs` fails if a permissive write policy, a write privilege or an off row-security setting returns.

**How the app reads it.** `src/lib/permissions/card-grants.ts` reads both tables with the service-role client, which bypasses row
security; `recompute_after_*` are security-definer triggers. So no signed-in read depended on the policy. The `for select` policy is kept
anyway so "reads unchanged" is literally true for any login that read before.

**The restrictive `*_requires_aal2` policies from 0257 are left.** With no permissive write policy they decide nothing, but they are a
second lock if someone adds a permissive one by mistake, and dropping them gains nothing.

**The tension with CLAUDE.md, settled here rather than inferred.** The rule says anything that grants or denies an ability must be a card.
Taking write access from ALL logins names no role, keys nothing by role and does not decide what any card does, so it is not the forbidden
shape. It also does not touch the Admin bypass (`can.ts`, `roles.is_admin`), which is settled. **Forward rule: if a screen is ever built
to edit card definitions, that screen's write must ask a card** (a new card for that activity), and the item that builds it inherits this.

**`definer_all` is not a login.** The tenancy sweep (0375/0382) gives every table a `definer_all` policy `to rls_definer`, a nologin role
that owns security-definer functions. The check ignores policies for that role alone.

## Found, not fixed
None.
