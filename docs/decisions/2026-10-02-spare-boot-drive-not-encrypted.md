# 2026-10-02 — The spare boot drive is not encrypted; it stays plugged in and out of sight

**Status: proposed by Claude, not yet confirmed by Lutan.** The backlog item says to
decide with him; he is the one to answer. If he chooses otherwise, edit this file and
`docs/pi-hosting.md` ("Encryption") together.

A bootable clone of the NVMe holds, in plain text, the two env files
(`.env.deploy.production`, `.env.local`: Supabase service key, Drive refresh token,
`ORIGIN_KEY`), the `cloudflared` tunnel credentials, and the encrypted dumps. It is the
same class of secret CODE-3 flags on the laptop.

**Options.** (a) LUKS the whole root: the Pi then waits for a passphrase at every boot,
so a power cut at 3 a.m. leaves the site on the Worker fallback until someone types it,
and the clone stops being the "plug it in and it comes back" spare. (b) An unencrypted
boot partition with the secrets on a separate encrypted partition: boot works, but the
services need the secrets to start, so someone still has to unlock it, and the clone
script grows a second moving part. (c) **Accept the risk and keep the drive
physically secure.** Chosen.

**Why (c) is acceptable here.** The drive is useful only plugged into a Pi 5 or read on
a Linux machine by someone who wants these specific secrets; it lives next to a box that
already holds the same secrets on the NVMe, so it adds a second copy at the same
physical location, not a new place. The database dumps in it are already age-encrypted
(DB-1), so a stolen drive does not hand over the data. What a thief gets is the ability
to act as the app, which is rotatable.

**If the drive is lost or stolen, rotate:** the Supabase service-role key and database
password, the Google Drive OAuth refresh token (revoke and re-mint), `ORIGIN_KEY` (and the
WAF rule), the tunnel (delete and re-create it, `cloudflared tunnel create`), and
`BACKUP_AGE_RECIPIENT` is public and needs no change.

**Sequence with DB-1.** It does not matter for the dumps: once DB-1 has run, the dumps on
the NVMe are `.age` and every later clone inherits that. Dumps taken before DB-1 and not
deleted are plaintext and would be cloned too, so **finish DB-1's "delete the plaintext
dumps" step before the first clone**, or the spare carries them.

**The dumps are not copied separately.** The backlog item suggested `--local-copy`
pointed at the USB mount. `~/backups` is inside the cloned root, and the timer runs an hour
after the Sunday backup, so the clone already holds the latest dump. A separate mount
would add a path that has to be mounted and checked for no extra safety (same box, same
house).

**One layout choice.** The clone gets a 64 GB root, not the whole drive, so the rest can
become a data partition for the deceased-residents archive mirror (separate item, which
should use LUKS: it holds medical history, and is not needed for an unattended boot).
`resize2fs` on an ext4 root grows or shrinks later if this is wrong.
