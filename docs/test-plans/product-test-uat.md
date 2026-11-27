# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The product platform's front door on test and UAT (`cooperjaidee-test.lannacare.org`, `cooperjaidee-uat.lannacare.org`) |
| Backlog item | `docs/backlog.md` → `#pltst` (on the `backlog` branch, not yet on `main`) |
| Branch / worktree | `claude/product-test-uat` @ `C:\Development\Animal_Shelter_product-test-uat` |
| Dev server | n/a: config-only change, nothing for next dev to render |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 45253afc9 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

What changed: test and UAT each get a product front door on its own address. Touched: `wrangler.jsonc` (test and uat blocks), `scripts/check-site-hosts.mjs` (one fixture), `docs/domain-checklist.md` (section G), and a decision file. No card changes, and Admin and signed-out visitors are unaffected until a deploy. Out of scope: every deploy, every Supabase auth setting, the Pi, the `shelter_hosts` rows, and production.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 7s
=== gates: lint exited 0 after 143s
=== gates: test exited 0 after 36s
=== gates: build exited 0 after 46s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: the test and UAT deploys, front-door rows and callbacks (domain-checklist section G), then a save on each address
- [ ] Data persists — reload the page and the change is still there — n/a: no data path changed; the save is section G7
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete added
- [ ] Empty state renders sensibly — n/a: no page changed
- [ ] Invalid input is rejected with a readable message — n/a: no input added
- [ ] Boundary cases checked — n/a: no input added

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page or card changed | n/a | n/a |
| signed out | n/a: no page or card changed | n/a | n/a |

- [ ] Every login above tested — n/a: no page, card or check changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing behaviour
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched; wrangler.jsonc proven by check-site-hosts below
- [x] Nothing merged from `main` during `sync` was broken by this branch

`node scripts/check-site-hosts.mjs`: all right. Production's allowedOrigins are unchanged, and test and uat now carry the platform host. `node scripts/check-deployed-hosts.mjs --env test`: test.lannacare.org ok; cooperjaidee-test.lannacare.org MISSING, which is expected until section G2.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: #pltst is on the backlog branch only, not yet on main; for the planner to tick after the daily sync, and only once G5 and G7 pass
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: nobody notices until the test and UAT deploys and auth entries are done, and nothing reaches production
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: whoever runs domain-checklist section G
- [ ] Smoke-tested on test — deferred: whoever runs domain-checklist section G
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no time logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: whoever runs section G pastes the G5 output
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: production is untouched
- [ ] `strip-baked-env` seen in the deploy output — deferred: whoever runs the test and UAT deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: a committed var, not a secret, and not production

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] production dry-run — n/a: no migration
- [ ] fresh backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**

Rollback: revert the commit, then redeploy test or UAT (Pi first, then Worker), which drops the custom domain. A leftover `shelter_hosts` row or allow-list entry does no harm. A moved Site URL has to be set back by hand to its noted value.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in, step up and save on each new address (section G7) | cooperjaidee-test.lannacare.org, cooperjaidee-uat.lannacare.org |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: section G7 after the deploys

Manual verification by: pending: section G7 after the test and UAT deploys and auth entries

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — n/a: nothing here reaches production

Result: pass

Release manager acknowledgement: n/a: nothing here reaches production
