# Feature test plan

## Header

| | |
|---|---|
| Feature | Show each backlog item's permanent id on its row on the Lanna Care Backlog page |
| Backlog item | `docs/backlog.md` → none; asked for directly in chat by Lutan, 2026-11-08 |
| Branch / worktree | `claude/backlog-page-ids` @ `C:\Development\Animal_Shelter_backlog-page-ids` |
| Dev server | not used — this change is to a generator script, not to the app |
| PR | #1385 |
| Tested by / date | Claude (backlog manager) / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | `547f28cd` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *every item row on the generated backlog page now shows its own five-character id, because Lutan could not follow references to ids he could not see.*
- [x] Files/areas touched listed — `scripts/gen-backlog.mjs` (the chip in each item's `<summary>`), `scripts/lib/backlog-page/head.html` (the `.iid` style), `scripts/lib/backlog-page/priorities.html` (the same chip on a ranked row). **No app code, no route, no `worker/`, no migration, no shared lib.**
- [x] Cards affected identified — **none.** The backlog page is an artifact published to claude.ai from a script run by hand; it is not served by the app, has no login and no card touches it. Admin and the signed-out public are unaffected because neither can reach it.
- [x] Anything explicitly out of scope written down — the id is **displayed only**. Nothing searches, filters or links by it, and the anchor `id="i-<id>"` already on each `<li>` is unchanged, so existing deep links and the priorities store keep working.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 80s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 158s
=== gates: test — npm test
=== gates: test exited 0 after 23s
=== gates: build — npm run build
=== gates: build exited 0 after 196s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/gen-backlog.mjs` run against `main`'s `docs/backlog.md` at `3f5e5a28`; output reported `67 open, 951 done, 93% of 1018`, and the HTML holds **67 `<li class="item">` rows and 67 `class="iid"` chips**, so every rendered row carries one. Spot-checked three against the file: `#40oz4`, `#ay3d6`, `#314hq`. Published to the artifact as version 224.
- [x] Data persists — n/a as a stateful check, but the equivalent was verified: the `<li>` anchor ids are unchanged, so the `priorities/ranking` document still matches rows by the same keys and the existing picks still resolve. Checked by diffing the generated anchors before and after: identical.
- [ ] Create / edit / delete all exercised — n/a: the page is generated and read-only; it has no create, edit or delete
- [x] Empty state renders sensibly — an item with no id emits **nothing** rather than an empty chip (`itemId ? … : ""`), and the ranked-row chip is emitted only for an id matching `^i-[a-z0-9]{5}$`, so a pick made before ids existed shows its title with no chip. Both paths read in the source; no such item exists today (`check-backlog-ids`: 1018 items, 1018 ids).
- [ ] Invalid input is rejected with a readable message — n/a: the only input is `docs/backlog.md`, whose shape is already enforced by `check-backlog-ids.mjs` and `check-backlog-sections.mjs`
- [x] Boundary cases checked — the id is a fixed five characters by construction, so there is no long-text case; the chip is `flex:none` beside a `flex:1` title, so it cannot squeeze the title at a narrow width.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: the backlog page is not served by the app |
| exactly `<card key>` | n/a | n/a | n/a: no card reaches a published artifact |
| signed out | n/a | n/a | n/a: the artifact is private to Lutan's claude.ai account |

- [ ] Every login above tested — n/a: the change is to a script that writes an HTML file; there is no app surface and no login
- [ ] A login that should not have access is blocked server-side — n/a: no server, no route, no RLS involved

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not an app page, so it has no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual documents the app for shelter users; the backlog page is an internal artifact they never see
- [ ] Translatable strings go through the translation path — n/a: no new user-facing string; an id is the same in every language
- [ ] Mobile viewport (375px) — pending: the chip is `flex:none` beside a `flex:1` title and 52px wide at 12px monospace, so it is sized not to wrap the row, but this was not seen on a phone. Listed under **Left for manual verification**
- [ ] Browser console clean — pending: the published page could not be opened in the built-in pane, which asks for a claude.ai sign-in it does not have, and refuses to run page tools against a local file. The added code is one `document.createElement` in a loop that already builds three other elements the same way. Listed under **Left for manual verification**
- [ ] Network clean — n/a: the page makes no request for this change; the chip is static markup

## 6. Regression

- [x] The pages nearest the change still work — the generator's other output was compared before and after: section headings, open/done counts, the `prio-finished` done-id list and every `<li>` anchor are byte-identical apart from the inserted chips.
- [x] Any shared file touched checked from a second, unrelated page — `head.html` and `priorities.html` are shared by the whole page, so the whole page was regenerated and re-published rather than reasoned about: version 224 renders all 67 items, every section heading and the priorities panel markup. The `.iid` rule adds a new class and changes no existing selector.
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` at `3f5e5a28` and all four gates passed afterwards.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: there is no backlog item; Lutan asked for this directly in chat on 2026-11-08. Searched `docs/backlog.md` for `gen-backlog`, `backlog page` and `artifact`: no open item is closed by this change
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-08-backlog-page-item-ids.md`
- [x] `README.md` still accurate — it does not describe the backlog page's layout, so nothing in it is now wrong.
- [ ] **Release notes.** — n/a: the backlog page is an internal artifact generated by `scripts/gen-backlog.mjs` and published to Lutan's own claude.ai account; it is not part of the app, no shelter user can reach it, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched
- [x] Commit messages say why, not just what — the commit quotes the sentence that prompted it and says what was invisible and to whom.
- [x] Claims in commit messages and decisions were measured, not reasoned — the counts in the decision file (67 rows, 67 chips, 1018 ids) are from the run and from `check-backlog-ids.mjs`, not estimated. Where the change was **not** measured — how it looks on a phone, and the console — the plan says so rather than asserting it is fine.

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing here is deployed; the change takes effect the next time the generator is run by hand
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy
- [ ] Deployed to test: `npm run deploy:test` — n/a: no deploy; the script is run locally and its output is published as an artifact
- [ ] Smoke-tested on `test.lannacare.org` — n/a: the backlog page is not served by any environment
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic is touched
- [ ] Boundary or banding change — n/a: no threshold, band or cutoff is touched
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block above and the generator's summary line are copied from their runs.
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var
- [ ] Migration ordering — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: nothing is deployed, so there is nothing to roll back. If the chips are unwanted, the three edits are reverted and the page regenerated; the artifact also keeps every earlier version

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The chip reads clearly and does not crowd the title | The Lanna Care Backlog artifact, version 224 or later |
| 2 | The row still reads well on a phone at 375px, with the chip, title and star badge on one line | The same page on a phone |
| 3 | The priorities panel's ranked rows show their ids and still drag and re-order | The same page, Customer priorities panel |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (backlog manager)  Date: 2026-11-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty, so only the person who looks may tick this

Manual verification by: pending: Lutan is reading the published page now; three rows above need a person's eye, one of them on a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here reaches production; the change affects a script run by hand

Result: pass

Release manager acknowledgement: n/a: no production surface
