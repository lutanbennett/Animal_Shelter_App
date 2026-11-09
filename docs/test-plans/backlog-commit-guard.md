# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `commit-msg` hook: a backlog-branch commit must name every item it changes |
| Backlog item | `docs/backlog.md` → `#z5pk9` (Architecture) |
| Branch / worktree | `claude/backlog-commit-guard` @ `C:\Development\Animal_Shelter_backlog-commit-guard` |
| Dev server | n/a: no app code changed, nothing for a dev server to serve |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | 110f8086 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `.githooks/commit-msg`, `scripts/check-backlog-commit-names.mjs`, one decision file, the tick in `docs/backlog.md`
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: repo tooling only; no card, page, admin or public surface changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `pre-commit`, `post-commit`, `post-merge` and CLAUDE.md unchanged (wording proposed in the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 104s
=== gates: lint exited 0 after 263s
=== gates: test exited 0 after 47s
=== gates: build exited 0 after 329s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — scratch repo, branch `backlog`: two uncommitted edits (items aaaaa, bbbbb) committed naming both → rc=0; single-session edits (item body line, new item, section header) → rc=0
- [x] Data persists — the hook files are committed; `git ls-files -s` shows `commit-msg` as 100755
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a check script has no create, edit or delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: the existing "no items found" crash path (exit 1) is unchanged
- [x] Invalid input is rejected with a readable message, not a crash — `commit -am` naming only bbbbb → refused listing `#aaaaa`; path-limited commit naming only aaaaa → refused listing `#bbbbb`; both rc=1
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — escape `BACKLOG_COMMIT_ALLOW_UNNAMED=1` allows; non-backlog branch not checked; a deliberately crashing script allows the commit with a note (fail open)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every login above tested — n/a: no page, route or RPC changed
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page, route or RPC changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: developer tooling, not in the user manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the existing pre-commit checks ran on this branch's own commits: sections ok, ids ok
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates above, run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-11-09-backlog-commit-names-items.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: development tooling on a git hook; no shelter user could notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — GIT_INDEX_FILE values for plain/-a/-i/path-limited commits printed from a scratch hook; every guard case run in a scratch repo

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: repo tooling, never deployed
- [ ] Deployed SHA matches the tested SHA — n/a: repo tooling, never deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: repo tooling, never deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: repo tooling, never deployed
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no time handling
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band; both sides of the naming rule (named passes, unnamed refused) are in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: repo tooling, never deployed
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: repo tooling, never deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — n/a: nothing deployed; reverting the PR removes the hook

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no surface a person looks at | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: repo tooling with no surface a person looks at

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass

Release manager acknowledgement: n/a: nothing to deploy
