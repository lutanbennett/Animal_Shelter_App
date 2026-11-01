# What the public repo says about Lutan's hardware, and what was done about it

Stream `pi-tests-record`, 2026-11-01, asked by Lutan after the stream found a drive serial in a
backlog item it was about to tick. **The short answer: nothing secret has ever been committed, so
there is nothing to rotate; one runbook line was wrong and is fixed; the rest is recorded here so
nobody re-runs the search.**

The repository has been **public since it was created** (2026-09-18), and that is deliberate
(private would cap GitHub Actions at 2,000 free minutes a month against roughly 30,000 used, so CI
would simply stop). So everything below has been world-readable from the day it was committed, and
**git history keeps it whatever any file says now** — which is the fact that decides most of what
follows.

## What was searched

Across `origin/main`'s working tree, and for the two worst cases across **all** history and every
branch:

- MAC addresses in colon form — **none**.
- Wi-Fi network names / SSIDs — **none**.
- Cloudflare tunnel ids, account ids, 32-hex tokens — **none**.
- Env, credential, `.pem`, `.key`, `id_rsa`, `.p12` files ever added on any branch — **none**
  (`.env.example` only, which is the template and holds no values).
- JWT-shaped (`eyJ…`), `sb_secret_…`, `sb_publishable_…` or service-role-shaped strings anywhere in
  the full history of every branch — **none**.

**So no credential has ever been committed to this repository.** That is the headline and it is the
only part of this that could have been urgent.

## What is published, and what each one is actually worth

| What | Where | Worth to someone who found it |
|---|---|---|
| The spare drive's `by-id`, which carries its serial | was in `docs/pi-hosting.md` (one line) and a backlog item | **Nothing remotely.** Not a credential, not reachable, not usable from outside the house. Both now removed |
| LAN addresses on the house subnet (the Pi, Lutan's PC, the model machine) | `docs/self-hosted-model-runbook.md`, two decision files, one release record, one backlog item | **Almost nothing.** RFC 1918 addresses are not routable from the internet; they are useful only to somebody already inside, who could read them off the network in seconds. The Pi's is **stale anyway** — it moved to its own subnet behind the FR205 on 2026-11-01 |
| Router and switch models, and that the firewall is adopted into a cloud controller | backlog items | **The most of the three, and still small.** It tells someone which firmware advisories to go and read. Against that: the tunnel is **outbound only**, so there is no inbound port to attack except one SSH forward that admits a single address |
| `lanna-pi.local` | throughout `docs/pi-hosting.md` | **Nothing.** An mDNS name means nothing off the LAN |

## What was decided

1. **Nothing is rotated and nothing is urgent.** There is no credential to rotate, and a drive
   serial and a private address are not secrets. Saying otherwise would turn a tidy-up into an
   incident.
2. **The one runbook line is fixed, as a correctness fault rather than as a scrub.**
   `docs/pi-hosting.md`'s drive-mirror step 1 hard-coded one drive's `by-id` inside an **`fdisk`**
   command, while steps 2 and 3 of the same list correctly take `<that partition's by-id path>`. A
   literal device in a destructive command points at the wrong disk the day the drive is replaced,
   which is the exact failure the same section already guards against by insisting on mounting by
   UUID and never `/dev/sda`. It now says to read the path from `/etc/default/lanna-spare` or
   `ls -l /dev/disk/by-id/` first. **The security tidy-up is a side effect of a better command.**
3. **The historical records are left alone.** The release record of 2026-10-02, the two decision
   files and the backlog items that quote a LAN address are records of what was measured on a day.
   Editing them would not unpublish anything — history keeps every version — and it would damage the
   one thing they are for. **Never rewrite a record to improve a security posture it cannot
   improve.**
4. **No history rewrite.** It would mean force-pushing every branch of a repository with other
   sessions working in it, to remove things that are not secrets, from a history that forks and
   caches may already hold. The cost is real and the benefit is zero.
5. **The rule going forward, which is where the actual value is:** when writing about the house
   network, **put the value in the Desktop notes and the meaning in the repo.** "Its WAN-side MAC,
   not the LAN-side one" is as useful to a future reader as the digits are, and costs nothing. Where
   a document needs an example address, prefer a placeholder (`<your model machine's address>`) over
   a real one. Filed on the `backlog` branch so it is not left to this file alone.

## What would change this answer

A credential, a tunnel credentials JSON, a `.env` with values, an SSH private key, or a public IP
and an open inbound port. None of those is present today, and the first four are what the
`git log --all -p` scan above was for — so if one is ever committed, the response is rotation, not
a scrub, and the scan is worth re-running rather than re-deriving.
