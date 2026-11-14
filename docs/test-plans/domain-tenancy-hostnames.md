# Feature test plan

## Header

| | |
|---|---|
| Feature | domain-tenancy-hostnames: decision paper on what a hostname means on cooperjaidee.org |
| Backlog item | `docs/backlog.md` → `#j4m8w` (left open; recommendation only) |
| Branch / worktree | `claude/domain-tenancy-hostnames` @ `C:\Development\Animal_Shelter_domain-tenancy-hostnames` |
| Dev server | n/a: docs-only |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | c15883961 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one decision file recommending a hostname shape, with the Cloudflare certificate limit verified
- [x] Files/areas touched listed: `docs/decisions/2026-11-14-cooperjaidee-hostnames.md` and this plan only
- [ ] Cards affected identified — n/a: no code, no card, no behaviour changes; admin and the public are unaffected
- [x] Anything explicitly out of scope written down: no DNS, route, Pages, Email Routing or renames; recorded in the decision file

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: run again at merge time if main has moved
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 59s
=== gates: lint exited 0 after 185s
=== gates: test exited 0 after 44s
=== gates: build exited 0 after 211s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads this file
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| none | nothing changes | no access change | n/a: docs only |

- [ ] Every login above tested — n/a: no access change
- [ ] A login that should not have access is blocked — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: nothing a user sees
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages still work — n/a: no code touched
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [ ] Nothing merged from main was broken — n/a: docs-only change

## 7. Documentation

- [ ] Backlog item ticked — n/a: item stays open, (a) is Lutan's; its title was rewritten on the backlog branch as the brief says
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [ ] `README.md` still accurate — n/a: README does not mention the domain
- [ ] **Release notes.** n/a: nothing a shelter user can see changes
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured: certificate limit read from Cloudflare's docs on 2026-11-14; mail senders read from `wrangler.jsonc` and `worker/release-mail.mjs`; the wildcard-on-Workers question is marked not verified

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager
- [ ] Boundary or banding assertions — deferred: release manager
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — deferred: release manager

### Migration ordering

- [ ] Migration and code together — deferred: release manager
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — deferred: release manager
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-14

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: docs-only, nothing to look at

### Result

- [ ] Open defects fixed or accepted — n/a: no defects
- [ ] Checklist pasted into the PR — n/a: PR links to this file
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass

Release manager acknowledgement: n/a: docs-only
