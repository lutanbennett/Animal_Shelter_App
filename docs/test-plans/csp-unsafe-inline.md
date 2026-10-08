# Feature test plan

## Header

| | |
|---|---|
| Feature | Decide whether `'unsafe-inline'` can leave the CSP and whether HSTS should be a year. Answer: no, and not yet. Nothing in the policy changed |
| Backlog item | `docs/backlog.md` → Security: "Drop `'unsafe-inline'` and lengthen HSTS (after the CSP went enforcing)" |
| Branch / worktree | `claude/csp-unsafe-inline` @ `C:\Development\Animal_Shelter_csp-unsafe-inline` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not started: nothing to render) |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `652d0dbf` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item said to drop `'unsafe-inline'` only if nonces could be shown on both render paths and otherwise to write down why not and close; this writes down why not (`docs/decisions/2026-10-08-csp-unsafe-inline-stays.md`) and closes it, and leaves HSTS at six months with a dated follow-up
- [x] Files/areas touched listed: `docs/decisions/2026-10-08-csp-unsafe-inline-stays.md`, `docs/backlog.md` (the tick), this plan. On the `backlog` branch, a new item "Raise HSTS to a year — not before 2026-11-08". No code, no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: none; no header or page changes
- [x] Out of scope written down: any change to the CSP or HSTS header; the Cloudflare zone's own HSTS setting (the "Supabase, Cloudflare and Google checklist" item); the blocked Cloudflare beacon, which stays blocked

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date") and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: all 7 checks passed on #467 at `bb6fdaa`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no change shipped — the investigation and its conclusion are the deliverable
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no logic changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | n/a: no change shipped |
| management | unchanged | unchanged | n/a: no change shipped |
| staff | unchanged | unchanged | n/a: no change shipped |
| vet | unchanged | unchanged | n/a: no change shipped |
| volunteer | unchanged | unchanged | n/a: no change shipped |
| signed out | unchanged | unchanged | n/a: no change shipped |

- [ ] Every role above tested — n/a: no change shipped, so there is no behaviour to test per role
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user can see changed
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no page changed; the CSP's console baseline (only `cloudflareinsights` blocked) is untouched because the header is untouched
- [ ] Network clean — n/a: no requests changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only shared file touched is `docs/backlog.md`, which no page reads
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync merged nothing, and the gates above ran on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with a note saying what closed it; the HSTS follow-up is on the `backlog` branch (`64b7095c`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-08-csp-unsafe-inline-stays.md`
- [x] `README.md` still accurate: it does not describe the CSP's `'unsafe-inline'` or the HSTS age, and neither changed
- [ ] **Release notes.** — n/a: a decision record only; no header, page or behaviour changed, so nobody would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The measured ones: `test.lannacare.org` `/` and `/login` (served by the Pi, `x-lanna-served-by: pi`) carry two inline `<script>` tags whose content is the `self.__next_f.push(...)` page payload, no `nonce=` attribute, and `style="color:transparent"`; 24 files under `src/` contain `style={`; the only `dangerouslySetInnerHTML` in `src/` is the JSON-LD block in `src/app/adopt/PublicHeader.tsx`; `CACHE_TTL_SECONDS = 600` and the CSP being set after the body in `worker/index.mjs` / `worker/security-headers.mjs`; nonce requirements from Next 16's own guide in `node_modules/next/dist/docs/`. Reasoned, and said so in the decision: that nonces cannot cover style attributes (CSP specification behaviour, not tried here) and the cost/benefit judgement

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: no deployable change; nothing to deploy for this PR
- [ ] Deployed SHA matches the tested SHA — n/a: no deployable change

### On the deployed build

- [ ] Deployed to test — n/a: no deployable change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable change
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the one pasted output (the `gates:` line) is in section 2; nothing is pasted here
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: public pages unchanged

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deployable change
- [ ] `strip-baked-env` line seen — n/a: no deployable change
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documentation only; reverting the PR is the whole rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no change a person could look at | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no change shipped — the investigation and its conclusion are the deliverable

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file, which is the checklist
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass
