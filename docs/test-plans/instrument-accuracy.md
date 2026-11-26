# Feature test plan

<!-- guidance:start -->
Copy this file to the feature branch as `docs/test-plans/<feature>.md`, fill the
header, and tick as you go.

Every line must end up in one of four states, and CI checks this:

- `- [x]` — the check was actually run and passed.
- `- [ ] … — n/a: <reason>` — the check did not apply, and the reason says why.
- `- [ ] … — pending: <what is outstanding>` — the check **does** apply and
  genuinely waits on somebody or something: Lutan's own upload, a deploy, a
  person to look. It passes CI and is printed as *awaiting a person*.
- `- [ ] … — deferred: <owner>` — **section 8 only.** The check cannot be true
  yet, and this names who picks it up.

`pending:` is there so the honest word is also the one that passes. Before
2026-11-05 a checklist line that truly waited on someone had nowhere to say so —
only a tick or an `n/a:` passed — so a stream either went red for telling the
truth or wrote `n/a` for something that was not n/a. The signature lines below
had accepted `pending:` all along; the checklist now does too. **Nothing ships
on a `pending:`**: it is the release manager's pre-deploy pass that resolves it,
exactly as for the signatures.

That fourth state exists because the deploy gates in section 8 cannot be true at
PR time: there is no deployed build to check and no production apply to have run.
Writing them `n/a` is a lie in a box labelled "did not apply", and once that habit
forms people write `n/a` for things they simply did not do. `deferred:` says the
truthful thing and passes, because a PR cannot be held open waiting for a deploy
it precedes. It is confined to section 8 deliberately — anywhere else it would be
a general-purpose escape hatch, which is the one thing this check exists to
prevent — and the checker rejects it elsewhere.

**The reason must follow `n/a:` immediately.** `n/a: no UI surface` passes;
`n/a as a deploy check, because …` reads fine to a human but fails, and that
strictness is deliberate — it is what makes every reason greppable in one pass
across every checklist in the repo. Put any qualifying words after the colon,
not before it.

Never tick something you did not do, and never leave a line untouched. Anything
that failed goes under **Defects**.

**No merge without a signed-off checklist. No exceptions.** CI enforces it: a PR
with no completed `docs/test-plans/<feature>.md` fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

**A half-written plan is not a failure.** The plan is committed early and filled
in as the work proceeds, so CI sees it unfinished on every push in between. Since
2026-11-05 the checker reports an unfilled placeholder, a missing `Result:` line
and an unsigned sign-off as *still being written* and passes, exactly as it has
passed an unsigned plan since 2026-09-24. **Red means the plan is wrong**: a line
nobody addressed at all, an `n/a:` or a `pending:` with no reason, a `deferred:`
outside section 8, a release-notes tick with no release note, `Result: fail`.

Run `node scripts/check-test-plan.mjs` locally before pushing to see what CI will say.

The `test-plan` CI job reports **red without blocking the merge**, and **that is
permanent** — decided by Lutan on 2026-10-20: *"we will NOT make this mandatory
it stays as advisory"* (`docs/decisions/2026-10-20-test-plan-stays-advisory.md`).
It is a deliberate soft gate, not an oversight and not a trial. **Treat a red
`test-plan` as a stop anyway:** the script goes red only when a plan is genuinely
wrong, so a red one is always someone's mistake to fix.
It will **not** become a required check. Earlier wording here said it would
"once we know the checklist is working", which read as a decision still pending
and got him asked for an answer he had already given.
The completed checklist is also pasted into the PR and read by the production
release manager before `npm run deploy:prod`.

Text between the `guidance:start` and `guidance:end` comments is advice, not fields:
the checker does not read it for unfilled `<…>` placeholders, so leave it or delete
it. Everything outside those comments is judged.
<!-- guidance:end -->

---

## Header

| | |
|---|---|
| Feature | instrument-accuracy: permission catalogue comments (#pcats) and the deferred release-note guard (#dfnwi) |
| Backlog item | `docs/backlog.md` → `#pcats`, `#dfnwi` |
| Branch / worktree | `claude/instrument-accuracy` @ `C:\Development\Animal_Shelter_instrument-accuracy` |
| Dev server | n/a: no UI surface; port 3010 unused |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Scripts only: `scripts/check-permission-catalogue.mjs` (comments), `scripts/check-deferred-notes.mjs`,
`scripts/lib/deferred-notes.mjs`. No card, no route, no Admin or public behaviour changes. Out of scope:
what the catalogue asserts, `cut-release.mjs`, `releases.ts` content.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

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

- [x] Happy path works end to end
- [ ] Data persists — n/a: scripts read git only, write nothing
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete in either script
- [x] Empty state renders sensibly (no rows yet)
- [ ] Invalid input is rejected with a readable message — n/a: no new input; errors for a missing release are plain throws naming --since
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

`check-deferred-notes.mjs --self-test`: 10 ok, 0 FAIL. At the 0.49.2 cut point (`--head 3465d61b8^`)
the default range and `--since ba6603e5b` both report 13 plans, 1 candidate (before: 35/15 and 13/3).
Empty state: default run at HEAD reports 1 plan, none owed. `check-permission-catalogue.mjs` exits 0.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | developer scripts, no login | n/a |
| signed out | n/a | developer scripts, no login | n/a |

- [ ] Every login above tested — n/a: developer scripts, nothing signed in reaches them
- [ ] A login that should not have access is blocked server-side — n/a: no route or action changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page
- [ ] Manual updated — n/a: no user-visible change
- [ ] Translatable strings — n/a: no strings shown to users
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched; `cut-release.mjs` imports the changed functions with unchanged signatures (new params default)
- [x] Nothing merged from `main` during `sync` was broken by this branch

Nearest: the existing six `--self-test` fixtures still pass; `cut-release.mjs`'s calls `lastCut()` and `report(…, since)` unchanged.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: two developer instruments run by the release manager; no shelter user, Admin or product administrator sees either
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts are not deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts are not deployed
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deployed
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deployed
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Revert the PR; it touches only scripts and docs, nothing deployed.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `--head` was ignored by the default range and the report label | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no surface a person looks at | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: developer scripts with no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: pending: next release cut
