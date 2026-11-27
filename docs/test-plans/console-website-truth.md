# Feature test plan

## Header

| | |
|---|---|
| Feature | The console's website step ticks only when the address answers; the product name links home |
| Backlog item | `docs/backlog.md` → `#hsttk`, `#cnhom` |
| Branch / worktree | `claude/console-website-truth` @ `C:\Development\Animal_Shelter_console-website-truth` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | opened after this commit |
| Tested by / date | Claude (Sonnet 5.5), 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 5ffcc3a68 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/platform/ProductAdminPanel.tsx`, `actions.ts`, `layout.tsx`, new `ProductHomeLink.tsx`; both dictionaries; `src/lib/releases.ts`
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected: no card; the console is the product-administrator list (a named exception outside the card system). Signed-out visitors to the public product pages see the new home link only
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: making `test555` answer is `#hstau`, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` is `0`:

```
=== gates: typecheck exited 0 after 153s
=== gates: lint exited 0 after 275s
=== gates: test exited 0 after 36s
=== gates: build exited 0 after 133s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: driven in headless Chrome as the dev product administrator at aal2; `test.lannacare.org` showed "✓ Answers" and Ready; four `.example.invalid`/`.example.org` shelters showed "✗ Does not answer yet" with "Next step: Has a web address"
- [x] Data persists — reload the page and the change is still there: the probe re-runs on every load and gave the same answers on two separate loads
- [ ] Create / edit / delete — n/a: nothing is written; the probe is a read
- [x] Empty state renders sensibly (no rows yet): a shelter with no address keeps the existing "No website yet" line and no probe is sent for it
- [ ] Invalid input rejected — n/a: no input; `checkShelterHosts` drops any host no shelter has before fetching
- [x] Boundary cases checked: unknown answer (probe in flight or failed) counts as not done; archived shelters are not probed

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/platform` as a product administrator at aal2 | cards with answers | pass |
| exactly no card, not a product administrator | `checkShelterHosts` | refused `notProductAdmin` before any fetch (same guard as `checkShelterHost`) | pass, read in code |
| signed out | `/platform/about` | home link absent on the home page, present on feature pages | pass |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side: the action checks `isProductAdmin()` and `hasTwoStep()` before reading or fetching

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav entry changes
- [ ] Manual updated — n/a: the console is not in the shelter manual
- [x] Translatable strings go through the translation path: `platformHomeLink` added to `en.ts` and `th.ts`; the Thai feature page's link read `แพลตฟอร์ม CooperJaidee: ไปที่หน้าแรก` and pointed at `/th/platform/about`
- [ ] Mobile viewport — n/a: the status text sits inline after the existing link in a wrapping `dd`; no new layout
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work: `/platform`, `/platform/about`, `/th/platform/features/medical`
- [x] Any shared file touched checked from a second, unrelated page: the dictionaries, by loading the Thai product feature page
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync reported already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-27-console-website-truth.md`
- [x] `README.md` still accurate
- [x] **Release notes.** One `admin: true` note in `unreleased` covering both items
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing depends on the date
- [ ] Boundary or banding change — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] Supabase project ref read — deferred: production release manager
- [ ] `strip-baked-env` seen — deferred: production release manager
- [ ] Any new secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Fresh backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: code only, so redeploying the previous ref reverts it entirely

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First lint run flagged a synchronous `setState` in the probe effect | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `test555` card reads "✗ Does not answer yet" and "Next step: Has a web address" on the real console | production `/platform`, after the release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan to look at the test555 card after release

Manual verification by: pending: Lutan to look at the test555 card on production after the release

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: picked up at the next release cut

Result: pass

Release manager acknowledgement: pending: next release cut
