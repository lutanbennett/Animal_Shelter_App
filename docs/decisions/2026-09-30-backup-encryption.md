# 2026-09-30 — Backups are age-encrypted to a public key, without session tables

Security assessment DB-1 (High). `scripts/backup.mjs` uploaded `pg_dump` output of
`public` and `auth` unencrypted, and logged the Drive link. `auth` holds password
hashes, TOTP secrets and live refresh tokens.

- **Public-key `age`, not a passphrase.** The backup now also runs on the Pi
  (cron, `--local-copy`). A passphrase (`age -p`, `openssl enc`) would have to sit
  on the Pi for cron to use, so the box holding the encrypted dumps would hold the
  key to them. With a public key the Pi can write a backup nobody on it can read;
  the private key lives only in Lutan's password manager. This supersedes the
  backlog item's "age, gpg or openssl" list, written before the Pi existed.
- **Encrypted in-process (`age-encryption` npm package), not by shelling out to
  `age`.** No extra program to install on the Pi, laptop and Task Scheduler
  environment, and one code path. The output is standard age binary format, so
  `age -d -i key.txt` opens it; `scripts/decrypt-backup.mjs` does the same for a
  machine without the `age` program. Cost: one runtime dependency, by the age
  author, in a script that already depends on `googleapis`.
- **No plaintext file ever exists.** `pg_dump` writes to a pipe (no `--file`), the
  bytes are encrypted in memory and only ciphertext is written, including into the
  `--local-copy` folder. Fine while the database is megabytes; a `maxBuffer` of
  2 GiB is the ceiling, at which point this becomes a streaming encrypt.
- **No opt-out, and it fails closed.** No recipient means exit 1 before the
  database is touched. A private key (`AGE-SECRET-KEY…`) given as the recipient
  is refused, so pasting the wrong half of the pair into an env file cannot put it
  on the Pi. Several recipients are allowed (a second administrator or a spare).
- **Excluded tables:** `auth.refresh_tokens`, `auth.sessions`, `auth.mfa_*`
  (the three the assessment named) plus `auth.one_time_tokens` and
  `auth.flow_state` (recovery, confirmation and OAuth-flow tokens: same
  reasoning, same zero restore cost). Consequence, accepted: `mfa_*` holds the TOTP
  secrets, so after a restore every 2-step user re-enrols their authenticator
  app, and nobody is signed in. `auth.users` (hashes) stays, because without it a
  restore has no accounts.
- **The Drive link is not logged.** `webViewLink` is no longer requested.
- **Old plaintext dumps are named, never deleted, by the script.** Each run warns
  about `.dump` files (as opposed to `.dump.age`) left in Drive's `Backups/` or the
  local folder, which are also no longer counted for retention. Deleting them is
  Lutan's call once the first encrypted backup is confirmed.
- **The Weekly backup tile reads `.dump.age`.** Left alone it would have gone red
  15 days after the first encrypted run. It now ignores plaintext dumps, so it
  also stops vouching for an unencrypted backup.
- **Not done here (Lutan's):** generating the key pair, installing the public key,
  moving `Backups/` into a folder shared with the admin only, deleting the old
  plaintext dumps and `backup.log`, and rotating anything the old links exposed.
  A restore of real data was not rehearsed from this branch (no database password
  on the machine); it is the first thing the next backup enables.
