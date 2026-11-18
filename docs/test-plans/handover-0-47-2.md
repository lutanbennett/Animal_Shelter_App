# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release handover written after `0.47.2` — `docs/release-handover.md` |
| Backlog item | n/a: a handover closes no backlog item |
| Branch / worktree | `claude/handover-0-47-2` @ `C:\Development\Animal_Shelter_handover-0-47-2` |
| Dev server | n/a: no code in this PR |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | the handover commit on this branch; the releases it describes are `3dde3e2eb` and `854891267` |

## 1. Scope and risk

- [x] Change is described in one sentence — `docs/release-handover.md` is rewritten as a delta covering **two** releases, `0.47.1` and `0.47.2`, plus this plan
- [x] Files/areas touched — those two documents. No code, no schema, no configuration
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: a document in `docs/` is not served, imported or rendered. No card gates it
- [x] Out of scope, written down — **this PR should not exist separately and says so in its own first paragraph.** Rule 3 of *The paperwork has a time budget too* puts the handover in the record's PR; `0.47.2`'s record merged as #1681 without it, so this is a second PR and a second CI cycle, which is the cost that rule exists to avoid. **`0.47.1` skipped the handover entirely**, which is why this edition covers two releases

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was branched from `origin/main` minutes earlier, after the record merged
- [ ] `node scripts/gates.mjs` — n/a: **this PR changes no code.** `typecheck`, `lint`, `test` and `build` all read `src/`, `worker/` and `scripts/`, none of which is touched. CI's `changes` job classifies the PR docs-only and skips the heavy jobs for the same reason
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written
- [ ] CI green on the PR — n/a: not yet at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [ ] Audit — n/a: neither `package.json` nor `package-lock.json` changes, so CI's `audit` shows `skipped`, which is not a pass and is not meant to be. The release's own audit is recorded in `docs/releases/2026-11-18-0-47-2.md`

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value

## 4. Functional checks

- [x] Happy path works end to end — the handover's claims were taken from tool output, not memory. The ones most likely to be relied on were re-read while writing it: all three hosts' `/api/version` and `/api/releases/current`, `--status` on production and UAT, and the Pi's own `uptime -s` and `journalctl --list-boots`
- [x] **The one claim that was re-measured rather than carried** — the previous edition said the Pi's power alarm should be *"re-read next release instead of repeating the alarm"*. It was: **up 5 days 17 hours, booted 2026-11-12 15:04, no reboot since**, and `journalctl --list-boots` now lists three boots, so the journal **is** persistent — correcting a note carried since `0.44.2`
- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: a document stores nothing and has no controls

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no server action

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: nothing in this PR is rendered anywhere

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check. The nearest constraint is rule 4's ceiling on the handover's own length (**aim ~100 lines, treat 150 as the limit**), checked against the file rather than estimated
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is replaced rather than appended. Everything still open in the previous edition was carried forward or explicitly closed: `#uatwk` and `table-policy-commands` are closed, the Thai sign-off, the rate-limit rule, the foundation document store and the PromptPay id are carried, and the Pi reboot alarm was re-read
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a handover ticks none. `#shtci` is named in it for the planner, as Lutan directed
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the handover *is* the write-up, and it cites decisions rather than restating them
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a handover is internal working material for the next release chat. It touches no page, no card and no data, and nobody using the app can reach it
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — see §4, and the handover cites each release's record for anything it does not measure itself

## 8. Pre-production gate

- [x] **Both releases it describes are already live and verified** — all three hosts answer `0.47.2` @ `854891267` on the Pi endpoint and `0.47.2` on the Worker endpoint, all `x-lanna-served-by: pi`
- [ ] Deployed SHA / deploy safety / migration ordering / rollback — n/a: **this PR is never deployed.** It is a document, and no Pi build or Worker deploy follows it
- [x] Evidence quoted in the handover is the tool's actual output, unedited

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (process, no user surface) | **The handover was skipped entirely on `0.47.1` and missed on `0.47.2`'s record PR**, so `docs/release-handover.md` described `0.47.0` for three days across two releases. Nothing detects this: `check-test-plan.mjs` validates plans, not handovers, and a stale handover reads exactly like a current one. It was found only because Lutan asked | **fixed here for the content** — this edition covers both releases and names the miss in its own opening lines. **The gap in the process is not fixed**: there is still no check, and worth a backlog item for the planner rather than a script written inside a release |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** The thirteen person-checks the two releases leave open are listed in `0.47.2`'s record under *What is not tested* and summarised in the handover; they belong to their own plans and signatures, and are deliberately not copied here as a second home nothing closes | `docs/releases/2026-11-18-0-47-2.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-18

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty: this PR adds two documents and there is nothing for a person to look at in it

Manual verification by: n/a: a handover has no rendered surface and is read only by the next release chat; the releases it describes were verified on all three hosts before this PR existed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects
