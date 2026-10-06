# 2026-10-06 — The Pi scripts refuse to run as root

**Context.** On 2026-10-02 `sudo bash scripts/pi/setup-test.sh` (the natural
command: the file had no exec bit until #303, and it visibly needs root for
systemd) left 57,249 paths in `~/Animal_Shelter_App_test` owned by root.
`deploy-pi.sh --env test` then failed with `EACCES` on `.env.production.local`
and `node_modules/.bin`. The scripts run as your own user and call `sudo`
themselves for the systemd and apt lines only.

**Decision.** `setup-test.sh`, `setup.sh` and `deploy-pi.sh` each begin with a
guard that exits 2 when `id -u` is 0. `setup.sh` has the same shape (its
`sudo` calls are internal too). `deploy-pi.sh` was "probably worth it": it
failed rather than caused the damage, but run as root it would equally hand
`node_modules` and `.next` to root, and production deploys would then need a
password. The refusal says to run as your own user, that sudo is used inside,
the exact command, and the recovery `chown -R <SUDO_USER>:<SUDO_USER> <clone>`.
No script chowns anything itself. `docs/pi-hosting.md` never tells anyone to use
sudo for these, so the docs were not the cause.

**Recovery of an already-root-owned clone** (interactive, on the Pi, by hand):
`sudo chown -R lutan:lutan ~/Animal_Shelter_App_test`. The guard prevents
recurrence; it does not repair the existing clone.
