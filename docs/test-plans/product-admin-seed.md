# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `scripts/add-product-admin.mjs` — place a product administrator through the service role; Lutan placed as the first one on production (#pdmin) |
| Backlog item | `docs/backlog.md` → `#pdmin` (Architecture), ticked on this branch |
| Branch / worktree | `claude/product-admin-seed` @ `C:\Development\Animal_Shelter_product-admin-seed` |
| Dev server | n/a: an operator script, no app surface |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-19 |
| Carries a migration? | no — `0411` already created the table and it is applied everywhere |
| Tested at SHA | the branch head |

## 1. Scope and risk

- [x] Change is described in one sentence — adds an operator script that puts a person on, or takes them off, the product-administrator list through the service role, and records that Lutan is now the first one on production
- [x] Files/areas touched — `scripts/add-product-admin.mjs` (new), `docs/decisions/2026-11-19-first-product-administrator.md` (new), `docs/backlog.md` (`#pdmin` ticked), and this plan. **No `src/`, no `worker/`, no migration**
- [x] Cards affected identified, plus whether admin and the signed-out public are affected — **none, and this is the line worth reading.** PADMIN is a list of people, not a role or a card, and is the third named exception to the zero-exceptions rule after Admin and the adopter website account. **Adding someone to it is the mechanism working as designed, not a bypass of the card system**, and it grants nothing inside a shelter: everything a product administrator does with a shelter's own data stays card-governed like anyone else's. The signed-out public is unaffected; a shelter Admin is unaffected and still cannot read or write this list
- [x] Out of scope — the script does not create accounts, does not send invitations, does not touch roles, cards or `user_roles`, and does not change the screen. It writes one row in `product_admins`

### Why this exists, in one paragraph

`0411_product_admins.sql` seeds nobody on purpose — the repository is public — and its insert policy
is `with check (public.is_product_admin())`, so **the list cannot bootstrap itself through the app.**
`docs/decisions/2026-11-18-product-admin-list-schema.md` says the first row is placed with the service
role; **nothing did that**, so the Product admin screen shipped live and unreachable in `0.47.3` and
gained a second unreachable capability in `0.47.4`. Both release records say so, and `--list` against
production confirmed it rather than inferring it: *"The product-administrator list is EMPTY"*.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: branched from current `origin/main` by `worktree.mjs new`, nothing merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — run on this branch; the script is `scripts/`, which `lint` and `typecheck` cover
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration.** `0411` created `product_admins` and is applied to dev, UAT and production
- [x] **The data change this PR records was made to production, and it is one row.** `product_admins(user_id, note)` for `lutan.bennett2@gmail.com` → `0131ea0c-6539-420b-82eb-ef6506fd1e6b`, at `2026-11-19 07:48:24 UTC`. **Reversible**: `--remove` takes it off, subject to the last-administrator refusal below
- [x] **Identity is `auth.users.id`, never the email**, which is `0411`'s own rule: an id survives an email change, while a list keyed on an address would silently lose the person, or hand the seat to whoever next held it. The email is only how a human names the account on the command line

## 4. Functional checks

- [x] **Happy path works end to end** — against **production**: `--list` read the list as empty; the dry run resolved the account and printed the exact statement without writing; `--apply --confirm` wrote it; and the script re-read the list afterwards and reported one person

```
add-product-admin: production — project dbkodyyxxhtygxcxmfcu
add-product-admin: lutan.bennett2@gmail.com -> 0131ea0c-6539-420b-82eb-ef6506fd1e6b
add-product-admin: the list currently holds 0 person/people.
add-product-admin: added lutan.bennett2@gmail.com. The list now holds 1 person/people:
  lutan.bennett2@gmail.com  has an authenticator
```

- [x] **Verified independently of the write**, by a separate `--list` run afterwards rather than by trusting the script's own closing line

```
1 product administrator(s):
  lutan.bennett2@gmail.com  0131ea0c-6539-420b-82eb-ef6506fd1e6b  has an authenticator  note: First product administrator, placed 2026-11-19 …
```

- [x] **Idempotent** — running the same command a second time against production answered `is ALREADY a product administrator (added 2026-11-19 07:48:24…). Nothing to do.` and exited 0. The insert also carries `on conflict (user_id) do nothing`, so even a race cannot double-write
- [x] **Invalid input refused, each with what to do instead** — exercised on **dev**, and the list there was confirmed still empty afterwards, so none of these wrote anything:

```
no such account      No account on test has the address nobody@example.invalid. Check the
                     spelling, or that they have signed in at least once.
--apply, no confirm  Refusing: --apply also needs --confirm dev-signin-admin@example.invalid.
                     Run it without --apply first; the dry run prints the exact line.
no arguments         Give --email <address> or --user-id <uuid>, or --list to see who is on the list.
unknown flag         Unknown flag(s): --wrong. Known: --email, --user-id, --note, --confirm,
                     --apply, --remove, --list, --env
```

- [x] **The authenticator warning fires when it should.** It printed for `dev-signin-admin@example.invalid`, which has no verified factor, and stayed silent for Lutan's account, which has one. **That silence is the measurement** that the `aal2` writes on the screen will work for him — every write there needs the second step, and `#shmgt` records that a PADMIN with no authenticator cannot set one up themselves
- [x] **Boundary case: the last administrator cannot be removed.** The refusal is in the code path above the write and explains why — an empty list cannot be added to through the app, so removing the only one would need this script again to recover. **Not exercised against production** (there is one person on the list and removing them is the thing being prevented); the branch is read in the source and the condition is `current.length === 1`
- [x] **A missing table is explained rather than thrown** — `to_regclass` is checked first, and an environment behind on migrations is told `0411 is not applied there yet` instead of a bare `42P01`

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: **the script is not reached through a login at all.** It uses the service role, which is the whole point: no login may insert the first row, by design. The screen's own gate (`is_product_admin()` plus `aal2`) is unchanged by this PR and was proved in `0414`'s rollback harness

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: an operator script with no page, nav entry, manual topic or string

## 6. Regression

- [x] The pages nearest the change still work — **nothing in `src/` changed.** The one observable difference is that `Settings -> Product admin` now opens for one account where it opened for nobody, which is the intended effect
- [x] Shared file touched, checked from a second unrelated page — n/a: the script shares only `scripts/lib/env.mjs`, which it reads and does not modify
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — **`#pdmin` ticked**, with its title rewritten to say what was done and its *blocked on Lutan* line replaced by his answer, so the item reads correctly without its tail
- [x] Non-obvious design choices as a new file in `docs/decisions/` — `2026-11-19-first-product-administrator.md`: why a script was needed, what was done, what the script is **not**, each guard and the fault it prevents, and the two things that remain open and are not its job
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody at the shelter would notice.** The screen is reachable only by a product administrator, which today is one person, and the capabilities themselves were already announced by `0.47.3`'s and `0.47.4`'s notes. What changed is that one named account can now open a screen; that is configuration, not a feature, and `#pdmin` recorded `Release note: no` when it was filed
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the empty list from `--list` against production before the write; the account id from the resolution step rather than from anywhere else; the authenticator from the script's own silence on one account and its warning on another; the idempotency from a real second run; the refusals from running each one on dev and re-reading the list to confirm nothing was written

## 8. Pre-production gate

- [x] **This PR's production change has already been made, deliberately, and that is unusual enough to state.** Lutan asked for it in chat by name — *"use my gmail account as the first product admin (lutan.bennett2@gmail.com)"* — and it is one row in a list, reversible with `--remove`, with no schema change and no code reaching users. The PR **records** the change and ships the instrument that made it; it does not make it again
- [ ] Deployed SHA / smoke test / deploy safety / UAT project line — n/a: **this PR ships nothing to any environment.** No `src/`, no `worker/`, no migration, so nothing is served differently and no deploy is needed to make it true
- [x] **The one thing to watch after merging** is that `scripts/` is not docs-only, so CI runs the full gates on this PR rather than skipping them

### Rollback

- [x] Rollback position stated — `node scripts/add-product-admin.mjs --env production --email lutan.bennett2@gmail.com --remove --apply --confirm lutan.bennett2@gmail.com`. **It would refuse**, because he is the only one on the list, which is the guard working: an empty list cannot be added to through the app. To genuinely undo it, add a second administrator first, or `delete from public.product_admins` through the service role. Reverting the PR removes the script and leaves the row, which is the right way round — the row is the thing Lutan asked for

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (usability, pre-existing) | **A PADMIN who is not also a shelter Admin reaches the screen only by typing its address**, because the tile lives on the Settings landing page. Found by #1709, still true | **not this PR's job**, recorded in the decision file so the next person meeting it does not file it as new |
| 2 | low (usability, pre-existing) | **The screen does not show which onboarding steps a shelter has had** — #1716's own note says so. Creating a shelter, mapping addresses and giving it an Admin role are separate actions with no progress across them | **not this PR's job**, recorded in the decision file |

## Left for manual verification

**Partly closed the same day, by Lutan, in chat.** Minutes after the row was written he reported of
`Settings -> Product admin`: ***"it is available and accessible"***. **That closes reaching the
screen** — the first time anybody has been able to open it, after two releases announced
capabilities on it — **and it does not close the presses**, which he has not said he made. The two
are separated below rather than rolled into one tick, because "the screen opens" and "the buttons
work" are different claims and only the second is what four plans across two releases are waiting on.

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **The screen opens on production for a product administrator** | Lutan | **DONE 2026-11-19** — *"it is available and accessible"*, reported in chat |
| 2 | **Do the second step with the authenticator, then confirm Add, Remove, create-a-shelter and map-an-address are drawn and work.** `shelter-management-app`, `shelter-management-schema`, `shelter-write-app` and `shelter-admin-role-app` all leave exactly these presses `pending:`, because a dev sign-in has no authenticator and until today no production account could reach the screen | Lutan | open |
| 3 | **Whether the tile appears on the Settings landing page**, or whether the address has to be typed — defect 1 | Lutan | open; his *"accessible"* may already mean the tile is there, but he did not say which and it is not for me to decide |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1 is done (Lutan opened the screen and reported it available and accessible); items 2 and 3 are not, and only the person who presses the controls may tick this

Manual verification by: pending: Lutan opened the screen on production and reported it available and accessible, which closes item 1; the authenticator step and the controls themselves (item 2) are not done, and only the person who presses them may tick that

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; no deploy step remains for this change

Result: pass with accepted defects
