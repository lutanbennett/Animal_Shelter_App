# Feature test plan — planner handover `429`

## Header

| | |
|---|---|
| Feature | Planner handover edition `429`, **off-cadence at Lutan's request**: batch 3's three actuals, and the test of whether `420`'s browser-pane mitigation fired |
| Backlog item | `docs/backlog.md` → n/a: not a backlog item. **And not due by the counter either — it stood at 0, because batch 3 was set up before `420` and is counted in its nine. Lutan asked for this edition directly; the plan file records the counter and why it was not advanced** |
| Branch / worktree | `claude/planner-handover-429` @ `C:\Development\Animal_Shelter_planner-handover-429` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` — **not started; this PR has no runtime surface** |
| PR | pending at this commit |
| Tested by / date | Claude Opus 5 (Daily Planner session) / 2026-10-28 |
| Carries a migration? | **no** |
| Tested at SHA | `8b281669`, the handover commit on this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `docs/planner-handover.md` is replaced with edition `429`, a short delta over `420` covering **batch 3 only**. **Nothing is promoted into the skill, again deliberately:** the ~6k walkthrough re-pass rate now has the fourth and fifth readings `411` asked for and would be safe to promote, but doing it inside an off-cadence edition written at the end of a long day is exactly how that rate was wrongly revised twice on 2026-10-27. It is named as the next round's first job instead
- [x] Files/areas touched listed — **two files only**: `docs/planner-handover.md` (rewritten, 143 lines) and `.claude/skills/plan-day/SKILL.md` (**+49, −0**, three insertion points). No route, no component, no `worker/`, no migration, nothing under `src/`
- [x] Roles affected identified — **none.** Neither file is read at runtime by anyone. The handover is read by the next planner chat; the skill is read by `/plan-day`. **No access changes and no role is named in either**
- [x] Anything explicitly **out of scope** written down — **the walkthrough rate is deliberately NOT promoted.** It moved three times in one day and its author was confident each time, so it stays in the handover until a fourth reading agrees. Also out of scope: the Pi deploy, the `0.40.8` record (the release manager owns it), and `test.lannacare.org`

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` minutes before the first commit, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 61s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 109s
=== gates: test — npm test
=== gates: test exited 0 after 14s
=== gates: build — npm run build
=== gates: build exited 0 after 139s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **The edition was written against measured figures** — see §1. `wc -l docs/planner-handover.md` reads **107**, well inside the skill's ~150 target and shorter than `420` on purpose, because an edition written an hour after its predecessor has only one round of new facts to carry. Measured after writing, not claimed before it. The per-step rates were computed from each stream's own non-`Messages` floor rather than from a carried-forward floor figure, and every `get_usage` call had its `context.session` read back against the id passed

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
- [x] **Claims in commit messages were measured, not reasoned** — every figure in edition `429` is a recorded actual from `get_usage`, with `context.session` read back against the id passed on all three calls. The two per-step rates were computed from each stream's own non-`Messages` floor (~98.0k each), not from a floor carried forward. The claim that the pane mitigation fired is **quoted from the two streams' own decision files**, not inferred from their having filed no pane rows — absence of a complaint is not evidence that a block was read, and that distinction is the whole point of checking a mitigation.

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
| That edition `429` is useful to the next planner chat | **the next planner chat** | Only readable in use. The test of a handover is whether the next round repeats this one's mistakes, which cannot be observed from inside it |
| That the ~6k re-pass rate is promoted into the skill with its seven readings | **the next `/plan-day` run** | Deliberately left undone here. That rate was revised twice in one day on 2026-10-27, and promoting it at the end of a long off-cadence edition is how that happened |

## Result

Result: pass

Everything this PR can be judged on is green: four gates at zero, a guarded and
mechanically verified promotion, and a diff that removes nothing. What is left is
inherently only observable in use, and is named above with an owner rather than ticked.

Automated checks by: Claude Opus 5  Date: 2026-10-28
Manual verification by: n/a: neither file has a runtime surface; the two in-use observations are listed above with owners
