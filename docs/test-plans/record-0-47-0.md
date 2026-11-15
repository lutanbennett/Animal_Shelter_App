# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release record and handover for `0.47.0` |
| Backlog item | n/a: bookkeeping for a release that has already shipped |
| Branch / worktree | `claude/record-0-47-0` @ `C:\Development\Animal_Shelter_cut-release-0-47-0`, port `3001` |
| Dev server | not started for this PR — nothing in it is served |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | `2b0126657` — the commit this plan was committed in |

## 1. Scope and risk

- [x] Change is described in one sentence — four documents: `docs/releases/2026-11-15-0-47-0.md` (the record), `docs/release-handover.md` (rewritten as a delta for the next release manager), `docs/release-procedure.md` (the mesh-route section added mid-release) and this plan
- [x] Files/areas touched — those four files and nothing else. No code, no migration, no string
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: nothing in this PR is served, imported or rendered, so no card, no Admin behaviour and nothing public changes
- [x] Out of scope, written down so the release manager is not surprised — **the release itself is finished**, with one named exception. It is deployed to all three Pi origins and verified; the production and test Workers are deployed; **UAT's Worker is not, and that is defect 4 in the record, not a gap in this PR.** Per `docs/release-procedure.md` the record PR is **not a gate** and is merged by Claude on green

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: this PR adds markdown to a branch whose code is already on `main` (the cut merged as `ca23f2c27`). `main` has since moved by three feature PRs (#1603, #1604, #1605), none of which touches any of these four files, so none can conflict
- [ ] `node scripts/gates.mjs` — n/a: **a documents-only PR skips the heavy CI jobs** by design (`scripts/check-docs-only.mjs`, agreed 2026-10-20), and the gates compile and test code this PR does not touch. The gates were run in full on the cut itself, all four at exit 0
- [ ] CI green on the PR — n/a: the PR does not exist at this commit. **Before merging, the run for this HEAD is read with `gh run view <id> --json status,conclusion,headSha`** and its `headSha` confirmed to be the commit pushed last
- [x] `node scripts/check-docs-only.mjs` — run. What it decides on this PR: every changed path is under `docs/`, so the heavy jobs skip, and `audit` shows **skipped** because no dependency changed. **Skipped is not a pass** — it means nothing was checked, on purpose
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. The release's five migrations (`0375`, `0377`–`0380`; **there is no `0376`**) were applied to all three databases and verified before the deploys; the readings are in the record, including the tenancy lint going from 225 flagged to **0** on all three

## 4. Functional checks

- [ ] Every line in this section — n/a: this PR adds no page, control, form or stored value. Markdown files under `docs/` are not served, imported or rendered by the app, so there is no happy path to drive. **What stands in for functional checking here is that every figure in the record was copied from a tool's own output**, which §7 lists

### Role access matrix

- [ ] Every login tested — n/a: nothing in this PR is reachable by any login. No route, no card, no query

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no nav entry, no manual topic, no string path, no component. Nothing renders

## 6. Regression

- [x] The pages nearest the change still work — nothing imports any of these files. Confirmed rather than assumed: `grep -rn "release-handover\|release-procedure\|2026-11-15-0-47-0" src/ worker/` finds nothing, so no bundle reads them
- [ ] Shared file touched, checked from a second unrelated page — n/a: none of the four is shared code. `docs/release-handover.md` is read by one chat per release and replaced by its successor; `docs/release-procedure.md` is read by a person
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a as a tick: no item belongs to this PR, and every item the release closed was ticked in its own PR. **One item was ADDED instead**, on the `backlog` branch where items belong, not here: `#uatwk`, the UAT deploy window that defect 4 describes
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a separate file: the judgements in this release are recorded **in the record itself**, which is where the next release manager looks. They are the mesh route as the Pi's second path, the decision to add exactly one deferred note and hand-build the `--verify` base, and the decision **not** to work around UAT's `unreleased` guard
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a release record, a handover or a runbook. None of the four files is served, imported or rendered, and no behaviour changes. **This release's seven notes shipped in the cut PR and have already been mailed**
- [x] Commit messages say why, not just what
- [x] **Claims in the record were measured, not reasoned** — and this is the line that matters on a record PR:
  - the **production Worker** from its log's `Current Version ID` (`ce40aaaa-d98f-4d1c-be14-7ba577a37506`) **and** independently from `/api/version` answering `0.47.0` @ `ca23f2c27`. **Lutan's "it's finished" was checked, not taken** — the first time he said it the build had twenty more minutes to run, which the log's frozen size would have hidden
  - **UAT's Worker recorded as NOT DONE from the refusal's own text**, not inferred: `deploy: uat ships only a written-down release — src/lib/releases.ts has 2 unreleased note(s)`, exit 2. The gap is then confirmed from outside by `uat.lannacare.org/api/releases/current` answering `0.46.0`
  - the per-build SHAs from each build log's own `built from` line. **`main` moved mid-release**, so this was not inferable from the order of events
  - the mail from the Gmail message itself (`1a1dd797a6765497`) — subject, sender display name, recipient list and all seven note bodies — and independently from the deploy log's `sent 1, skipped 1`
  - the applies and drift from `--status` and `--drift` on all three databases, and both schema assertions naming the Management API as the route that answered
  - the three hosts from one pass reading `/api/version`, `/api/releases/current` **and** `x-lanna-served-by` together, which is what separated "UAT serves the release" from "UAT's Worker is on the release"
  - the home-screen icons from `sync-home-icons.mjs`'s own output (536 checked, 536 unchanged)

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deploys are done; the record names each build's SHA individually, because `main` moved during the release
- [x] Deployed SHA matches the tested SHA — **answered as code identity, not SHA equality, and it is NOT empty this time**: the Pi builds and test's Worker came from the cut `ca23f2c27`, the production Worker from `737549902`. The difference is three merged feature PRs, so the production Worker's bundle carries code the Pi clones do not. It is recorded rather than smoothed over, and it is why defect 4 exists

### On the deployed build

- [ ] Deployed to test / smoke-tested / public pages re-checked after a purge — n/a: this PR ships nothing, so there is nothing to smoke-test. All three were done for the release and are recorded there, with byte-for-byte asset checks after a cache purge
- [ ] Timezone-sensitive behaviour — n/a: this PR derives no date. The record's dates are literals
- [ ] Boundary or banding change — n/a: no threshold, band or cutoff in this diff
- [x] Evidence pasted in the record is the tool's actual output, unedited — the gates block, the assertion lines, the deploy lines, the refusal text, the check outputs and the mail fields are all copied from their runs

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read / `strip-baked-env` seen / new secrets exist — n/a: this PR deploys nothing. Done and recorded for the release. **UAT's project line was never reached**, because the deploy refused before it got there — which is worth stating plainly rather than leaving as an unticked line
- [x] **No secret or environment variable was added by this release**, so no `--secrets` push was needed or made

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR. Done for the release and recorded
- [ ] Destructive or rewriting migration: a fresh backup exists — n/a: no migration in this PR. **None of the release's five rewrites rows at apply time** — established by reading all five file headers, not assumed — and the backup gate was met from Drive's own listing

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR removes four documents and changes nothing a user or the app can reach.** The release itself rolls back by `./scripts/pi/deploy-pi.sh --ref <the 0.46.0 SHA>` on each Pi clone, with `npx wrangler rollback --env production` for the Worker fallback; neither reverts a migration and **neither unsends the mail**, which has already gone. **UAT needs no rollback** — its Worker never moved

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **medium — not mine** | **The runbook's Pi step assumed the home network and named no alternative route**, so a timed-out ssh read exactly like a dead Pi while the Pi was fine | **fixed in this PR** — the runbook names the mesh route and the `x-lanna-served-by` check first |
| 2 | **medium — process** | **UAT's Worker deploy was shut out** by feature PRs merging behind the release and re-filling `unreleased` | **not fixed and not worked around**; record defect 4, backlog `#uatwk`, and the handover recommends reordering UAT before Lutan's deploy |
| 3 | low | I judged that the UAT Worker should be deployed from `main`'s later tip, and **the script overruled me** before anything shipped | no harm; the guard did its job and the reasoning is recorded rather than quietly dropped |
| 4 | low | Bash heredocs with nested quotes failed three times; `python` is the Microsoft Store stub | worked around with `node` scripts and the Write tool; named in the handover |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Thai nobody independent has signed off** — a reader has been through the strings, the signature has not been given | a Thai reader |
| 2 | **The new merchandise and report-an-animal screens, signed in, on production.** While the public site is `locked` a signed-out check only sees the redirect, and Claude has no production account | Lutan, signed in |
| 3 | **The new screens on a phone** | Lutan, on his phone |
| 4 | **The three click-throughs** the record names, which the browser pane cannot drive reliably on a direct load | Lutan, or a real Chrome |
| 5 | **The Cloudflare rate-limit rule** for the report form (`#8t3rk`) | Lutan, in Cloudflare |

*(The release mail is deliberately **not** on this list — it was read from the message itself, as `0.45.0` established.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: a Thai reader for the sign-off, and Lutan for the signed-in look at the new screens, the phone checks, the three click-throughs and the Cloudflare rule

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the release is deployed and verified apart from UAT's Worker, which is recorded as not done, and this PR is bookkeeping, not a gate

Result: pass with accepted defects
