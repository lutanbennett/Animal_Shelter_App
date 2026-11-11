# `worktree.mjs new` copies an allow-list of env keys, not whole files (`#52y56`, the no-rotation half)

Decided in the brief for this stream, 2026-11-11. Key NAMES only; no value appears here (the repo is public).

## What changed

`scripts/worktree.mjs new` used to `copyFileSync` the whole of `.env.local` and `.dev.vars` into every
worktree. It now writes only the keys in `ENV_KEEP` (each group commented with what needs it), prints
`copied .env.local: 11 of 14 keys (left in the main checkout: …)`, and **stops with a sentence** if the
main checkout's `.env.local` lacks any of the four keys every worktree needs (`ENV_REQUIRED`). Comment
lines are not carried over, because they described keys that may no longer be in the file. Existing
worktrees are untouched: the change takes effect on the next `new`.

## Per-key verdicts (`.env.local`, 14 keys)

| Key | Verdict | How established |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | needed | `next dev`, `dev-signin`, `apply-migrations`, `check-planner-preflight` (it fails without them) |
| `SUPABASE_SERVICE_ROLE_KEY` | needed | server code, `dev-signin`, preflight REST probe |
| `SUPABASE_ACCESS_TOKEN` | needed | `apply-migrations`, preflight Management API probe |
| `GOOGLE_OAUTH_CLIENT_ID/_SECRET/_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID` | needed | read by the running server (`src/lib/google/drive.ts`, photo and document routes), so any stream testing an upload needs them |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | **not established** → kept | read by `scripts/lib/actions-key.mjs` for builds and deploys; not shown that `gates.mjs` build never picks it up |
| `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_REFRESH_TOKEN` | **not established** → kept | `src/lib/clinics/calendar-sync.ts` runs inside the dev server; a clinic-visit stream may reach it. Optional: unset means visits are simply not sent |
| `DEV_TEST_USER_EMAIL`, `DEV_TEST_USER_PASSWORD` | not needed → dropped | no reader in `src/`, `scripts/` or `worker/` other than a comment in `strip-baked-env.mjs`; `dev-signin.mjs` deliberately does not use them |
| `REHEARSAL_SUPABASE_ACCESS_TOKEN` | not needed → dropped | one reader, `scripts/check-schema-drift.mjs`, a cross-project rehearsal run from the main checkout, and it falls back to `SUPABASE_ACCESS_TOKEN` |

`.dev.vars` is narrowed by the same list (its five keys are all on it, so it is copied whole in effect).
Nothing in `scripts/`, `src/` or `worker/` reads `.dev.vars` from a worktree; it is the Worker preview's
file. The same filter keeps one rule instead of two.

## What the guard catches, and what it misses

Catches: a main-checkout `.env.local` missing one of the four core keys fails `new` immediately, naming
the key. Misses: a key present but wrong or empty-valued; a new key added to `.env.local` later that
worktrees need (it is not on the allow-list, so it is silently left behind, but is printed in the
`left in the main checkout` line each time); anything in `.dev.vars`. `check-planner-preflight.mjs` stays
the instrument for "can this session reach each core key".

## What a worktree can no longer do

- `node scripts/check-schema-drift.mjs` across two projects (needs `REHEARSAL_SUPABASE_ACCESS_TOKEN`): run it from the main checkout.
- Nothing reads `DEV_TEST_USER_*`, so no script loses anything.
- Everything else that worked still has its keys.

Not done here, by design: moving or rotating the service-role key and database password.
