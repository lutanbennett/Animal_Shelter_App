# The DNS-blackout retry window: 5/10/20/30 s, not 2 x 5 s

**2026-11-28, `#dnsgp`.** Resizes the retry built in `2026-11-27-deploy-dns-retry.md`. Read
`2026-11-27-deploy-dns-blackout.md` first for why there is a retry at all.

## What was wrong

`scripts/lib/dns-retry.mjs` retried twice, 5 s apart: about 10 s of cover. Its comment said *"the
blackout lasted ~250 ms"*. That was the spread of six failed lookups in one trace, not the length of
the episode. On 0.50.0 the episode ran ~23 s, and the retry gave up while the fault was still there.

## The new window, and why this size

The waits are **5, 10, 20, 30 s**: four retries, **65 s** of waiting in all, and 35 s by the third
retry. Each attempt also takes time, which only adds cover.

- **Why not exactly 23 s?** One measurement is not a distribution. Sizing to it is the 250 ms mistake
  made the other way. 65 s is close to 3 times the one figure we have.
- **Why growing waits, not a flat one?** A short blip costs only 5 s. A long episode is still covered,
  without hammering a dead network every few seconds.
- **The cost of being wrong.** Too short: a lost build of about ten minutes, which on production is
  Lutan's time. Too long: a network that is really down is held for about 65 s, plus the attempts,
  before the deploy fails. That is cheap next to a rebuild, so the size leans long. Capped well under
  two minutes (the test asserts this) so a dead network is still reported promptly.
- **Re-size from the next episode.** The trace prints every failed lookup with its time, so the next
  release record that shows a retry gives a second measurement.

## What did not change

The trigger. A retry still happens **only** when the net trace recorded `code=ENOTFOUND` with
`syscall=getaddrinfo` inside that wrangler child. A bad token, a deleted Worker, a bad config, an
`EAI_AGAIN`, a timeout, or a build failure all still fail at once. The Server Actions key check still
runs before every retry, and a retry still re-uploads the same build without rebuilding.

## What the operator sees

A pause of up to 30 s with no output reads like a hang. So during each wait `deploy.mjs` prints a line
every 5 s (`DNS-RETRY waiting, Ns until retry X of 4…`) and `retrying now.` before each attempt.

## This treats a symptom, not the cause

On 2026-11-28 a plain `git push` failed with `Could not resolve host: github.com` and worked on a
retry seconds later. No wrangler and no Cloudflare were involved. So the fault is the whole machine's,
and every other network tool on it stays exposed. The retry saves deploy builds only.

**Cause: not established.** Read again on 2026-11-28 (reads only, nothing changed): the NordLynx
adapter is up, and `Get-DnsClientServerAddress` shows **no DNS server on it**, while the Wi-Fi adapter
has the router's. That matches the 2026-11-27 reading. It is consistent with the VPN hypothesis but
does not prove it. The test that would settle it, running with NordVPN off or with a DNS server set on
its interface, changes the machine's network and was out of scope for this stream.
