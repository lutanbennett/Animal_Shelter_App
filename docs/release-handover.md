# Release handover

**This outranks nothing.** `docs/release-procedure.md` is the runbook and `CLAUDE.md` the rules; where
this disagrees with either, they win. It is one chat's note to the next, rewritten every release, and
a wrong line here is corrected by its successor rather than by a reviewer — which is why it merges on
green like any other PR.

**Written after `0.49.2` (2026-11-25, minor, no email, three touches).**

## Where things stand

- **Live everywhere: `0.49.2 @ 5344c037a`** on `/api/version`, all four hosts, all `served-by: pi`.
- **Migrations: `0443` is the highest applied** on production and UAT, both **444 applied, 0 pending**.
  Dev has one extra that exists in no file (`#d422o`); check with `--status` before assuming anything.
- **The production website floor is now `open`** and Lanna's own setting is `locked`, which is the only
  thing keeping the site shut. **Read the next section before you touch `wrangler.jsonc` again.**

## 1. READ THIS BEFORE ANY RELEASE THAT CHANGES `wrangler.jsonc`

**`0.49.2` made the real public website publicly reachable, and the release manager did it while
following the recorded order exactly.** The cost was about the length of the remaining release steps,
and only a configuration read would have prevented it.

`PUBLIC_SITE` is declared in `scripts/lib/runtime-config.mjs` as **`where: "pi"`**. `write-env.mjs`
copies it out of `wrangler.jsonc` into the Pi's `.env.production.local` at **build** time, so the Pi
renders what the Worker would. Every public page is served by the Pi. **So a `wrangler.jsonc` change
to that variable takes effect at the PI BUILD, not at the Worker deploy** — the deployer's step, and
earlier than everyone believed.

**The general rule, which is the thing to inherit:** `runtime-config.mjs` answers "which step applies
this?" for every variable, in one word. **Read `where` for every variable a release changes.** `"pi"`
means a Pi build applies it; `"worker"` means a Worker deploy does. Reviewing *what* a configuration
line does and not *which step applies it* is what went wrong, and no check catches it.

`docs/decisions/2026-11-25-website-lock-truth.md` still puts its read-back in front of the Worker
deploy. **It is wrong and it is filed** — do not follow its step order; put the read-back in front of
the Pi build.

## 2. `tail` has now cost this project four separate faults. Stop piping.

`0.49.1` read `check-deferred-notes.mjs` through `tail -6` and wrote a false claim into a gate's
answer. `0.49.2` read `guarded-install.mjs` through `tail -4`, saw npm warnings, and called an
unfinished install done — `wrangler` was missing and `deploy.mjs` died on it.

**Redirect to a file and read the file.** `CLAUDE.md` already bans reading exit codes through a pipe
and the runbook already warns about `| tail -40` on a deploy. This is the same fault on output rather
than status, and it is most dangerous when the truncated part is the part you are about to make a
claim about.

## 3. A minor release's no-mail needs the CONTROL, not just the absence

`cut-release.mjs --verify` prints two lines and a minor release is only proved by both:

```
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found
```

Without the control, an empty answer and a broken query are indistinguishable. Then **both Worker
deploys say it independently** (`no major release new to <env>, so no email`), and **UAT's is the one
that counts** — UAT has a live `RELEASE_MAIL` binding and its database holds production's real
people. Pass `--no-mail` anyway, as the runbook says.

## 4. Two things that will cost you time if nobody tells you

### A fresh worktree cannot deploy, and the error does not say so

`check-deployed-hosts.mjs --env uat` and `--env production` exit 2 in a new worktree with
`.env.deploy.uat is missing or empty`. `worktree.mjs new` copies only `.env.local`. **Run every
deploy-env command from the main checkout**, not from the release worktree.

### A red `--dry-run` on a migration can be the signal to apply

`0442` reported `FAILED: relation "public.platform_content" does not exist` on both environments.
`0441` creates that table and the dry-run rolls it back before `0442` runs — the documented
per-file-transaction caveat. **A red dry-run normally means "do not apply" and here the correct
action was to apply.** Read both files before concluding a migration is broken, and say which it was:
"the dry-run failed" and "the file is wrong" are not the same statement.

## 5. The tenancy catalogue: read the baseline BEFORE you apply

`check-tenancy-catalogue.mjs --env <env>` is **report-only and always exits 0**, which is exactly why
it gets skipped. Production and UAT both read **124 flagged / 13 allowed / 0 stale** before
`0.49.2`'s migrations and **128 / 13 / 0** after — the four objects `0441` adds, filed as `#tnc41`.

**The delta is only available if you read it first**, and the delta is the whole finding: 128 on its
own says nothing, because 124 were already flagged. **And nothing LEFT the flagged list**, so
`0440`'s re-own changed an owner without clearing its flag. Do not assume a re-own is the fix.

**This debt re-accumulates every release.** `#tnycl` cleared seven on 2026-11-25 and four arrived
within hours from the next release. If you find yourself cataloguing again, the item to work is the
missing step in how a definer migration is written, not the four objects.

## 6. Pi builds: serial, pre-flighted, detached — and stacking is impossible

One at a time (`next build` peaks above 6 GB on a 4 GiB Pi), each log read before the next starts.
**Pre-flight the box** with `free -m` and `uptime`, so a connection problem surfaces before a build
rather than during one. On `0.49.2`: 3238 MB available, load 0.00, uptime 13 days, 872 G free.

**Use `lanna-pi-mesh`, never `lanna-pi.local`** — different subnet, and the LAN name times out by
design. Do not put the route to Lutan as a question; it is recorded as in place.

**Mesh SSH flapped about ten times on `0.49.2` and not one build was lost.** `setsid nohup` means a
build survives the session ending, so a foreground timeout on the starting command is **not** a
failed build — read the log on the Pi. And `deploy-pi.sh` takes a machine-wide `flock -n` that
**refuses rather than waits**, so stacked concurrent builds are impossible by construction. Reading
that script is cheaper than fearing them, which is what `0.49.2` did first.

## 7. `gh` failing is not `gh` refusing, and the difference matters

GitHub had a **Partial System Outage with Pull Requests in major outage** during `0.49.2`.
`gh pr create` failed once and `gh pr merge` three times, through both GraphQL and REST
(`unexpected end of JSON input`). The fourth attempt worked and nothing was lost.

`CLAUDE.md`'s rule is to **stop and hand a refusal to Lutan**. A transport failure looks identical
and is not one. **Check `githubstatus.com` before concluding either way**, and retry a transport
error rather than escalating it.

## 8. Outstanding, and none of it blocks a release

Eight test gaps, listed in `docs/releases/2026-11-25-0-49-2.md`. Two to carry forward:

- **Row 7, a real authenticator code on both step-up journeys.** Lutan's, and outstanding for several
  releases. No stream has an authenticator and `--aal2` on dev does not prove the real journey.
- **Rows 3, 4 and 6 are phone-width looks that can be DRIVEN**, not handed over — headless Chrome
  with a mobile user agent through `scripts/lib/driven-session.mjs` (`#bprf7`). **Offer it; do not
  quietly add it to his list.** He said *"Leave them"* to the same offer on `0.49.1`.

**`0.49.0`'s production cache fault has now not recurred twice.** Purge both zones every time
regardless; there are two data points and no explanation.
