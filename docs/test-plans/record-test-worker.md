# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Update `0.47.10`'s record and handover: test's Worker deployed after all, at the third attempt |
| Backlog item | `docs/backlog.md` → `#tstok`, noted on the `backlog` branch in the same round |
| Branch / worktree | `claude/record-test-worker` @ `C:\Development\Animal_Shelter_google-client-record` — **a free leftover reused** rather than a new worktree for two documents |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `fbd197c71` |

## 1. Scope and risk

- [x] Change is described in one sentence — the record and the handover said test's Worker was left on `0.47.9`; Lutan restored the expired wrangler login, the deploy succeeded, and both documents now say so with the figures
- [x] Files/areas touched — `docs/releases/2026-11-22-0-47-10.md`, `docs/release-handover.md`, and this plan. No code, no schema
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered
- [x] Out of scope — **`#tstok` itself**, which keeps the durable half (a `.env.deploy.test` the env loader can read). The login is a refill, not a fix, and the documents now say which was taken

### Why the record is being changed at all, rather than left as it was written

`docs/release-procedure.md`: *"when the paperwork is overtaken, say so in it… A record that corrects
itself is worth more than one that reads as though nothing moved."* The release's one outstanding item
closed an hour after the record merged, so the record would otherwise permanently misstate the end state of
the release — and the handover would send the next release manager to chase something already done.

**What is deliberately NOT done: pretending the window never happened.** The record keeps the failure, both
error messages, and the hour in which test's Worker was a release behind, and the cost line now reads
**three touches, not two**. An hour's exposure on the fallback is a real fact about this release.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: branch created from `origin/main` at `fbd197c71`, nothing merged in
- [ ] `node scripts/gates.mjs` — n/a: documents-only, so the heavy CI jobs skip and the gates have nothing to compile
- [x] `node scripts/check-release-handover.mjs` — must not print STALE; the handover still names `docs/releases/2026-11-22-0-47-10.md`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha`**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration

## 4. Functional checks

- [x] **The deploy was read from its own output, not assumed** — the project line named the **dev** project `qxkmhwybjggxvsfxsxbd`, which is test's, `Server Actions key ecc41837fc0b` matched test's Pi build, `Current Version ID 8edc3ef1-040f-4670-b3c1-03f9e1c3633a`, `no major release new to test … so no email`, and **exit 0 was read from the command rather than through a pipe**
- [x] **Both of test's endpoints were re-read afterwards** — `/api/version` and `/api/releases/current` both answer `0.47.10`, with `x-lanna-served-by: pi`. **All four hosts now agree on both endpoints**
- [x] **The code-identity check was re-run for the new pair of SHAs** — the test Worker built from `main`'s tip (`cfb1a385e`), not the release SHA, because `deploy.mjs` takes no `--ref`. The allow-list diff `7a1aae4ea..cfb1a385e` is **empty** and the five files that differ are all documents, so the served application code is identical
- [x] **The credential was checked before the ten-minute build, not after it failed** — `wrangler whoami` showed `workers (write)`, `workers_scripts (write)` and `workers_routes (write)`
- [x] **A full build was used, and the reason is recorded** — the leftover `.open-next` was UAT's bundle by then, so `--skip-build` would have pointed test at UAT's database. The opposite call to the earlier retry, where the leftover was test's own
- [x] Empty state / invalid input / boundary cases — n/a: documents have no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: two documents in `docs/`
- [x] **No credential value appears in the change**, and no network value or device identifier either

## 6. Regression

- [x] The pages nearest the change still work — nothing imports these files; `docs/` is not part of any build
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is read by `check-release-handover.mjs`, run above, and by the next release manager. The record's figures, Pi sections and verification sweeps are untouched apart from the test-Worker lines
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: `#tstok` stays open for its durable half, and the note saying option (1) was taken went on the `backlog` branch
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a: nothing is decided here. Which option to take long-term is `#tstok`'s
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody at a shelter sees a release record, a handover or a test deploy.** Neither file is served, imported or rendered
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** `0.47.10` is live on all four hosts on both endpoints
- [x] **Not a gate**, and merged on green without asking, like the record it updates
- [ ] Smoke test / UAT project line — n/a: nothing is deployed

### Rollback

- [x] Rollback position stated — reverting this PR restores two documents that say test's Worker is behind, which is no longer true. **Nothing deployed changes**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | **None in this PR.** The release's own findings stay in its record, with this one now shown as closed and its hour of exposure kept rather than erased | n/a |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **`#tstok`'s durable half** — a `.env.deploy.test` the env loader can read, so the next expiry does not land mid-release | `scripts/lib/env.mjs` | **open**, and not this PR's work |
| 2 | The release's **13 `pending: Lutan` production presses**, the 1 MB logo refusal first | `lannacareforanimals.org`, signed in | **Lutan's**, tracked in the record |

**Nothing in this PR itself needs a person to look at it.**

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the deploy's own output, both of test's endpoints, the code-identity diff, `wrangler whoami`, `check-release-handover.mjs` and `check-test-plan.mjs --base origin/main`
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance: two documents, nothing on screen. **The one human action in the story — the browser login — was Lutan's and is recorded as such**

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the release is complete on all four hosts; `#tstok` carries the one thing that would stop it recurring

Result: pass
