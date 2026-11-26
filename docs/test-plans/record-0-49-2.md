# Test plan — release record and handover, `0.49.2`

## Header

| | |
| --- | --- |
| Feature | The `0.49.2` release record, `docs/release-handover.md` rewritten, and the cut plan's pre-production gate finished |
| Branch | `claude/record-0-49-2` |
| Tested SHA | `5344c037a` — the release this record describes, live on all four hosts |
| Environments | none: this PR is three markdown documents |
| Author | Claude (release manager) |
| Date | 2026-11-26 |

## 1. Scope and risk

**This PR is not a gate and must not be presented as one.** By the time it exists, `0.49.2` is cut,
merged, migrated, deployed and verified. It describes a release that already shipped (`CLAUDE.md`,
"Every PR merges on green").

Three files, all documents:

- `docs/releases/2026-11-25-0-49-2.md` — the record
- `docs/release-handover.md` — rewritten, 131 lines against a 150-line ceiling
- `docs/test-plans/cut-release-0-49-2.md` — the cut plan's pre-production gate, finished

**It carries one correction that matters more than the bookkeeping.** The cut plan, the cut commit
message and PR #1890's body all stated that production's `PUBLIC_SITE` floor lifts when the
production Worker deploys. It does not: the variable is `where: "pi"` in
`scripts/lib/runtime-config.mjs` and `write-env.mjs` applies it into the Pi's env file at **build**
time, so it lifted at the production Pi build. The real public website was reachable from the
internet as a result. Both documents lead on that rather than footnote it.

- [x] Risk assessed — **nothing is served, imported, rendered or executed from any of the three
  files.** No code, no schema, no copy a user sees
- [x] Boundary cases checked — n/a: no logic

## 2. Automated gates

- [x] `check-docs-only.mjs` will mark this PR documents-only, so the heavy jobs skip — expected, and
  skipped is not a pass: it means nothing was checked, on purpose
- [x] `audit` will show **skipped**: no `package.json` or `package-lock.json` change
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run locally before pushing, the way CI
  runs it
- [x] `node scripts/gates.mjs` — run, exit 0 on all four
- [ ] CI green on the PR — pending: the PR does not exist at this commit

## 3. Schema and data

- [x] n/a: no migration, no column, no row. The release's own five migrations (`0439`–`0443`) were
  applied and verified during the release and are recorded in the record itself

## 4. Functional checks

- [x] Every figure in the record is one that was actually read, not estimated — the byte counts and
  status codes on all four public pages before and after, the three key fingerprints, the catalogue
  baseline and delta (124 → 128, functions 77 → 79, tables missing `definer_all` 0 → 1), the
  migration counts, and the four hosts' two endpoints
- [x] The byte counts for the exposure are the two reads either side of the lock, unpiped:
  78,877 / 78,859 open against 24,462 / 24,468 closed
- [x] Every claim the record **cannot** support is in its own closing section rather than implied —
  the six notes not read on a rendered `/releases`, Lanna's `public_site` column never read directly
  (no script in the repo can), `0441`'s two new functions not exercised, and the Thai product pages
  not read by anyone who reads Thai
- [x] **The one limit on the exposure's close is stated rather than overclaimed:**
  `isPublicSiteLocked` treats `locked` and `off` identically for a signed-out visitor, so from
  outside the two cannot be distinguished. What is proved is that Lanna's value is one of them
- [x] The release manager's own two faults are in the record under their own heading — the
  floor-trigger error, and `| tail -4` on `guarded-install.mjs`
- [x] Role access matrix — n/a: no card, role or policy is touched by any of the three documents

## 5. Cross-cutting

- [x] Timezone-sensitive behaviour — n/a
- [x] Thai strings — n/a: no copy changed. The Thai product pages are listed as an outstanding gap,
  not claimed as verified

## 6. Regression

- [x] The handover still says in its opening lines that it **outranks nothing**, so it cannot be read
  as overriding the runbook or `CLAUDE.md`
- [x] The handover is a delta and within its ceiling: 131 lines against 150
- [x] The previous release's record is untouched
- [x] The cut plan's edits only answer lines that were `deferred:` or `pending:`; no line that was
  already ticked or reasoned `n/a:` was altered

## 7. Documentation

- [ ] **Release notes.** n/a: **nobody using the app would notice a release record or a handover.**
  Neither is served, imported or rendered, and no behaviour changes. This release's six notes shipped
  in their own PRs and were published by the cut — and all six are `admin: true` in any case
- [x] `docs/releases/2026-11-25-0-49-2.md` written
- [x] `docs/release-handover.md` rewritten, and within its ceiling
- [x] The wrong floor-trigger claim is corrected where it was made: a comment on PR #1890, and the
  cut plan's own gate lines rewritten to say what actually happened
- [x] Backlog: `#flrwh` was filed on the `backlog` branch, not here, because that is where backlog
  items go. `#tnc41`, `#d422o`, `#dfnwi` and the note on `#acwho` were filed there during the release

## 8. Pre-production gate

- [x] n/a: nothing deploys from this PR. The release it describes is already live and verified —
  `0.49.2 @ 5344c037a` on `/api/version` on all four hosts, all `served-by: pi`

### Rollback

Revert the commit. All three files are documents; nothing served changes either way.

## Defects found

| # | Severity | What | Status |
| --- | --- | --- | --- |
| 1 | **high** | The recorded website-lock order guards the production Worker deploy, but `PUBLIC_SITE` is applied at the production **Pi build**. Following the order exactly put the real public website on the internet | **Filed as `#flrwh`** and corrected in both documents and on PR #1890. Not patched here: the step order lives in `docs/decisions/2026-11-25-website-lock-truth.md` and the runbook, neither of which is this PR's file |
| 2 | medium | Lanna's own `public_site` was still `open` — the console change of 2026-11-25 had not taken effect | **Closed 2026-11-26** by Lutan, confirmed behaviourally from outside. Recorded in the record, including the limit on that confirmation |

## Left for manual verification

| # | What | Whose | Why |
| --- | --- | --- | --- |
| — | none | — | Three markdown documents. There is no screen, no deploy and no device: every check above is a read of a file or of a figure captured during the release. The release's own eight outstanding rows are carried in the record, not re-listed here |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Every exit code and every figure read from the command itself, never through a pipe — the one
  release-time breach of that rule is written up in the record rather than quietly fixed

Automated checks by: Claude  Date: 2026-11-26

### Manual verification

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check  Date: 2026-11-26

### Result

Result: pass
