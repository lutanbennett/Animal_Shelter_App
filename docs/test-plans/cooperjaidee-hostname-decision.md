# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Record Lutan's hostname decision for `cooperjaidee.org` and close `#j4m8w` |
| Backlog item | `docs/backlog.md` → `#j4m8w` (Architecture), now ticked |
| Branch / worktree | `claude/cooperjaidee-hostname-decision` @ `C:\Development\Animal_Shelter_cooperjaidee-hostname-decision` |
| Dev server | not started — n/a: documentation only, no runtime surface |
| PR | __PR__ |
| Tested by / date | Claude (planner session) / 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | `0276cd4ae` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — records the answer Lutan gave on 2026-11-15 to `#j4m8w`'s question (a), and ticks the item; the item's own done-when was "(a) is decided and recorded in `docs/decisions/`", which this satisfies
- [x] Files/areas touched listed — exactly two, both documentation: `docs/decisions/2026-11-14-cooperjaidee-hostnames.md` (status RECOMMENDATION to DECIDED) and `docs/backlog.md` (`#j4m8w` ticked, title rewritten, (a) and the done-when answered in place). No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified — **none.** No card's behaviour changes, no card is added or removed, no grant moves. Admin and the signed-out public are unaffected, because nothing executable changed
- [x] Anything explicitly **out of scope** written down — **no DNS record, Worker route, Pages project, certificate or Email Routing change is made on `cooperjaidee.org`, and none may be made on the strength of this PR.** Creating them is the tenancy build's work under `#ykefa` and, on Lutan's own Cloudflare account, needs his say-so (the item's (d)). Lanna's domains are untouched. Nothing in the repository is renamed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`; the branch was cut from `origin/main` minutes earlier)
- [x] `node scripts/gates.mjs` — four gates, every exit code `0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 117s
=== gates: test — npm test
=== gates: test exited 0 after 34s
=== gates: build — npm run build
=== gates: build exited 0 after 41s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only, there is no behaviour to exercise
- [ ] Data persists — n/a: documentation only
- [ ] Create / edit / delete all exercised — n/a: documentation only
- [ ] Empty state renders sensibly — n/a: documentation only
- [ ] Invalid input is rejected with a readable message — n/a: documentation only
- [ ] Boundary cases checked — n/a: documentation only

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | n/a | n/a | n/a: no page, route, RPC or card is touched, so there is nothing a login could be refused |

- [ ] Every login above tested — n/a: no access surface changed
- [ ] A login that should not have access is blocked server-side — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: `src/app/NavLinks.tsx` not touched
- [ ] Manual updated — n/a: a planning decision about hostnames has no manual topic, and no user-facing behaviour changed
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — **checked as a build-time property rather than by loading pages, which is the honest claim for a docs-only diff:** `node scripts/gates.mjs` includes `npm run build`, which rendered the whole route tree with exit code `0` (above). No page reads either edited file
- [x] Any shared file touched checked from a second, unrelated place — `docs/backlog.md`'s consumers are `scripts/check-backlog-sections.mjs` and `scripts/check-backlog-ids.mjs`, and both ran green in the pre-commit hook: `ok — 29 open items, all above ## Completed` and `ok — 1107 items, 1107 ids, all present and unique`. No `src/` file reads either edited file, so there is no page to load
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; `sync` reported `Already up to date`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#j4m8w` is now ticked, its title says on its own that the hostname meaning is decided, (a)'s "Not decided." is marked `ANSWERED 2026-11-15 — SUPERSEDED, DO NOT RE-ASK` in place, and the done-when records that all three of its conditions are met. **This is `CLAUDE.md`'s "Answering a decision on a backlog item" rule, which exists because `assistant-retention` was parked as blocked for nine days behind a stale title**
- [x] Non-obvious design choices recorded in `docs/decisions/` — `docs/decisions/2026-11-14-cooperjaidee-hostnames.md` is amended rather than superseded by a new file, deliberately: a second file would leave the first still reading "Status: RECOMMENDATION … the item stays open", which is exactly how a settled question gets put to him again. Its reasoning, the verified certificate limit and the email position are kept unchanged below the new status block, as the record of what he was choosing between
- [x] `README.md` still accurate — unchanged, and it says nothing about hostnames or `cooperjaidee.org`
- [ ] **Release notes.** — n/a: nothing a shelter user could notice. No DNS record, route or page exists on `cooperjaidee.org` and none is created here; this PR records a decision about what a future build will resolve against. **A note would be the false-promise shape `docs/decisions/2026-10-11-release-note-truth-rule.md` forbids** — it belongs to the PR under `#ykefa` that actually stands the hostnames up
- [x] Commit messages say why, not just what — the commit records his words, why the file is amended rather than replaced, and why this is a record and not a build
- [x] **Claims were measured, not reasoned** — the certificate limit is cited to Cloudflare's own Universal SSL limitations page (read 2026-11-14, named in the file), not inferred; the wildcard-Worker question is left written down as *not established* rather than guessed; and the hostnames listed are the ones he chose, quoted

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `0276cd4ae`, this branch's head
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Nothing here reaches a user; it rides with whatever release next ships

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. There is nothing to smoke-test: the diff is two documentation files
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic is touched
- [ ] Boundary or banding change covers both edges — n/a: no threshold, band, rounding rule, retry window, pagination limit or permission cutoff is touched
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only evidence here is the gates block above, which is its run's own output, pasted whole
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no secret or environment variable is added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — `git revert` of this commit is the whole rollback, and it covers everything this PR does, because the PR changes only documentation. **What it does not cover: nothing** — no DNS record, route, certificate, deployed build or database row is created, so there is no state outside git to undo. If the decision itself is reconsidered, that is a new decision recorded the same way, not a rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The decision file's name is dated `2026-11-14` while the decision it now records was made on `2026-11-15`. | accepted — it is the same record, amended in place; renaming it would break the backlog item, the handover and `#ykefa`, which all cite the path, and both the title line and the status block carry the real date |
| 2 | low | Whether a Worker can attach to a wildcard `*.cooperjaidee.org` on the free plan is still not established. | accepted — written down in the decision file as not established, with "list each host explicitly" named as the known-working fallback; it is the tenancy build's check to make, not this record's |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. The diff is two documentation files; there is no page, control or deployed behaviour for a person to look at, and the decision itself is Lutan's own words recorded back to him in this PR's description. | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-15

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only — no page, control or deployed behaviour to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: rides with the next release; nothing here reaches a user

Result: pass with accepted defects

Release manager acknowledgement: pending: next release
