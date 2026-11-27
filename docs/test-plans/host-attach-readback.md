# Feature test plan

## Header

| | |
|---|---|
| Feature | Console reads the attach flag back: badge, one button, and a note when marked but silent (#hstau read-back) |
| Backlog item | `docs/backlog.md` → `#hstau` (retitled, not ticked: only the release manager's 0445 warning stays open) |
| Branch / worktree | `claude/host-attach-readback` @ `C:DevelopmentAnimal_Shelter_host-attach-readback` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | yes |
| Tested at SHA | 3bea4b90d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Touched: `supabase/migrations/0449_product_admin_shelters_attached_hosts.sql` (one output column on `product_admin_shelters()`), `src/app/platform/ProductAdminPanel.tsx` (badge, one button instead of two, marked-but-silent line), `src/lib/i18n/dictionaries/en.ts` and `th.ts` (two new strings, the note rewritten), `src/lib/releases.ts`, `docs/backlog.md`, a decision file. No card changes: the console is gated by the product-administrator list plus aal2, as its neighbouring host buttons. Shelter Admin and the signed-out public are unaffected. Out of scope: `scripts/deploy.mjs`, attaching any real host, production.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` run on this branch; every gate exited 0, closing lines pasted below exactly as printed

```
=== gates: typecheck exited 0 after 76s
=== gates: lint exited 0 after 248s
=== gates: test exited 0 after 62s
=== gates: build exited 0 after 171s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no constraint or default added; a read-only function, exercised through the driven console instead
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet) — n/a: nothing marked is the `'{}'` case, driven as the before and after states; a shelter with no address shows the unchanged line
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no free input; the host comes from the listed row, and a vanished host maps 22023 to the existing noSuchHost message
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: a boolean flag on an existing row has no boundary; a database before 0449 leaves the field absent, which reads as unmarked

Driven with `playwright-core` on dev at aal2 as a product administrator: added the disposable `readback-2026-11-27.example.invalid`; before `{badge:false, attach:1, stop:0}`; pressed Attach, reloaded `{badge:true, attach:0, stop:1}`; pressed Check it answers: "Does not answer yet" and the marked-but-silent line both shown; pressed Stop, reloaded `{badge:false, attach:1, stop:0}`; removed the address, 0 rows left. `--status` after apply: `This checkout: 450 applied, 0 pending.` Production apply plan: `0449` on production with the release, before or after the deploy (code tolerates its absence); `0445`-`0447` must precede it.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| product administrator at aal2 (not a card: the PADMIN list) | badge, one button, both presses work | yes | pass, driven |
| product administrator at aal1 | buttons hidden (`canWrite` false), as Remove | yes | by reading: same `canWrite` gate as Remove |
| signed out | `/platform` not reachable | yes | unchanged page gate |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails)

Server side: `product_admin_shelters()` returns nothing unless `is_product_admin()`; the write action is unchanged.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the product console has no manual topic; the note on the page explains the buttons
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the strings are in the en and th dictionaries (typecheck requires both); the translations page was not opened
- [ ] Mobile viewport (375px) — pending: Lutan to glance at the Website tab on a phone; the buttons sit in the same flex-wrap row as the existing ones
- [ ] Browser console clean — no errors or React warnings — n/a: not captured in the driven run; the press and both confirmations worked
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not captured; the server action succeeded both times, proven by the database read-back

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: only the two dictionaries are shared, and they gained keys only; typecheck proves both languages carry them
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: `/platform` list and the first shelter's Website tab, its existing Check it answers, Make website and Remove buttons beside the changed ones.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not ticked on purpose; the item is retitled; only the release manager's 0445 warning stays open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: README does not describe the console's host buttons
- [x] **Release notes.** Would a shelter user notice this change, or would an Admin or a product administrator notice something appear, move or disappear?
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** — n/a: no boundary or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: release manager; yes, and the code reads a missing column as unmarked, so either order is safe
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, for 0445 to 0449
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager, 0445 to 0449 before the deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| – | – | none | – |

## Left for manual verification

| What | Who |
|---|---|
| The Website tab on a phone (375px) | Lutan |

## Sign-off

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-27
Manual verification by: pending: Lutan, the phone-width glance above

Result: pass
