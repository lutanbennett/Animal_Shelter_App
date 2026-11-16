# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Correct the `0.47.1` record now that production's Worker is deployed |
| Backlog item | n/a: no item belongs to this PR. **`#v0302` was checked and deliberately not ticked** — see §7 |
| Branch / worktree | `claude/record-0-47-1-complete` @ `C:\Development\Animal_Shelter_cut-release-0-47-1` |
| Dev server | n/a: markdown only |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | `84e614b2d` — the tip of `main` this branch was cut from |

## 1. Scope and risk

- [x] Change is described in one sentence — four places in `docs/releases/2026-11-16-0-47-1.md` that said production's Cloudflare Worker was not deployed now say it is, with the lines read from its own log, and a note saying what was corrected and why
- [x] Files/areas touched — that record and this plan. No code, no migration, no string, no backlog edit
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: nothing in this PR is served, imported or rendered, and no card gates a file under `docs/`
- [x] Out of scope, written down so the release manager is not surprised — **the release is complete; this is the record catching up with it.** The `401` that made the first run fail is left standing as defect 1, because it happened and it cost a touch; what changed is only that the retry succeeded

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branched from `origin/main` at `84e614b2d` minutes earlier, so there was nothing to merge in
- [ ] `node scripts/gates.mjs` — n/a: **a documents-only PR skips the heavy CI jobs** by design, and the gates ran in full on the cut
- [ ] CI green on the PR — n/a: the PR does not exist at this commit. **Before merging, the run for this HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. The release's nine were applied and verified before its deploys, and that is recorded

## 4. Functional checks

- [x] Happy path works end to end — **the claim this PR makes was measured, which is the whole content of it.** Production's `/api/releases/current` answers `0.47.1`, its `/api/version` answers `0.47.1`, and `x-lanna-served-by` is `pi`. From the deploy's own log: the project ref is `dbkodyyxxhtygxcxmfcu`, `strip-baked-env` removed 14, the Server Actions key is `cbd55beae8d8` — **the same fingerprint production's Pi build printed** — and the mail line reads `no major release new to production (was 0.47.0), so no email`
- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: this PR adds no page, control, form or stored value

### Role access matrix

- [ ] Every login tested — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no nav entry, manual topic, string path or component. Nothing a browser loads

## 6. Regression

- [x] The pages nearest the change still work — nothing imports a release record; `grep -rn "docs/releases" src/ worker/` finds no reader
- [ ] Shared file touched, checked from a second unrelated page — n/a: a release record is not shared code
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [x] Backlog item ticked on this branch — **none, and `#v0302` is the one that was checked and deliberately left open.** Its own text says **two** things keep it open and neither is code: *(1) the production Worker deploy, which is Lutan's* — **now done by this release** — and *(2) the wildcard condition in this item's own done-when is still not answered*, measured 2026-11-16 as *"Not verified, and not assumed"*. **(2) is untouched by this release, so a tick would be false.** The half that closed is noted on the `backlog` branch instead, where a reword belongs, so the next planner sees one condition left rather than two
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a separate file: the only judgement here is whether to correct a merged record or let the next edition do it, and the runbook already rules on that (*"when the paperwork is overtaken, say so in it"*). The correction note in the record is that reasoning, in place
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a correction to a release record. The file is not served, imported or rendered, and no behaviour changes
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the deployed version from both endpoints and the served-by header; the key, ref, env-var count and mail decision from the deploy's own log; the code identity from the allow-list diff over `3dde3e2eb..84e614b2d` **and** its complement, re-run for the second move rather than assumed to still hold

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR ships nothing; the release's five builds and their three SHAs are named in the record
- [x] Deployed SHA matches the tested SHA — **answered as code identity, not SHA equality, and re-answered for the second move of `main`**: `3dde3e2eb..84e614b2d` over the allow-list of everything built or run at deploy is **empty**, and its complement is six documents

### On the deployed build

- [ ] Deployed to test / smoke-tested / public pages re-checked after a purge — n/a: this PR ships nothing. Done for the release and recorded, including the byte-for-byte asset check on all three Pi clones after both zones were purged
- [ ] Timezone-sensitive behaviour — n/a: this PR derives no date
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff
- [x] Evidence pasted here and in the record is the tool's actual output, unedited

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read / `strip-baked-env` seen / new secrets exist — n/a: this PR deploys nothing. **All three were read on the production deploy itself** and are quoted in §4 and in the record
- [x] **No secret or environment variable was added by this release**, so no `--secrets` push was needed or made

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR. Run for the release, and its five rollback-caused FAILED lines were read rather than obeyed
- [ ] Destructive or rewriting migration: a fresh backup exists — n/a: no migration in this PR. None of the release's nine rewrites a row at apply time, and the backup gate was met from Drive regardless

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR restores four sentences to a less accurate state and changes nothing a user or the app can reach.** The release's own rollback is unchanged and is in the record

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | — | None found by this PR. The release's two are recorded in the record and unchanged: the production deploy's Cloudflare `401`, and `0387` breaking `dev-signin --cards` (`#dvsgn`) | both accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The nine items the record lists under *What is not tested*** — the e-Donation screens on a real login, the Sold out badge at phone width, the Shelter Friends map on a phone, the order-flood wording, a public page on test, the canary secret, the accountant's answer, `0.47.0`'s carried-forward items, and the unread Thai | Lutan, and a Thai reader |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: Lutan for the nine items the record lists, and a Thai reader for the unread wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager, and with production's Worker deployed the release has no outstanding step

Result: pass
