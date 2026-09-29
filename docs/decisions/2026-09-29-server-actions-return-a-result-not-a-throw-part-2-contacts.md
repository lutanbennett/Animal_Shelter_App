# 2026-09-29 — Server Actions return a result, not a throw (part 2: contacts)

Part 2 of #441, the contacts area only.

- **`src/app/contacts/**` has no `"use server"` file.** The contact hub's
  Shelter Friend card calls the actions in
  `src/app/management/shelter-friends/actions.ts`, so that file is what
  this stream converted (and why it is listed under contacts: it owned
  `FriendActionResult`). The management sweep must skip it.
- **`FriendActionResult` is gone.** It was `{ error } | { success }`; it is
  now `ActionResult<{ success: string }>`. All six actions plus `moveFriend`
  (which used to throw on a failed load or reorder and return nothing) run
  inside `runAction()` (`shelterFriends.<action>` in the log).
- **Role check returns, not throws.** New `hasManagementRole()` in
  `src/lib/auth/require-management.ts`; `assertManagementRole()` now calls it
  and still throws, because the other management actions have not been swept.
- **`runUploadAction` now returns `{ ok: false, error }`.** It is shared with
  the Website photos, whose callers only test `"error" in result`, so they
  are unaffected.
- **Not changed:** `friendContactId()` still throws on a read error; it is
  only called inside `runAction`, which turns that into the generic message.
