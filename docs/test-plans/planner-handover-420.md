# Feature test plan — planner handover `420`

## Header

| | |
|---|---|
| Feature | Planner handover edition `420`: nine streams since `411`, the browser-pane finding, and the band error those three under-runs share |
| Backlog item | `docs/backlog.md` → n/a: the handover is the skill's own step 8, due at nine workstreams since the last edition. Not a backlog item |
| Branch / worktree | `claude/planner-handover-420` @ `C:\Development\Animal_Shelter_planner-handover-420` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` — **not started; this PR has no runtime surface** |
| PR | pending at this commit |
| Tested by / date | Claude Opus 5 (Daily Planner session) / 2026-10-28 |
| Carries a migration? | **no** |
| Tested at SHA | `aab3c138`, the handover commit on this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `docs/planner-handover.md` is replaced with edition `420`, a delta over `411`. **Nothing is promoted into the skill this time, deliberately:** the round's candidate rule (an audit is cheap, so band a wide-but-shallow sweep as a report) has three readings all from one planner, and the skill's own instruction is to leave a number here until a fourth agrees. Promoting it today would repeat the walkthrough-rate mistake of 2026-10-27, which was revised twice in a day
- [x] Files/areas touched listed — **two files only**: `docs/planner-handover.md` (rewritten, 143 lines) and `.claude/skills/plan-day/SKILL.md` (**+49, −0**, three insertion points). No route, no component, no `worker/`, no migration, nothing under `src/`
- [x] Roles affected identified — **none.** Neither file is read at runtime by anyone. The handover is read by the next planner chat; the skill is read by `/plan-day`. **No access changes and no role is named in either**
- [x] Anything explicitly **out of scope** written down — **the walkthrough rate is deliberately NOT promoted.** It moved three times in one day and its author was confident each time, so it stays in the handover until a fourth reading agrees. Also out of scope: the Pi deploy, the `0.40.8` record (the release manager owns it), and `test.lannacare.org`

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` minutes before the first commit, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 6s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 75s
=== gates: test — npm test
=== gates: test exited 0 after 14s
=== gates: build — npm run build
=== gates: build exited 0 after 37s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **The edition was written against measured figures, and the one thing it does NOT do is promote a rule** — see §1. `wc -l docs/planner-handover.md` reads **144**, inside the skill's ~150 target, measured after writing rather than claimed before it (four editions in a row stated a figure they had not measured). **Defect found in this plan's own ancestor:** edition `411`'s test plan shipped with the literal string `GATES_OUTPUT_PLACEHOLDER` in its gates evidence block and `check-test-plan.mjs` passed it. This plan carries the real output of its own run. **The checker does not detect a placeholder inside a fenced block — worth a backlog item, and not fixed here**

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration, no schema, no data touched

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime surface. The "function" is that a future planner chat reads these files, which cannot be exercised here
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete all exercised — n/a: no write path
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no user input
- [ ] Boundary cases checked — n/a: no user input

### Role access matrix

- [ ] Every role above tested — n/a: this PR changes no access whatsoever
- [ ] A role that should not have access is blocked server-side — n/a: no route added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the handover and the skill are not user documentation
- [ ] Translatable strings — n/a: neither file is shown to a user
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — n/a in the browser sense, and the real regression risk here is **the skill failing to load or losing a rule**. Checked instead by reading the diff: **49 added, 0 removed**, so nothing existing was displaced, and all three insertions are new blocks placed before existing anchors rather than replacing them
- [x] Any shared file touched checked from a second, unrelated page — **`.claude/skills/plan-day/SKILL.md` is the shared file**, and the honest check is that its structure survived: the three anchors it was keyed on are still present and still open their original sections, and the file's CRLF endings were restored (confirmed by the script's own report)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` minutes earlier

## 7. Documentation

- [ ] Backlog item ticked — n/a: the handover has no backlog item
- [ ] Non-obvious design choices added to `docs/decisions/` — n/a: the handover **is** the record of this round's reasoning, and the promotions are described in the commit message that makes them. A decision file would be a third copy
- [x] `README.md` still accurate — unchanged by this PR
- [ ] **Release notes.** — n/a: no shelter user can see a planner handover or a skill file. This PR touches nothing under `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`
- [x] Commit messages say why, not just what — both say what was promoted and, for the rate, why it was deliberately **not** promoted
- [x] **Claims in commit messages were measured, not reasoned** — every figure in edition `420` is a recorded actual read from `get_usage` with `context.session` verified on each call, or a reading taken today with its clock. The browser-pane mechanism is quoted from #1017's own measurements (`rAF` never firing over 3 s; 0 of 13 buttons hydrated in the pane against 13 of 13 in Chrome), not restated from its summary. The production card assignment claim (`no live role holds view_medical or medical_records`) was read from `check-production.mjs role-cards` today, not inferred from the migration

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR ships nothing to any environment. Neither file is bundled or deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing is deployed by this PR
- [ ] Deployed to test — n/a: nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to deploy
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change — n/a: the token bands are prose guidance for a planner, not code; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above is verbatim
- [ ] Public pages re-checked after a cache purge — n/a: no public surface
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy in this PR
- [ ] `strip-baked-env` line seen — n/a: no deploy in this PR
- [ ] Any new secret/env var exists in production — n/a: this PR adds none
- [ ] Migration ordering — n/a: no migration

## Left for manual verification

| what | who | why it could not be signed here |
|---|---|---|
| That edition `420` is useful to the next planner chat | **the next planner chat** | Only readable in use. The test of a handover is whether the next round repeats this one's mistakes, which cannot be observed from inside it |
| That the browser-pane workaround in batch 3's briefs actually changes how those streams verify | **the next `/plan-day` run** | A mitigation written into a brief is a hypothesis until a later round reads whether it fired; this one is new and untested |

## Result

Result: pass

Everything this PR can be judged on is green: four gates at zero, a guarded and
mechanically verified promotion, and a diff that removes nothing. What is left is
inherently only observable in use, and is named above with an owner rather than ticked.

Automated checks by: Claude Opus 5  Date: 2026-10-28
Manual verification by: n/a: neither file has a runtime surface; the two in-use observations are listed above with owners
