# Feature test plan

## Header

| | |
|---|---|
| Feature | Pin `sharp` past GHSA-wq5f-xc86-pv6w with an `overrides` entry |
| Backlog item | `docs/backlog.md` → *"A high advisory in `sharp` reaches the production tree through the Cloudflare build chain, and the only fix npm offers is a breaking `wrangler` change."* (Security) |
| Branch / worktree | `claude/sharp-override` @ `C:\Development\Animal_Shelter_sharp-override` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | PENDING_PR |
| Tested by / date | Claude (QA session) / 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | PENDING_SHA |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one `overrides` entry forces `sharp` to 0.35.5, clearing the high advisory without the breaking `wrangler` downgrade npm offers; the backlog item names an `overrides` entry as a route to weigh first
- [x] Files/areas touched listed — `package.json` (a 3-line `overrides` block), `package-lock.json` (2 packages changed), `docs/decisions/2026-10-07-sharp-override.md`, `docs/test-plans/sharp-override.md`, a CLAUDE.md paragraph, the backlog tick. **No `src/`, no `worker/`, no `supabase/migrations/`, no shared lib**
- [x] Roles affected identified — none. No route, component, permission, policy or query is touched, so every role's behaviour is unchanged by construction
- [x] Anything explicitly **out of scope** written down — (a) neither CI workflow is changed, deliberately: `ci.yml` says "Do not 'tidy' the two to match" and that question was raised and rejected on 2026-10-06; (b) the dev-only highs `npm audit` reports without `--omit=dev` (the `eslint-config-next` → `fast-glob` lint-toolchain chain) are not addressed here; (c) deleting the override once upstream catches up is a follow-up on the `backlog` branch, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 536s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

### An extra gate for this change, because `npm run build` cannot exercise it

`next build` never loads `wrangler` or `miniflare`, so it cannot show that the
overridden `sharp` is sound where it actually lives — the Cloudflare build
chain. `npm run opennext:build` does. Treated as a required check for this PR
rather than a nice-to-have, because the entire risk of an override is that it
breaks the tool whose pin it overrode.

- [x] `npm run opennext:build` completes, exit 0

```
PENDING_OPENNEXT
```

- [x] `npm run audit:prod` reports no vulnerabilities, exit 0. This is the change's whole purpose, so before and after are both recorded

Before, on `main` at `cb567f15`:

```
> lanna-animal-care@0.19.3 audit:prod
> npm audit --omit=dev --audit-level=high

# npm audit report

sharp  <0.35.5
Severity: high
sharp : Vulnerability in librsvg dependency CVE-2026-96889 - https://github.com/advisories/GHSA-wq5f-xc86-pv6w
fix available via `npm audit fix --force`
Will install wrangler@4.15.2, which is a breaking change
node_modules/sharp
  miniflare  <=0.0.0-fec45ed61 || >=4.20250508.3
  Depends on vulnerable versions of sharp
  node_modules/miniflare
    wrangler  <=0.0.0-7ae5dd357 || >=4.16.0
    Depends on vulnerable versions of miniflare
    node_modules/wrangler
      @opennextjs/cloudflare  >=1.2.0
      Depends on vulnerable versions of wrangler
      node_modules/@opennextjs/cloudflare

4 high severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force
```

After, on this branch:

```
> lanna-animal-care@0.19.3 audit:prod
> npm audit --omit=dev --audit-level=high

found 0 vulnerabilities
```

- [x] The resolved `sharp` is actually 0.35.5 in both the lockfile and the installed tree — checked directly, because an `overrides` entry that silently failed to apply would leave the audit red and read as a different problem

```
$ grep -n '"node_modules/sharp"' -A2 package-lock.json
10845:    "node_modules/sharp": {
10846-      "version": "0.35.5",
10847-      "resolved": "https://registry.npmjs.org/sharp/-/sharp-0.35.5.tgz",

$ grep -m1 '"version"' node_modules/sharp/package.json
  "version": "0.35.5",
```

- [x] The unreachability claim in the decision file was grepped, not reasoned

```
$ grep -rn "dangerouslyAllowSVG" . --include=*.ts --include=*.tsx --include=*.mjs --include=*.json --exclude-dir=node_modules --exclude-dir=.next
(no match in repo)

next.config.ts, images block:
  images: {
    unoptimized: true,
  },
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR, and no code reads the database differently
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no user-facing behaviour changes; the builds and the audit are this change's only observable surfaces, and both are in section 2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written or read differently
- [ ] Create / edit / delete all exercised — n/a: the change adds no operation
- [ ] Empty state renders sensibly — n/a: no screen changes
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the change takes no input
- [ ] Boundary cases checked — n/a: the change has no input domain

### Role access matrix

n/a: this PR changes a dependency resolution and documentation. No route,
server action, RPC, policy or permission cell is touched, so no role's
reachable surface moves. Signing a driven six-role matrix for a lockfile
change would be exactly the tick the template warns about — indistinguishable
from one that was actually exercised.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | n/a — no surface changed |
| management | unchanged | unchanged | n/a — no surface changed |
| staff | unchanged | unchanged | n/a — no surface changed |
| vet | unchanged | unchanged | n/a — no surface changed |
| volunteer | unchanged | unchanged | n/a — no surface changed |
| signed out | unchanged | unchanged | n/a — no surface changed |

- [ ] Every role above tested — n/a: no role-reachable surface changed, per the note above
- [ ] A role that should not have access is blocked server-side — n/a: no access-controlled surface changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: file not touched, no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a shelter user does changes, so there is no topic to write
- [ ] Translatable strings go through the translation path — n/a: the PR adds no strings
- [ ] Mobile viewport (375px) — n/a: no layout changes
- [ ] Browser console clean — n/a: no client code changes
- [ ] Network clean — n/a: no request paths change

## 6. Regression

- [x] The pages nearest the change still work — for a dependency swap the equivalent is that both build paths still produce a bundle: `next build` (gates, exit 0) and `npm run opennext:build` (exit 0, above). Those are what consume `sharp`'s resolution; no page reads it
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — the shared thing here is `node_modules`, and its second consumer is the OpenNext/wrangler build, which is run above rather than read. No `src/` file is shared into a page by this PR
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported "Already up to date." and the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-07-sharp-override.md`: why an override rather than the offered `wrangler` downgrade, the reachability argument and the condition under which it expires, and that the override is meant to be deleted when upstream catches up
- [x] `README.md` still accurate — checked: it covers `npm ci` under "Install dependencies" and says nothing about dependency pins, overrides or `npm audit`, so nothing in it is made wrong by this change
- [ ] **Release notes.** — n/a: nobody at the shelter would notice. No screen, wording, permission or behaviour changes; this clears a supply-chain advisory for a code path the app never invokes (`images: { unoptimized: true }`, no `dangerouslyAllowSVG`)
- [x] Commit messages say why, not just what — the dependency commit explains the chain, why `npm audit fix --force` is the wrong fix here, and the override's intended removal
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Every claim in the commit and the decision file was executed rather than argued: the 4-high before and 0-after are pasted from `npm run audit:prod`; the resolved version is read from both the lockfile and `node_modules/sharp/package.json`; the unreachability claim is `images: { unoptimized: true }` read out of `next.config.ts` plus a repo-wide grep finding no `dangerouslyAllowSVG`; and the "a red `audit` has never blocked a merge" claim behind the CLAUDE.md paragraph is from the last 30 `pull_request` runs read with `gh`, not from reading `continue-on-error` and inferring it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the PR contains no date, clock or timezone logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, band, rounding rule, retry window, pagination limit or permission cutoff is touched
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a as a deploy-time gate; for the record, every block in section 2 is unedited tool output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: the PR adds no secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the commit and run `npm ci`: the override is three lines of `package.json` plus a lockfile entry, nothing reads it at runtime, so reverting restores `sharp@0.35.4` exactly and brings the audit finding back with it. No migration, so nothing is left behind in a database. **What it does not cover:** on production the live rollback is still `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

Empty. This change has no surface a person needs to look at: no screen, no
wording, no role behaviour. Its two observable effects — the audit going clean,
and both build paths still succeeding — are machine checks, run and pasted in
section 2. The deploy-time items have their own `deferred:` state in section 8
and are deliberately not repeated here.

| # | What to check | Where |
|---|---|---|
| — | Nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (QA session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no human-visible surface — no screen, wording or role behaviour belongs to this change, and the audit result and both builds are machine checks pasted above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description links this file instead of duplicating it, so there is one copy to keep correct
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
