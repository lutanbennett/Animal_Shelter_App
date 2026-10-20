# Release handover — written 2026-10-20 after `0.38.0`

**Read this first: the last edition opened by telling you to expect
`[Production Deploy]` to refuse the production Pi build twice and to budget three
touches. That is too pessimistic, and you should not plan around it.** `0.38.0`
cost **two** touches — the budget — and the gate refused only once, on something
harmless. See *THE ONE THING*, which is now a narrower warning than the one it
replaces.

- **`0.38.0` was a MAJOR release and the mail went out.** Confirmed **delivered** to the inbox, not left at `sent 1`. The next release is more likely to be minor, which **inverts the mail check** — see *THE MAIL CHECK FLIPS*.
- **This is the fourth handover in a row to correct its predecessor.** Nothing here outranks `docs/releases/2026-10-20.md` or `docs/release-procedure.md`. If they disagree with this file, they are right and this is stale.
- **Nothing shipped broken.** All four builds from one SHA, every gate green, both databases clean.

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release** and
is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file.

The standing instruction: **when something it warns about gets fixed, come back
and say so.** Honouring that, from the previous edition:

- **THE PI GATE IS NOT A THREE-TOUCH TAX. Corrected, with a cheaper shape.** The command that *starts* the production Pi build went through first time; what was refused was **reading the build log afterwards**. One retry cleared it and Lutan was never involved. **Budget two touches, not three.**
- **`strip-baked-env` removes 13 on BOTH environments.** `0.37.2`'s correction held exactly. **Expect 13 and 13.**
- **The Pi's banner is trustworthy, second release running.** `serving 0.38.0 as expected`, zero `DEPLOY FAILED`, `check-assets: ok … identical to the build` from the exit trap on both clones. **A red banner is evidence. Believe it.**
- **`0224`'s card check is CLOSED and must not be raised again.** Lutan, 2026-10-19: *"Management holds it, and only Management."* Ticked in `docs/backlog.md`. Two editions have now carried this warning; **do not make it three.**
- **The record-PR prediction held for a SEVENTH release and the cut's for a FOURTH in a row** (#775). Settled; stop checking, but keep writing the guess down — writing it is what makes re-reading it happen.
- **The per-file dry-run trap did NOT fire** — all three `ok`. **Running tally: twice fired, eight not.** Say which of the three cases you got.
- **`npm ci` as step 1 earned its keep a fourteenth time**, and `next@16.3.8` matched `package.json`.
- **The first CI run was green by construction for a TENTH release.**
- **All four builds from one SHA: eighteen releases running.**
- **A production-only guard** has gone **sixteen** releases without appearing.
- **No 502 on either merge** this release. Keep the warning anyway — it costs one retry.
- **The Pi build cache is a non-issue.** Production 1.8 GB, test 1.2 GB, **876 GB free**. Compiles 51s and 50s.
- **The swap fix** was retired from this file last edition and is not coming back.

---

## THE ONE THING THAT WILL BITE YOU: the gate is on the PATH, not on the deploy

There is an allow rule for the Pi — `Bash(ssh lutan@lanna-pi.local *)` in
`C:\Users\Leidos\.claude\settings.json`. The previous edition told you to expect
`[Production Deploy]` to refuse the **build** twice. **What actually happened on
`0.38.0` is more useful to know:**

- The command that **started** the production Pi build was **not refused**.
- The command that **read the build's log afterwards** — a plain `tail ~/deploy-prod.log` — **was** refused as `[Production Deploy]`.
- **One considered retry cleared it**, and the release continued without reaching Lutan.

```
Permission for this action was denied by the Claude Code auto mode classifier.
Reason: [Production Deploy]
```

> **So the rule to carry is about the path, not the action:**
>
> 1. **Any command touching `~/Animal_Shelter_App` on the Pi may be refused**, including harmless reads. Starting a build and reading its log are **two separate chances**.
> 2. **Take ONE considered retry.** It cleared it on `0.38.0` and on three of the four releases before `0.37.2`.
> 3. **If a second attempt is refused, STOP.** Do not take a third. Hand Lutan the exact command and say plainly what did and did not run.

**The diagnostic that still holds: the TEST Pi is never refused.** Same session,
same SSH. So a blocked release manager can always finish three of the four builds
and leave Lutan exactly one command.

**Budget two touches.** `0.38.0` proved two is achievable with the gate present.
If you end up at three, say so and record what caused it — but do not open by
telling Lutan to expect three.

---

## THE MAIL CHECK FLIPS WITH THE VERSION CALL, AND IT IS THE IRREVERSIBLE STEP

`0.38.0` was **major**, so the check ran the right way up for the first time in
four releases: `majorReleasesSince("0.37.2")` returned exactly `["0.38.0"]`, the
production log printed `deploy: release mail for 0.38.0 [UAT]: sent 1, skipped 0`,
and **its presence was the pass**.

> **Whichever way Lutan decides, assert it mechanically and know which direction
> you are checking.** On a **major**, the mail line must be **present**; on a
> **minor**, `majorReleasesSince("<previous>")` must return **nothing** and the
> absence of the line is the check. Getting this backwards means a gate that
> verifies nothing.

**Two things about `0.38.0`'s mail worth not re-deriving:**

- **Do not stop at "sent 1".** That is the relay accepting it. The message was confirmed in the inbox from `releases@lannacare.org`, subject carrying `0.38.0`, with the notes rendering. **Check delivery.**
- **`skipped 0`, not the usual `E_RECIPIENT_NOT_ALLOWED` skip.** Previous releases recorded `lannacareforanimals@gmail.com` being refused by the relay as expected. This release skipped **nobody** — that address was simply not among the recipients. **Not established why, and not worth a paragraph of inference.**

**Expect the next release to be minor**, because `0.38.0` mailed every admin on
2026-10-20. But **put the case to Lutan and let him weigh it** — that is the one
call that cannot be taken back, and it is his by design.

---

## THE SECOND THING: this file goes stale, and its OPEN ITEMS go stale fastest

Unchanged from the previous edition, because **it worked**. `0.37.2` nearly spent
a fourth touch re-asking a question Lutan had already answered; `0.38.0` checked
every open item against `docs/backlog.md` before sending the opening message and
nothing stale reached him.

> **Before you repeat ANY open item from this file — including the ones below —
> `grep` it in `docs/backlog.md` and read the line.** It costs seconds. Asking a
> second time is worse than not asking: it tells Lutan his answer went nowhere.

This file is a snapshot written at one moment; the backlog is live and edited by
every stream continuously. **Trust the backlog over this file when they
disagree** — including over the "things that got fixed" list above.

---

## THE THIRD THING: a 502 is not a refusal

Did not recur on `0.38.0`, but it costs one retry and is worth keeping.
`gh pr merge` can return:

```
non-200 OK status code: 502 Bad Gateway
```

leaving the PR `OPEN` and unmerged. **This is a transient GitHub error, not a
permission refusal**, and it looks nothing like the "Merge Without Review" block.
**Retry once.** And **always re-read the state after a failed merge**:
`gh pr view <n> --json state,mergedAt`. A session that confuses the two either
stops and asks Lutan for nothing or, worse, assumes the merge happened.

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.38.0`** @ `8d385e10` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`8d385e10`** — `node scripts/release-prs.mjs 8d385e10 <the new release SHA>` |
| Production database | **`233 applied`, `0 pending`**, `No drift` at the end of this release. **Run `--status --env production` yourself.** |
| Dev database | `233 of 233`, `No drift: test matches origin/main`. **Already stale — run `--drift test`.** |
| Next free migration number | **`0233`**. `origin/main`'s highest is `0232`. **Still check** — three landed in this release |
| `unreleased` notes waiting | **0** at the moment the cut merged — **read nothing into that.** Five editions running have said 0 and been overtaken |
| Open PRs | **run `gh pr list`.** None at the end of this release except this record's own |
| Worktrees | **run `node scripts/worktree.mjs list`.** The feature leftovers and one husk were cleared at the end of this release |
| **The Pi's build cache** | production **1.8 GB**, test **1.2 GB**, **876 GB free** — healthy. **Stop fearing it** |
| `main` moves under you | **Yes.** It did not during `0.38.0`, but two new streams branched during `0.37.2` and it changed the release SHA mid-cut on `0.37.1`. Re-read; never carry a count forward |

**Server Actions keys checked Worker against Pi again** (thirteenth time):
production `cbd55beae8d8`, test `ecc41837fc0b`, both unchanged since `0.31.0`.
They are environment configuration, not build output, so **matching this file's
values is not evidence you checked.** Compare the Worker's deploy line against the
Pi's, and look for the Pi's second line, `the build in .next.new carries that key`
— both Pis printed it.

---

## A NEW CASE TO KNOW: a `-- consumer:` warning can be expected rather than a problem

Every migration in `0.37.2` declared `-- consumer: none`, so no warning appeared,
and the last handover recorded that as the shape. **`0.38.0` is the other case**,
and the two look identical on screen:

```
WARNING 0231_public_photos_exclude_videos.sql: declared consumer
src/app/api/videos/[fileId]/route.ts differs from release 0.37.2,
so it may or may not already read this.
```

`0231` names app code that **arrives in the same release** (#764), so the warning
is the safe direction by construction — schema lands minutes before its reader,
which is the runbook's order anyway. **It was predicted in the cut's test plan
before the apply ran, so meeting it cost nothing.**

> **So: read every migration's `-- consumer:` header against *this* release before
> you apply, and write down which warnings you expect.** A warning you predicted
> is free; the same warning unpredicted costs you fifteen minutes of deciding
> whether to stop.

**And check a narrowing in code, not by reasoning.** `0231` narrows a public view
(`media_kind = 'photo'`), the shape of change that silently empties a page. It was
safe only because `0229` added that column `not null default 'photo'`, so every
pre-existing row already matched. **Had it been nullable, approved photos would
have vanished from the public site with nothing to say so.**

---

## In flight

**NOTHING is open from `0.38.0`.** Both items the first draft of this edition
carried were closed within the hour — one by another stream, one by Lutan running
a command. **Do not raise either with him.**

### CLOSED: `0227`'s retention job IS scheduled on production

Open across `0.37.2` and most of `0.38.0`, and **settled on 2026-10-20**. Lutan
ran `node scripts/check-cron-job.mjs --env production` and it printed:

```
check-cron-job (production): ok — purge-assistant-actions is active, 17 3 * * *, and the function exists.
```

So the job exists, is active, runs on the right schedule, and calls a function
that is really there. `docs/backlog.md` records the same confirmation. **The
question is answered; asking it again costs him a second answer to something he
has already done.**

Two things worth keeping from how it was settled, because they generalise:

- **A refused read is not a dead end, it is an unanswered question with an owner.** It was refused as `[Production Reads]` on two releases running and **was never retried blind**. What closed it was another stream writing a purpose-built read-only checker and Lutan running it in one line — not persistence against the classifier.
- **"Verified working today" is not "will report if it breaks."** The job is correct *now*. It still reports to nothing, so a future silent failure would be just as invisible. **That is the separate, still-open backlog item** — making it report through the existing `/admin/status` tiles and `status_alert_runs` plumbing — and it is a real piece of work, not a re-check. See the silent-failure pair below.

### CLOSED: the `purge-cache.mjs` / `check-assets.mjs` byte disagreement

**Do not carry this forward, and do not re-investigate it.** `0.37.2` saw 4 bytes,
`0.38.0` saw 28, and this edition was originally drafted saying the growth made a
rounding artefact less likely. **That inference was wrong.**
`scripts/lib/served-bytes.mjs` landed on `main` during `0.38.0` and names the
cause: `(await res.text()).length` counts **UTF-16 code units, not bytes**, so any
asset containing a non-ASCII character reads short. Both numbers were always
explainable, the growth was the file changing, and **nothing was ever wrong with
what the edge served.** The fix is a shared `fetchBytes()` reading an
`ArrayBuffer`.

**The useful lesson is about the reasoning, not the bytes:** two data points were
turned into a trend in a document, and the trend was noise.

### A THIRD silent failure now exists, and it is the same shape as the first

**Drive space.** Videos are up to 500 MB each into the shelter's 1 TB Drive, and
the only warning is a tile on System status — amber at 80%, red at 95% — which
**never emails anyone**
(`docs/decisions/2026-10-20-videos-uploaded-straight-to-drive.md`). A full Drive
stops uploads, and nothing would say so. Nothing is broken today.

**This is the second unwatched silent failure in two releases** (the retention
job is the first), and both would be fixed by the same plumbing. **Worth naming
to Lutan as a pair rather than one at a time.**

**Be precise about what is open here, because the neighbouring item is not.**
The retention job was *confirmed working* on 2026-10-20 — that question is shut.
What remains, for both it and Drive space, is that **neither would tell anyone if
it stopped**. That is a piece of work to build, not a check to re-run, and
describing it as "we should check the cron job" would re-open a settled question.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** What is durable is the shape:

- A release's own worktrees become free leftovers once their PRs merge. **Clear your own**, but check they still exist first.
- `HELD — <session name>` means someone is in it. Ask; do not tear it down.
- **A stream can be in flight with no PR**, which `gh pr list` will not show. `git branch -a` is the check.
- **There are worktrees `worktree.mjs list` cannot see** — app-cut ones under `.claude/worktrees/`.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-20.md`** — both sections; that day holds `0.37.2` **and** `0.38.0`. Then *THE ONE THING* above.
2. **Expect a `[Production Deploy]` refusal on ANY production-Pi command, log reads included.** One considered retry, then stop and hand it over. **The test Pi is never refused.** **Budget two touches, not three.**
3. **Check `docs/backlog.md` before repeating any open item from this file.** `0224` is closed; do not raise it. This worked on `0.38.0` and is the cheapest habit here.
4. **Copy the production deploy command out of `docs/release-procedure.md` verbatim — and check `git status -sb` immediately before handing it over.** Seven releases running for the first half, three for the second.
5. **Do not run anything in the main checkout while his deploy is going.** `0.38.0` avoided this by finishing the test Worker deploy first and then handing over, which also meant the checkout was provably idle.
6. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Never call the record PR "ready to merge when you say".
7. **`npm ci` in the main checkout before any deploy.** Fourteen releases running.
8. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values.
9. **Open with ONE message** carrying four things: the major/minor case with a recommendation; the silent-failure answer read in code; the whole outstanding-verification list **as an explicit question**; and any quietly-breaking change **named separately from the count**. **Check item 3's list against the backlog first.**
10. **Range starts at `8d385e10`.** Re-run `release-prs.mjs` if `main` moves. **Expect a DISAGREEMENT alongside exit 0** — four consecutive releases have had one and **every one was a squash merge**, traced from the PR number in the commit subject. It is what a squash merge looks like to this script. **Do not tick the test-plan item against its list** — check the plans directly with `check-test-plan.mjs --base <previous SHA>`.
11. **Read both databases rather than trusting the table above.** `--env dev` is not a thing; the dev database is `--env test` and the drift check is `--drift test`.
12. **Decide major or minor with Lutan before cutting**, and **know which way the mail check runs** — see *THE MAIL CHECK FLIPS*. `0.38.0` mailed everyone, so a minor is the likelier call next.
13. **Verify the cut mechanically, and make the verifier PRINT THE VALUES IT COMPARED.** Import both modules and compare notes as values so role tags are compared too; make the first two assertions prove the comparison is not empty; **print an added note as an addition rather than absorbing it into a count.** `0.38.0` reused `0.37.2`'s shape unchanged and it worked. **Reuse it again.**
14. **A note added IN the cut is legitimate when the release is what closes the step.** **Check every feature plan whose release-notes line reads `n/a: <outstanding step>` to see whether your release closes it** — `0.38.0` found one that way (#763's vet note, unblocked by applying `0230`) and cleared two others that needed nothing. Two releases running this has found something. **This is how an ability ships invisibly otherwise.**
15. **Read every `-- consumer:` header against this release and predict the warnings** — see the new section above.
16. **Check a narrowing in code, not by reasoning about it.** A public view gaining a filter is the shape that silently empties a page.
17. **When two migrations in one release touch the same object, check the later did not revert the earlier.** `0.38.0`'s three shared no object.
18. **Ask whether anything can fail silently**, read the candidates in code, and **name it separately from the count**. **If a read you need is refused, say so and leave it open** — do not retry blind and do not quietly drop it; on `0.38.0` that patience is what got the retention job answered properly rather than guessed at. Two things of the same shape **still report to nobody**: the retention job (confirmed *working* 2026-10-20, but it would not announce a future failure) and Drive space. Both are build-work on the backlog, **not checks to re-run**.
19. **Expect a production-only guard.** None for sixteen releases.
20. **The production migration apply is yours, with an allow rule.** It needed no prompt on `0.38.0`.
21. **Budget the Worker deploys at ~9–10 minutes each, strictly serial. Budget the Pi builds at ~5 minutes each** — `0.38.0`'s compiles were 51s and 50s.
22. **Check what is already on test before overwriting it.**
23. **Clear your own worktrees once their PRs merge** — but check they still exist first.
24. **Writing the cut's test plan before opening the PR made the first CI run green for the tenth release.** Then ticking the CI line is itself a commit, so a second run follows — **wait for it and confirm its `headSha` matches your HEAD before merging.** Merging on the first run's strength merges a commit whose CI never finished. **At first commit the CI line cannot be ticked**; write it `n/a: not yet — the PR does not exist at this commit`, which the checker accepts, then tick it afterwards.
25. **The vet calendar is ANSWERED — stop asking.** Lutan, 2026-10-19: *"LEAVE ON TEST UNTIL WE DEPLOY 2 WAY & TEST IT."* Write `n/a: configured on test only, dormant on production`. **`0232` landed the two-way schema in `0.38.0` and nothing reads it yet** — that does not change the answer.
26. **`test-plan` is ADVISORY, permanently** (Lutan, 2026-10-20). Do not raise it, do not list it as a decision he owes, and **if you find branch protection already requiring it, say so rather than assuming it was intended.**
27. **For any shipped change to `deploy-pi.sh`, check the log for `deploy-pi: restarting under the script from <sha>`.** Its absence means the old script ran and the release's new guards did not. `0.38.0` changed nothing under `scripts/pi/`, so this was checked and moot.

---

## The public site is still locked — on BOTH environments

`PUBLIC_SITE` is `locked`, so anonymous requests to `lannacare.org` **and**
`test.lannacare.org` get the "Staff testing site" gate — **confirmed on `0.38.0`
by fetching the root and matching the gate text, not assumed.** "Deploy it to test
and check the public behaviour there" is not an available move on any environment,
and offering it to Lutan is offering something that cannot be done.

**What you CAN do, and it is better evidence anyway:** test the enforcing layer
directly, against real rows, **as the `anon` role**, in a `begin … rollback`
harness (`set local role anon;`, then read the public views and call
`is_public_drive_file`). **This matters more than usual next release**, because
`0231` changed exactly those objects: `public_resident_photos` now excludes
videos, and `is_public_drive_file` reads it.

Consequences to expect:

- **The public pages cannot be smoke-tested at all.** Fourth release running where the headline was internal.
- **The edge-cache `HIT` check is vacuous**: the gate is served `no-store`. Write it `n/a` with that reason. `0.38.0` saw `BYPASS`, which is the expected curl result; **`0.37.2`'s unexplained `HIT` did not recur**.

---

## Things that look alarming but are not

Everything the previous editions hold still applies, in particular: a red `audit`
never blocks; `| tee` writes UTF-16 so strip the nulls before grepping, and the
arrow does not survive, so grep for the **project ref**; a backgrounded
`deploy.mjs` writing nothing for minutes is buffering; the `ERROR Failed to copy …`
lines are noise. Also:

- **A `502 Bad Gateway` from `gh pr merge` is transient.** Retry once and re-read the PR state. Did not recur on `0.38.0`.
- **`[Production Deploy]` can refuse a harmless READ** of the production clone, not just a build. One retry usually clears it.
- **A `-- consumer:` warning can be entirely expected** — see the new section above. Predict them before you apply.
- **A byte count from `(await res.text()).length` is UTF-16 code units, not bytes** — which is what made `purge-cache.mjs` and `check-assets.mjs` disagree by 4 bytes on `0.37.2` and 28 on `0.38.0`. **Closed**; use `fetchBytes()` from `scripts/lib/served-bytes.mjs`.
- **A `public-views` failure naming a `public_*` view you have never heard of is usually a race or a stale branch, in that order.** The foreign-branch skip needs the owning branch **pushed** to find its proof, so a view applied to shared dev minutes before its branch is pushed fails every other PR in the gap. And once that branch merges, a branch behind `main` fails on a stale allow-list instead. **Check the clock, then `worktree.mjs sync`** — both happened to `0.38.0`'s record PR, three minutes and 23 commits apart.
- **A command piped through `tail` writes nothing until it finishes** — that is why `gates.mjs` and `npm ci` look stalled for minutes. Not a hang.
- **A heredoc can be too long for this shell.** A large `cat > file <<'EOF'` died with `ENAMETOOLONG: uv_spawn` on `0.38.0`. Use the editing tools for long documents rather than shelling them out.
- **`python` is the Microsoft Store stub on this machine** and exits 49. Use the editing tools or `node`.
- **`Killed` after `Creating an optimized production build ...` is the CACHE; after `Running TypeScript ...` it is the older memory fault.** Neither appeared this release.
- **A five-figure `lint` failure in the main checkout is almost certainly NOT your code** — `eslint` walks into `.claude/worktrees/`. Check with `npx eslint --ignore-pattern '.claude/**'`.
- **A FAILED dry-run can be the correct result** when a file rebuilds a view naming columns an earlier *pending* file adds. **A red it does not explain is a real stop.**
- **`--drift test` exiting 1 with dev *ahead* is usually normal** — the schema-first rule working.
- **A `gates.mjs` run much faster than the last is a warm Turbopack cache.** Read the exit codes, not the timings. It prints `test=0` as well as the three the template names.
- **A second CI run on the cut PR is correct and expected.**
- **CI jobs reporting an empty conclusion are queued, not stuck.** `check` takes two to three minutes.
- **`/api/version` disagreeing with `/api/releases/current` mid-release is not a fault** — the first comes from the origin Pi, the second from the Worker. Expect it between the Worker deploy and the Pi build.
- **A red `public-views` is almost certainly not yours** — it runs against the shared dev database.
- **`width=device-width` contains the substring `dev`.** Grepping the production gate page for "dev" matches the viewport meta twice.
