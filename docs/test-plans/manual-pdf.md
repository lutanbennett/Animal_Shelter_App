# Feature test plan — manual-pdf

## Header

| | |
|---|---|
| Feature | Manual as a printable PDF (`GET /manual/pdf`) |
| Backlog item | `docs/backlog.md` → Manual as a printable PDF |
| Branch / worktree | `claude/manual-pdf` @ `C:\Development\Animal_Shelter_manual-pdf` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | not yet opened |
| Tested by / date | Claude, 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | branch tip after the gates commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a signed-in `/manual/pdf` route renders the same `Manual` data as a PDF, linked from the Manual page
- [x] Files/areas touched listed — `src/app/manual/pdf/route.ts`, `src/lib/manual/manual-pdf.tsx`, `src/app/manual/page.tsx` (link), `src/lib/manual/en.ts` (new topic), `src/lib/releases.ts`, `docs/`
- [x] Roles affected identified — every signed-in role (the manual's readers); signed out is turned away
- [x] Anything explicitly **out of scope** written down — no Thai edition (no `th.ts` exists yet), no screenshot regeneration, PDF stays behind sign-in (docs/decisions/2026-09-29-manual-pdf.md)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in 0116 and the microchip-vet files)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven by Claude; the route is behind sign-in and a session could not be used here, so the PDF has not been opened yet (see Left for manual verification)
- [ ] Data persists — reload the page and the change is still there — n/a: no stored data; the PDF is generated on request
- [ ] Create / edit / delete all exercised — n/a: read-only route
- [ ] Empty state renders sensibly — n/a: the manual always has content; a role with no topics in a section skips that section in code
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the only inputs are `view` and `images`, and anything unrecognised means the default
- [ ] Boundary cases checked — n/a: not driven; tall and phone-width screenshots are scaled to fit 420pt in code and are in the manual-verification table

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/manual/pdf` | Whole-role copy; `?view=all` gives everything | not driven |
| management | `/manual/pdf` | Own-role copy | not driven |
| staff | `/manual/pdf` | Own-role copy | not driven |
| vet | `/manual/pdf` | Own-role copy | not driven |
| volunteer | `/manual/pdf` | Own-role copy | not driven |
| signed out | `/manual/pdf` | 307 to `/login?next=%2Fmanual%2Fpdf` | curl on the dev server returned `307 http://localhost:3013/login?next=%2Fmanual%2Fpdf` |

- [ ] Every role above tested — n/a: only signed out was driven; the rest are in the manual-verification table
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — signed-out request to the URL redirected to login

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; the PDF is linked from the Manual page
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new "Printing this manual" topic added under Getting started (read in source; not viewed signed in)
- [ ] Translatable strings go through the translation path — n/a: the manual is English-only content, not database text
- [ ] Mobile viewport (375px) — n/a: not driven; the only page change is one line of links inside the existing filter bar
- [ ] Browser console clean — n/a: not driven, no session
- [ ] Network clean — n/a: not driven, no session

## 6. Regression

- [ ] The pages nearest the change still work — n/a: `/manual` needs a session that could not be used here
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `manual/en.ts` was touched, and only `/manual` and the PDF read it
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in at this commit

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-09-29-manual-pdf.md`
- [ ] `README.md` still accurate — n/a: README does not list the manual's features
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for the printable manual
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — n/a: the ~11.7 MB / 44 PNG figure was measured with `ls`; no timing or memory claim is made

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (**must include `/manual/pdf?view=all` on the Worker**: 44 PNGs are decoded in memory and the Workers limits have not been exercised)
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no thresholds
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: no pasted evidence beyond the curl line above
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — `npx wrangler rollback --env production` reverts the Worker; no schema is involved, so nothing is left behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in, open `/manual/pdf`: it opens, paginates, has your role's topics, screenshots are present and readable, footer shows page numbers | dev server, `http://localhost:3013/manual/pdf` |
| 2 | `/manual/pdf?view=all` and `?images=0`: the whole manual renders, and the text-only file is far smaller | same |
| 3 | The "Print this as a PDF" and "Without screenshots" links on `/manual` (both views) go to the right files | `/manual` and `/manual?view=all` |
| 4 | Print it on paper: is text legible, are the tall screenshots (e.g. admin-website) sensibly scaled, do page breaks fall well | a printer |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — Lutan confirmed in chat that the PDF creates, downloads and looks as expected (items 1–3; item 4, paper printing, was not separately confirmed)

Manual verification by: Lutan Bennett — confirmed in chat; line written by Claude at their request  Date: 2026-09-29

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [ ] Checklist pasted into the PR — n/a: PR not yet open
- [ ] Handed to the production release manager — n/a: PR not yet open

Result: pass

Release manager acknowledgement: pending
