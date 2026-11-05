# Planner tooling follow-ups (2026-11-05)

Items `#em0b2`, `#gspxx`, `#qcd6g`, `#0f0ey`. Four repo-tooling changes in one stream.

## Step zero

`scripts/check-deceased-archive-state.mjs` was absent and never in git (`git log --all` empty), so `#em0b2` was a rewrite. `gates.mjs` had no `tree-lock`. The template's guidance prose did contain `<feature>`, `<name>`, `<yyyy-mm-dd>`. None of the four had landed.

## `#em0b2`: the archive-state check

Rewritten, read-only, `--env`, optional resident code, `exitWith()`, the real names (`deceased_summary_drive_file_id`, `deceased_index_drive_file_id`, and `is_deceased` read from the view `resident_current_state` by `resident_id`). Its 401 message keeps "the token may be missing from this shell" but no comment claims sessions cannot see the token (`check-planner-preflight.mjs` shows they can today). **Proven against dev only** (10 deceased, all archived); the production run is the planner's. `date_of_death` is a timestamptz, so it is printed as a UTC date.

## `#gspxx`: tree lock

`gates.mjs` takes the `build` lock after its node_modules check and refuses with the holder named (the lock's own message). `npm run opennext:build` now runs `scripts/locked-opennext-build.mjs`, which takes the lock and runs the same command. To stop `deploy.mjs` (holder) refusing its own child, `takeTreeLock` exports `TREE_LOCK_PID` and a child whose parent pid is the live holder runs under that lock.

**Bare `npm ci` left unguarded, on purpose.** The only hook would be a `preinstall` script in `package.json`, which also runs in CI and Cloudflare builds, and would fight `guarded-install.mjs` (which holds the lock and runs `npm ci`). `guarded-install.mjs` is the route; the exception remains a person typing `npm ci`.

## `#qcd6g`

(a) `check-env-leak.mjs` now uses `SITE_ORIGINS`. **Correction to the brief: it is exported from `scripts/lib/env.mjs` (read from `wrangler.jsonc`), not from `src/lib/site-hosts.ts`**, which holds the host functions only. Before: all 10 cases `ok` with its own list. After: the same 10 `ok`, reading the wrangler hosts; the fixtures and the host assertion derive from the same list, so a host change cannot leave it stale.
(b) `deploy.mjs` has no `--ref` flag; the brief assumed one. Added an optional `--ref <sha>`; after the build it prints `built from <sha>` beside `release SHA asked for: <sha | none given>` and warns (does not refuse) on a mismatch or a dirty tree.

## `#0f0ey`: template vs checker

**Chose (b)**: guidance sits between `<!-- guidance:start -->` and `<!-- guidance:end -->` (the opening block and the manual-verification explanation). The placeholder scan skips it; nothing else does. (a) alone would let any later edit reintroduce a `<…>` token.

**Which side of the strictness line:** the fence exempts *prose the template marks as guidance*, in the one scan for `<…>` tokens. Every checkbox, signature, `Result:` and fence-evidence rule is judged exactly as before, and a field outside the comments (`Branch / worktree`, the sign-off lines, `Result:`) is still reported. No `continue-on-error`; an unsigned plan still exits 0. The error now reads "…if this line is a field, fill it; if it is the template's own guidance prose (not a field), delete the line". `scripts/test-plan-template.test.mjs` copies the template to a scratch repo and asserts a fresh copy reports placeholders only on fields (including `<feature>` and `<name>`), that the message names the cause, and that without the fences the guidance is read as before.

## Found, not fixed

- `check-test-plan.mjs` reports one placeholder per line, so a sign-off line shows `<name>` and only shows `<yyyy-mm-dd>` once `<name>` is filled.
- The archive check is a standalone script, not an entry in `readonly-checks.mjs`; `#36egc` is therefore partly closed (see the PR).
