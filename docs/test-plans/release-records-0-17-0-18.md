# Feature test plan — release-records-0-17-0-18

## Header

| | |
|---|---|
| Feature | `docs/releases/2026-10-04.md`: the records for **both** of today's releases, `0.17.0` and `0.18.0` |
| Backlog item | none — the record step in `docs/release-procedure.md` §8 |
| Branch / worktree | `claude/release-records-0-17-0-18` @ `C:\Development\Animal_Shelter_release-records-0-17-0-18` |
| Dev server | not started — one markdown file, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | `701136c2` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one new file recording how `0.17.0` and `0.18.0` were cut, deployed and verified
- [x] Files/areas touched listed — `docs/releases/2026-10-04.md` (new) and this plan. No code, no migrations
- [x] Roles affected identified — none: repository documentation
- [x] Anything explicitly **out of scope** written down — the records state gaps, they do not close them. Fourteen unsigned plans across the two releases, the signed-in smoke test, and the public-page cache check for `0.18.0`'s note 6 all remain open

### `0.17.0`'s record is late, and that is itself recorded

`0.17.0` shipped to production and test and **nothing recorded it**. It was
written here, five hours and one release later, which is the failure the file
exists against: a release record has no automated trigger, so it exists only if
someone notices. The record says so in its own opening rather than presenting
itself as contemporaneous, and marks what was lost to the delay — chiefly the
production deploy's own output, which no longer exists anywhere.

The two are in one file because they shipped on the same day, which is how
`docs/releases/` is organised. Writing them together is also what made the
`0.17.0` gap concrete rather than theoretical.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `701136c2` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 285s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR; `0133`–`0139`'s state is recorded *in* the file, from runs made during the releases
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a record is read, not run
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

**What was checked instead, because a record's failure mode is being untrue:**

- [x] Every quoted block is unedited output captured during the releases — both test deploys, the teed production deploy, the Pi logs, the dry-run failure, the drift checks and the cut-script error
- [x] **The `0136` diagnosis was verified, not pattern-matched** — `sees_all_clinical()` is created by `0135_perm_convert_medical.sql` at line 56, found by grepping the pending set rather than by recognising the trap's shape. The record states the distinction `CLAUDE.md` asks for
- [x] **`0133`'s staleness was verified** — `eligibility-load.ts:28` calls `supabase.rpc("role_can", …)`; three of the four `role_can` references in `src/` are comments and the fourth is the call
- [x] **Both release mails were confirmed in the inbox**, not taken from `sent 1` — `0.17.0` at `05:00:29Z`, `0.18.0` at `09:26:36Z`
- [x] **`0.17.0`'s deploy time is labelled as derived**, from the mail's timestamp, because no log of it exists. The record says which rather than presenting it as observed
- [x] The verification bullets for `0.18.0` were each observed: `/api/version` sha against `main`'s HEAD, `HIT` twice in a real browser, no console errors, no Dev badge, both clones and three services
- [x] **The `gh pr checks` discrepancy was confirmed against the API** — `gh run view --json` showed the run `completed`/`success` and `script-integrity` with conclusion `success` while its `status` still read `in_progress`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | documentation is not served by the app | n/a |
| management | nothing | same | n/a |
| staff | nothing | same | n/a |
| vet | nothing | same | n/a |
| volunteer | nothing | same | n/a |
| signed out | nothing | same | n/a |

- [ ] Every role above tested — n/a: the file is not reachable from the app
- [ ] A role that should not have access is blocked server-side — n/a: no access path

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the in-app manual is for shelter users
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — none; `build` compiled the app unchanged
- [x] Any shared file touched checked from a second, unrelated page — n/a in substance: a new file under `docs/releases/`, read by people and by no code. `check-test-plan.mjs` still rejects a release record offered as a feature's gate, and that rule is untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: a record of events
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** — n/a: no shelter user could notice a release record
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — §4 is the list. Three things are labelled as *not* established: `0.17.0`'s production deploy output, which no longer exists; whether `0133`'s misleading note has been seen by anyone else; and whether a code rollback over `0134`–`0139` is safe in function as well as in exposure

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at the next release
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime dates. The record's times are local clock readings and one derived from a mail timestamp, both labelled
- [ ] **Boundary or banding change** — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block, and every block in the record
- [ ] Public pages re-checked after a cache purge — deferred: release manager. Carried into the record as an open item for `0.18.0`'s note 6
- [x] `deploy: production → Supabase project <ref>` line read — **yes, for `0.18.0`**, the first time in four releases: `dbkodyyxxhtygxcxmfcu (701136c2)`, via the `| tee` the procedure now prescribes. Not available for `0.17.0`
- [x] `strip-baked-env` seen in the deploy output — `removed 11 env var(s)`, from the same teed log
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: neither release adds one
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration — n/a: no migration
- [x] Apply plan stated — n/a in substance: nothing to apply
- [x] Rollback position stated — reverting this PR deletes a record of events that happened anyway

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `0.17.0` shipped with no release record, and nothing noticed until the next release was being cut | fixed here, and the record says so in its own opening. The underlying cause — no automated trigger — is unchanged and is QA's standing observation |
| 2 | low | PowerShell's `tee` writes UTF-16, so the captured deploy log is unreadable to `grep` until passed through `tr -d '\000'` | accepted and recorded in the `0.18.0` section, where the next person reading a teed log will meet it |
| 3 | low | `gh pr checks` can report a finished check as `pending` indefinitely; the conclusion is correct while the status is not | accepted and recorded. The safe habit is `gh run view --json`, and the record says why the wrong habit looks like diligence |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That both accounts match what you saw, particularly `0.17.0`'s — it was written after the fact and its deploy time is derived from the release mail rather than observed | `docs/releases/2026-10-04.md` |
| 2 | `0.18.0`'s note 6 on a real public page after the edge cache expires: an adopted resident should be gone from `/adopt` | `lannacare.org/adopt`, ten minutes after the deploy or after a purge |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's; one is a judgement about an account of his own releases and the other needs a live public page after cache expiry

Manual verification by: pending: Lutan on both accounts, and the public-page check for `0.18.0`'s note 6

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-04
