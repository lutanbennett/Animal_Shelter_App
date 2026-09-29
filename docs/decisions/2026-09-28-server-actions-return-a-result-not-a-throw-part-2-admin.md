# 2026-09-28 — Server Actions return a result, not a throw (part 2: `/admin`)

Part 2 of #441 (docs/backlog.md, "Server Actions across the app: return a
result instead of throwing"). This PR covers **`src/app/admin/**` only** —
the backlog item spans every `"use server"` file under `src/app`, and per
the item itself ("Probably one PR per area so they can run alongside other
streams") each area gets its own stream. Residents, contacts, management,
projects and maintenance are left for later streams; the backlog line stays
unticked with a note recording that `/admin` is done.

- **Same shape as 2026-09-26, applied mechanically.** Every exported
  `"use server"` function under `/admin` now returns `ActionResult` from
  `src/lib/action-result.ts` (`{ ok: true, …extra } | { ok: false, error }`)
  wrapped in `runAction()`, with a local `refuse(error): ActionRefusal`
  helper per file — the same idiom `security/actions.ts` and the
  already-converted `zones/actions.ts` used. No refusal message, check
  order or outcome changed; only how a refusal reaches the browser did.
  Converted: `enclosures`, `frequencies`, `immunization-types`,
  `procedure-types`, `blood-test-types`, `website`, and `status`'s
  `checkNow` (the other two `status` actions, and all of `security`, were
  already done before this PR started). Every client caller's
  `try/catch` or `"error"/"success" in state` switched to reading `.ok`.
- **`assertAdminRole()` (throws) → `hasAdminRole()` (returns boolean) used
  inside `runAction`, returning a refusal instead of throwing.** This was
  called out as the highest-value single fix in the area, since it ran at
  the top of every `/admin` action. `requireAdminUser()` (the
  `page.tsx`/server-component redirect check) is untouched — it was already
  correct and is a different function from `assertAdminRole()`.
- **The merge actions (`mergeFrequency`, `mergeProcedureType`,
  `mergeBloodTestType`) return `ActionResult<{ count: number }>`** instead
  of a bare number of rows moved; callers read `result.count`.
- **`checkNow` (`status/actions.ts`) is a raw `<form action={checkNow}>` on
  a server component, with no `useActionState` reading its result.**
  Converting its body to `hasAdminRole()`/`runAction()` still matters for
  the same #441 reason as everywhere else, but a Server Action bound
  straight to a form's `action` prop must resolve `void | Promise<void>` —
  React's form-action typing does not allow a returned value there, unlike
  a `useActionState`-bound action. `checkNow` itself keeps returning
  `ActionResult` (consistent with every other action, and available to a
  future caller that does read it); `status/page.tsx`'s `<form>` calls it
  through a small inline `"use server"` wrapper that awaits and discards
  the result, rather than weakening `checkNow`'s own return type.
- **`website/actions.ts`'s internal `uploadToWebsiteFolder` helper still
  throws, on purpose.** It is not itself a Server Action (no direct
  `"use server"` export) — every exported action that calls it wraps the
  call in its own `try/catch` and turns the throw into a friendly message
  via `driveErrorMessage()`, and any throw that still escaped would be
  caught by the enclosing `runAction()` and turned into
  `unexpectedFailure()` regardless. Converting it to return a result too
  would just move the same `try/catch` translation one level down for no
  behavioural change.
- **`GalleryPhotos.tsx` and `HeroPhoto.tsx`'s upload handlers keep their
  `"error" in result` checks**, rather than switching to `.ok`. Both route
  through the shared `runUploadAction()` (`src/lib/uploads/run-upload-action.ts`,
  out of scope — used by other areas too), which wraps an action's return
  in `R | { error: string }`. Since `ActionResult`'s refusal branch is
  itself `{ ok: false, error: string }`, the `error` key survives either
  way and the existing check is still correct; switching it to `.ok` would
  require widening `runUploadAction`'s own return type for no gain.
- **Near-duplicate type folding: none needed for `/admin`.**
  `FriendActionResult`, `ProjectActionResult`, `MaintenanceActionResult`
  and `TranslationActionResult` (named in the backlog item) do not appear
  anywhere under `src/app/admin` (`grep -rn` across the four names returned
  no matches there) — they belong to `src/app/contacts`, `src/app/projects`,
  `src/app/maintenance` and `src/app/management/translations`
  respectively. Left untouched for whichever stream sweeps each of those
  areas next, rather than reaching outside `/admin`'s scope to fold them
  here.
- **Verification.** `node scripts/gates.mjs` passes
  (`typecheck=0 lint=0 build=0`) on a real production build
  (`next build`, Turbopack). `next start` on the worktree's port served the
  built app; unauthenticated `curl` requests to `/admin/zones`,
  `/admin/status` and `/admin/website` returned `307` redirects to
  `/login` (the admin guard is unaffected by this change and the
  production server does not crash). **Could not get an authenticated
  admin browser session in this sandbox** — the dev Supabase project
  already has 13 role rows, so `bootstrap-admin.mjs` correctly refuses to
  seed a fresh admin (it only seeds an empty table), and no existing
  admin's password or Google account was available here to sign in with.
  So the actual "type an empty required field / delete a referenced row
  and read the real message, not #441" check on the deployed build is
  left for a person with an admin login — see the test plan's **Left for
  manual verification** table.
