# Feature test plan — asbuilt-hardware-stack

## Header

| | |
|---|---|
| Feature | `docs/as-built-2026-11-13.md`: the hardware and technology stack as built, with the security measures gathered and marked |
| Backlog item | `docs/backlog.md` → **AS-BUILT: THE HARDWARE AND THE TECHNOLOGY STACK** (`#s54mf`, ticked on this branch) |
| Branch / worktree | `claude/asbuilt-hardware-stack` @ `C:\Development\Animal_Shelter_asbuilt-hardware-stack` |
| Dev server | not started: documentation only, no UI surface |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | 8b28032fc |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one dated document recording the hardware, hosting, stack, data stores, Google identities, email, network and security measures, with two Mermaid diagrams and no addresses
- [x] Files/areas touched listed — `docs/as-built-2026-11-13.md` (new), `docs/decisions/2026-11-13-as-built-document.md` (new), `docs/backlog.md` (`#s54mf` ticked), this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [ ] Cards affected identified — n/a: no code or permission changes, so no card's behaviour changes; admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — no re-read of the Pi, router, consoles or production; no Drive sharing figures (the Drive lock-down stream owns them); no edit to `CLAUDE.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly before the gates
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`. Closing lines as the run printed them:

```
=== gates: typecheck exited 0 after 90s
=== gates: lint exited 0 after 278s
=== gates: test exited 0 after 42s
=== gates: build exited 0 after 188s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change, no code reads anything new
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only, no UI surface
- [ ] Data persists — n/a: documentation only, nothing is stored
- [ ] Create / edit / delete all exercised — n/a: documentation only
- [ ] Empty state renders sensibly — n/a: documentation only
- [ ] Invalid input is rejected with a readable message — n/a: documentation only, no input
- [ ] Boundary cases checked — n/a: documentation only

### Role access matrix

Not applicable: the change adds no page, route or action. The document is a file in the repository, read on GitHub, not served by the app.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a |
| signed out | nothing new | no change | n/a |

- [ ] Every login above tested — n/a: no access surface changed
- [ ] A login that should not have access is blocked server-side — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings go through the translation path — n/a: no app strings
- [ ] Mobile viewport (375px) — n/a: no app surface
- [ ] Browser console clean — n/a: no app surface
- [ ] Network clean — n/a: no app surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: `NavLinks.tsx`, `manual/en.ts` and shared libs untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates ran on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `#s54mf` ticked with a note naming the document; `#1wf15` deliberately not ticked (a standing writing rule, not a buildable thing). The other items touching this area (`#gvnrr`, `#z04wr`, `#dxjz2`, `#f1wp1`) are not closed by a document and stay as they are
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-13-as-built-document.md`
- [x] `README.md` still accurate — not touched, and nothing it says is contradicted by the new document
- [ ] **Release notes.** n/a: a repository document that no one using the app would notice; `unreleased` in `src/lib/releases.ts` is unchanged, and nothing about the app's behaviour changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The document cites its sources and dates for every reading and marks anything unread as not established. The one finding of its own (the model path versus the router's blocking rule) is stated as a reading of the dated sources, with the untested part labelled not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: no code ships; a document in `docs/` is not part of any build
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed
- [ ] Timezone-sensitive behaviour proved — n/a: no behaviour
- [ ] Boundary or banding assertions cover both edges — n/a: no thresholds
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above is the run's own closing lines
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documentation only; reverting the commit removes the files and nothing else depends on them

### The Mermaid renders

- [ ] **Both Mermaid diagrams render** (request path in section 2, containment in section 7 of the document) — pending: checked in GitHub's preview of the file on the PR once it exists. Not rendered locally: no Mermaid renderer is installed on this machine and installing one was out of scope for a documentation change. Syntax was kept to the conservative forms (plain, dotted and thick links with quoted labels)

### Write-rule

- [x] The write-rule held, proved mechanically — `grep -nE '([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}' docs/as-built-2026-11-13.md` returned no matches (exit status 1), and a second scan for the router's model name, the mesh router's name, the outside port number and the remote-desktop and VNC port numbers found nothing but file permissions and file names

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The model path in `#z04wr` and its runbook predate the Pi's move behind the VPN router and cannot work as written without a router exception | deferred to backlog — recorded in the document (section 8) and in the PR body for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Both Mermaid diagrams render | GitHub's file preview of `docs/as-built-2026-11-13.md` on the PR |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the Mermaid render check above

Manual verification by: pending: Mermaid render check on GitHub's preview, to be done by a person who looks

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit; the plan is committed on the branch and CI reads it there
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: pending: no deploy involved
