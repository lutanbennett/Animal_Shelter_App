# 2026-11-11 — The Pi's journal is made persistent by an override, not by editing the vendor file (`#pm4kz`)

**Why this exists at all:** on 2026-11-11 the Pi rebooted in the middle of the `0.44.2` release, killing
a round of three builds, and **there was no record of why** — the entire journal lived in `/run` (tmpfs)
and is erased at every boot. The cause of that reboot is gone for good. This makes the *next* one
answerable.

## The cause was not what the backlog item assumed

`#pm4kz` said persistent logging was *"one setting … plus `/var/log/journal`"*. **`/var/log/journal`
already existed**, created 15 September, and was empty — a red herring. The real cause:

```
/usr/lib/systemd/journald.conf.d/40-rpi-volatile-storage.conf
[Journal]
Storage=volatile
```

Raspberry Pi OS ships that to spare an **SD card** from write wear. **This Pi boots from a 938 GB
NVMe**, so the rationale does not apply. journald said so itself at boot:
`Runtime Journal (/run/log/journal/…) is 8M, max 80.9M`.

**Worth keeping because the obvious fix was the wrong one.** Creating the directory, or editing
`journald.conf`, would both have left `Storage=volatile` winning.

## Three choices, and why

**1. Override with a `99-` drop-in in `/etc`; leave the vendor file alone.**
`/etc/systemd/journald.conf.d/99-lanna-persistent-journal.conf` sorts after `40-`, so it wins. The
alternative — editing or deleting the vendor file — would be undone silently by the next OS package
update, and worse, undone *invisibly*: nothing would report that logging had gone volatile again. An
override in `/etc` survives a package update and is obvious to anyone reading the directory.

**One consequence to know, and it is written into the script's own comment:**
`systemd-analyze cat-config systemd/journald.conf` now prints **both** `Storage=` lines, volatile
first and persistent second. The later one wins. **Seeing `Storage=volatile` in that output is not a
fault**, and a reader who stops at the first line will conclude the opposite.

**2. `SystemMaxUse=500M`, rather than the default.**
With no cap the default is **10% of the filesystem** — about 93 GB on this box. Nothing needs 93 GB of
logs, and an unbounded log on the machine that serves production is a slow-motion disk problem. 500 MB
holds many weeks here; the journal was 8 MB per boot at the time of writing.

**3. The assertion warns, and does not fail the script.**
Step 2c checks `journalctl --header` reports a path under `/var/log/journal/` — **the thing that
actually matters**, rather than that the config file exists, because a config file can exist and be
overridden. But on failure it prints a warning and carries on, because `setup.sh` still has the app,
systemd, tunnel, updates and backup steps to run, and **a non-persistent journal is not worth
abandoning a box build for.** The warning names the command that explains it.

## What is verified, and what is not

**Verified on the live Pi, independently of the script's own report:** `journalctl --header` reads
`/var/log/journal/<machine-id>/system.journal`; `systemd-analyze cat-config` shows persistent winning;
`/var/log/journal/<machine-id>/` holds 17 MB where it was empty; and journald itself says
`System Journal (/var/log/journal/…) is 8M, max 500M, 492M free.`

**NOT verified, deliberately:**

- **Survival across a reboot.** Rebooting production to prove it was not done. The proof is
  `journalctl --list-boots` showing more than one entry after the next reboot.
- **Step 2c as part of a real `setup.sh` run.** The same commands were proved standalone on the live
  Pi, but the integration is unexercised until someone rebuilds a Pi, and nobody is rebuilding one to
  test it.

## Why it is in `setup.sh` only

`setup-test.sh` and `setup-uat.sh` touch neither journald nor swap — checked, not assumed. Both are
**machine-wide** settings, and all three clones share one box, so doing it per clone would restart
journald three times for no gain. Swap is already handled exactly this way in step 2b.

## A separate finding, from reading step 2b while placing this

`setup.sh` step 2b records that **`next build` peaks above 6 GB on this 4 GB Pi**, which is why it adds
a 4 GB swap file and why `deploy-pi.sh` refuses below ~6 GB. That makes the `0.44.2` OOM kill
**predictable from a comment already in the repo**, and it corrects the "or at most two" guidance I had
written into `docs/release-procedure.md` and the handover earlier the same day: one build already needs
swap to fit, so **one at a time** is the rule. Both documents are corrected in the same PR.

**The other half of `#pm4kz` is still open:** a per-machine lock in `deploy-pi.sh` so a second
concurrent build cannot start. Prose in a runbook is what was already there and already wrong.
