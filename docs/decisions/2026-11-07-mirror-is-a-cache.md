# The Pi's Drive mirror is a cache; Drive stays the source of truth

**Lutan, 2026-11-07, asked directly and answering stage 2 of `#svs6c`:** *"My decision is todo the Pi
hosting, it should be the cache and drive will be the primary fallback."*

So the app reads a file from the Pi when the mirror holds it, and goes to Google Drive on any miss.
Drive remains authoritative.

## It needed no change, and that is the point

`src/lib/mirror-read.ts` has described itself as *"a cache, not a primary"* since it was written
(`docs/decisions/2026-10-29-pi-file-cache.md`), and that is exactly the behaviour chosen: Pi first,
Drive on any miss, every error swallowed into a miss. **Nothing was built, nothing deployed, and no
setting changed by this decision.** What changed is that the question is closed and the three
consequences below are now facts rather than open risks.

## The three warnings on the item that the decision discharges

The item deliberately recorded three costs of making the Pi copy *primary*, so they would not be met
as a surprise. Choosing *cache* discharges all three:

1. **`noauto` stays in `/etc/crypttab`.** After a power cut the encrypted partition comes back locked
   and unmounted, and the nightly unit fails visibly (`RequiresMountsFor`). That is right for a cache.
   Had the Pi copy become primary it would have needed either an auto-unlocking key on the Pi or a move
   to the unencrypted NVMe — a real security cost, on a tree holding medical history and naming carers
   and adopters. **That cost is now not incurred.**
2. **The Cloudflare Worker fallback has no disk.** When the Pi is down the Worker serves, and with the
   Pi copy as primary files would have been missing for exactly as long. With Drive as the fallback,
   a Pi outage costs latency and nothing else.
3. **The USB drive sits beside the Pi.** Drive therefore stays the only off-site copy, and it stays a
   live one rather than a backup of a backup.

## The measurement it was taken on

`#prr9h`, settled on the Pi itself on 2026-11-06: 47 files, 49.8 MB, the same bytes each way — at
concurrency 4 the mirror answered in **27 ms** against Drive's **14.66 s**; at browser-like
concurrency 16, **32 ms** against **3.71 s**. So the cache earns its place on speed; what it does not
earn is the right to be the only copy the app can reach.

## A correction this records, because a wrong answer reached Lutan on it

On 2026-11-07 the `drive-buckets` stream told him the app does not read photos from the Pi, taking it
in good faith from the then-current heading in `docs/pi-hosting.md`: *"stage 1 … Drive stays primary"*.
That was out of date. `MIRROR_DEST` is written for **production only**
(`scripts/pi/write-env.mjs`), and **three** call sites read through `src/lib/mirror-read.ts` —
`src/app/api/photos/[fileId]/route.ts`, `src/app/api/documents/[fileId]/route.ts` and
`src/lib/google/stream-video.ts`. Staff photos, documents **and videos** have been served from the Pi's
copy on production since it was installed on 2026-11-04.

**The heading was the cause, so the heading is what changed** — it now says *"a cache on the USB drive;
Drive stays the source of truth"*, and the section names the three call sites outright. A heading that
describes an intention rather than the behaviour will be quoted back as the behaviour.

## The Drive buckets cost one re-pull, and it is affordable

Separately, sorting the Drive into Production/UAT/Test buckets (#1372) changed every file's path, and
`drive-mirror.mjs` skips a file only when its `modifiedTime` **and** its path are unchanged. So the
first run after 2026-11-07 re-copies the whole Production bucket, about **915 files / 1.1 GB**, and —
by the script's own never-delete rule — keeps the pre-bucket copy beside it, roughly doubling the
mirror's footprint.

**Checked rather than assumed:** `df -h /mnt/lanna-mirror` on 2026-11-07 reports **1.8 TB, 1.3 GB used,
1.7 TB free**, so the re-pull takes it to about 2.4 GB. `_mirror/status.json` showed `lastSuccess
2026-11-06T21:06:37Z` with `same: 1134`, so the re-pull had not yet happened when this was written.
Reads do not break while it does: ids survive a move, and the old copy stays until the entry is
rewritten.

It is **one** re-pull and not two: the sort and the switch of production's
`GOOGLE_DRIVE_ROOT_FOLDER_ID` to the Production bucket happened on the same day, so the paths moved
once. That correction came from the `drive-buckets` stream, which had done the switch.

## What is explicitly NOT changed

`scripts/pi/drive-mirror.mjs` is untouched. It is pull-only by rule, its header says not to improve it,
and its value is surviving a mistake in Drive. Nothing here asks it to delete, prune or reconcile.
