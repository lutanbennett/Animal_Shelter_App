# The service-role client is fenced by an allow-list lint rule (2026-10-12)

`src/lib/supabase/admin.ts` bypasses RLS. Its comment said "only import from `use server` files gated by
`assertAdminRole()`", and nothing enforced it. `eslint.config.mjs` now has a `no-restricted-imports` rule on
`@/lib/supabase/admin` with the importers listed in `ignores`, and the comment in `admin.ts` points at that list.

**The importers are 12, not 13** (the review's count was off by one). They are not all `use server` files, so the
comment was wrong as well as unenforced:

- `"use server"` actions: `account/password/actions.ts`, `admin/security/actions.ts`, `admin/security/verify/actions.ts`
  (each calls `auth.getUser()` and its own checks).
- Pages: `admin/recent-changes/page.tsx` (`requirePermission("audit.view")`), `admin/security/page.tsx`
  (`requireAdminUser()`), `admin/who-does-what/page.tsx` (signed-in check plus `opensWhoDoesWhat`).
- `admin/security/role-options.ts`: a **type-only** import, no client is created.
- `lib/facility-map/plan-store.ts`: `server-only`; its callers are the facility-map admin page and
  `api/facility-maps/[...path]/route.ts` (signed-in plus `loadPermissions()`).
- `lib/status/{access-requests,alerts,health,usage}.ts`: plain server modules with no guard of their own. Their
  callers guard them: `/admin/status`, the Security actions, My tasks, and `api/status/alerts` (bearer key).

No file was found importing it unguarded, so there is no finding beyond the stale comment. The status modules are
the ones to watch: they are guarded by their callers, not by themselves.

**Not in scope:** other imports, `src/proxy.ts`. A new importer now fails `lint` until it is added to the list,
which is the point: that is a decision, made in review.

**Release-time hazard: none.** Comments, a lint rule and documentation; no runtime change.
