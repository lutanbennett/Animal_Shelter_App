# Feature test plan — pi-tests-record

Filled from `docs/test-plan-template.md`. **This change ships no user-facing behaviour**: a drill
row and two caveats in a decision file, a fix to a repo script that is run by hand at the Pi, three
dated corrections to runbook text, one new troubleshooting entry, and backlog bookkeeping. Most
lines below are honestly `n/a`, and the reason is written on each.

The measurements recorded by this PR were taken on 2026-11-01 by Lutan at the Pi. **This stream did
not measure anything and claims no measurement of its own** — it is the record of his, read from
the backlog items *PI TESTS AT THE PI* and *PI FAILOVER*.

---

## Header

| | |
|---|---|
| Feature | Record the three Pi tests of 2026-11-01: fill the power-pull row (with its not-like-for-like and RTC caveats) in `docs/decisions/2026-10-02-pi-failover.md`, fix `scripts/pi/drill-probe.mjs`, correct three stale passages, add the port-isolation troubleshooting entry |
| Backlog item | `docs/backlog.md` → **PI TESTS AT THE PI** (ticked by this PR); partial note on **Review the home network the Pi lives on**, *Left* (4) |
| Branch / worktree | `claude/pi-tests-record` @ `C:\Development\Animal_Shelter_App-worktrees\amazing-payne-6f12f1` (an app-cut worktree, renamed branch; see §5 of the decision file) |
| Dev server | not started — `n/a: no runtime surface in this change` |
| PR | #1157 |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `c653b045` — the commit `gates.mjs` actually ran on, which carries the whole code change (`scripts/pi/drill-probe.mjs`) and every document edit. The commits after it add this plan and finish the backlog tick: documentation only, which no gate reads. CI runs the gates again on the head commit, and that run is what the merge is read from |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item's own title says what is left is one PR: the power-pull row plus three stale passages; this is that PR, plus the probe fix and troubleshooting entry the same results asked for
- [x] Files/areas touched listed: `docs/decisions/2026-10-02-pi-failover.md`, `docs/decisions/2026-11-01-pi-tests-record.md` (new), `docs/pi-hosting.md`, `docs/test-plans/pi-usb-ssd-spare.md`, `docs/test-plans/pi-tests-record.md` (new), `docs/backlog.md`, `scripts/pi/drill-probe.mjs`. **No `src/`, no `worker/`, no `supabase/migrations/`**
- [x] Roles affected identified — `n/a` is not the honest word here, so: **none**. Nothing in this change is reachable by any role, signed in or out. `scripts/pi/drill-probe.mjs` is run from a developer's PC by hand and is not part of any build
- [x] Anything explicitly **out of scope** written down — the Worker's 44-second hole during the outage (its own Architecture backlog item), the rest of the home-network item (Meshnet, hardening, the Desktop report), and signing Lutan's manual-verification line on `pi-usb-ssd-spare.md`. All three are named in `docs/decisions/2026-11-01-pi-tests-record.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.` at `d4e68e72`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing line, as printed:

  ```
  gates: typecheck=0 lint=0 test=0 build=0
  ```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

Also run, because this PR changes a script rather than application code:

- [x] `node --check scripts/pi/drill-probe.mjs` — passes
- [x] The new `import … from "../../src/lib/write-requests.ts"` **actually resolves** under Node's type stripping, checked by importing the probe with no arguments: it reached its own usage refusal (`usage: drill-probe.mjs <case> <seconds> <cookie-file> [site]`), which it can only do after the import succeeded. A bad specifier would have thrown first
- [x] `node scripts/check-test-plan.mjs` — run locally before pushing

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no code in this change reads the database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The only executable file in this change is `scripts/pi/drill-probe.mjs`, which cannot be exercised
end to end from here: a real run needs a live `dev-signin` cookie and the Pi serving
`test.lannacare.org`, and it writes real rows. What was checked is recorded in §2 and in the
**Left for manual verification** table.

- [ ] Happy path works end to end — n/a: the probe's happy path is a real write against the live test site, which needs a current `dev-signin` cookie and a running Pi; the fix is the one line §2 proves loads and resolves, and the dry run is handed over below
- [ ] Data persists — reload the page and the change is still there — n/a: no page
- [ ] Create / edit / delete all exercised — n/a: no page and no user-facing action
- [ ] Empty state renders sensibly — n/a: no page. The probe's equivalent case **is** covered: a run with nothing landed now prints that the probe is probably broken and exits non-zero, rather than a tidy summary
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no user input. The probe's own argument refusal still fires and was seen (§2)
- [ ] Boundary cases checked — n/a: nothing in this change has a boundary. The `landedCount === 0` branch is guarded by `attempts.length > 0`, so a zero-second run does not report a broken probe

### Role access matrix

Nothing in this change is reachable by a role: no page, no nav entry, no server action, no RPC, no
column. The documents are repository files and the probe is a hand-run script.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this change | no change | no change |
| management | nothing in this change | no change | no change |
| staff | retired role (`0173`) | no change | no change |
| doctor | nothing in this change | no change | no change |
| volunteer | nothing in this change | no change | no change |
| signed out | nothing in this change | no change | no change |

- [ ] Every role above tested — n/a: there is nothing any role can reach in this change
- [ ] A role that should not have access is blocked server-side — n/a: no route, action or RPC is added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no page added
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; a drill table, a developer script and a Pi runbook are not in it
- [ ] Translatable strings go through the translation path — n/a: no user-facing string added
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — **by the build, which is the honest answer here:** no page is near this change, and `build` compiled every route at exit 0. The probe is imported by nothing
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/write-requests.ts` is **read** by the probe and not modified; nothing else imports the probe. `grep -rn "drill-probe" src worker scripts` finds only `docs/` references and the file itself
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`, so nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — *PI TESTS AT THE PI* is ticked, with the item line replaced by the `backlog` branch's current (post-test) text so `main` gets the accurate record. **This will conflict on the next daily `git merge backlog`, on purpose**; §5 of the decision file says to resolve it by keeping the ticked version. *Review the home network the Pi lives on* gets a partial note — its *Left* (4) is done, the rest is untouched and still open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-01-pi-tests-record.md`
- [x] `README.md` still accurate — read the Pi and failover passages; nothing in it asserts the boot test is outstanding or that the spare is slow, so nothing needed changing
- [ ] **Release notes.** — n/a: no shelter user sees any of this. A drill table in a decision file, a probe script run by hand from a developer's PC, Pi runbook corrections and backlog bookkeeping. Nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched
- [x] Commit messages say why, not just what — the commit explains why the fourth row needs a caveat rather than just a number, and why the probe's field name is imported rather than written out
- [x] **Claims in commit messages and decision files were measured, not reasoned** — every figure in this PR (55.6 s, ~20 s, 240/194/46/2/0, 7 of 11 over 11 s, the 44 s gap, 503s in 250–370 ms, 0.10–0.35 s against 0.08–0.21 s) was measured by Lutan at the Pi on 2026-11-01 and is transcribed from the backlog items, not re-derived here. The one claim this stream makes on its own authority is that the probe's import resolves, and §2 says how that was checked rather than asserting it. The RTC caveat is in the file precisely because the first version of the ~20 s figure *was* reasoned from wall-clock stamps and was wrong

## 8. Pre-production gate

**Nothing in this change reaches a deployed build.** The documents are repository files; the probe
is not bundled, imported or deployed. So these are `n/a` rather than `deferred` — there is no
deploy-time check waiting on anyone, and a `deferred:` row here would be a line nothing ever closes.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this change ships nothing to a deployed build; the header records the SHA the gates ran on
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy follows from this change

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no code in this change is served
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code in this change is served
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date or time logic is added. The clock caveat recorded in the decision file is about the **Pi's** RTC after a power cut, which is a fact about the box, not behaviour in this change
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: there is no deploy-time output to paste, and the one piece of evidence this plan does carry, the `gates:` line in §2, is the script's own closing line copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var. The probe reads the same two values from `.env.local` it already read

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR, with no deploy and no migration involved. **What that does not cover:** it would put the four stale statements back (the boot test "has not been done", the spare "is not yet a spare", the clone script "has never run against a good drive", the spare "runs at USB speed"), and those are the sentences that on 2026-10-31 nearly got the only spare wiped. A revert also re-deadens the probe. So the correct response to a problem here is a fix forward, not a revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | `scripts/pi/drill-probe.mjs` sent no write-request id, so `runWriteAction` refused every write while the probe recorded a clean 200 — a drill run with it would have produced a confident false record | fixed in this PR (a fresh `newWriteRequestId()` per attempt, the field name imported; plus a loud non-zero exit when a run lands nothing) |
| 2 | High | The Cloudflare Worker fallback covered only the first 11 s of the 55.6 s outage, then returned 503s with no `x-lanna-served-by` header for 44 s — so those replies were not from our Worker | deferred to backlog (its own Architecture item). Recorded in the drill table; out of scope here and not fixed |
| 3 | Medium | Four statements across `docs/pi-hosting.md` and `docs/test-plans/pi-usb-ssd-spare.md` were false and had already caused a near-miss: a session believed them over the machine and offered to wipe the only spare | fixed in this PR (dated corrections, originals kept and marked superseded) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Dry-run the fixed probe against a healthy Pi before any future drill** — six seconds is enough and every attempt must say `landed=yes`. This is the check the probe's own header now insists on, and it cannot be run from here: it needs a current `dev-signin` cookie (50 minutes) and the Pi serving the test site, and it writes real rows to the dev database | `node scripts/pi/drill-probe.mjs dryrun 6 <cookie-file>` from the PC |
| 2 | The new troubleshooting entry reads correctly to the person who lived the fault, and names no address, MAC, device or Wi-Fi network he would not want in a public repo | `docs/pi-hosting.md`, "Troubleshooting: SSH cannot reach the Pi, but the website is perfectly fine" |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (`pi-tests-record`)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; only the person who looks may tick it

Manual verification by: pending: the two rows above — the six-second probe dry run against a healthy Pi, and Lutan reading the troubleshooting entry. Neither blocks this PR; the probe dry run is a precondition of the next drill, not of this merge

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here ships to production; there is no deploy, no migration and no release note

Result: pass with accepted defects

Release manager acknowledgement: n/a: no production step follows from this PR
