# Feature test plan

Copy this file to the feature branch as `docs/test-plans/<feature>.md`, fill the
header, and tick as you go.

Every line must end up in one of two states, and CI checks this:

- `- [x]` — the check was actually run and passed.
- `- [ ] … — n/a: <reason>` — the check did not apply, and the reason says why.

Never tick something you did not do, and never leave a line untouched. Anything
that failed goes under **Defects**.

**No merge without a signed-off checklist. No exceptions.** CI enforces it: a PR
with no completed `docs/test-plans/<feature>.md` fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

Run `node scripts/check-test-plan.mjs` locally before pushing to see what CI will say.

The `test-plan` CI job currently reports **red without blocking the merge** — it is
a deliberate soft gate while the process beds in, not an oversight. Treat a red
`test-plan` as a stop anyway; it becomes a required check once we know the
checklist is working.
The completed checklist is also pasted into the PR and read by the production
release manager before `npm run deploy:prod`.

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
| Tested at SHA | |

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
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test`
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev`
- [ ] **Timezone-sensitive behaviour checked on test, not locally.** Workers run in UTC wherever they are; anything deriving "today" is wrong for part of every day in Thailand and only shows up on a real Workers build
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks
- [ ] Any new secret/env var exists in the production Cloudflare environment

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.)
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. `npx wrangler rollback --env production` reverts the Worker in seconds; it does **not** revert migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [ ] Everything in this checklist that could be verified without human eyes was run, not assumed
- [ ] Nothing is ticked that was not actually executed

Automated checks by: <name>  Date: <yyyy-mm-dd>

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf; if there was
nothing to look at, write `n/a: <reason>` in place of the name.

- [ ] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: <name>  Date: <yyyy-mm-dd>

### Result

- [ ] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result: <pass | pass with accepted defects | fail>

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
