# Test plan — release record and handover, `0.49.1`

## Header

| | |
| --- | --- |
| Feature | The `0.49.1` release record, and `docs/release-handover.md` rewritten for the next release manager |
| Branch | `claude/record-0-49-1` |
| Tested SHA | `ba6603e5b` — the release this record describes, already live on all four hosts |
| Environments | none: this PR is two markdown documents |
| Author | Claude (release manager) |
| Date | 2026-11-25 |

## 1. Scope and risk

**This PR is not a gate and must not be presented as one.** By the time it exists, `0.49.1` is cut,
merged, migrated, deployed to all four hosts and verified. It describes a release that already
shipped (`CLAUDE.md`, "Every PR merges on green").

Two files, both documents:

- `docs/releases/2026-11-25-0-49-1.md` — the record
- `docs/release-handover.md` — rewritten, 122 lines against a 150-line ceiling

It also ticks the **cut plan's** pre-production gate, whose lines read `deferred: release manager`
and are now answerable because the deploy has happened. That is the same plan, finished — not a
second plan for the same work.

- [x] Risk assessed — **nothing is served, imported, rendered or executed from either file.** No
  code, no schema, no copy a user sees
- [x] Boundary cases checked — n/a: no logic

## 2. Automated gates

- [x] `check-docs-only.mjs` will mark this PR documents-only, so the heavy jobs skip — expected, and
  skipped is not a pass: it means nothing was checked, on purpose
- [x] `audit` will show **skipped**: no `package.json` or `package-lock.json` change
- [x] `node scripts/check-test-plan.mjs` — run locally before pushing
- [ ] CI green on the PR — pending: the PR does not exist at this commit

## 3. Schema and data

- [x] n/a: no migration, no column, no row. The release's own three migrations (`0436`–`0438`) were
  applied and verified during the release and are recorded in the record itself

## 4. Functional checks

- [x] Every figure in the record is one that was actually read, not estimated — the key fingerprints,
  the `strip-baked-env` count (23), the catalogue baseline and delta (123 → 130, 76 → 83 functions),
  the icon-sync result (536 unchanged), the asset byte counts, and the four hosts' two endpoints
- [x] Every claim the record **cannot** support is in its own closing section rather than implied —
  the notes not read on a rendered `/releases`, the product pages not verifiable by `curl`,
  production's `0.49.0` cache behaviour not established, and `0438`'s functions not exercised
- [x] The nine test gaps are listed with whose they are, and row 1 is named as the one that matters
- [x] Role access matrix — n/a: no card, role or policy is touched by either document

## 5. Cross-cutting

- [x] Timezone-sensitive behaviour — n/a
- [x] Thai strings — n/a: no copy changed. The Thai product pages are listed as an outstanding gap,
  not claimed as verified

## 6. Regression

- [x] The handover still says in its opening lines that it **outranks nothing**, so it cannot be read
  as overriding the runbook or `CLAUDE.md`
- [x] The previous release's record is untouched

## 7. Documentation

- [ ] **Release notes.** n/a: **nobody using the app would notice a release record or a handover.**
  Neither is served, imported or rendered, and no behaviour changes. This release's four notes
  shipped in their own PRs and were published by the `0.49.1` cut
- [x] `docs/releases/2026-11-25-0-49-1.md` written
- [x] `docs/release-handover.md` rewritten, and within its ceiling
- [x] Backlog: `#tnycl` was filed on the `backlog` branch during the release, not here, because that
  is where backlog items go

## 8. Pre-production gate

- [x] n/a: nothing deploys from this PR. The release it describes is already live and verified —
  `0.49.1 @ ba6603e5b` on both endpoints on all four hosts, all `served-by: pi`

### Rollback

Revert the commit. Both files are documents; nothing served changes either way.

## Defects found

| # | What | Status |
| --- | --- | --- |
| — | none | The release's own two findings (`#tnycl`, and my `tail -6` misreading) are recorded in the record and the handover rather than here, because they are the release's, not this PR's |

## Left for manual verification

| # | What | Whose | Why |
| --- | --- | --- | --- |
| — | none | — | Two markdown documents. There is no screen, no deploy and no device: every check above is a read of a file or of a figure captured during the release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Every exit code read from the command itself, never through a pipe

Automated checks by: Claude  Date: 2026-11-25

### Manual verification

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check  Date: 2026-11-25

### Result

Result: pass
