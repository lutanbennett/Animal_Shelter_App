# Feature test plan

## Header

| | |
|---|---|
| Feature | Console host attach, schema half (product_admin_set_host_attach) |
| Backlog item | `docs/backlog.md` → #hstau step 3 (not ticked: the app half follows) |
| Branch / worktree | `claude/console-host-attach-schema` @ `C:\Development\Animal_Shelter_console-host-attach-schema` |
| Dev server | n/a: no UI surface |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | yes: 0446, 0447 |
| Tested at SHA | 34cda1c52 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Adds the one database write that sets `shelter_hosts.attach_to_worker`. Files: `supabase/migrations/0446`, `0447`;
`docs/hard-coded-security-registry.json`; this plan and the decision file. No card affected: product-admin axis only; the
signed-out public has no execute grant. Out of scope: `src/`, any Cloudflare call, `#shnul`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, each its own exit code, every one 0; pasted below as printed
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck exited 0 after 55s
=== gates: lint exited 0 after 164s
=== gates: test exited 0 after 47s
=== gates: build exited 0 after 157s
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: as a product admin with aal2 a real row flipped (host passed upper-case with a trailing dot); aal1, a non-admin, an unknown host and another shelter's id were each refused; the header was restored; one overload remains; `is_trusted_caller()` asserted false under `role=authenticated` claims
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

Down: `drop function public.product_admin_set_host_attach(uuid, text, boolean);` (in 0447's header). Production: 0446 then
0447 on `dbkodyyxxhtygxcxmfcu` with the next release, either side of the deploy, as nothing reads them yet.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface yet; the function itself was driven in section 3
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface yet
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface yet
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface yet; database refusals proved in section 3
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface yet

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| product admin, aal2 | function | flips row | flipped |
| product admin, aal1 | function | 42501 | refused |
| not a product admin, aal2 | function | 42501 | refused |
| signed out (anon) | function | no execute grant | revoked from anon |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI surface yet
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface yet
- [ ] Browser console clean — n/a: no UI surface yet
- [ ] Network clean — n/a: no UI surface yet

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

Nearest: `check-hard-coded-security.mjs` (no coded security outside the Admin bypass) and `check-migration-grants.mjs`
(ok) both clean; nothing in `src/` changed.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: #hstau stays open until the app half ships
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: nothing reads the function yet, so nobody would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — pending: the release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — pending: the release manager, at the next release
- [ ] Deployed to test: `npm run deploy:test` — pending: the release manager, at the next release
- [ ] Smoke-tested on `test.lannacare.org` — pending: the release manager, at the next release
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no dates involved
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge — n/a: public pages untouched
- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — pending: the release manager, at the next release
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — pending: the release manager, at the next release
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: migration only
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — pending: the release manager, at the next release
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive function only
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager (plan in section 3)
- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager (down line in section 3)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | 0446's (host, attach) shape matched no row under the restrictive per-shelter policies | fixed in 0447 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: there is no screen | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no screen until the next stream builds one

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none open
- [ ] Checklist pasted into the PR — n/a: linked from the PR body instead
- [ ] Handed to the production release manager — pending: the release manager, at the next release

Result: pass

Release manager acknowledgement: pending: next release
