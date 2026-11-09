# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `check-backlog-ids.mjs` refuses control bytes; `docs/backlog.md` pinned to `text eol=lf` |
| Backlog item | `docs/backlog.md` → `#ayl1h` (Architecture) |
| Branch / worktree | `claude/backlog-binary-guard` @ `C:\Development\Animal_Shelter_backlog-binary-guard` |
| Dev server | n/a: no app code changed, nothing for a dev server to serve |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | 01b29b5e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/check-backlog-ids.mjs`, `.gitattributes`, two decision files, the tick in `docs/backlog.md`
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: repo tooling only; no card, page, admin or public surface changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `check-backlog-sections.mjs` and the hook file are deliberately unchanged (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 104s
=== gates: lint exited 0 after 152s
=== gates: test exited 0 after 30s
=== gates: build exited 0 after 192s
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

- [x] Happy path works end to end — clean `docs/backlog.md`: `check-backlog-ids: ok — 1031 items, 1031 ids, all present and unique`, exit 0
- [x] Data persists — reload the page and the change is still there — `git ls-files --eol docs/backlog.md` reads `i/lf w/lf attr/text eol=lf` after commit and sync
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a check script has no create, edit or delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: the existing "no items found" crash path (exit 1) is unchanged
- [x] Invalid input is rejected with a readable message, not a crash — planted `0x08` in a staged copy: both `sh .githooks/pre-commit` and the live hook in `C:\Development\Animal_Shelter_App\.githooks` printed `line 1189, column 32: byte 0x08` and exited 1; the script itself exits 3
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — trailing CR on every line (CRLF tree) is not a finding; a lone mid-line CR is (`byte 0x0D`, exit 3); the planted line was 3,213 characters

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

- [x] The pages nearest the change still work (list the ones checked) — `check-backlog-sections.mjs` still `ok — 66 open items`; the hook's other checks ran and passed in the same proof
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates above, run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-11-08-backlog-binary-guard.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a pre-commit guard on a repository file; no shelter user could notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the hook proof, the `ls-files --eol` reading with a planted byte, and the 1-line staged diff were each run; output in the PR

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: repo tooling, never deployed
- [ ] Deployed SHA matches the tested SHA — n/a: repo tooling, never deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: repo tooling, never deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: repo tooling, never deployed
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no time handling
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band; the byte-range edges (TAB and LF allowed, 0x08 and mid-line 0x0D refused) are in section 4
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

- [ ] Rollback position stated, **including what it does not cover**. — n/a: nothing deployed; reverting the PR restores the old check

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
