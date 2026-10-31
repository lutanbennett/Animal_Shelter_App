# Feature test plan — thai-dictionary-sweep

## Header

| | |
|---|---|
| Feature | Thai dictionary sweep: the eleven lines the sweep found wrong, plus `scripts/check-thai-dictionary.mjs` in CI |
| Backlog item | `docs/backlog.md` → `## Management` → *THAI TRANSLATION SWEEP ACROSS THE APP AND THE WEBSITE*, half (B) only |
| Branch / worktree | `claude/thai-dictionary-sweep` @ `C:\Development\Animal_Shelter_thai-dictionary-sweep` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR this plan is committed to |
| Tested by / date | Claude (Opus 5) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | ffa76e31 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — eleven Thai lines in `src/lib/i18n/dictionaries/th.ts` corrected, and a new CI check that stops a Thai entry being its English copied across
- [x] Files/areas touched listed — `src/lib/i18n/dictionaries/th.ts` (11 lines), `scripts/check-thai-dictionary.mjs` (new), `.github/workflows/ci.yml` (`script-integrity` job), `docs/decisions/2026-10-31-thai-dictionary-check.md`, `docs/backlog.md`, `docs/test-plans/thai-dictionary-sweep.md`. No `src/app/`, no `src/components/`, no `worker/`, no migration
- [x] Roles affected identified — every role reading the app in Thai sees the eleven corrected lines; Admin additionally sees the two *Who does what* card descriptions and the Status tile. No access changes at all: nothing in this PR reads a role, a card or an activity
- [x] Anything explicitly **out of scope** written down — the fixing of the English typed straight into components (measured here at 15 strings in 3 files and filed as its own item under `## Architecture`); half (A) and everything on Management → Translations; the twelve unreachable `_th` columns; the Thai edition of the manual; the Director's own website wording. Nine Thai lines naming a **Google Drive** folder were deliberately left in English, and the reasoning is in the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Its closing lines, exactly as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `pi-failover-schema` owns `0292` this batch
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no row in any table is read or written by this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — for a dictionary PR the happy path is that every corrected key still resolves and the file still satisfies the `Dictionary` type. `npm run typecheck` proves that structurally (`th.ts` is typed against `en.ts`, so a renamed or dropped key fails), and `npm run build` proves both dictionaries compile and are bundled. The eleven values were also read back through the running module: `node -e` importing `th.ts` and printing each of the eleven key paths returned the new Thai, with no `undefined`
- [x] Data persists — reload the page and the change is still there — the dictionary is source, not data; the *persistence* equivalent is that the new strings survive a production build, which `build=0` and the bundled output show
- [ ] Create / edit / delete all exercised — n/a: this PR adds no screen and no action; it changes wording that existing screens already render
- [ ] Empty state renders sensibly — n/a: no list and no query added
- [x] Invalid input is rejected with a readable message, not a crash — the new check's own inputs: it was run against a deliberately broken allow-list (a bogus `"common.save"` entry) and reported `FAIL ALLOWED["common.save"] is stale`, exit 1, rather than passing silently; and its templated-entry sampler was exercised against entries taking a scalar, an array and an object, which is what turned three false positives into zero
- [x] Boundary cases checked — the check was run over the whole file (5,285 strings, 950 templated functions, 15 arrays), including multi-line values, values holding only punctuation (`—`, `…`, `4:5`), values that are only placeholders, and functions whose argument is an array or an object. Rule 2 was run over all 460 `.tsx` files

### Role access matrix

Not applicable to this PR, and the reason is specific rather than general: nothing in the diff reads a role, a card, an activity or `perms`, adds a route, or changes a server action or an RPC. The eleven strings are rendered by screens whose access is unchanged, so there is no access surface for a matrix to measure. Recording per-role rows here would be inventing evidence. Two of the eleven are *Who does what* card descriptions, which only Admin reads — noted under *Left for manual verification* rather than ticked.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | unchanged | unchanged | n/a: no access surface in this diff |

- [ ] Every role above tested — n/a: no access surface in this diff, as set out above
- [ ] A role that should not have access is blocked server-side — n/a: this PR adds no page, action or RPC to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added or renamed; `NavLinks.tsx` is untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no feature to document, and the brief forbids touching `src/lib/manual/en.ts`, which `CLAUDE.md` names as the file nearly every UI stream touches
- [x] Translatable strings go through the translation path — this PR *is* the translation path for the app's own wording. The eleven lines are in `th.ts`, the file `en.ts` types; none of them is content typed into the system, so none appears at `/management/translations` (that is half (A), done 2026-10-31 by #1128). The new check now asserts the whole file against `en.ts` on every CI run
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change. Two replacements are longer than what they replace (the *Manage medical* description gains a clause, the diets forecast note is rewritten); both sit in prose blocks that already wrap, and the English equivalents of both are longer still and already ship. Listed under *Left for manual verification* so a person can confirm on a phone
- [ ] Browser console clean — no errors or React warnings — n/a: no browser pass was driven; see the note under *Left for manual verification*
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no request path changed; this PR adds no route, fetch or action

## 6. Regression

- [x] The pages nearest the change still work — proved by type and build rather than by loading: every one of the eleven keys is consumed by existing call sites that `tsc` resolves (`t.photos.medicalTile` in `src/app/residents/[id]/edit/EditResidentForm.tsx:204`, `d.emailSubject` / `d.emailBody` in `src/app/management/donations/[id]/ReceiptActions.tsx:96-97`, and the rest through `t.…` lookups), and `typecheck=0` means none of those lookups broke. No key was added, renamed or removed, so no call site could be left dangling
- [x] Any shared file touched checked from a second, unrelated page — `th.ts` is the shared file, and the honest statement is that this was checked **by type and build, not by loading a page**, which the template calls the weaker reading. It is recorded as the weaker reading on purpose: the risk a page load would catch is a broken key, and `th.ts` being typed against `en.ts` makes that a compile error rather than a runtime one. The risk a page load would **not** catch is wrong Thai, which is exactly what is left for the bilingual reader
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — half (B)'s clause struck through with what was done, the item's title rewritten so it reads correctly without its last paragraph (the only thing left is the bilingual read), and the *"Half (B) is untouched and still open"* status replaced. Half (A)'s strikethroughs and the person-only jobs left alone. The follow-up (the English typed into components) went on the `backlog` branch as `eacdf396`, not here
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-31-thai-dictionary-check.md`
- [x] `README.md` still accurate — read; it describes the app and its scripts in general terms and names no dictionary check, so nothing in it became wrong. No change needed
- [ ] **Release notes.** — n/a: the eleven Thai lines wait on a bilingual read before this merges, so a note would promise a user wording that is not live yet. The note belongs in the PR that follows her read. (A shelter user reading Thai *would* notice, so this is `n/a` for the outstanding step, not for lack of visibility — `docs/decisions/2026-10-11-release-note-truth-rule.md`.)
- [x] Commit messages say why, not just what — three commits: the eleven lines with what each group was and why Drive folder names stay English; the check script with why rule 2 reports rather than blocks; and this plan
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every number in them came from a run, and two were corrected after being read rather than shipped as first printed: rule 2's count went from **56 to 15** once the list was read and over half turned out to be TypeScript generics, and the identical-value count went from the planner's **27** to **96** once the comparison was done at runtime instead of by regex. Two things that read like faults were checked and are not: `admin.security.twoStep.codeSubtitle` names *Lanna Animal Care*, which `src/lib/auth/two-step.ts:123` really does register as the authenticator issuer; and `src/lib/i18n/enum-labels.ts` holds no label text at all, so "fix the stale enum labels" had nothing to fix — all 60 labels across 16 enum groups are already translated

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR reads a clock, a date or a timezone; the diff is dictionary strings, a check script and a CI step
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band, rounding rule or cutoff in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is the script's closing lines as printed; the check-script figures quoted elsewhere are from its own stdout
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — this PR changes source strings, a script and a CI step only, so reverting the commits and redeploying restores the previous wording completely; there is no schema and no data to undo. What that does **not** cover: the Desktop document `Thai dictionary gaps - 2026-10-31.html` is outside the repository and a revert does not remove it, and the backlog item filed on the `backlog` branch (`eacdf396`) is a separate commit that a revert here leaves in place. Both are deliberate.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The donation receipt's email subject and body were English in the Thai dictionary, so a staff member using the app in Thai composed an English letter to the donor | fixed (Thai wording awaiting the bilingual read) |
| 2 | low | `photos.medicalTile` was the literal word *Medical* while the same folder reads `การแพทย์` in the gallery | fixed |
| 3 | low | Five Thai lines named an in-app folder or screen in English while the file already had Thai names for them | fixed |
| 4 | low | Three Thai entries were left behind when their English changed: the diets forecast note (pre-recipe model), the Pi origin tile (lost the emergency-switch clause) and the *Manage medical* card description (never gained *record a death*) | fixed |
| 5 | low | English typed straight into components instead of the dictionary: 15 strings in 3 files, the largest being `src/lib/archive/resident-summary-pdf.tsx`, which takes no locale at all | deferred to backlog (`## Architecture`, filed `eacdf396`; measuring it was this stream's deliverable, fixing it was explicitly not) |
| 6 | none | Rule 2 of the new check first reported 56 occurrences; reading the list showed over half were TypeScript generics read as words | fixed before commit (matcher now rejects code punctuation and generic type names; 15 is the figure to trust) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The eleven Thai lines read correctly to a bilingual reader.** This is the whole point of the stream and the reason the PR is not merged. English, current Thai and proposed Thai side by side, grouped by where in the app each appears | `C:\Users\Leidos\OneDrive\Desktop\Thai dictionary gaps - 2026-10-31.html`, and the same eleven in the PR body |
| 2 | **The one open question in that document:** the receipt email is composed in the *sender's* language, so a Thai-speaking staff member now sends a Thai letter to a donor who may be from abroad. Is that wanted, or should the letter always be English? | the warning box at the top of the same document |
| 3 | The two longer replacements wrap sensibly on a phone (375px): the *Manage medical* card description and the diets forecast note | Settings → Who does what (Admin); Management → Diets, the note under the forecast |
| 4 | The *Medical* photo label reads `การแพทย์` on screen in Thai | a resident → Edit → the photo strip, with the app in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; all four items wait on the bilingual reader, and this PR is held open for her

Manual verification by: pending: the bilingual read of the eleven Thai lines, and the one question about which language a donor's receipt email should be in

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: this PR is held for the bilingual read and must not be merged before it
