# 2026-11-11 — `cloudflared` waits for a name to resolve, and retries after 1 s (`#f1wp1`)

**What is fixed, and what is not.** After an abrupt power cut `cloudflared` starts as soon as the network is
"online" but before names resolve, fails on `dial udp <router>:53: network is unreachable`, and systemd retries
after `RestartSec=5s`. That retry is about 6 of the 20.5 s the Pi takes to serve again (clean reboot: 12.2 s), and
nobody chose it. This removes it. It does **not** make the Pi boot faster and does **not** fix the `1970-01-01`
clock after a power cut. Evidence is the 2026-11-01 drill: one sample, not re-takeable (no reboot is possible
from a stream).

## The choice: both, as a drop-in

`/etc/systemd/system/cloudflared.service.d/10-wait-for-dns.conf`, written by `scripts/pi/setup.sh` (step 2a):

- `ExecStartPre` loops at most 15 times, 1 s apart, on `getent hosts region1.v2.argotunnel.com`, and always
  exits 0 (leading `-` as well), so it can delay a start by up to 15 s but never block or fail one. First attempt
  then succeeds and the log is clean. It uses `getent` because that goes through the same resolver the process will.
- `RestartSec=1s` is the backstop for any other first-attempt failure. Alone it would return only ~4 s and leave
  the error in the log; the wait alone would leave the old 5 s retry if DNS is slow for another reason.

**Rejected:** `RestartSec=1s` only (treats the symptom, error still logged); do nothing (6 s is small, but the fix is
two directives and the log misreading is the larger cost). Rejected inside the wait: an unbounded one, which would
hang the boot and is strictly worse than the retry.

**Why a drop-in:** `cloudflared service install` writes its own unit (setup.sh step 5), so there is no unit of ours to edit.

**Why only `setup.sh`:** there is one `cloudflared` service on the box; test and UAT ride the same tunnel and their
setup scripts only point at it. Same reasoning as the journald step (`2026-11-11-pi-persistent-journal.md`).

## Not covered

DNS down for longer than 15 s (then `cloudflared` starts, fails and retries every second); the 1970 clock;
the Worker-fallback gap `#dxjz2`, whose window this only shortens by ~6 s on the Pi side. No `$` appears in the
`ExecStartPre` line on purpose: systemd expands `$VAR` in `Exec*` lines.

## Proof needs an abrupt power loss

A clean reboot showed 0 failures before this change, so it proves nothing. After a power cut:
`journalctl -u cloudflared -b -o short-monotonic`; expect 0 `network is unreachable` failures (was 1) and the first
`Registered tunnel connection` well under 20.5 s. Syntax was checked by reading against `systemd.service(5)`
(`systemd-analyze` is not available on this machine) and `bash -n` on the script.
