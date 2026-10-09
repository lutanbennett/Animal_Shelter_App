# Feature test plan — multi-tenancy-spike

---

## Header

| | |
|---|---|
| Feature | Multi-tenancy spike: measure what it costs to hold several shelters in one database |
| Backlog item | `docs/backlog.md` → *Spike: can the app hold several shelters in one database? Measure it, do not estimate it.* |
| Branch / worktree | `claude/multi-tenancy-spike` @ `C:\Development\Animal_Shelter_multi-tenancy-spike` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (not started: nothing to render) |
| PR | (opened from this commit) |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no — by design: the spike's schema ran only inside a rolled-back transaction |
| Tested at SHA | `a61f7ec6` (docs); harness evidence from `3761a29d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a decision record giving a measured cost (≈ 50 h) and the list of places that fought back, with the `.org` shortlist re-checked; no code or schema merges, as the item and brief require
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/decisions/2026-10-09-multi-tenancy-spike.md` (new), `docs/backlog.md` (tick), this plan. `scripts/spike-multi-tenancy.mjs` was added and removed again on the branch, so the PR diff does not contain it
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none at runtime. The spike *measured* the admin and signed-out tiers on dev; nothing a role reaches changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the build itself, the product name (Lutan's), per-shelter Drive and the sender item; and the `p_issuer` finding on `issue_donation_receipt`, reported for the backlog rather than fixed here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Merge made by the 'ort' strategy`, three docs files from main, no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 169s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration file; the brief forbade taking a number and `0174` belongs to `close-the-remaining-over-grants`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — run at the start (no drift) and again at the end; nothing was applied. End-of-spike output, unedited:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 174 applied, 0 pending.
Against origin/main 81aa29eb: 173 file(s), 174 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 1
    0174_close_the_remaining_over_grants.sql
```

  The one row without a file on `main` is `0174`, applied by the sibling stream `close-the-remaining-over-grants` from its own branch, as the brief said it would be. **It is not this spike's.** At the start of this session the same command read `173 applied, 0 pending … 0 / 0`. A direct catalogue check after the last run confirms the spike left nothing on dev:

```
shelters table | 0
shelter_id columns | 0
spike_definer role | 0
tenant/definer policies | 0
spike functions | 0
canary rows | 0
LANNA_FOLDER / CANARY_FOLDER rows | 0
view owners | postgres
```

- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration file to dry-run
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: deliberately not applied; see the residue check above
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration file
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: nothing changed on dev; within the rolled-back harness, `--reown` compared all 59 objects before and after and found no difference for Lanna (`REGRESSION … []`)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/spike-multi-tenancy.mjs` at `3761a29d`, both modes, against dev's real rows. Asserted: no shelter-B row visible to a Lanna admin in any of 62 tables; md5 of every admin-readable view (45) and anon-readable object (14) before and after B got rows; cross-tenant RPC writes (`set_resident_microchip`, `set_resident_drive_folder`) and a Lanna control. Output is in the decision record, unedited
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: nothing was applied, so there is nothing to undo
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: nothing is applied anywhere

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface or runtime code changed
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no feature; the harness's writes were rolled back by construction
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a: no code shipped; the admin tier was measured in the harness instead |
| management | nothing new | unchanged | n/a: no code shipped |
| staff | nothing new | unchanged | n/a: no code shipped |
| doctor | nothing new | unchanged | n/a: no code shipped |
| volunteer | nothing new | unchanged | n/a: no code shipped |
| signed out | nothing new | unchanged | n/a: no code shipped; the anon tier was measured in the harness instead |

- [ ] Every role above tested — n/a: nothing reaches any role
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new route or RPC

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-facing behaviour to document
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no page is near a docs-only change
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: the only shared file touched is `docs/backlog.md`, which no page reads
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought three docs files and the gates ran on the merged tree: `typecheck=0 lint=0 build=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-09-multi-tenancy-spike.md`
- [x] `README.md` still accurate — nothing it describes changed
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody would notice; a decision record and a backlog tick, with no runtime change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every count in the decision record comes from a catalogue query on dev or the harness output. Two counts in the first draft were wrong when re-checked against the raw output (22 unique keys → 19; 34 service-role call sites → 33, the 34th being the definition) and were corrected before commit. The hours are an estimate built from measured counts, and the record says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is not deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: documents; `docs/` is not part of any build output
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no runtime date derivation
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold any code evaluates
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the `gates:` lines, the `--status` output and the residue check are copied from the commands' output; the harness output is quoted unedited in the decision record
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy follows this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy follows this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of the merge removes the decision record and un-ticks the item; nothing at runtime or in any database moves either way. It does not un-learn the findings: the `p_issuer` finding on `issue_donation_receipt` is true on `main` today whether or not this PR is merged

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor (today) | `issue_donation_receipt` takes the issuer as a parameter from the caller, so anyone with `donation.receipt` can issue a receipt naming any organisation through the API, around the deliberate hard-coding in `src/lib/donations/issuer.ts` | deferred to backlog — not this stream's to fix; added on the `backlog` branch |
| 2 | major (at tenancy, not today) | Under the item's design, 9 public views leak a second shelter to anon and definer RPCs write across shelters | accepted — this is the spike's finding; the decision record's fix closes it in the harness |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan reads the decision record and agrees with the recommendation (re-own, ≈ 50 h, not before Lanna is live) | `docs/decisions/2026-10-09-multi-tenancy-spike.md` |
| 2 | Lutan chooses the Cooper `.org` name and checks its price at Cloudflare Registrar checkout | the record's last section |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (multi-tenancy-spike session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's: a decision to read and a name to choose

Manual verification by: pending: Lutan reading the recommendation and choosing the Cooper .org name

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises it and links this file
- [ ] Handed to the production release manager — n/a: nothing deploys from this PR

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing deploys from this PR
