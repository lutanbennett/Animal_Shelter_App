# Feature test plan

Copy this file to the feature branch as `docs/test-plans/<feature>.md`, fill the
header, and tick as you go. A box is only ticked when the check was actually run
and passed — write `n/a` with a reason instead of ticking something that did not
apply, and record anything that failed under **Defects**.

The completed checklist is pasted into the feature's PR (description or a single
comment) and handed to the production release manager before `npm run deploy:prod`.
A feature without a completed checklist does not go to production.

---

## Header

| | |
|---|---|
| Feature | |
| Backlog item | `docs/backlog.md` → |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | |
| Tested by / date | |
| Carries a migration? | yes / no |

## 1. Scope and risk

- [ ] Change is described in one sentence, and it matches what the backlog item asked for
- [ ] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public
- [ ] Anything explicitly **out of scope** written down, so the release manager is not surprised

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`:

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [ ] `npm run typecheck` — clean
- [ ] `npm run lint` — clean
- [ ] `npm run build` — succeeds
- [ ] CI green on the PR (runs the same three)

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [ ] Existing rows still read correctly after the change (checked against real dev data)
- [ ] Down-migration written, or the reason one is not needed is stated
- [ ] Production apply plan stated for the release manager (which file, which project, when)

## 4. Functional checks

- [ ] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there
- [ ] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet)
- [ ] Invalid input is rejected with a readable message, not a crash
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| staff | | | |
| vet | | | |
| volunteer | | | |
| resident | | | |
| signed out | | | |

- [ ] Every role above tested
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations`
- [ ] Mobile viewport (375px) — no overflow, controls reachable
- [ ] Browser console clean — no errors or React warnings
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page
- [ ] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated
- [ ] `README.md` still accurate
- [ ] Commit messages say why, not just what

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production**.

- [ ] Deployed to test: `npm run deploy:test`
- [ ] Smoke-tested on `test.lannacare.org` — the feature's happy path works on the deployed build, not just the dev server
- [ ] Any new secret/env var exists in the production Cloudflare environment
- [ ] Production migration (if any) named and scheduled with the release manager
- [ ] Rollback understood: what to revert, and whether the schema change survives a revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Sign-off

- [ ] All applicable boxes ticked, every `n/a` justified
- [ ] Open defects are either fixed or explicitly accepted below
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result: **pass / pass with accepted defects / fail**

Tested by: ______________  Date: ____________

Release manager acknowledgement: ______________  Date: ____________
