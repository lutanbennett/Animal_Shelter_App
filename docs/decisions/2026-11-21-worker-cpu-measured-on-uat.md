# 2026-11-21 — The public pages do not fit the Workers free plan: 52–87 ms of CPU against 10 ms (#egq18)

Measured by the planner on **UAT**, after the `0.47.9` release. `#egq18` is answered and ticked; the
decision it feeds is `#34a30`'s (part 13 of `#ykefa`), and that decision is Lutan's, not a build.

## The reading

`lanna-animal-care-uat` deployed with `node scripts/deploy.mjs --env uat --no-pi`, so `ORIGIN_HOST` was
empty and the Worker rendered every page instead of proxying to the Pi (`x-lanna-served-by: worker`,
checked before measuring). Eleven public prefixes, one warm pass then three rounds, **every request with a
unique query string**; all answered `x-lanna-cache: BYPASS`, so these are real renders and not cache hits
— the trap `#egq18` itself warns about (`isCacheable()` caches public pages for 600 s).

Read from Cloudflare's own Workers observability, field `$workers.cpuTimeMs`:

| Page | CPU (ms) | Budget |
|---|---|---|
| `/volunteer` | **52** | 10 |
| `/donate` | **62** | 10 |
| `/foster` | **62** | 10 |
| `/our-work` | **78** | 10 |
| `/our-work` (second) | **87** | 10 |

**The cheapest page is 5× over and the dearest nearly 9×.** A sixth reading would refine the range and
cannot change the verdict. Wall times were 500–750 ms, but wall time includes Supabase round trips and is
not the measure — that is why the 2026-11-17 local run could not answer this.

**Machine load is not a contaminant here**, unlike the Lighthouse rule of
`2026-11-02-public-site-speed-bisect.md`: the CPU is counted inside Cloudflare's isolate, not on this PC.

## The counter-finding, recorded because it cuts the other way

**Cloudflare reported 47 successes and zero errors.** Nothing was cut off at 52–87 ms. So enforcement is
softer than the documented 10 ms — in a quiet moment, with one visitor, cache-busted.

That is **not** a reprieve. On 2026-11-05 UAT threw **627 CPU-limit errors** with `ORIGIN_HOST` empty by
accident under real conditions. The honest statement is: *the pages are far over budget, and whether
Cloudflare enforces it appears to depend on load.* Nobody should build a public website on the quiet-moment
behaviour.

## Why UAT, when the method named test

`docs/decisions/2026-11-17-worker-free-plan-limits.md` prescribed the **test** Worker. **It cannot be
used.** Test carries `PUBLIC_SITE: "off"` (`#br3f3`,
`docs/decisions/2026-11-09-website-off-on-test.md`) — the Director's instruction that an outside tester
must not see the website — so **no public page renders there at all** and no figure can be taken. Using
test would mean undoing that for the window. **Lutan was given both options and chose UAT, 2026-11-21.**

That method file predates nothing: `"off"` was set on 2026-11-09, eight days *before* it was written. The
lesson is the repo's own: **read the instruments, not just the item.**

## Two things that save the next person an hour

- **No `wrangler.jsonc` edit is needed.** `deploy.mjs --no-pi` passes `--var ORIGIN_HOST:` at deploy time.
  That matters because **uat and production refuse to deploy from a dirty tree** (`GUARDED` in
  `scripts/deploy.mjs`), so an uncommitted edit cannot be deployed there at all, and committing a
  deliberately wrong value to `main` would be the only alternative. Undone by deploying again with no flag.
- **A signed-in session is required.** UAT is `PUBLIC_SITE: "locked"`, so a signed-out request is
  redirected before any render and measures nothing. `dev-signin.mjs` refuses any project but dev, so the
  pages were driven from a browser already signed in to UAT.

**UAT was restored to the Pi immediately after the reading**, by deploying again without `--no-pi`.

## What it decides

`#34a30` cannot proceed on the free plan as the pages stand. The three routes, and the choice is Lutan's:

1. **Workers Paid** — which **breaks the zero-ongoing-cost rule**, so it is his decision and not a build.
2. **Keep the Pi serving the website**, and drop or defer the domain split.
3. **Make the pages dramatically cheaper to render** — a 5–9× reduction, which is a programme, not a tweak.

## DECIDED, the same day: route 2

**Lutan, 2026-11-21, asked directly and answering in one line:** *"keep the pi serving the website"*.

**So `#34a30` is closed without a build and without a bill.** The Pi goes on serving the public website
through its tunnel, the Worker stays the cache and the fallback, and `ORIGIN_HOST` stays set on every
environment — emptied only for a measurement, briefly, and put back.

**The risk he accepted, stated plainly rather than buried: a Pi outage still takes the public website down
with the app.** That was part 13's whole purpose, and it is **accepted at zero cost**, not solved. It
stands until the pages are cheap enough to render in a Worker or the zero-ongoing-cost rule changes.

**Do not re-offer Workers Paid.** If this is ever re-opened it needs a fresh measurement, not this one.

`#ykefa` parts 12 and 13: **both closed — 12 by this measurement, 13 by his decision.** The programme is
down to its go-live step.
