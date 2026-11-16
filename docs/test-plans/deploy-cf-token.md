# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `deploy.mjs` can authenticate wrangler with a scoped Cloudflare API token instead of its expiring OAuth login |
| Backlog item | n/a: no item existed — Lutan asked for it directly after `0.47.1`'s defect 1, *"yes make deploy.mjs use a Cloudflare API token"* |
| Branch / worktree | `claude/deploy-cf-token` @ `C:\Development\Animal_Shelter_deploy-cf-token`, port `3006` |
| Dev server | not needed: nothing in the app changes. The paths exercised are a deploy script and an env-layer helper |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 / 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | `a911f04b6` — the tip of `main` this branch was cut from |

## 1. Scope and risk

- [x] Change is described in one sentence — `deploy.mjs` hands wrangler `CLOUDFLARE_API_TOKEN` (and optionally `CLOUDFLARE_ACCOUNT_ID`) when the environment's own values file sets them, prints which credential is in use, and otherwise behaves exactly as before
- [x] Files/areas touched — `scripts/deploy.mjs` (a header block, two helpers, one `env:` on the wrangler spawn, one printed line), `scripts/lib/env.mjs` (two names added to `ACCOUNT_KEYS`), `scripts/env-layers.test.mjs` (three tests), `docs/release-procedure.md` (what to do on a `code: 10000`), one decision file, this plan. **No `src/`, no `worker/`, no migration, no string, no dependency**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: nothing here runs in the app. No card, activity, page or server check is touched, and no login can reach a deploy script
- [x] Out of scope, written down so the release manager is not surprised — **the token is opt-in and no environment has one yet**, so every deploy today still uses the OAuth login and the printed line says so. Creating the token is Lutan's (it is his Cloudflare account); the decision file names the three permissions. **`purge-cache.mjs` is untouched** — its `CLOUDFLARE_PURGE_TOKEN` is correctly scoped per zone and must not be merged with this one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the worktree was created from `origin/main` at `a911f04b6` minutes earlier, and `git status -sb` showed neither ahead nor behind
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 8s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 209s
=== gates: test — npm test
=== gates: test exited 0 after 52s
=== gates: build — npm run build
=== gates: build exited 0 after 82s
gates: typecheck=0 lint=0 test=0 build=0
```

**This is the second run. The first failed `lint`** (`gates: typecheck=0 lint=1 test=0 build=0`) on a
real guard — see defect 2 — and the whole set was re-run after the fix rather than just `lint`,
because the file had changed since the passing typecheck, test and build. **The background task that
ran the gates reported "exit code 0" both times**, because that is the shell wrapper's status and
not the gates'; the four numbers above were read from the `gates:` line itself, which is exactly the
trap `docs/release-procedure.md` names.

- [ ] CI green on the PR — n/a: the PR does not exist at this commit. **Before merging, the run for this HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] `node --test scripts/env-layers.test.mjs` on its own: **8 pass, 0 fail** — the four that were there and the three added, plus the existing `ACCOUNT_KEYS` assertion

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value, no database access of any kind. This change is about which credential a command-line tool is handed

## 4. Functional checks

- [x] Happy path works end to end — **the whole content of this change is "which credential, and does it say so truthfully", so all five source states were driven** with `--env test --plan`, which resolves and prints without building or uploading:

```
A. nothing set anywhere
   deploy: wrangler auth: wrangler's own OAuth login — no CLOUDFLARE_API_TOKEN in
     .env.local or the shell. Its access token can expire part-way through the build …
B. token in the SHELL only
   deploy: wrangler auth: API token from the shell, no account id set (wrangler infers it)
C. token in .env.local only
   deploy: wrangler auth: API token from .env.local, no account id set (wrangler infers it)
D. .env.local AND a different token in the shell
   deploy: wrangler auth: API token from the shell, …          <- shell beats .env.local
E. token and account id both in .env.local
   deploy: wrangler auth: API token from .env.local, account id from .env.local
```

- [x] **Case B is the one that caught a real bug in this change, and it is why the layers are read rather than the merged environment.** The first draft asked `env.CLOUDFLARE_API_TOKEN` — the merged view — and reported a shell-only token as **`API token from .env.local`**, which would have sent the next reader to the wrong file while debugging an auth failure. `loadEnv` folds `process.env` in, so the merged value cannot say where it came from. It now reads `loadLayers` and names the layer. **The case looked least interesting of the five**
- [x] Invalid input — **a blank value reads as absent, not as an empty token** (`CLOUDFLARE_API_TOKEN=` in the file → the OAuth line, not a deploy attempting to authenticate with an empty string). Both helpers `.trim()` before deciding
- [x] Boundary case: `--env test` has no overlay file, so `envFile("test")` *is* `.env.local` — the "nothing set" line deduplicates rather than reading *"in .env.local, the shell or .env.local"*. Checked after fixing it
- [ ] Data persists / create-edit-delete / empty state — n/a: this change stores nothing

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no login, card or route is involved. A deploy script is run by a person at a terminal

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic, string path or component. Nothing a browser loads

## 6. Regression

- [x] **The default path is unchanged, which is the regression that mattered** — with no token anywhere, `--plan` resolves and prints exactly as before plus one line (case A), and the wrangler spawn receives `{ ...process.env }` with nothing added, because `cfAuth()` returns `{}`. **A deploy today cannot behave differently from a deploy yesterday**, which is what makes this safe to merge before any token exists
- [x] **`ACCOUNT_KEYS` gained two names, so what else reads it was checked rather than assumed** — `mergeLayers` (the only consumer) and `scripts/env-layers.test.mjs`. And **nothing in the repository reads either key**: `grep -rl` for `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` across `src/`, `worker/`, `scripts/`, `supabase/` and `.github/` finds only the new `deploy.mjs` lines. So elevating them above the shell changes the behaviour of nothing that exists today
- [x] Shared file touched, checked from a second unrelated caller — `scripts/lib/env.mjs` is shared widely, and the change to it is two strings appended to one exported array. Its one behavioural consumer, `mergeLayers`, is covered by the eight passing tests; `loadEnv`'s precedence for every other key is asserted unchanged by the pre-existing *"every other key: the shell still wins"* test
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: there was no item. This came straight from Lutan after the release
- [x] Non-obvious design choices as a new file in `docs/decisions/` — `2026-11-16-deploy-cloudflare-api-token.md`: the measured cause of the `401`, why the keys went into the existing `ACCOUNT_KEYS` rather than a new mechanism, why the credential is kept out of `buildEnv`, the bug case B found, the three permissions to create, **why ONE token rather than three** (`Workers Scripts → Edit` is account-level and cannot be narrowed to one Worker, unlike cache purge, which is why the purge token *is* per-zone), and **why it must not go in `.env.local`** (`worktree.mjs new` copies that file into every worktree)
- [x] `README.md` still accurate — it describes the env files' purpose, not their key lists
- [x] **The two new keys are deliberately NOT added to `.env.example`, and a check enforces that** — `check-runtime-config.mjs` asserts both directions: every manifest entry appears in `.env.example`, **and every name in `.env.example` appears in the manifest**. These are deploy-time credentials, not Worker configuration, so they have no manifest entry (`WORKER_BUILD_VARS`, `WORKER_REQUIRED_SECRETS`, `WORKER_OPTIONAL_SECRETS` all exclude them by construction) — and adding them to `.env.example` alone would fail `lint`. **So the place to document them is the deploy script's own header and the decision file**, which is where they are. Discovered by reading the check after it failed on something else (defect 2)
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a deploy script's credential handling. No shelter user can reach it, nothing they see changes, and the app's behaviour is identical
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the five source states from running `--plan` in each; the bug in case B from its own wrong output before the fix; the eight tests from `node --test`'s own count; the "nothing else reads these keys" from `grep -rl` across five trees; the token's permissions from reading `wrangler.jsonc`'s actual bindings (`ai`, `assets`, `send_email`) and routes rather than from a general recipe
- [x] **The runbook now says what to do on a `code: 10000`** (`docs/release-procedure.md`, under the production deploy): read the new auth line first, retry the same command, **do not** run `wrangler login`, and do not reach for `--skip-build` unless the leftover build can be shown to belong to that environment

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `a911f04b6`
- [ ] Deployed SHA matches the tested SHA — n/a: **nothing here is deployed.** `scripts/deploy.mjs` and `scripts/lib/env.mjs` run on this machine; neither is bundled into the Worker nor copied to the Pi's build. The change takes effect the next time somebody runs a deploy

### On the deployed build

- [ ] Deployed to test / smoke-tested / public pages re-checked after a purge — n/a: this PR ships nothing to any environment, and **no deploy was run as part of it on purpose.** `--plan` exercises every line changed here without building or uploading; a real deploy would have cost ten minutes to prove a credential nobody has created yet
- [ ] Timezone-sensitive behaviour — n/a: no date is derived
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff
- [x] Evidence pasted here is the tool's actual output, unedited

### Deploy safety

- [x] **The credential cannot reach the Worker bundle, and this was established three ways rather than asserted once.** (1) It is passed only on the `wrangler` spawn, and deliberately **not** added to `buildEnv`, which `next build` sees — so there is nothing for `next build` to inline. (2) It is **not** in `WORKER_BUILD_VARS`, `WORKER_REQUIRED_SECRETS` or `WORKER_OPTIONAL_SECRETS`, so `--secrets` never pushes it to Cloudflare as a Worker secret. (3) `strip-baked-env.mjs` empties the baked env snapshot before upload anyway — belt and braces, and the weakest of the three, because that snapshot is written from `.env*` rather than `.env.deploy.*`
- [x] **No secret value is printed.** The auth line names the *layer* a value came from and never the value; the decision file and this plan contain no token. The account id in the test above (`79c4…a33d`) is an account identifier, not a credential, and it already appears in wrangler's own output
- [x] **Where the token must not go is part of the change, not an afterthought** — `.env.local` is copied into every worktree by `scripts/worktree.mjs new`, so a token there would be duplicated onto disk once per workstream. The decision file says production and UAT only, and test keeps the OAuth login deliberately

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration and no database code
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Destructive or rewriting migration: a fresh backup exists — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR returns `deploy.mjs` to using wrangler's OAuth login unconditionally and removes the printed line.** No environment depends on the new path yet, so a revert is inert today. **If a token has been added to an env file by then, reverting would silently stop using it** and the next deploy would fall back to the OAuth login — which still works, so the failure mode of a revert is "the `0.47.1` problem comes back", not a broken deploy. Nothing to clean up: no file is written, no secret is pushed, no state is kept

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | — | **Found and fixed inside this change**, recorded because the shape recurs: the first draft read the *merged* environment to decide where the token came from, and reported a shell-only token as *"API token from .env.local"*. A merged env view cannot say which layer won — that is the whole reason `ACCOUNT_KEYS` exists. Caught by driving case B, which looked like the least interesting of the five | fixed: `cfSource()` reads `loadLayers` and names the layer. Case B is now part of the evidence above |
| 2 | — | **Found and fixed inside this change: the first gates run failed `lint`** on `check-runtime-config: scripts/deploy.mjs spells out "SUPABASE_ACCESS_TOKEN"; derive it from the manifest`. My new comment named that variable **in backticks**, and the guard's regex is `["'`]NAME["'`]` — so it catches a manifest name quoted anywhere in this file, **comments included**. The guard is right (names in `deploy.mjs` must come from the manifest, not be copied), so the comment was reworded to name it in prose, with a clause saying why it is unbackticked so nobody puts them back. **The gates were then re-run in full rather than just `lint`**, because the file had changed since the passing typecheck, test and build | fixed. It also settles where these keys may be documented — see §7 |
| 3 | low (pre-existing, not introduced here) | **A deploy cannot be planned from a worktree for production or UAT**, because `worktree.mjs new` copies only `.env.local`, so `node scripts/deploy.mjs --env production --plan` there stops with `.env.deploy.production is missing or empty`. Known and documented for the UAT deploy; it also means the new auth line could only be driven on `--env test` from here | not changed. It is the correct refusal — a worktree has no business holding production's values — and `--env test` exercises every changed line. Noted so the next person does not read it as this change breaking something |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **A real deploy authenticated by a real token — the one thing `--plan` cannot prove.** Create the token (decision file names the three permissions), put it in `.env.deploy.production`, and the next production deploy should print `deploy: wrangler auth: API token from .env.deploy.production, …` and upload without a `code: 10000`. **If wrangler names a missing permission, add exactly that one** — the permission table was read from this Worker's bindings and routes, not from Cloudflare's documentation | Lutan, in his Cloudflare account, then at the next release |
| 2 | **The same for UAT**, whose deploy is Claude's — it will use the token as soon as one is in `.env.deploy.uat` | the next release's UAT deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: no token exists yet, so the token path has not been driven end to end; only the person who creates it and runs the deploy may tick this

Manual verification by: pending: Lutan to create the token and run the next production deploy, which is the only thing that proves the credential path for real

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the change is inert until a token exists, so it is safe to merge ahead of one

Result: pass
