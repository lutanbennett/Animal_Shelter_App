# Create a role from the app (`#b3y4z`)

Lutan, 2026-11-04: *"Ability to create Roles."* Adding cards (Who does what) and assigning people (Security) already existed; this adds Create.

## What it does
`createRole(name, nameTh, requestId)` in `src/app/admin/who-does-what/actions.ts`, drawn by `CreateRoleForm.tsx` on the Who does what page. It inserts one `roles` row: `key` derived from the English name (`role-key.ts`, shown to the person before they commit), `name`, optional `name_th`, `kind = 'custom'`. Nothing else: **no cards**, and no `legacy_role` (that column was dropped in `0181`). A duplicate key gets a readable message; `admin` / `public_viewer` are refused in words. No migration.

## The retired scope columns were deliberately not exposed
`scope_residents`, `scope_clinical`, `scope_contacts`, `scope_photos` are retired role columns; the form does not offer, set or read them and their defaults apply.

## Deliverable 2: the gate is Admin at the authenticator step, not a card
The brief said to gate the control on the `who_does_what` card's activity. Every write on this screen (`guard()`, `featureGuard()`, `deleteRole`) asks `hasAdminRole()` + `hasTwoStep()`, and `roles`' own insert policy is Admin at aal2. There is no card activity those actions ask, and the rule is "the one the action's own check asks". So the Create control is drawn on `canEdit` (the page's existing `isAdmin && hasTwoStep()`), exactly like Add/Remove card and Delete role. A login holding the `who_does_what` card without Admin sees no Create control. No role name is read.

## Shape question one: what a card-less role's holder sees
**Chosen: keep `opens_app` at its default (true) and rely on the line the home already draws** (`appHome.emptyTitle` / `appHome.empty`: "This role has no jobs on its home screen yet. They appear when the role is given something to do."). Defaulting `opens_app` to false would need a second control to flip it later (a second place to forget, and a silent "cannot sign in" is worse than an empty home); an explanation is the opposite of the silent-tile fault `cardTile()` can cause. The line already exists, so nothing was added.

## Shape question two: the authenticator code
**Required**, as for every other write on the screen and for delete. Consequence stated up front: a dev sign-in is aal1, the page hides every edit control at aal1, so the Create press cannot be driven on dev (`n/a: aal2 required, no authenticator`). Checked instead: the key derivation and wording by test/typecheck, the control's absence at aal1 and for a card-only login on screen.
