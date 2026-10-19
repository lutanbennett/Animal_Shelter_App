# Pi deploy tells the truth, and builds beside the live folder (2026-10-19)

- **The false banner.** `src/proxy.ts` returns 403 `Forbidden` to any request without the Worker's
  `x-origin-key` where `ORIGIN_KEY` is set (production). The loopback version probe sent none, so it read
  "nothing" on a deploy that worked (0.37.1). Test has no key, which is why it passed. The probe now reads
  `ORIGIN_KEY` from `.env.production.local` and sends it (`origin_key_from`, `check_served_version`).
  Not "ask through the public URL": that can be answered by the Worker's fallback and would pass with the Pi down.
  The check can still go red (a wrong or missing version still prints the banner; tested), and the message now
  says an empty answer may be a refusal, so confirm publicly before rolling back.
- **The asset check always runs** once a build is live: an EXIT trap runs `check-assets.mjs`, and its failure
  sets the exit status if nothing else had.
- **Option (b) built, via `distDir`.** The 2026-10-18 decision left this to Lutan because it needs a
  `next.config.ts` switch. It is three lines, off unless `NEXT_DIST_DIR` is set, so dev, CI and the Worker
  build are unchanged. The Pi builds into `.next.new` (cache copied across), checks the Server Actions key there,
  then renames `.next` to `.next.prev` and `.next.new` to `.next`. The gap is two renames, not a build. It is
  not zero, and the old build's chunks vanish at the swap for pages already open: the purge still matters.
  `.next.prev` is kept until the version check passes, so rollback is two `mv`s.
- **Not built:** (a) automatic purge (needs the token, backlog #720); (c) serve assets from the Worker.
- **Unproven on a Pi:** that `next start` serves a build made with `distDir=.next.new` after the rename. Run it on the
  test clone first. A `CLAUDE.md` note is owed by a later stream.
