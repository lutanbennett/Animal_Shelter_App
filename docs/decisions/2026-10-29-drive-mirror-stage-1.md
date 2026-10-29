# 2026-10-29: Drive mirror, stage 1 (a pull-only copy on the Pi's USB drive)

Lutan, 2026-10-29: mirror the Drive files first, measure responsiveness later, then decide which
is primary. **Drive stays primary; stage 2 (measuring, the decision) is not started.**

- **One job closes two items:** the whole-tree mirror and the deceased-archive USB copy
  (`Residents/Deceased/` is just part of the tree).
- **A Node script, not rclone.** Nothing is installed on the Pi beyond node, and every Drive call is a
  GET, so "never writes to Drive" can be read straight off the code. It lists by folder walk and
  compares Drive `modifiedTime` per file id, rather than using the changes feed: simpler, and a full
  walk is what lets it tell "gone" from "not looked at".
- **Gone files are kept and logged once**, only after a complete walk (an aborted walk marks nothing).
- **Encrypted, noauto.** The mirror goes in its own LUKS partition. It is not unlocked at boot, so a
  power cut cannot hold the site up on a passphrase; the job fails visibly until unlocked. Unattended
  unlock is a stage 2 question (the "primary" fact (2)).
- **Credentials:** the app's existing `GOOGLE_OAUTH_*` and `GOOGLE_DRIVE_ROOT_FOLDER_ID`, read from the
  Pi's env file, so the Drive move to the shelter's account changes only that file.
- **Size:** dev tree 1.1 GB / 934 files (measured). Production's was NOT measured (no production Drive
  credentials from this checkout); the partition is over 1.7 TB, so it fits unless production is
  more than about 1,500 times larger than dev.

**Found, not fixed:** the USB drive is 1.8 TB, not the 1 TB the backlog says; `spare-clone.sh` header
mentions leaving the rest for "a data partition", which this uses. `docs/pi-hosting.md` "Spare boot
drive" still says "500 GB to 1 TB"; left alone.

**Outstanding for Lutan:** the Pi setup in `docs/pi-hosting.md` "Drive mirror" (partition, LUKS,
timer, first run). Hence no release note.
