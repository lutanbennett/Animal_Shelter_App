# Test plan: vet-cards-create

## Header

| | |
|---|---|
| Feature | Four vet cards (`record_vet_care`, `record_microchip`, `adoption_news`, `add_while_recording`) seeded by `0281`; `reference.add_while_recording` leaves the doctor boxes of `fixed-for-now.ts` |
| Backlog item | `docs/backlog.md` → NINE ACTIVITIES A VET PERFORMS ARE CARRIED BY NO CARD SIZED FOR THEM |
| Branch / worktree | `claude/vet-cards-create` @ `C:\Development\Animal_Shelter_vet-cards-create` |
| Dev server | n/a: no page changed |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | yes: `0281_vet_cards.sql` |
| Tested at SHA | a8b66e1d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: four cards sized to a vet's activities, seeded in `card_grants`
- [x] Files/areas touched listed: `0281`, `cards.ts`, both dictionaries, `fixed-for-now.ts`, `docs/card-walkthrough.md` (regenerated), decision file, backlog tick
- [x] Roles affected identified: none by role; nobody is given a new card; Admin untouched
- [x] Out of scope written down: assigning cards to the Doctor (Settings step), walkthrough steps, any production apply

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 173s

gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`0280`); runner printed `migration numbers: ok`
- [x] `--status` reviewed (1 pending: 0281)
- [x] `--dry-run` reviewed (`0281 … ok`)
- [x] Applied to **dev** and recorded in `schema_migrations`
- [x] File is re-runnable (`on conflict … do update / do nothing`)
- [x] Existing rows still read correctly: no existing row changed
- [x] Exercised in a `begin; … rollback;` harness: a role holding exactly each card held exactly that card's cells, a no-card role held none of the nine, Admin's cells did not move
- [ ] Down-migration — n/a: deleting the four cards' rows from `card_grants`, `card_includes`, `card_features` reverses it; no role holds them
- [ ] Production apply plan — n/a: release manager applies `0281` with the release; `--status --env production` first

## 4. Functional checks

- [ ] Happy path in the app — n/a: no UI surface changed; the cards become visible in Settings → Who does what once released
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: nothing rendered changed
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: the harness covers read versus edit levels per card

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | pass: Admin's cells did not move |
| management | n/a | n/a | n/a: roles are transient groupings of cards; stated by card |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: stated by card |
| volunteer | n/a | n/a | n/a: stated by card |
| signed out | n/a | n/a | n/a: nothing public changed |

- [ ] Every role above tested — n/a: reviewed by card, by harness
- [x] A login holding no cards is refused: a no-card role held none of the nine cells

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual updated — n/a: cards are described in the dictionaries only
- [x] Translatable strings through the dictionaries (`en.ts`, `th.ts`); the Thai was written by the session and not read by a person
- [ ] Mobile viewport — n/a: no layout changed
- [ ] Console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser

## 6. Regression

- [x] Nearest checks still pass: `check-hard-coded-security.mjs` clean, `check-card-walkthrough.mjs` ok, `check-card-grants.mjs` new rows missing none
- [ ] Shared file touched checked from a second page — n/a: no shared component changed
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Decision file: `2026-10-29-vet-cards.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: no role holds the new cards, so nobody would notice until the Director assigns them; the note belongs with that assignment
- [x] Commit messages say why
- [x] Claims measured, not reasoned: the harness was run on dev; production is marked not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: none changed
- [ ] Evidence pasted is the tool's actual output — n/a: nothing pasted
- [ ] Public pages re-checked — n/a: none changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it — deferred: release manager (apply `0281` before the deploy)
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup fresh — n/a: additive rows only
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: reverting the merge is safe; the seeded rows are inert with no holder

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 2 | low | `scripts/check-cards-count.mjs` hard-codes 36 cards and now fails (cards.ts has 40); the brief forbids editing `check-*.mjs` here | deferred to backlog: one number, 36 to 40, owned by `harness-rerun-server-rows`; CI job red until then |
| 1 | n/a | `check-card-grants.mjs` already differs on dev for `photos.resident_medical` / `photos.medical_add` rows from another stream's `0279` side | deferred to backlog: the stream that owns it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the four card names | Settings → Who does what, in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty, or checked by a person — n/a: not yet; one item outstanding

Manual verification by: pending: the Thai card names

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
