# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `dev-signin --cards` works again: its upsert targets `0387`'s new `roles` key (`#dvsgn`) |
| Backlog item | `docs/backlog.md` → `#dvsgn`, ticked on this branch |
| Branch / worktree | `claude/dev-signin-shelter-key` @ `C:\Development\Animal_Shelter_cut-release-0-47-1`, port `3008` |
| Dev server | not needed: the script talks to the dev database and prints a snippet; no server is involved in the path that broke |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (same session that found it, as the `0.47.1` release manager) / 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | `97747c1f1` — the tip of `main` this branch was cut from |

## 1. Scope and risk

- [x] Change is described in one sentence — one argument: `scripts/dev-signin.mjs`'s throwaway-role upsert goes from `onConflict: "key"` to `onConflict: "shelter_id,key"`, which is the constraint `0387` left behind, plus a comment saying why it is two columns
- [x] Files/areas touched — `scripts/dev-signin.mjs` (one line and a comment), `docs/backlog.md` (the tick), this plan. **No `src/`, no `worker/`, no migration, no string**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: this is a developer script that never runs in the app. It **creates** a throwaway role holding exactly the cards asked for, which is what it did before `0387`; no card's behaviour, grant or visibility changes, and nothing about Admin or the public site is touched
- [x] Out of scope, written down so the release manager is not surprised — **the other 18 unique keys the tenancy migrations swapped were swept and need nothing** (§6). The wider question of whether `deploy.mjs` should hold a scoped Cloudflare token, which `0.47.1`'s defect 1 raised, is **not** here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `97747c1f1` minutes before, and `git status -sb` showed neither ahead nor behind
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — the run, as it printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 9s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 178s
=== gates: test — npm test
=== gates: test exited 0 after 41s
=== gates: build — npm run build
=== gates: build exited 0 after 72s
gates: typecheck=0 lint=0 test=0 build=0
```

All four numbers read from the gates line itself, and the run redirected to a file rather than piped
through `tail`. **The short typecheck and build times are a warm Turbopack cache in this worktree,
not a skipped gate** — it had just built the release cut; each gate's own exit code is above.

- [ ] CI green on the PR — n/a: the PR does not exist at this commit. **Before merging, the run for this HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**

## 3. Schema and data

- [ ] Every line in this section — n/a: **no migration.** This change adapts a script to a migration that already shipped in `0.47.1` (`0387`), and the constraint it now names is the one live on dev, test, UAT and production. Nothing is added, altered or backfilled

## 4. Functional checks

- [x] Happy path works end to end — **six checks, all run against the dev database with the fixed script, and the first is the exact command that failed before:**

```
1. --cards run_merch_shop --port 3008            exit 0, snippet printed, no 42P10
   (before the fix: 42P10, "there is no unique or exclusion
    constraint matching the ON CONFLICT specification")
2. the same again, immediately                   exit 0, no 42P10   <- the UPDATE path: an existing
                                                                       throwaway role is corrected
3. --cards run_merch_shop,my_tasks --port 3008   exit 0, no 42P10   <- the INSERT path: a card set
                                                                       that had never existed
4. --cards not_a_card --port 3008                exit 1, "not card keys: not_a_card"
5. --remove --cards run_merch_shop,my_tasks      exit 0, "removed dev-signin-b65806c9-3008@…"
      --port 3008                                       "removed role dev_signin_cards_b65806c9_3008"
6. volunteer --port 3008                         exit 0, snippet printed   <- the ROLE path, which
                                                                             never used the upsert
```

  **Check 3 is the one that matters** — an unseen card set takes the insert branch, where a wrong
  conflict target cannot be masked by the row already existing. **Check 5 proves the removal is still
  scoped to one port**, which is what stops a fix here signing other streams out: it named only the
  `3008` login and its own throwaway role. Afterwards the card roles belonging to ports `3001`,
  `3002`, `3009` and `3010` were still present, read from `check-production.mjs role-cards --env test`
- [x] Invalid input — check 4: an unknown card key still exits 1 and still prints the real keys
- [ ] Data persists / empty state / boundary cases — n/a: the script creates and deletes disposable dev logins. It stores nothing a person can see and has no UI, empty state or boundary

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: the script grants nothing of its own. It builds a role holding **exactly** the cards named and signs in as it, which is the mechanism the matrix is tested *with* rather than something to test. **No server-side check changes**

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: a developer script. No page, nav entry, manual topic, string path or component

## 6. Regression

- [x] **The same shape was swept for across the whole tree, because `0387` was not the only key swapped** — this is the part of `#dvsgn` that mattered more than the one-line fix. `0383`, `0384`, `0387` and `0389` replaced **19** unique keys in all (`residents_resident_code_key`, `donation_receipts_number_key`, `fixed_outgoings_label_key`, `roles`' key, `roles_one_admin_idx`, and 14 more from `0389`'s table-driven list: `medication`, `diets` ×2, `rounds` ×2, `impact_baselines`, `public_stat_switches`, `website_drafts`, `premises`, `maintenance`, `zones`, `site_pages`, `facility_maps`, `project_folders`). Every `onConflict` in `src/`, `worker/` and `scripts/` was listed and compared against that set:

```
onConflict: "room_id,map_id"            x2    not a swapped key
onConflict: "clinic_id,doctor_id"       x2    not a swapped key
onConflict: "user_id,role_id"                 not a swapped key
onConflict: "prescription_id,round_id"        not a swapped key
onConflict: "diet_id,diet_type_id"            not a swapped key
onConflict: "appeal_id,attachment_id"         not a swapped key
onConflict: "card"                            card_features.card, not a swapped key
onConflict: "id", ignoreDuplicates            primary key, unaffected
onConflict: "key"                             scripts/dev-signin.mjs  <- THE ONE, fixed here
```

  **And no code anywhere names any of the swapped constraints** (`grep -rl` for each of the five named ones across `src/`, `worker/`, `scripts/`: nothing). **Nor is there any raw `on conflict` in `src/` or `worker/`** — the only ones in the repository are top-level inserts inside already-applied migrations, against the activity catalogue and `shelters`, neither of which was swapped, and an applied migration is never re-run
- [x] The paths nearest the change still work — checks 2, 3, 5 and 6 above exercise the update path, the insert path, the removal path and the role path, which is every branch of the script that reaches `roles`
- [x] Shared file touched, checked from a second unrelated page — n/a as a page: `scripts/dev-signin.mjs` is imported by nothing (`grep -rn "dev-signin" src/ worker/` finds no importer; it is a command people run)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [x] Backlog item ticked on this branch — `#dvsgn`, with what the fix was, that the sweep found nothing else, and the proof both ways
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a separate file: the reasoning belongs where the next reader will meet it, so it is **a comment at the line itself**, saying that two columns are deliberate, that `0387` is why, that `42P10` is what one column produces, and that a null `shelter_id` with `nulls not distinct` matches exactly the row `key` alone used to. **That comment is the fix's real content**; a decision file nobody opens while editing that line would not have stopped the tidy-up it exists to prevent
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a developer sign-in script that never runs in the app. No shelter user can reach it and no behaviour they see changes
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the failure and the fix from running the real command against the real dev database before and after; the insert path from a card set that had never existed; the scoping from the removal naming only one port's login, with the other ports' roles read back afterwards; the sweep from `grep` over the whole tree and from reading all four migrations' key lists rather than the two I happened to remember

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `97747c1f1`; nothing here is deployed
- [ ] Deployed SHA matches the tested SHA — n/a: **this change ships to no environment.** `scripts/dev-signin.mjs` is not bundled into the Worker, not copied to the Pi's build and not read by the app; it runs on a developer's machine against the dev project only

### On the deployed build

- [ ] Deployed to test / smoke-tested / public pages re-checked after a purge — n/a: nothing is deployed by this PR
- [ ] Timezone-sensitive behaviour — n/a: no date is derived
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff
- [x] Evidence pasted here is the tool's actual output, unedited — the six checks' exit codes and lines, and the `onConflict` listing

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read / `strip-baked-env` seen / new secrets exist — n/a: this PR deploys nothing and adds no secret or environment variable
- [x] **The script's blast radius is unchanged and was re-read, not assumed**: it refuses anything but the dev project, it holds the service-role key only on the developer's machine, and the snippet it prints carries a live dev session token — which is why no snippet is pasted into this plan, only exit codes and the identity line's shape

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration. The migration this adapts to (`0387`) shipped in `0.47.1` and is applied to all three databases
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration: a fresh backup exists — n/a: no migration in this PR. The script writes only to disposable dev rows it created

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR puts the `42P10` back**: `--cards` would fail again and streams would be unable to make a single-card login. Nothing else changes, and no data is at risk either way — the script's only writes are disposable dev logins and their throwaway roles. **There is no partial state to clean up**, because the upsert either matched a constraint or did nothing

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | — | **Something worth knowing rather than a defect: the script's `--remove` with no `--cards` still deletes every login it has ever made, across all ports and all streams.** That is unchanged by this PR and is documented in `CLAUDE.md` (*never run `--remove` while other streams are running*), but it sat one argument away from the commands run in §4 while three other streams had live logins | not changed here — it is existing, documented behaviour and narrowing it is a different decision. Named so the next person editing this script sees it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Pasting a snippet into a browser and seeing the card-scoped login actually load a page** — §4 proves the snippet is produced and the login and role exist, which is the whole of what `0387` broke. It does not prove the browser half, which was last exercised earlier the same day on `/releases` with a card-keyed login made the other way | any stream's next card walkthrough; it is the normal use of this script, so the next use is the check |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the browser half above has not been driven on this branch; only the person who looks may tick this

Manual verification by: pending: the next card walkthrough to paste a snippet and load a page, which is this script's ordinary use

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager, and `0.47.1` is already shipped; this is the follow-up it found

Result: pass
