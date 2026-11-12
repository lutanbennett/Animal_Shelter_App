# drive-sharing.mjs accepts --env production in report mode only (#yy9fz)

2026-11-12. Lutan chose "Narrow the guard" over reading production's sharing state by hand in the Drive UI.

## What the guard refuses and allows now

- `--env production --remove` and `--env production --restore`: **refused, exit 2**, message names production and says nothing was changed. There is no `--force`, `--yes` or any flag combination that writes to production.
- `--env production` with no write flag (the **report**): allowed. It reads and changes nothing.
- Everything else (test, uat, the `--shared-tree-ok` guard on test, all write paths) is untouched.

The old guard sat on line 34 *after* `const WRITE` (line 33), so nothing had to move: the existing `if` gained `&& WRITE`. The planner's earlier brief said the refusal came before any mode check; that was wrong.

## Whose account a local production report uses

`.env.deploy.production` sets none of `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` or `GOOGLE_OAUTH_REFRESH_TOKEN`, so a local `--env production` falls through to `.env.local`, the **dev** Google account. That account owns all three trees under *LCA Health System*, so it can read production's tree as its owner.

**This does NOT establish what the deployed Worker authenticates as, which remains unread.** The report tells us what the owner's view of the tree is, not which identity the running app uses.

## Banner

Considered a louder banner for production. Not added: the first output line already prints `Environment: production   root: <id>   mode: report only (nothing is changed)`, so a production report cannot be mistaken for a UAT one. Nothing more needed.

## Unchanged

`docs/decisions/2026-11-10-drive-unshare.md` is unchanged and still authoritative. (Briefs and a handover cite it as `2026-11-09`; the real file is dated 2026-11-10.) Lutan locked production's Drive himself on 2026-11-12, so `--remove` is not needed there and its refusal stays absolute.
