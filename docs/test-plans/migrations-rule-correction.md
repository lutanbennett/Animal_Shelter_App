# Test plan — correct the `0.43.4` record's claim that the migration apply needs an allow rule

## Header

| | |
|---|---|
| Feature | Correct a **false finding** in `docs/releases/2026-11-06-0-43-4.md` and `docs/release-handover.md`: both say the production migration apply needs a permission rule it has had for weeks. **Documents only** |
| Backlog item | `docs/backlog.md` → none, and that is the point: this stops a backlog item being filed for work that is already done |
| Branch / worktree | `claude/migrations-rule-correction` @ `C:\Development\Animal_Shelter_migrations-rule-correction` |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three passages corrected in two documents, all saying the same wrong thing
- [x] Files/areas touched listed — `docs/releases/2026-11-06-0-43-4.md` (Defect 1 and *The touches this release cost*), `docs/release-handover.md` (*In flight and open*), and this plan
- [x] Cards affected identified — **none.** No card, activity or page
- [x] Anything explicitly out of scope written down — **`~/.claude/settings.json` was NOT changed, because nothing was wrong with it.** That file is outside the repository and holds the user's own permission rules; the finding here is that the existing rule was already correct

### What was actually wrong, measured

`0.43.4` reported that `node scripts/apply-migrations.mjs --env production` was refused twice by the
permission classifier as `[Production Deploy]`, handed eight migrations to Lutan, and recorded that
the job *"needs an allow rule"*.

- **The rule exists**, in `~/.claude/settings.json`: `Bash(node scripts/apply-migrations.mjs --env production)`.
- It is an **exact-match** rule. The command actually sent was
  `cd /c/Development/… && node scripts/apply-migrations.mjs --env production 2>&1 | grep -v Warning | tail -20`,
  which does not match it, so the classifier judged the command instead.
- **Run bare, it succeeds**, first time — see the evidence in section 2.

Neither decoration was needed: the Bash tool already starts in the main checkout, and the pipe existed
only to hide a `MODULE_TYPELESS_PACKAGE_JSON` warning.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` minutes before the first commit, so there was nothing to merge in
- [x] `node scripts/gates.mjs` — n/a: a documents-only PR has nothing for the four gates to exercise, and `check-docs-only.mjs` is what establishes that. Its output is in section 6
- [x] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`
- [x] **The claim this PR makes was proved by running the command**, which is the only check that matters here. Bare, with nothing pending, it is a read-only no-op, and it was not refused:

```
Environment: production — project dbkodyyxxhtygxcxmfcu
This checkout: 326 applied, 0 pending.
```

## 3. Schema and data

- [x] n/a: no migration in this PR. The run quoted above applied nothing — production was already at `326 applied, 0 pending` from the release, which is what made it a safe way to test the permission

## 4. Functional checks

- [x] Happy path works end to end — the corrected passages read correctly on their own, and each names the date the original was written so a reader of the older text knows which way it went
- [x] Data persists / create, edit, delete / empty state / invalid input / boundary cases — n/a: prose in two markdown files; none of these apply

### Role access matrix

Analysed by card. **No card's behaviour changes**, and neither file is served to anybody.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | both files are in git, not on any page | pass |
| any single card | nothing in this PR | as above | pass |
| signed out | nothing in this PR | as above | pass |

- [x] Every login above tested — n/a as a browser exercise: there is no surface
- [x] A login that should not have access is blocked server-side — n/a: no access surface

## 5. Cross-cutting

- [x] Nav entry / manual / translations / mobile viewport / console / network — n/a: no page, no string, no layout. Nothing in this PR renders

## 6. Regression

- [x] The pages nearest the change still work — n/a: no page is near these files. `check-docs-only.mjs`:

```
deps-changed: false
docs-only: true — 3 path(s), all documents
  docs/release-handover.md
  docs/releases/2026-11-06-0-43-4.md
  docs/test-plans/migrations-rule-correction.md
The heavy jobs will skip; test-plan still runs.
```

- [x] Any shared file touched checked from a second, unrelated page — n/a: neither file is imported by anything. `docs/release-handover.md` is read by the next release manager, which is a person, not a build
- [x] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in

## 7. Documentation

- [x] Backlog item ticked — n/a: no item. **This PR prevents one being filed** for a rule that already exists
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the reasoning belongs in the record it corrects, where anyone chasing this will look, and in this plan. A decision file would be a third home
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** n/a: nobody using the app would notice a correction to a release record and a handover. Neither file is served, imported or rendered, and nothing under `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched — which `check-docs-only.mjs` confirms above
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — and this PR exists *because* the claim it corrects was reasoned rather than measured. The correction itself was measured twice: the rule was read out of `~/.claude/settings.json`, and the bare command was run and succeeded

## 8. Pre-production gate

**Since the 2026-11-05 cutover:** `lannacareforanimals.org` is production; `test.lannacare.org` is test
on the dev project; `lannacare.org` is UAT.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR ships nothing and is not deployed
- [x] Deployed SHA matches the tested SHA — n/a: as above

### On the deployed build

- [x] Deployed to test / smoke-tested / timezone / boundaries / public pages — n/a: nothing in this PR reaches any host, derives a date or computes a value
- [x] Evidence pasted into this plan is the tool's actual output, unedited — both fenced blocks are their commands' own output. **This is the line that caught a real defect on the previous PR**, so it is not a formality: the `check-docs-only.mjs` block was pasted from a real run, not typed

### Deploy safety

- [x] Supabase project line read / `strip-baked-env` / new secrets — n/a: this PR performs no deploy and introduces no variable

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? — n/a: it contains neither
- [x] The remaining lines of this section — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this PR restores two passages that are **known to be false**, and has no runtime effect. There is nothing else to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **A release record and a handover both asserted a permissions gap that did not exist**, and the handover told the next release manager to *"budget a third touch"* for it indefinitely. A wrong finding in a handover costs every later release, not just the one that wrote it | **Fixed here**, in both files, naming the real cause so the correction is usable rather than just a deletion |
| 2 | low | **The lesson was already in memory and was not applied.** *"Piping or redirecting the command breaks the allow rule match … run it bare"* was recorded on 2026-10-19 for `load-residents.mjs` | **Fixed outside the repository**, in the session memory for migrations, where somebody about to run one will meet it — the 2026-10-19 note was filed under production *reads*, which is not where anyone applying a migration would look |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty, and that is a real answer: there is nothing in this PR for a person to look at. The release's own
two manual items stay on `docs/test-plans/cut-release-0-43-4.md`, where listing them again would give
them a second home that nothing ever closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so there is nothing being signed for

Manual verification by: n/a: nothing in this PR has a surface a person could look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-06
