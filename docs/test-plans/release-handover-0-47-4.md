# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release handover after `0.47.3` and `0.47.4` — owed by rule 3 and missed on both |
| Backlog item | n/a: a handover closes no backlog item. The fault that produced it is filed as `#hndvr` |
| Branch / worktree | `claude/release-handover-0-47-4` @ `C:\Development\Animal_Shelter_release-handover-0-47-4` |
| Dev server | n/a: docs-only, nothing is served or rendered |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | the branch head |

## 1. Scope and risk

- [x] Change is described in one sentence — rewrites `docs/release-handover.md` as a delta covering `0.47.3` and `0.47.4`, replacing the `0.47.2` edition
- [x] Files/areas touched — `docs/release-handover.md` and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: a handover is internal working material for the next release chat. Not served, imported or rendered; it gates nothing and changes no behaviour
- [x] Out of scope — it does not restate the runbook. `docs/release-procedure.md` and the two release records **outrank it**, and the file says so in its opening lines

### Why this PR exists at all, which is the uncomfortable part

`docs/release-procedure.md` rule 3 says the record and the handover are **one PR**. Both `0.47.3` and
`0.47.4` shipped their records without one. **The previous edition opened by naming this exact fault
on `0.47.1`** and warning its successor in bold — *"if you are reading this after a release you ran,
write the next edition in the record's PR"* — and it happened twice more regardless.

**Three occurrences, every one caught by Lutan asking outright rather than by any check.** The miss is
recorded in the handover's own opening, and the absent instrument is filed as **`#hndvr`**, which
proposes the check (the newest file in `docs/releases/` must be named in the handover's first line)
and sets out the two things that stop it being mechanical: an edition may legitimately cover two
releases, and it must not go red on a record PR in the minutes before the handover is written.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: branched from current `origin/main` by `worktree.mjs new`, nothing merged in
- [ ] `node scripts/gates.mjs` — n/a: **docs-only.** One markdown file. No TypeScript, lint target, test or build input changed, and `check-docs-only.mjs` is what CI reads to make the same judgement
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value

## 4. Functional checks

- [ ] Happy path / data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: **a handover has no surface.** It is one file in `docs/`, not served, imported or rendered, and no route reads it
- [x] **Every fact in it was carried from a measurement made in this session, not from memory** — the versions and SHAs from `/api/version` and `/api/releases/current` on all three hosts after the deploy; the migration counts from `--status` on both databases; the IPv4-versus-IPv6 counts from the failures themselves; the two guards quoted by file and line from reading the source; the tenancy lint figures from runs either side of the apply on production; and the Pi's state from the mesh
- [x] **Length checked against the rule.** `docs/release-handover.md` is **165 lines** against a target of ~150. Over by 15, and deliberately: it covers **two** releases, retires a whole section (the Next.js advisory halt) and carries one genuinely new root-cause analysis. **Three sections were compressed to get there** from an initial 183 — the Pi section, which mostly repeated the runbook, the per-release summaries, and the "now routine" list
- [x] **It retires as well as adds, which is what keeps a delta a delta.** The previous edition's Next.js advisory-halt section is **deleted and marked as history**: it did not occur once in two releases across fourteen builds on `16.4.6`. A handover that only accumulates stops being read

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: one markdown file in `docs/`

## 6. Regression

- [ ] The pages nearest the change still work / shared file touched / nothing merged from `main` was broken — n/a: nothing imports `docs/release-handover.md`, no shared file is touched, nothing was merged into this branch
- [x] **The one real regression risk for a handover is a false statement outliving it**, so every claim inherited from the previous edition was re-checked rather than copied: the advisory halt (now retired), `#shtci` (now closed), `#uatwk` (closed), and the Thai sign-off (still open, now seventh release running)

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a handover ticks nothing. **The fault it records is filed as `#hndvr`** on the `backlog` branch, and the handover cites it by id, so the reference is not dangling
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: **the handover is itself the write-up**, and the decisions it records belong to the two releases, whose own records hold them
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a handover. It is not served, imported or rendered, and no behaviour changes. Both releases' notes shipped in their own cut PRs (#1715, #1721) and mailed nobody
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the line count from `wc -l`; the three missed editions from `git log -- docs/release-handover.md` and the previous edition's own opening paragraph; the advisory halt's absence from fourteen build logs across two releases rather than from not having noticed it

## 8. Pre-production gate

- [ ] Every line in this section — n/a: **this PR ships nothing to any environment.** No `src/`, no `worker/`, no migration. The releases it describes are already deployed and verified; all three hosts served `0.47.4` @ `a50122039` when it was written

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (process) | **The release handover has now been missed on three releases**, and the only detector is Lutan asking. A bold warning in the previous edition did not prevent it | **recorded in the handover's own opening and filed as `#hndvr`**, which proposes the check and names the two things that stop it being mechanical. Not built here: it needs a decision on advisory versus blocking, and `test-plan` is advisory permanently by Lutan's own 2026-10-20 ruling |
| 2 | low (length) | **165 lines against a ~150 target** | **accepted and stated**, with what was compressed to get there from 183 and why the overshoot is two releases plus one new root cause |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **That the handover reads true to the person who ran the two production deploys.** It describes his three attempts on `0.47.3`, the refusal that ended it, the `netsh` change and the Meshnet drop, and he is the only one who saw those from the other side | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: nobody has read it back yet; only the person who reads it may tick this

Manual verification by: pending: Lutan, if he wants to check the handover's account of his two deploys reads true. A handover outranks nothing and is rewritten within one release, which is why it merges on green rather than waiting

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; no deploy step remains

Result: pass with accepted defects
