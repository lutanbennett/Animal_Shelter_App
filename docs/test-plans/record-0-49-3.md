# Test plan — release record and handover, `0.49.3`

## Header

| | |
| --- | --- |
| Feature | The `0.49.3` release record, `docs/release-handover.md` rewritten, and the cut plan's pre-production gate finished |
| Branch | `claude/record-0-49-3` |
| Tested SHA | `ef022e146` — the release this record describes, live on all four hosts |
| Environments | none: this PR is three markdown documents |
| Author | Claude (release manager) |
| Date | 2026-11-27 |

## 1. Scope and risk

**This PR is not a gate and must not be presented as one.** By the time it exists, `0.49.3` is cut,
merged, migrated, deployed and verified. It describes a release that already shipped (`CLAUDE.md`,
"Every PR merges on green").

Three files, all documents:

- `docs/releases/2026-11-26-0-49-3.md` — the record
- `docs/release-handover.md` — rewritten, 143 lines against the 150-line limit
- `docs/test-plans/cut-release-0-49-3.md` — the cut plan's pre-production gate, finished

**It carries one measurement worth more than the bookkeeping.** The wrangler deploy failure that cost
`0.49.2` four attempts and two wrong diagnoses was caught by the net trace #1898 landed for it, and it
is a **machine-wide sub-second DNS blackout**, not a Cloudflare fault: six `ENOTFOUND` lookups in
250 ms across four hosts, two of which are not Cloudflare's, each failing in 1–41 ms, with full
recovery minutes later. Both documents lead on that, and `#dnsgp` carries the fix.

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
- [x] `node scripts/check-release-handover.mjs` — prints `Current: the handover names 0.49.3`
- [ ] CI green on the PR — pending: the PR does not exist at this commit

## 3. Schema and data

- [x] n/a: no migration, no column, no row. The release's own two migrations (`0444`, `0445`) were
  applied to UAT and production during the release, both `ok`, zero drift, and are recorded in the
  record itself

## 4. Functional checks

- [x] Every figure in the record is one that was actually read, not estimated — the six net-trace
  lookups with their hosts and elapsed times, the three Server Actions fingerprints, all four Version
  IDs, the catalogue baseline and delta (125 / 16 / 1 → 125 / 17 / 0), the migration counts, the three
  purge byte counts, the 15 secret names, and all four hosts on both endpoints
- [x] The DNS finding is stated at the strength the evidence supports: **scope and timing established,
  cause still inferred.** The VPN appears as a hypothesis, and the record says plainly that `0.49.3`'s
  production deploy **succeeded first time with the VPN up**, which is the fact that stops the
  hypothesis being written up as a finding
- [x] The website-shut proof is byte counts either side of two separate steps (production Pi build, then
  Worker deploy), both reading `200 / 24,468` and matching `0.49.2`'s recorded closed page
- [x] The record states that the **deployment floor is `open`** and that the shelter's own `locked` is
  the only thing holding the site shut — read from the production deploy's own binding list, not inferred
- [x] Every claim the record **cannot** support is in its own closing section rather than implied —
  there is no pre-Pi-build reading of `cooperjaidee.org`, so its being closed now is not proof this
  release did not move it
- [x] The release manager's own three faults are in the record under their own heading — the invented
  `--list-secrets` flag pointed at production, the two `| head` breaches, and the VPN left off by the
  previous release
- [x] The cut plan's 14 `deferred:` gate lines are each answered with the measurement that settles
  them, and **none is left `deferred:`** — `0` remaining, counted
- [x] Role access matrix — n/a: no card, role or policy is touched by any of the three documents

## 5. Cross-cutting

- [x] Timezone-sensitive behaviour — n/a
- [x] Thai strings — n/a: no copy changed. The release's Thai wording note (#1900) shipped in its own
  PR and was read by a Thai speaker there; this PR does not re-verify it and does not claim to

## 6. Regression

- [x] The handover still says in its opening lines that it **outranks nothing**, so it cannot be read
  as overriding the runbook or `CLAUDE.md`
- [x] The handover is a delta and within its limit: **143 lines against 150**, with durable material
  cited rather than recopied — the Pi-build, worktree and dry-run sections were cut back to what this
  release actually changed
- [x] The handover's H1 now names the release, which is what `check-release-handover.mjs` tests; the
  handover itself says to keep it there, so the advisory stays meaningful
- [x] The previous release's record is untouched
- [x] The cut plan's edits only answer lines that were `deferred:`; no line that was already ticked or
  reasoned `n/a:` was altered, and the script refuses to touch a line that is not an unticked item

## 7. Documentation

- [ ] **Release notes.** n/a: **nobody using the app would notice a release record or a handover.**
  Neither is served, imported or rendered, and no behaviour changes. This release's two notes shipped
  in their own PRs (#1900 and #1893) and were published by the cut
- [x] `docs/releases/2026-11-26-0-49-3.md` written
- [x] `docs/release-handover.md` rewritten, within its limit, and no longer stale
- [x] Backlog: `#dnsgp`, `#c0nhd`, `#rpsha` and `#cjpzn` were filed on the `backlog` branch, not here,
  because that is where backlog items go — commits `ee5d2ba59` and `d2e6b3f4d`, all four backlog hooks
  green on each

## 8. Pre-production gate

- [x] n/a: nothing deploys from this PR. The release it describes is already live and verified —
  `0.49.3 @ ef022e146` on `/api/version` **and** `0.49.3` on `/api/releases/current`, all four hosts,
  all `served-by: pi`, both zones purged with a `CF MISS` each

### Rollback

Revert the commit. All three files are documents; nothing served changes either way.

## Defects found

| # | Severity | What | Status |
| --- | --- | --- | --- |
| 1 | medium | The wrangler deploy failure is a machine-wide sub-second DNS blackout; the error names Cloudflare only because that is what wrangler was asking for, which has sent three sessions at the wrong cause | **Filed as `#dnsgp`** with the measurement and a bounded-retry fix. Not patched here: the retry belongs in `scripts/deploy.mjs`, not in a documents PR |
| 2 | low | `0445`'s `-- consumer: none` header became false in its own release, so `apply-migrations.mjs`'s ordering warning can never fire for that column | **Filed as `#c0nhd`**. Applied files are never edited, so `0445` is deliberately left alone |
| 3 | low | `cooperjaidee.org` is a third Cloudflare zone no script purges, so a release purges three of the four hosts it deployed | **Filed as `#cjpzn`**. Measured exposure small (`DYNAMIC` pages, content-hashed chunks) and stated as such rather than inflated |
| 4 | low | `release-prs.mjs` exits 2 without a SHA it could read from `releases.ts` | **Filed as `#rpsha`** |
| 5 | low | `check-release-handover.mjs` tests only the handover's first line, so the previous title convention could never satisfy it and it reported STALE on every correct edition | **Fixed here** by naming the release in the H1, and the handover says to keep it there. No item: the mechanism is now self-enforcing |

## Left for manual verification

| # | What | Whose | Why |
| --- | --- | --- | --- |
| — | none | — | Three markdown documents. There is no screen, no deploy and no device: every check above is a read of a file or of a figure captured during the release. The release's own seven outstanding rows are carried in the record, not re-listed here |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Every figure read from the command itself or from a redirected log file, never through a pipe —
  the two release-time breaches of that rule are written up in the record rather than quietly fixed,
  and neither produced a figure that reached any plan

Automated checks by: Claude  Date: 2026-11-27

### Manual verification

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check  Date: 2026-11-27

### Result

Result: pass
