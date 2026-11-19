# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release record for `0.47.4` — the smoke test filled in, and the IPv6 fault measured either side of its fix |
| Backlog item | n/a: a release record closes no backlog item |
| Branch / worktree | `claude/record-0-47-4` @ `C:\Development\Animal_Shelter_record-0-47-4` |
| Dev server | n/a: docs-only, nothing is served or rendered |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | the branch head; branched from `main` after `a50122039`, the release commit |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/releases/2026-11-19-0-47-4.md`, the filled-in smoke test for a release that **landed completely on every site and every Worker**, and that also closed `0.47.3`'s undeployed production fallback
- [x] Files/areas touched — `docs/releases/2026-11-19-0-47-4.md` and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the record is a document. Not served, imported or rendered; it gates nothing and changes no behaviour
- [x] Out of scope — this PR deploys nothing. It does not close `#pdmin`, and it does not edit any applied test plan: `calendar-connect-screen`'s release-note reason is now out of date because `#cn7gk` closed, and that is recorded in the record rather than fixed in its file, since an applied plan is a historical record

### Why this record is worth reading even though the release went well

The two before it both ended awkwardly — `0.47.2` had to invent a note to cut at all, `0.47.3` lost its
production Worker to a network fault and a merging stream. **This one finished cleanly, and it did so
while the same network fault was still present for the first half**, which turned the release into a
better-controlled experiment than anything the previous record could offer. The record sets out the
before-and-after in a table, and corrects something `0.47.3`'s record was too confident about.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: branched from current `origin/main` by `worktree.mjs new`, nothing merged in
- [ ] `node scripts/gates.mjs` — n/a: **docs-only.** No TypeScript, lint target, test or build input changed. The four gates ran in full on the cut PR (#1721), the commit this record describes: `typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. **The release itself carried none either**, which is recorded in the record as the reason it was simpler than its two predecessors

## 4. Functional checks

- [ ] Happy path / data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: **a release record has no surface.** It is a file in `docs/`, not served, imported or rendered, and no route reads it
- [x] **Every figure in it was read from a tool's own output in this session, which is this document's equivalent of a functional check** — the versions and SHAs from `/api/version` and `/api/releases/current` on each host before and after; the migration counts from `--status` on both databases; the Server Actions fingerprints from each of the three Worker deploys and each of the three Pi logs; the asset bytes from `check-assets.mjs` run on the Pi after the purge; the Cloudflare Version IDs from the three deploy logs; Lutan's own deploy lines read from his terminal; the "build is alive" judgement from `Get-CimInstance Win32_Process` rather than from the log; and the IPv4-versus-IPv6 counts from the failures themselves rather than estimated

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the record adds no route and no card reads it

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path is touched by a document in `docs/releases/`

## 6. Regression

- [ ] The pages nearest the change still work / shared file touched / nothing merged from `main` was broken — n/a: nothing imports `docs/releases/`, no shared file is touched, and nothing was merged into this branch

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a for the record itself. **`#cn7gk` was ticked by #1718 inside the release**, and `#swrun`'s production step was corrected on the `backlog` branch when `0413` reached production in `0.47.3`
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the record *is* the write-up. It makes one correction to a previous record (`0.47.3` treated the font failures and the Cloudflare failures as one symptom; the measurements here separate them) and that correction belongs in the record, where the next release manager reads
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a release record. The file is not served, imported or rendered and no behaviour changes. **This release's two notes shipped in the cut PR (#1721) and mailed nobody**
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — see §4. Two in particular: *"the release landed completely"* is read from both endpoints on all three hosts after the deploy, not from the deploy scripts reporting success; and *"the IPv4 preference fixed the Cloudflare failures"* is a count of failures either side of the change within one release, not an inference from the first clean run

## 8. Pre-production gate

- [ ] Every line in this section — n/a: **this PR ships no code to any environment.** The release it describes was deployed before it was written, and all three hosts were re-read at the time of writing: `0.47.4` @ `a50122039` on every site, `0.47.4` on every Worker, `x-lanna-served-by: pi` throughout

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (network, deploy machine) | **The test Worker upload failed on a Cloudflare API timeout** after a clean build | **retried with `--skip-build` and uploaded in 5 seconds.** The reuse was proved by the retry printing the same Server Actions key. Root cause is the IPv6 preference, measured in the record |
| 2 | medium (operational) | **The Pi became unreachable by both routes and the first UAT Pi build never started** | **diagnosed, not assumed** — three `x-lanna-served-by: pi` answers proved the Pi was healthy, and the UAT clone's HEAD proved the build had not merely failed. Meshnet was restored by Lutan and the build landed |
| 3 | medium, carried forward and now wider | **Nobody is a product administrator on production and no script places the first one** (`#pdmin`). This release publishes a **second** capability on that screen, so the whole onboarding chain is built and unstartable | **found, filed, raised again here.** Not fixed inside a release: whose account is first is Lutan's call, and it wants an account that already has an authenticator |
| 4 | low (tooling, recurs) | **`deploy.mjs --plan` reports the mail decision without reading the release's own `major` flag**, and **`check-deferred-notes.mjs` ignores the commit range it is given** | **found, not fixed.** Both are cosmetic, both recur every release, and both are better fixed outside one |
| 5 | low (release manager's own) | **The `netsh` command was handed over with a trailing backslash** and failed with *"The parameter is incorrect"* | **corrected by Lutan, who spotted it.** Recorded because the lesson is general: a command is not verified until it is verified as the person will paste it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Who the first product administrator is, and whether that account already has an authenticator** — defect 3, now covering two published capabilities | Lutan, then the `#pdmin` script |
| 2 | **The `aal2` presses on `/admin/product-admin`**, including this release's Admin-role-and-first-login step. `shelter-admin-role-app` leaves them `pending:` | Lutan, with an authenticator |
| 3 | **A second shelter's Drive on a real screen.** #1718 proved the upload through the real photo route, which is strong, but no person has driven it | Lutan |
| 4 | **Thai that nobody independent has read** — the standing gap, seventh release running (`#y1dqu`) | a Thai reader, and Lutan to sign |
| 5 | **The items carried forward from `0.47.1`, `0.47.2` and `0.47.3`**, listed in the record | Lutan |
| 6 | **That this record reads true to the person who ran the production deploy** | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: Lutan for the first product administrator and the aal2 presses, a Thai reader for the dictionaries, and the items carried forward from 0.47.1 to 0.47.3

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager, and **this release has no outstanding deploy step**: every site and every Worker is on `a50122039`

Result: pass with accepted defects
