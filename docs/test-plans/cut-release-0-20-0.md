# Feature test plan — cut-release-0-20-0

## Header

| | |
|---|---|
| Feature | Cut release `0.20.0`, **major**: move the ten `unreleased` notes into a new register entry, order them for the admin mail, and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-20-0` @ `C:\Development\Animal_Shelter_cut-release-0-20-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-07 |
| Carries a migration? | no — `0151`–`0155` ship in this release and are **still pending on production**. See §3, and §8's ordering section, which is not routine this time |
| Tested at SHA | `cb567f15` + this branch's two commits (`bfee7909`, `30c64f0d`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.20.0` entry holding the ten notes written by the release's PRs, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — five notes reach every signed-in role; the other five are tagged. `major: true`, so **every admin is mailed** — the opposite of the last four releases, and verified in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's one job; (b) the release record; (c) the `bare-buttons-44px` signature, which is its own sign-off-only PR (§7); (d) the outstanding manual verification on the other eleven PRs, which stays on their plans

**Decided in chat by Lutan, 2026-10-07: `0.20.0`, major.** Asked before cutting,
with the argument for each side put to him. The case for major, which he took:
Contacts disappears from the menu for staff and volunteers, so people will ask
where it went and Management needs to know they are now the point of contact —
and the admin mail is how admins learn that. The header also stops showing email
addresses and shows a name and role on every screen, for everyone. The case
against, which he heard: no new login type and no new feature area, which is
what the whole `0.19.x` run had been.

### Order on `/releases` — and in the admin mail

The notes left `unreleased` in the order the ten PRs happened to add them, which
put a phone-button note first and the Contacts restriction second. Because this
release is mailed, the entry is also what every admin reads first, so the order
was changed deliberately — the decisions that change *who can do what* lead:

1. **Contacts** narrows to Management and the 2IC, the Director's answer (`management, staff, volunteer`)
2. The header shows **your name and role** instead of your email address (everyone)
3. On a phone, the **top-bar buttons** are full-size (everyone)
4. On a phone, the **small controls** that were easy to mis-tap are full-size (everyone)
5. **Save, Filter, Send, Move and Book** are big enough to tap (everyone)
6. **Management can record a microchip**, as the handbook always said (`management`)
7. The **vaccine list hides prices** on Log immunizations (`admin, management, staff, vet`)
8. **Staff keep seeing a Shelter Friend's card** (`management, staff`)
9. Adding resident photos says whether a folder **appears on the public website** (everyone)
10. A **deceased resident's profile photo** that could not go in the PDF now says so (everyone)

Lines were moved, never retyped. The one thing a reorder can quietly break is a
role tag following the wrong note, so the tags were re-checked **by text rather
than by position** — §2.

### What is in the release

`node scripts/release-prs.mjs 082bf60b cb567f15` — **seventeen** PRs, exit 0,
28 added migration/test-plan files accounted for: **#397–#413**, contiguous with
no gap to explain. `082bf60b` is `0.19.3`'s deployed SHA, read from its record's
header.

### Twelve of the seventeen plans are unsigned, and Lutan chose a pass on one of them

Seventeen PRs carry a plan. Five are closed: `admin-role`, `advisory-bump`,
`worker-upload-limit` and `worktree-held-reason` are `n/a` with a reason, and
`header-name-role` is signed by Lutan in chat. **Twelve say `pending:`.**

Put to him before the cut, as the procedure requires, with the biggest
unverified item named: the Contacts restriction in `0155`, where staff and
volunteers lose a page and nobody had looked at it on a screen. **He chose a
short Contacts pass on test before shipping** — as Management, as the 2IC and as
staff — with the other eleven shipped and recorded as a gap. That pass is a §8
gate, not a thing this plan can tick.

He also asked, in chat, that `bare-buttons-44px` be signed for what he had
actually done: he opened Rehome / foster on his own phone and said *"functionally
the form works and fits on the screen and is useable"*, and answered the header
decision as option A. That signature is **not in this PR** — see §7.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run; fast-forwarded `4e951b49..cb567f15`, one documentation line (`docs/backlog.md`), and pushed. 0 behind at the cut
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 30s

gates: typecheck=0 lint=0 build=0
```

- [x] **The gates were re-run after the entry changed** — they had already passed once (`build exited 0 after 257s`) before the notes were reordered. The procedure says to re-run on any change to the entry *even a role tag*, because the tempting assumption is that a data-only edit cannot break a build. Re-run, and the 30s build above is the second pass on the final tree
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **`check-test-plan.mjs` was run on its own and its exit code read** — not piped through anything
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — `0.19.2`'s cut PR reported `MERGEABLE` / `CLEAN` with no workflow run at all, and `0.19.3`'s had a `success` run containing a failed `audit` job. Neither signal alone distinguishes a healthy run from an unexamined one, so both are read, knowing `audit` and `test-plan` are `continue-on-error`
- [x] Newest release version matches `package.json` — both `0.20.0`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 10 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.19.3")` returns `["0.20.0"]`** — the call that decides whether admins are mailed. This release is the first since `0.19.0` where it is **not** empty, so it is the one gate here that must not be taken on trust
- [x] **The date was read from the local clock** — `2026-10-07`, a new day, so this release starts its own record file
- [x] The register parses the way `deploy.mjs` loads it — `0.20.0` / `2026-10-07` / `major: true` / 10 notes, under type stripping
- [x] Order intact — `0.20.0 > 0.19.3 > 0.19.2`, file order still matching a re-sort by `compareVersions` across all 32 entries
- [x] **The cut was verified against the pre-cut register through the parsed module** — `carried across unchanged: 10 of 10`, `text lost: 0`, `text invented: 0`. Compared as a **set**, because the order was changed on purpose; the forms went `string,object,object,object,object,string,string,string,string,string` to `object,string,string,string,string,object,object,object,string,string`, which is the reorder and nothing else
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **Every previously released entry is byte-identical** — all 31 of them, compared as serialised JSON against `origin/main`'s register, not eyeballed
- [x] **The notes render clean** — `notes rendering badly: 0`; no `[object Object]`, no `undefined`, every date well-formed
- [x] `node scripts/check-release-guards.mjs` — all 15 ok, exit 0

Twelve assertions, all passing, printed together rather than reasoned about one
at a time. The title carries a typographic apostrophe (`Director’s`) rather than
an ASCII one: `0.19.3`'s cut recorded that the generator builds the entry as
single-quoted JavaScript, so a plain `'` is a syntax error. It was written as an
escape, and the parse in §2 is what proves it landed.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `--env production --status` reviewed — **five pending: `0151`–`0155`**; 150 applied, no file applied that `origin/main` lacks
- [x] `--env production --dry-run` reviewed — **all five `… ok`**. No chained-dependency failure of the kind `0.18.0`'s `0136` and `0.16.0`'s `0076` hit; these five do not build on one another
- [x] Applied to **dev** and recorded in `schema_migrations` — by the feature PRs. Dev reads `155 applied, 0 pending`, and `0` in each direction against `origin/main`
- [x] File is re-runnable — read rather than assumed; `0155` says so in its own header and the other four follow the house pattern
- [x] Existing rows still read correctly after the change — four convert RLS policies to `has_permission(…)` and one adds cells, a view and a function; no row is rewritten
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in the schema PRs
- [ ] Down-migration written — n/a: no migration in this PR. `0155` names what to restore to undo it, per section
- [x] Production apply plan stated — **not yet executed, and the order is not routine this time.** See §8

**This is the part of this release that needs care.** Three of the five declare
app-code consumers, and the dry-run said so eleven times:

```
WARNING 0151_price_free_pickers.sql: declared consumer src/lib/prescriptions/options.ts differs from release 0.19.3, so it may or may not already read this.
WARNING 0152_perm_convert_photos.sql: declared consumer src/app/residents/[id]/photos/actions.ts differs from release 0.19.3, so it may or may not already read this.
WARNING 0155_director_answers_schema.sql: declared consumer src/app/contacts/page.tsx differs from release 0.19.3, so it may or may not already read this.
  note: "Live" here is what https://lannacare.org reports it runs: 0.19.3 @ 082bf60.
```

`0153` and `0154` are `consumer: none`. The tool's own note calls this "the safe
direction — nothing is blocked", and that is right for a file that only *adds*.
**`0151` and `0155` do not only add: they narrow read policies**, each moving its
readers onto a fixed-column view first and taking a cell out of the table's read
policy last. Applied while `0.19.3` is still live, the old code reads the
*tables*, and the cells it relied on are gone:

| Applied before the deploy | What `0.19.3` would show until the deploy lands |
|---|---|
| `0151` | the prescription form, diet picker and intake form read the tables directly, so a staff login could get an **empty medication or diet list** |
| `0155` §4 | the Log immunizations form reads `immunization_types`, so the **vaccine list could come up empty** for the 2IC and staff |
| `0155` §2 | `/contacts` narrows to `contacts.browse`, so staff and volunteers could get an **empty Contacts page** on a build that still shows them the menu entry |

So the apply is **not** a step to run early and leave. It must run immediately
before the deploys, with the Pi production build started in the same breath —
§8 states the sequence and §8's rollback section states what it costs.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR; `/releases` reads the register and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input. The nearest thing is the apostrophe in §2, where the generator refuses outright
- [ ] Boundary cases checked — n/a: no input. Version ordering across 32 entries is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all ten, **and an email** | not driven — register parse checked instead; the mail is a §8 gate |
| management | `/releases` | all ten | not driven |
| staff | `/releases` | eight (not the microchip or Management-only notes) | not driven |
| vet | `/releases` | six | not driven |
| volunteer | `/releases` | six | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed; the tags are data carried across unaltered, asserted by text match in §2
- [ ] A role that should not have access is blocked server-side — n/a: no new access path **in this PR**. The release as a whole narrows Contacts, photos, prices and translations, and that is the unsigned work in §1

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change in this PR. The release removes Contacts from the staff and volunteer menus, which is `0155`'s PR
- [ ] Manual updated — n/a: the manual does not describe the register; the features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no UI change in this PR
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and the Worker's `/api/releases/current` with the new register
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, the Worker and `deploy.mjs`; the third was exercised directly by loading the register under type stripping, twice, before and after the reorder
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync was a fast-forward carrying one `docs/backlog.md` line

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one choice here, the note order, is recorded in §1 with its reason
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All ten were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the ten-note comparison through the parsed module, role tags by text, `majorReleasesSince("0.19.3")` returning `["0.20.0"]`, the five dry-runs read individually, the consumer warnings read rather than summarised, and the narrowing claim in §3 checked against each file's own header

### Why the `bare-buttons-44px` signature is not in this PR

Lutan asked for it in chat, and it was written — then taken back out, because
`check-test-plan.mjs` went red on it:

```
docs/test-plans/bare-buttons-44px.md:95 — release-notes line is ticked, but `unreleased` in
src/lib/releases.ts gained no line in this PR
```

That is not a bug and not a thing to work around. The checker has a deliberate
exemption for exactly this job — `signoffOnly`, added for #80 — which holds a
later signature's release-notes tick against *the merge that introduced the
plan* instead of the current diff. It requires **every** touched path to be a
plan. A cut PR touches `releases.ts` and `package.json`, and by definition
*empties* `unreleased`, so a cut can never satisfy it: any feature plan edited
inside a cut PR will fail this way.

So the signature goes in its own sign-off-only PR, which is the shape the
checker was built for. Recorded here because the obvious fix — rewording the
feature's permanent record to suit a later PR — is the one #80 already rejected.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. **Both Pi builds will be pinned with `--ref <release sha>`**, rather than left to fetch `main`'s tip: `backlog` commits landed on `main` three times during this release's preparation, and that is exactly how `0.19.3` ended up with four artifacts on two SHAs

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, and **this is where Lutan's Contacts pass happens** (§1). Test runs against the dev database, which already holds `0151`–`0155`, so test is the one place the new code and the new policies are both live before production
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime
- [ ] **Boundary or banding change** — n/a: no boundary in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] **The working tree is clean before deploying** — deferred: release manager. `0.19.1`'s deploy was refused for untracked spreadsheets in the repo root
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, **with `| tee`**; the log is UTF-16, so `tr -d '\000'` before grepping. Missed on `0.15.0`, `0.15.1` and `0.16.0`, captured on `0.19.3`
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] `Server Actions key <fingerprint>` matches what the Pi build printed — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new
- [ ] **The deploy prints a release mail, and the mail arrives** — deferred: release manager. **This flips for the first time in four releases.** It should print `release mail for 0.20.0: sent N, skipped M`, and `sent` is the relay accepting it, not delivery — the inbox is checked for the message from `releases@lannacare.org` with `0.20.0` in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED`, a known open question. Only the **production** deploy mails; test sets `RELEASE_MAIL_ENV` to `""`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form, **but emphatically not n/a for the release.** `0151`, `0152` and `0155` declare consumers and two of them narrow read policies, so there is a real window in which production runs `0.19.3` against `0.20.0`'s policies. §3 names what a user would see in it
- [x] `--env production --dry-run` run and clean — all five `… ok`, read one at a time
- [ ] For a **destructive or rewriting** migration only — n/a: policy conversions and additions, no data rewritten
- [x] Apply plan stated — **the order, which is the point:**
  1. merge this PR;
  2. deploy **test** (Worker then Pi test, pinned) — the dev database already holds all five, so there is no window on test;
  3. Lutan's Contacts pass on `test.lannacare.org`;
  4. then, **with Lutan at the keyboard**, `apply-migrations.mjs --env production` and the production deploys started immediately — his Worker deploy and the Pi production build in parallel, which is also what `docs/release-procedure.md` means by "do not idle";
  5. `--drift production` and `--drift dev` afterwards, both quoted in the record.

  The window is the Pi build, a few minutes. It is **not** hours, and the reason the apply is not run ahead of time is §3's table.

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref 082bf60b`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0151`–`0155`**, and that matters more here than on `0.19.3`: rolled-back `0.19.3` code would run against narrowed policies, which is §3's table all over again and indefinitely rather than for minutes. A rollback therefore means rolling the five migrations back too, by the restore notes in each file's header, or accepting empty medication, vaccine and Contacts lists. **And the mail cannot be un-sent** — this is a major release, so by the time a rollback is considered every admin has already been told what shipped

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A cut PR can never carry another plan's signature: it empties `unreleased`, so `check-test-plan.mjs`'s `signoffOnly` exemption cannot apply and a ticked release-notes line fails | not a defect in the checker — worked as designed. The signature moved to its own sign-off-only PR and §7 records why, so the next release manager does not debug it or, worse, reword a merged plan to suit the cut |
| 2 | low | The cut script's note-form tally is still wrong, sixth release running | accepted, as before: it is a log line, and §2's verification pass is the evidence |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Lutan's Contacts pass**, which he chose in place of shipping all twelve unsigned: `/contacts` as Management (full), as the 2IC (name and phone, no address) and as staff (no menu entry, no page). On test, before the production deploy | `test.lannacare.org` after step 2 of §8's apply plan |
| 2 | The `0.20.0` title and the order of the ten notes — on `/releases` **and in the admin mail**, which is new: a wrong order here is read by every admin and cannot be taken back | `src/lib/releases.ts`, the `0.20.0` entry |
| 3 | That the release mail actually arrived, not merely that the deploy said `sent 1` | the inbox, for `releases@lannacare.org` with `0.20.0` in the subject |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items, all Lutan's, and all of them fall after this PR merges

Manual verification by: pending: the Contacts pass on test, the `0.20.0` title and note order, and the arrival of the admin mail

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1, §3 and §8
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-07 — all seventeen plans read; twelve are unsigned, and Lutan chose a Contacts pass on test plus shipping the other eleven as a recorded gap, rather than the blanket ship of the last seven releases. `bare-buttons-44px` is signed at his request in its own PR. The migration ordering in §3 and §8 is the part of this release that is not routine
