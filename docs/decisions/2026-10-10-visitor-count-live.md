# The visitor count, tested against Cloudflare for the first time

2026-10-10, `claude/visitor-count-live`. Follows
`2026-10-10-one-optional-secrets-list.md` (#518).

## Why this exists

`0.25.0` told every admin, by release mail, that the Website visitors tile
on Settings → System status now shows a number. On production it still said
*Not set up*. #518 had fixed the plumbing that carries the two values to the
Pi, but the values were only ever in the dev machine's
`.env.deploy.production` (and so on the Worker). The Pi serves the pages and
had nothing to read. And `countVisitors()`'s query had never once been run
against Cloudflare: three attempts at this feature, and nobody had seen the
answer.

## What Cloudflare answered

Run from the laptop with the values in the main checkout's
`.env.deploy.production` (both present: 53 and 32 characters, values never
printed), first with a copy of the query and then through the app's own
`countVisitors()` and a real `/admin/status` page:

| Range | Answer (before the fix: no `dimensions`) | Answer (after: grouped by date) |
|---|---|---|
| 7 days | HTTP 200, one group: 5,360 page views, 662 uniques | 7 groups: 5,361 page views, 804 visitors summed |
| 30 days | HTTP 200, one group: 16,741 page views, 2,524 uniques | 20 groups: 16,742 page views, 3,534 visitors summed |
| 90 days | HTTP 200, same as 30 | same as 30 |

- **The token is valid** and has Zone → Analytics → Read. A wrong token
  answers `Authentication error`, which the tile shows in red.
- **The query was not malformed**, but it was not doing what the tile says.
  With no `dimensions`, Cloudflare folds the whole range into **one** group,
  and that group's `uniq { uniques }` is not the sum of the days (662
  against 803 summed by hand from the per-day rows). The tile says "counted
  per day and added up". Adding `dimensions { date }` makes it one group per
  day, and the sum is then what the words say. Page views agree either way.
- **30 and 90 days are the same** because the zone's data starts on
  **2026-09-21**, when lannacare.org moved to Cloudflare. That is correct,
  not a failure: 90 days will diverge from 30 on its own from 2026-10-21.
- **Free-plan range limit for `httpRequests1dGroups`: 52 weeks + 1 day + 1
  hour.** A 365-day range answers; 366 days is refused with
  `cannot request a time range wider than 52w1d1h` (code `quota`). The
  page offers at most 90, so there is a lot of room. `limit: 100` covers 90
  daily groups.
- **`uniq { uniques }` is available on this plan and this group.** No change
  of source was needed.
- **Zero would render as a number, green.** The tile shows whatever the
  groups sum to, and an empty range sums to 0; only missing values are
  shown as missing.

`httpRequestsAdaptiveGroups` (to filter by host, so test.lannacare.org and
staff traffic drop out) was **not** tried: the zone-wide figure is
labelled as zone-wide on the tile, and swapping group is a separate decision
with its own range limit to measure first.

## The tile now says where the value is missing

Before, a missing value gave a grey tile reading "Not set up … as Worker
secrets", which was both indistinguishable from "configured somewhere
else" and the instruction that sent the values to the wrong machine.

Now `countVisitors()` returns which of the two names are missing, which
machine is answering, and the file to fix:

- **Worker**: `getCloudflareContext()` works only there.
- **Pi**: off the Worker with `PHOTO_CACHE_DIR` set. `write-env.mjs` gives
  that line only to a Pi (its comment says so), so it marks the Pi, its
  test clone included, without a new variable.
- **local**: anything else, a laptop.

The file is the one `scripts/lib/env.mjs` reads for that database:
`.env.deploy.production` (or `.uat`), and `.env.local` for the dev database.

**Red, not grey, on production**, because the count was promised there and
a missing value is a fault, not a choice. Grey ("not in use") stays for a
dev laptop, which is what `off` means in `run.ts`. **One of the pair without
the other is red anywhere**: that is always a mistake. The error line names
the keys only, never a value.

## Not changed

- The **0.25.0 release note** stays as shipped, and **no correcting line
  goes in `unreleased`**. Lutan, 2026-10-10: nobody had opened System status
  before the fix, so the note is simply early, not wrong in front of anyone.
  It becomes true on lannacare.org with the Pi step below.
- **The Pi deploy is not part of this change.** The tile will be green on
  lannacare.org only after the two lines are copied into the Pi's
  `~/Animal_Shelter_App/.env.deploy.production` and `deploy-pi.sh` runs.
  That is a production step, the release manager's with Lutan's go.
- `check-test-plan.mjs` still cannot tell a true release-notes line from a
  present one. That is filed as its own process item in `## Architecture`
  and is a decision for Lutan, not a change here.
