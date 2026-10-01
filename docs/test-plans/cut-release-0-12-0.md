# Feature test plan — cut-release-0-12-0

## Header

| | |
|---|---|
| Feature | Cut release `0.12.0`, **major**: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-12-0` @ `C:\Development\Animal_Shelter_cut-release-0-12-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-01 |
| Carries a migration? | no — **and nothing is pending**: `--drift production` reads 120 of 120 applied, zero both directions |
| Tested at SHA | `fb2ded9` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.12.0` entry holding the five notes written by PRs #249–#259, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles** in what `/releases` lists, each filtered to their own role. Two of the five are tagged: one `admin` (2-step verification), one `admin, management` (the cashflow vet line). The other three — faster photos, the password minimum, the maintenance messages — are everyone's. `major: true`, so **every admin with an email is mailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploys, Lutan's go, **both of them** (the Pi and the Worker; see §8); (b) the release record; (c) the Pi release-guard question, now on the backlog and unresolved; (d) the `0112` expiry date, still parked

**Decision confirmed in chat by Lutan, 2026-10-01:** `0.12.0` with `major: true`. The deciding note is the first, and specifically one clause of it: **setting up a first authenticator app now needs another admin to press Allow set-up**, with a three-day window granted automatically when someone is made an admin. That changes what an admin can do alone, and an admin who hits the gate without knowing why has no way to reason about it. Note 3 also raises the password minimum from 8 to 12 for everyone at their next change.

The counter-argument was put and is worth keeping: nothing *breaks* if nobody acts, the gate only bites on first set-up, and the release itself adds an in-app reminder on My tasks plus a flag on the Security page — so the app already tells admins what the mail would. Lutan's call was major.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: `git rev-list --count HEAD..origin/main` returned **0** at `fb2ded9`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.12.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.11.0")` returns `["0.12.0"]`** — the check that makes the deploy mail admins, verified rather than inferred from `major: true`
- [x] **The date was read from the system clock, on the local clock** — `date +%Y-%m-%d` gives `2026-10-01` and the entry says `2026-10-01`. UTC agrees today, so this is a weaker test than on `0.10.0`, where the same assertion against `new Date().toISOString()` failed because it was past midnight in Thailand and not in UTC. Dates here follow Thailand's clock (release `0.1.0`'s first note)
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.12.0` / `2026-10-01` / `major: true` / 5 notes
- [x] **`compareVersions("0.12.0","0.11.0") === 1` and the register's file order still matches a re-sort by it** across all eighteen entries — `0.12.0 > 0.11.0 > 0.10.1 > 0.10.0`. Carried forward from `0.10.0`'s double-digit finding: a lexical compare would place `"0.12.0"` before `"0.11.0"` correctly by luck but `"0.9.1"` after it, and the ordering is what decides whether the mail is sent at all

### The cut script refused this release, and that was the right answer

**Two of the five notes are written in a multi-line object form no previous release
used:**

```
  {
    text: "…",
    roles: ["admin"],
  },
```

Every release from `0.8.1` to `0.11.0` had single-line entries, and the cut
script was line-based to suit — one source line per note, asserted before moving
anything. It hit this and **stopped with "an unreleased note spans more than one
line - cut it by hand" rather than mangling the file.** Recorded because the
guard doing its job is the only reason this is a footnote instead of a corrupted
register: a line-based rewrite over a multi-line entry would have produced
syntactically valid TypeScript with notes silently truncated at the first line.

The fix was a parser, not a hand edit:

- [x] **Entries are split by walking the array body, tracking string state and bracket depth**, so a comma, brace or bracket inside a note's prose cannot split it. Both forms are handled; the script reports which it found — `multi, single, single, multi, single`
- [x] **Each entry's source text is re-indented verbatim, never re-serialised through JSON**, which would have changed quoting and escapes
- [x] **The result was verified against the pre-cut file rather than eyeballed.** A copy of `releases.ts` was taken before the cut, both were imported, and all five notes compared: **text identical, roles identical, total character count identical, `unreleased` empty.** That comparison is the check that matters for a parser-based rewrite and it is the first time a cut has had one
- [x] Formatting matches the register's conventions — multi-line entries at 6/8 spaces, single-line at 6, CRLF preserved

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] **`--drift production` reviewed — nothing to apply.** `Against origin/main fb2ded9: 120 file(s), 120 applied row(s)`, zero in both directions, `No drift`. `0119` and `0120` (#255 placement guards, #257 contact map URL) were applied before this cut
- [ ] `--dry-run` reviewed — n/a: nothing pending to dry-run
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0120`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **there is none**, verified rather than assumed. Second release running with no apply step
- [x] **And this release is the first where `deploy.mjs` would refuse on its own if that were wrong.** #254 added the schema guard to the guarded deploy path, implementing the design from the backlog item filed after `0.10.1`: it compares *every migration the deployed commit carries* against what the database has applied — not equality with `origin/main`, so extra applied rows are still fine — and treats "could not ask" as a warning rather than a refusal. So the hazard that bit `0.10.0` (saved by a slow build) and `0.10.1` (not saved, `/adopt/[id]` querying a missing column for about an hour) is now closed on this path. **It is not closed on the Pi path**, which is §8

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.12.0`, `major: true`, `2026-10-01`, 5 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has eighteen entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — the multi-line entry form is this release's boundary case and has its own section in §2. Also: the register resolves to **3 strings and 2 objects**, every note readable through `noteText()`, note count exactly 5, none reworded
- [x] **The release mail was built and read** — subject `Lanna Care release 0.12.0: 2-step verification needs a second admin, faster photos on the website, and longer passwords`; **0** occurrences of `[object Object]`, **0** of `undefined`, **5** bullets in the HTML and five in the plain text. The two object notes render their text, which matters more than usual here: they arrived in a source form the mailer has never seen, and `noteText` reads the parsed value rather than the source, so the multi-line form is transparent to it — confirmed rather than assumed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all five; **is emailed**; the 2-step note is theirs alone | mail built and read above; the send is a deploy step, §8 |
| management | `/releases` | sees four — the cashflow vet line is tagged for them, the 2-step note is not | not verified on a deployed build at PR time |
| staff / volunteer / vet | `/releases` | sees the three untagged notes: faster photos, the password minimum, maintenance messages | not verified on a deployed build at PR time |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. The cut's job was to carry two role tags across intact, which §2's before/after comparison verifies directly
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR. The release's own access changes are #259 (the 2-step set-up gate), #253 and #258, covered by their own plans

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts`'s consumers (`/releases`, `worker/release-mail.mjs` via `src/lib/release-mail.ts`, `scripts/deploy.mjs`, the role filter) were all exercised in §2 and §4. The mailer matters most this time, for the reason in §4
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `fb2ded9`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All five were written by the PRs that made each change
- [ ] Non-obvious design choices recorded as a new file in `docs/decisions/` — n/a: no design choice in this PR. The multi-line-entry finding is a tooling observation and belongs in this plan and the backlog, not in `docs/decisions/`
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `fb2ded9` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. `main` has moved during the preparation of four of the last five releases; check `git log` immediately before deploying

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — **done 2026-10-01**, from `main` at `8efdb72`, before any production deploy. `deploy: test → Supabase project qxkmhwybjggxvsfxsxbd (8efdb72)`, `Uploaded lanna-animal-care-test (17.24 sec)`, Worker `c8ec2cee-f1ba-493e-a690-c47749a39729`, and `release mail for 0.12.0 [off]: sent 0, skipped 4` — the step engaged, four addresses found, send refused by the environment guard. `test.lannacare.org/api/releases/current` returns `{"version":"0.12.0"}`, the lock page is 200 and `x-lanna-served-by: worker`.

  **`strip-baked-env` removed 12 env vars, up from 10, and the two new ones were checked rather than waved through** — they touch the sign-in path this release follows. `PUBLIC_SITE` is supplied to the Worker at runtime from `wrangler.jsonc`, so stripping it from the bundle changes nothing. `NEXT_PUBLIC_SITE_URL` arrived with `d063fee` (the sign-in fix) and is read by `auth/callback/route.ts` via `src/lib/site-origin.ts` — but it is an **override**: `getSiteOrigin()` falls back to the request host headers when unset, and it was never in `wrangler.jsonc`, so the Worker never had it at runtime either way. The Pi is the deployment that needs it, being the one behind a proxy that rewrites the host, and `scripts/pi/write-env.mjs` supplies it there. **So stripping it is correct and deliberate**: the Worker should read the real host, the Pi should use the pin
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, for the signed-in paths. **Test is Worker-served** (`ORIGIN_HOST` is `""` there), so it does not exercise the Pi path production uses — the asymmetry that produced `0.11.0`'s headline outage. **Worth most attention**: Settings → Security's 2-step column and Allow set-up (#259), and a public page's photos at phone width (#256, which changed what size image is fetched)
- [ ] Timezone-sensitive behaviour checked on test — deferred: release manager. **Relevant this time**: the 2-step set-up allowance expires after three days, and the cashflow vet line averages "the last 90 days" — both date arithmetic
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Directly relevant**: #256 changes the image URLs public pages request, and anonymous GETs are edge-cached per data centre
- [ ] **`check-public-views.mjs --env production`** — deferred: release manager, **owed only if something changes**. No migration ships here; it last ran clean at 184 ok, 2 skip, 0 fail

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager. Use `>>`
- [x] Any new secret/env var exists in the Cloudflare environment — none added by this PR
- [x] **Release mail — this release sends.** `major: true` and `majorReleasesSince("0.11.0")` is `["0.12.0"]`. Expect `deploy: release mail for 0.12.0 [UAT]: sent N, skipped M`; `sent 1, skipped 1` is the established shape and not a fault
- [x] **Both copies must be deployed, and only one of them is guarded.** Production serves from the Pi (`x-lanna-served-by: pi`); the Worker is the fallback. `deploy.mjs` now refuses on branch, tree, version, `unreleased` **and** missing migrations — while `scripts/pi/deploy-pi.sh` is `git reset --hard origin/main` + build + restart with none of those checks. So: `node scripts/deploy.mjs --env production >> deploy.log 2>&1` from here **and** `./scripts/pi/deploy-pi.sh` on the Pi, or `/releases` keeps showing users `0.11.0`. Plain `npm` is blocked by PowerShell's execution policy on this machine, and **the terminal will look empty — that is the redirect, not a failure**
- [x] **Rollback is not what the older records say.** `npx wrangler rollback --env production` reverts the **Worker**, which is the fallback, not the serving copy. Rolling production back means `git reset --hard <sha>` and a rebuild on the Pi. Four release records state the `wrangler rollback` position as though it were the whole answer; correcting them is on the backlog with the Pi guard. **This release is also not fully reversible**: `major: true` means the mail is sent and cannot be unsent. No migration ships, so there is no schema half

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no, and nothing is pending, so the ordering hazard does not apply. §3
- [ ] `--env production --dry-run` run and clean — n/a: nothing pending to dry-run
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this release
- [x] Apply plan stated — §3: there is none

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- **Eleven PRs** (#249–#259), enumerated with `scripts/release-prs.mjs 4d34dc6`: exit 0, **13 added migration and test-plan files cross-checked, no orphans**. All eleven have a completed plan; none reports `Result: fail`; one reports `pass with accepted defects`
- **The tool reported: "git log --first-parent shows only 9; 2 more found off the first-parent line."** That is the second release where it found PRs the old method would have missed — #213 in `0.10.1` was the first, and the reason it exists. Two PRs in **this** release would have been absent from a hand-checked list, and nobody would have known
- **The cut script refused the register's new multi-line note form** rather than corrupting it. §2. A line-based rewrite would have truncated two notes at their first line and still produced valid TypeScript
- **The `0112` expiry date is still open** — stock-count provenance recorded since `0.9.1` and shown nowhere. Started in this session and halted at Lutan's request to do this release first; it still needs a decision on *where* the source should appear

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The five notes **and the title**, read as a shelter user would. `major: true`, so these exact words are emailed to every admin and the title becomes the subject. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.12.0` entry |
| 2 | **Note 1's description of the 2-step gate.** It explains Allow set-up and the three-day window for new admins. That is the clause the major decision rests on, and it has to be right, because an admin reading the mail will act on it | `src/lib/releases.ts`; #259 |
| 3 | The two role tags. The 2-step note is `admin`-only, so **management and staff will not see it** — correct if the gate is admin-only, wrong if anyone else ever sets up 2-step | `src/lib/releases.ts`, the `0.12.0` entry |
| 4 | The signed-in pass on `test.lannacare.org` after the test deploy, **remembering it exercises the Worker, not the Pi** | `test.lannacare.org` |
| 5 | After both deploys: `/releases` shows `0.12.0` to a signed-in user — that is the only external check that the **Pi** took the release, since `/api/releases/current` is answered by the Worker | `lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all five items are open and need a person. Items 1 and 2 matter most: this release mails, and note 1 tells admins how a security gate works

Manual verification by: pending: Lutan to read the five notes and the title (item 1), check note 1's account of the 2-step gate (item 2), confirm the two role tags (item 3), run the signed-in pass on test (item 4), and confirm `/releases` shows `0.12.0` after both deploys (item 5)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the release manager — this session, with the items above outstanding

Result: pass
