# Feature test plan

## Header

| | |
|---|---|
| Feature | Record Lutan's answer in `docs/release-handover.md`: the five cards no role holds are to be **left as they are**, asked and answered 2026-11-02, so no future release manager re-raises it |
| Backlog item | `docs/backlog.md` → n/a: no item covers this. It is an answered question being written down where it was being asked, not new work |
| Branch / worktree | `claude/handover-cards-answered` @ `C:\Development\Animal_Shelter_handover-cards-answered` |
| Dev server | not started — n/a: one paragraph of one Markdown file, no code, no schema, no surface |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | the commit this plan is committed on |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one bullet in the handover is rewritten from "still unassigned, put it to him" to "answered, leave them, stop raising it"
- [x] Files/areas touched listed — `docs/release-handover.md` (one bullet), this plan. Nothing else
- [x] Roles affected identified — **by card, not by role**: none, and that is the point. **No card is granted, revoked or changed by this PR**, and no permission, cell or control is touched. It changes a sentence in a document, and the five cards named in it stay exactly as they are
- [x] Anything explicitly **out of scope** written down — **assigning any of the five cards**, which is his action on Settings → Who does what and which he has now declined; and the withheld death-recording release note, which stays withheld for the same reason and needs no further note

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the worktree was created from a freshly fetched `origin/main` at `3f661888` minutes before, so there was nothing to merge in
- [x] `node scripts/gates.mjs` — **n/a, and deliberately**: documents-only, which `check-docs-only.mjs` detects and `ci.yml` uses to skip the heavy jobs. The runbook forbids touching code to make a documents PR run them. Stated rather than ticked
- [x] `node scripts/check-test-plan.mjs --base origin/main` — exit 0, read from the command and not through a pipe
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

`node scripts/check-production.mjs role-cards` on production, read **before** writing the bullet so the five
card keys are quoted rather than remembered: the cards each role holds are `record_vet_care`;
`do_maintenance, my_tasks`; `administer_medication, record_weight, add_medical_photos, feed_special_diets,
my_tasks, view_medical`; `book_clinic_visits, record_weight, recurring_jobs, residents, do_purchasing,
enclosures, contacts, donations_receipts, bills, approve_photos, run_appeals, meme_library,
feed_special_diets, add_medical_photos, my_tasks, who_does_what, publish_shelter_friends`;
`do_stocktaking, do_purchasing, record_delivery, do_maintenance, record_weight, my_tasks, residents,
view_medical`; and `add_photos, my_tasks`. **None of them includes `manage_medical`, `translations`,
`propose_translations`, `view_translations` or `assistant`**, which is the claim the bullet makes.

That check prints its own warning that it is transient context and not a measurement, because roles are a
transient grouping of cards. It is used here only to establish **which cards are held by nothing today**,
which is a statement about cards, and the bullet is written that way.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the "function" of this bullet is that the next release manager reads it and does not ask again. Checked by reading the rewritten bullet cold: it states the answer, who gave it, the date, what was declined, and that it is neither a defect nor a decision anyone is owed
- [ ] Data persists — n/a: no data. Git is the persistence
- [ ] Create / edit / delete all exercised — n/a: no operation exists
- [x] Empty state renders sensibly — n/a as written. The nearest real check: the bullet reads correctly **without its last sentence**, which is what `CLAUDE.md` requires of an answered item, since anything skimming a document reads the first line
- [x] Invalid input is rejected with a readable message — exercised for real: `check-test-plan.mjs` refused this PR's sibling plan earlier today for an `n/a` whose reason did not follow the colon immediately
- [ ] Boundary cases checked — n/a: no boundary
- [ ] Driven in a real browser — n/a: the handover has no surface and is never served by the app

### Role access matrix

**Not run, and deliberately.** Reported by card rather than by role, as `CLAUDE.md` requires. **No card,
cell, activity or control changes**, and the file is a repository document the app never serves, so there
is no access to test in either direction.

- [ ] Every role above tested — n/a: there is no matrix. The five cards named in the bullet are held by nothing before this PR and held by nothing after it
- [ ] A role that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: the handover is not a manual topic
- [x] Translatable strings go through the translation path — n/a: an English repository document, never shown in the app
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no code
- [ ] Network clean — n/a: no request

## 6. Regression

- [x] The pages nearest the change still work — n/a as written; no code is touched, so nothing can regress, and `check-docs-only.mjs` is what asserts it
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` is read by the next release manager and nobody else, and **outranks nothing**, which its own opening lines say. Checked that the edit does not contradict `docs/releases/2026-11-02-0-41-2.md`, which lists the same cards as unheld: the record describes the state on release day, which is unchanged and still true; this bullet adds the decision about it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch starts at `3f661888`

## 7. Documentation

- [ ] Backlog item ticked — n/a: no item covers this, and none should be created. A declined action is not work
- [x] Non-obvious design choices recorded — the bullet itself is the record, and it says why it is worded as a stop rather than a status: four editions listed this as open before it had ever been put to him, which is the "false block is silent" fault `CLAUDE.md` describes
- [x] `README.md` still accurate — it does not mention cards or the handover
- [ ] **Release notes.** — n/a: nobody using the app would notice. One paragraph of a document read only by the next release manager; nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched, and **no card changed hands**, so nothing a shelter user can see or do is different
- [x] Commit messages say why, not just what — the commit says it is closing an answered question so it stops being re-asked, and quotes his answer
- [x] **Claims were measured, not reasoned** — the five card keys are quoted from `check-production.mjs role-cards` run against production, pasted under **Evidence**, not recalled

## 8. Pre-production gate

- [x] Tested SHA recorded in the header — this PR ships one document
- [ ] Deployed SHA matches the tested SHA — n/a: nothing to deploy. This document is not served, imported or bundled
- [ ] Deployed to test — n/a: a repository document ships with the next release and changes nothing when it does
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no surface
- [ ] Timezone-sensitive behaviour proved — n/a: the only date is `2026-11-02`, a literal
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `role-cards` output
- [ ] Public pages re-checked after a cache purge — n/a: no public page is affected
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy in this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added
- [ ] Both a migration and code that reads it — n/a: no migration in this PR
- [ ] `--env production --dry-run` clean — n/a: no migration in this PR
- [ ] Backup fresh for a destructive migration — n/a: no migration in this PR
- [x] Rollback position stated, including what it does not cover — **nothing to roll back**: reverting this PR restores one paragraph and changes no behaviour, no card and no access

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | Four handover editions carried the unassigned cards as an open item before anyone had put it to him | **Fixed here, and that is the point of the PR.** It is now recorded as answered, with his words and the date |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | n/a: there is nothing for a person to look at. The one thing a person could judge — whether the bullet states his answer correctly — is his own answer from this conversation, quoted in the bullet | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is `n/a`

Manual verification by: n/a: one paragraph of a document read only by the next release manager, with nothing for a person to look at on a screen; the answer it records was given by Lutan in chat on 2026-11-02 and is quoted in the bullet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-02
