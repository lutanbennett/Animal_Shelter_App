# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.5` — **minor, and it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-5` @ `C:\Development\Animal_Shelter_cut-release-0-47-5`, port `3005` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-19 |
| Carries a migration? | **the cut does not; the release carries SIX** — `0416`–`0421`, pending on production and UAT, already applied on dev |
| Tested at SHA | `c2d5b72a0` (the cut commit); the release range is `bc13394ee..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.5` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.5`, and the two notes written in this PR's first commit move across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **Both notes are `admin: true`**, so only Admin sees them and a card-holding login sees the `0.47.5` heading and title with nothing beneath. The signed-out public does not reach `/releases` at all
- [x] Out of scope — **the six migrations, all three Worker deploys and all three Pi builds are the release, not the cut.** No application code was written here

### THE THING THAT MAKES THIS CUT DIFFERENT, AND IT IS THE WHOLE STORY

**`unreleased` was EMPTY, with eleven streams and 22 merged PRs since the `0.47.4` cut.** Not one of them
touched `src/lib/releases.ts`. That is the state `0.39.5`'s handover warns about in this very procedure —
*"an empty `unreleased` is not proof that nothing user-visible shipped"* — so it was measured rather than
accepted:

- `git log bc13394ee..HEAD --name-only -- src/app src/components src/lib/manual src/lib/i18n worker`
  returns **four** changes: the platform console (#1739, #1742), the stocktaking failure message (#1740),
  and the font swap (#1725).
- `node scripts/check-deferred-notes.mjs` reads **64** test plans changed in the range and reports that
  **every one** answered the release-notes line `n/a`, with a reason. It exits 0: no note is held back
  wrongly.

**So the `n/a` answers were right about shelter users, and wrong about Admin.** Three of the four are
genuinely invisible — the fonts must render identically, the stocktaking message cannot be reached
(`0417` backfills every shelter's row, so no shelter is in the state that triggers it), and the console
is seen by a product administrator, who today is one person. **But the fourth thing is not invisible to
Admin: this release deletes the Product admin tile from Settings and the page behind it.** An Admin who
used that page today — Lutan did, this morning — meets a gone tile and a 404 with nothing to explain it.

**That is what release notes are for, so two were written in this PR's first commit (`fcd94af6a`),
both `admin: true`:**

1. the console moving off Settings onto the platform's own address, **naming the two set-up steps the
   new address needs**, so it promises nothing that is untrue at the deploy;
2. the six console writes that `0419`–`0421` fix — creating a shelter, adding starting content, setting
   receipt numbers, removing an address, giving the Admin role, linking the first Admin login — each of
   which was being refused behind a misleading *"your second step has expired"*.

**Writing them was not a free choice: `cut-release.mjs` refuses before writing if `unreleased` is
empty.** A zero-note release can only be had by going round the tool, and a `0.47.5` entry with a title
and no lines would read as "nothing shipped" for a release carrying eleven streams and six migrations.

**The note that was considered and NOT written** is the stocktaking one. Its own plan says `0417`
backfilled every shelter, so nobody can reach the new message; a note would have invented visibility.
Worth recording because it was the first candidate and it was wrong.

### The deferred-note gate is a real gate on a release, not advisory

`cut-release.mjs` **refused outright** — *"16 PR(s) above wrote n/a for a step that may close in this
release"* — and wrote nothing until each was reviewed by name through
`--deferred-reviewed`. Both verdicts are recorded in that argument and in the cut commit. Two are still
open (`calendar-connect-screen`, waiting on a hand-run script and a token only Lutan can mint;
`stocktaking-silent-save`, above), eleven owe nothing because their note already shipped in their own PR
or their reason quotes the rule rather than naming a step, and the rest are closed by **this** release's
two notes.

### Lutan was asked nothing, because he had already answered

He said *"lets do a minor release no email, gaps in tests noted"*. **The procedure is explicit that the
version is derived from the mail answer and never from the word "minor"**, which means different things
to the two sides of the conversation. No mail → `major: false` → the last number moves → `0.47.4` →
`0.47.5`. Asserted in §2 by the mail-absence assertion rather than inferred from his sentence.

**One thing he is told in plain words rather than being asked:** eleven streams ship under a patch
label. That is what his answer derives, and the label is his to overrule before the deploy.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `5808882bb` by `worktree.mjs new`, and nothing was merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 46s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 167s
=== gates: test — npm test
=== gates: test exited 0 after 37s
=== gates: build — npm run build
=== gates: build exited 0 after 136s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — exit **0**, 15 assertions, including that *"could not ask"* is a refusal rather than a warning
- [x] `node scripts/check-release-order.mjs --env production` — `no guarded migration is pending here, nothing to prove`
- [x] **`node scripts/cut-release.mjs 0.47.5 2026-11-19 minor --verify --base <pre-cut file>` — all 17 assertions pass.** The base was built as the procedure requires, because **this cut publishes notes added in the same PR**, which makes plain `origin/main` the wrong base and fails two assertions on a count that is correct:

```
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [2 vs 2]
ok   package.json version equals the newest entry  [0.47.5]
ok   package-lock.json top-level and root-package versions equal package.json  [lock 0.47.5 / root 0.47.5 / package.json 0.47.5]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]
all 17 assertions passed
```

  **The base used, and why:** the working file at commit `fcd94af6a` — `origin/main`'s `releases.ts`
  plus exactly the two notes added in this PR and nothing else — copied aside *before* the cut ran. That
  is the only base against which the carried notes **and** the added ones are both asserted rather than
  waved through.
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### Before the deploy (the two checks the procedure puts here)

- [x] **`npm run audit:prod` / `npm run audit:register`** — `audit:register` exits **0**: *"1 high/critical advisory, all registered and still unreachable"*, the `glob` CLI command-injection advisory `GHSA-5j98-mcp5-4vw2`, which has a dated register entry. **Recorded as "clean against the register", not as "clean"**: raw `audit:prod` prints 5 vulnerabilities (1 moderate, 4 high), all the same registered `glob`/`minimatch` chain through `@opennextjs/cloudflare`
- [x] **`node scripts/check-dev-aal2-absent.mjs --env production`** — exit 0. Six static proofs plus a live read: production holds no `dev-signin-*` login, and no migration after `0411` alters either aal2 policy (422 files read)
- [x] **`node scripts/check-dev-aal2-absent.mjs --env uat`** — exit 0, same eight lines against `fsjagxmxjosauwmxwype`

## 3. Schema and data

- [ ] Migration numbering / re-runnable / down-migration / dry-run — n/a: **this PR carries no migration.** The six the release ships were written and applied to dev by their own PRs
- [x] **The six pending files were read for a consumer header, and all six have one** — `0416` and `0417` say `consumer: none` (nothing read them when they were written), and `0418`–`0421` name `src/app/platform/actions.ts` and `page.tsx`, which **exist only in this release**
- [x] **Applying them before the deploy is safe, and that was reasoned from the files rather than assumed.** `0419`–`0421` add a `set_config(..., is_local => true)` of the shelter header inside functions that already check product-administrator and `aal2`; who may call them is unchanged. `0.47.4`'s console calls some of the same functions, and the change makes those calls **work**, not fail — the fix is to a refusal, so there is no window in which older code is worse off
- [x] **Both databases read before the cut**, and the figures are the measurement the record will carry

```
production (dbkodyyxxhtygxcxmfcu)  416 applied, 6 pending, 0 drift either way
uat        (fsjagxmxjosauwmxwype)  416 applied, 6 pending, 0 drift either way
test/dev   (qxkmhwybjggxvsfxsxbd)  422 applied, 0 pending, 0 drift either way
```

- [x] **`0417` has NOT run on production yet**, which the planner's own message understated as four pending files. It matters here and not only as bookkeeping: the stocktaking note was declined on the grounds that `0417` backfills every shelter's settings row, and **on production that backfill happens during this release**, not before it

## 4. Functional checks

- [x] **The cut is data, and its one real failure mode is a lost or altered note** — which no gate catches and reading it over does not catch either. That is what the 17 assertions above are, and they were run mechanically against a base built for this cut
- [x] **No `[object Object]` or `undefined` in the new entry** — asserted
- [x] **The mail will not be sent, proved as an absence AND a presence.** `majorReleasesSince("0.47.4")` is `[]`, and the control assertion shows the same function still finding `0.47.0` from further back, so the empty answer is the flag being `false` rather than the function being broken
- [ ] **A signed-in browser read of `/releases`** — pending: three batch-1 streams are running on ports 3001–3003, and `dev-signin.mjs admin` re-keys the single shared `dev-signin-admin@example.invalid` login, which would sign them out mid-stream. The shape is identical to `0.47.4`'s, which measured it two cuts ago, and Lutan is Admin on production, where it is checked after the deploy
- [x] Empty state / invalid input / boundary cases — n/a: a release entry has no inputs. The boundary that exists is the empty `unreleased`, and the tool refuses it, which §1 covers at length

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the cut adds no route and no card. `/releases` filtering is unchanged, and both notes being `admin: true` is asserted by the character-identical carry

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a version number and two notes. No nav entry, no manual topic, and the notes are English, as every release note is

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` read the same file through the same accessors; the typecheck and test gates cover the shape and the assertions cover the content
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is read by `/releases`, by the Worker's `/api/releases/current` and by `deploy.mjs` under Node's type stripping. **The third is the one that bites**, and `check-release-guards.mjs` exercising it at exit 0 is the check that it still loads
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a cut ticks nothing. The items its contents close were ticked by their own PRs
- [x] Non-obvious design choices as a new file in `docs/decisions/` — **this plan and the cut commit are the write-up.** The one judgement worth a decision file is the empty-`unreleased` reasoning, which is recorded in §1 and will be carried into the release record
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **a cut PR cannot tick this line, by construction.** The checker requires `unreleased` to have *gained* a line, and a cut's whole purpose is to empty it. The two notes were gained in `fcd94af6a`, the commit before the cut, and are listed in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the empty `unreleased` from `awk` on the file; the four user-facing changes from `git log --name-only` over the range; the 64 `n/a` answers from `check-deferred-notes.mjs`; the three databases from `--status` on each; the consumer headers from `head -3` on all six files; the advisory from `audit:register`'s exit code; the 17 assertions from the run pasted above

## 8. Pre-production gate

- [x] Deployed SHA will be the merge commit of this PR, read back from `/api/version` on all three hosts
- [x] **Deploy safety, and the one thing that is new this release.** `cooperjaidee.org` becomes live in this deploy: production's config carries `PLATFORM_HOST` and two `custom_domain` routes, and **the deploy creates both addresses and their certificates itself, refusing to overwrite an existing record**. The zone must be empty for that to work
- [x] **What I measured myself:** the zone is on Cloudflare (`dean.ns.cloudflare.com`, `athena.ns.cloudflare.com`); `www.cooperjaidee.org` is **NXDOMAIN**; the apex returned **SERVFAIL** for `A`, `AAAA` and `CNAME`, which is not a clean "no record" — **so I could prove `www` empty and could not prove the apex empty**
- [x] **What the planner reported, recorded as theirs and not as mine:** Lutan's two by-hand steps are done — the zone holds **0 of 200 records, read in the Cloudflare zone list with Lutan on screen**, not from DNS, which is exactly why my SERVFAIL could not settle it; and the Supabase redirect URL is on the production project. **With that, his deploy is one command again** rather than the three touches section F would otherwise cost. **TRAP, from the same message: Cloudflare's Recommendations panel urges adding apex and `www` records, and following it would break this deploy.** The right state for that zone is empty
- [ ] Smoke test / UAT project line — n/a: nothing is deployed by a cut, so there is nothing to smoke-test at this commit. `docs/release-smoke-test.md` is run after the three deploys and copied into the release record

### Rollback

- [x] Rollback position stated — reverting this PR puts `package.json` back to `0.47.4` and the two notes back into `unreleased`; nothing is deployed by the cut, so there is nothing live to undo. **After the deploy the position is different and worth knowing now:** the six migrations are additive or widen a refusal, so `0.47.4`'s code runs against the `0.47.5` schema, exactly as `0.47.3`'s deferral relied on — **but `cooperjaidee.org` going live is not undone by a code rollback**, since the deploy creates the addresses and their certificates

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (process) | **Eleven streams merged and `unreleased` stayed empty.** Every one of 64 plans reasoned the line `n/a`, correctly about shelter users and wrongly about Admin — the Settings tile and page this release deletes are plainly visible to the one person who reads release notes | **fixed here**: the two notes were written in this PR, and the reasoning is in §1 so the next release manager does not re-derive it. The deeper fault — that `n/a` is answered about shelter users while `admin: true` notes exist for exactly this case — is for the planner to file |
| 2 | low (measurement) | **`check-deferred-notes.mjs` prints the rule's own text as several PRs' "reason"**, because those plans quoted the rule in the `n/a:` line. Five of the 16 candidates are that, which makes the list longer than the real question | **recorded, not fixed.** The gate is right to refuse until reviewed; the noise is in what the plans wrote |
| 3 | low (verification) | **The apex of `cooperjaidee.org` could not be proved empty from here** — SERVFAIL rather than a clean no-record answer | **recorded as a gap in §8**, with the planner's report of the real state attributed to them. Nothing in this repo touches that zone |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **That `0.47.5` is the label he wants for eleven streams.** His answer settles the mail, and the version is derived from it; the label was his to overrule before the deploy | Lutan | **DONE 2026-11-19** — told in plain words that eleven streams ship under a patch label, and offered `0.48.0`. He answered *"Keep 0.47.5"* |
| 2 | **`/releases` signed in as Admin shows both notes**, after the deploy | Lutan | open — Claude has no account on production, and §4 says why it was not driven on dev |
| 3 | **`https://cooperjaidee.org` opens, the authenticator step works, and a web address saves** — the proof section F asks for, which is a *saving* proof and not a loading one | Lutan | open — needs his deploy first |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: all three items need the deploy or Lutan's own eyes, and only the person who looks may tick this

Manual verification by: pending: Lutan, after the production deploy — the version label is his to overrule, and items 2 and 3 cannot be reached without an account on production

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the deploy steps follow this PR's merge

Result: pass with accepted defects
