# `deploy.mjs --secrets` refuses a secret that resolves only from `.env.local` (2026-10-14)

Backlog item: deploy secrets guard. Branch `claude/deploy-secrets-guard`.

## What was decided

- For `--env uat` and `--env production`, `--secrets` works out where every
  secret it is about to push came from (`shell`, `.env.deploy.<env>` or
  `.env.local`) and **prints name and source for each — never a value**.
- If any came **only** from `.env.local` (the dev values) the deploy **stops
  before the build**, names each one, and gives two ways forward: add it to
  `.env.deploy.<env>`, or pass `--allow-dev-fallthrough`.
- `test` is not guarded: its values *are* `.env.local`.
- The fall-through itself is unchanged and stays possible. The Google Drive set
  still runs on the dev account (`scripts/lib/env.mjs` header), so today
  production needs the flag. The point is that it is stated, not inherited.
- Logic is in `scripts/lib/secret-sources.mjs`; `src/lib/secret-sources.test.mjs`
  covers a refused push, the override, and that no value appears in the message.

## `write-env.mjs` (the Pi): not done

Considered and left alone. It runs on the Pi, where `.env.local` is not the dev
laptop's file, and it pushes nothing to a live service: a wrong value there is
visible on that machine, not silent. A refusal would also block Pi deploys with
no override designed for them. Revisit if the Pi's `.env.local` ever holds dev
Drive values by accident.

## Not touched

`BACKUP_DRIVE_FOLDER_ID` missing on the Worker is Lutan's one-secret fix.
