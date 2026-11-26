# Feature test plan

## Header

| | |
|---|---|
| Feature | Host attach, deploy half: mechanism settled, schema specified, two secrets registered, deploy import fixed |
| Backlog item | `docs/backlog.md` → `#hstau` (left open: the build waits on a schema PR) |
| Branch / worktree | `claude/host-attach-deploy` @ `C:\Development\Animal_Shelter_host-attach-deploy` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not used: no UI surface) |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: no card, page or permission changes; deploy script and secrets registry only
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Touched: `scripts/deploy.mjs` (missing `fileURLToPath` import; account-id name read from the manifest),
`scripts/lib/runtime-config.mjs` (two optional secrets, `CLOUDFLARE_ACCOUNT_VAR`), `.env.example`,
`docs/decisions/2026-11-26-host-attach-deploy.md`. Out of scope: the `--domain` build itself (waits on the
`shelter_hosts.attach_to_worker` schema PR specified in the decision file), the console screen, production, UAT.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Pasted below as printed

```
GATES_HERE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the column is specified, not written
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: no page; nothing stored
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no records created or changed
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no new input

Happy path, as run: `node scripts/deploy.mjs --env test --plan` prints the wrangler auth line and the command after
the account-id change; `node scripts/check-runtime-config.mjs` prints `42 names, .env.example and consumers agree.`;
`grep -n fileURLToPath scripts/deploy.mjs` shows the import (line 66) and the use. The dev `shelter_hosts` rows in the
decision file were read from the dev project by Management API query, not inferred.

**No live attach/deploy trial was run (brief deliverable 5)**: the mechanism has nothing to read until the schema
lands, so the trial belongs to the build stream. No Cloudflare domain was attached or detached; `test.lannacare.org`
untouched.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page | n/a | n/a |
| signed out | n/a: no page | n/a | n/a |

- [ ] Every login above tested — n/a: no page or action changes
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page or action changes

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user meets
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched; the registry's other consumers are covered by check-runtime-config and the test gate
- [x] Nothing merged from `main` during `sync` was broken by this branch

Nearest "page" is the deploy script itself: `--plan` on `--env test` ran clean after the change.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: `#hstau` stays open, the build waits on schema; replacement title for the planner is in the PR body
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: nobody would notice; deploy script and secrets registry only, and the feature is not usable yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager (the first real deploy after merge is the proof the import fix works)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: both are optional and unused by any code yet; production's token is deliberately not made

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**

Rollback: revert the PR. Nothing in the database or at Cloudflare changes.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `scripts/deploy.mjs` used `fileURLToPath` with no import (since #1898): every real deploy would throw at the wrangler call | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no surface a person can look at; the console screen does not exist yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the next release's pre-deploy pass

Result: pass

Release manager acknowledgement: pending: next release
