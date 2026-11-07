# The home-network review is closed: Meshnet on the Pi, no `ufw`, remote use of the PC

Date: 2026-11-07. Backlog item `#r55fe`. Values (names, addresses, device list) are on Lutan's Desktop,
not here, because the repo is public (`#1wf15`).

## What was concluded

- **The review is finished.** The home network the Pi lives on, and remote use of the Windows PC that
  runs the Claude sessions, were reviewed, and the findings are in a report on Lutan's Desktop:
  `Remote-access-report-PRIVATE-7-Nov-2026.md`. Its notes from the earlier sessions sit beside it in
  `network-review-session-notes-PRIVATE.md`.
- **Remote access to the Pi is NordVPN Meshnet**, installed and signed in on 2026-11-06. It is
  Meshnet only: NordVPN itself is Disconnected, so nothing is re-routed, and no peer is allowed to route
  or to reach the local network behind the Pi. Management access stays separate from public web traffic,
  which still reaches the Pi only through the outbound Cloudflare tunnel.
- **`ufw` is NOT implemented. Decided by Lutan, 2026-11-06. Closed; do not re-raise it.** Reasons: the
  Pi is the only device on its own subnet behind the FR205, which already blocks it from starting
  connections to the home network; very little listens (SSH on the network address, the app and the
  tunnel's status port on loopback only, plus Nord's own file-sharing helper on the Meshnet address,
  read 2026-11-07); and a firewall on the live host risks locking out SSH, the one management way in.
- **Remote use of the PC is the Claude desktop app's Remote Control**, which Lutan has used from his
  phone to start workstreams and run scripts (2026-11-06), with Remote Desktop over Meshnet as the second
  way in. Cloud sessions are not a substitute: they have none of the secrets, the Pi key or the allow rules.
  Nothing is opened to the internet. BitLocker was already confirmed and is not re-asked.
  The report carries the off-switches for each route.

## Not covered (stated, not a to-do)

Not tested from outside the home network, or from a phone. Lutan's phone SSH app would not log in on
2026-11-06 (a phone-side fault) and he was satisfied Meshnet is operational; it was not re-asked.

## Why it is recorded

`#r55fe`'s middle still said `ufw` was to be added and the work "unstarted" after those had been decided
or done. The item now carries a head that says it is finished, with the stale passages marked
`SUPERSEDED 2026-11-07` in place.
