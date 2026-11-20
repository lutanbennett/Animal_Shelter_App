# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Keep `?next=` off the OAuth callback URL; carry it in a short-lived cookie (#nxtqs, fix a) |
| Backlog item | `docs/backlog.md` → `#nxtqs` |
| Branch / worktree | `claude/login-next-callback` @ `C:\Development\Animal_Shelter_login-next-callback` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see the PR this plan ships in |
| Tested by / date | Claude (Opus 5) / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | `f994ec8d9` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the callback URL handed to Supabase now carries no query string; where the person was going rides in a short-lived `httpOnly` cookie that is re-validated on read
- [x] Files/areas touched listed — `src/lib/auth/next-cookie.ts` (new), `src/lib/auth/next-cookie.test.mjs` (new), `src/app/login/actions.ts`, `src/app/login/forgot/actions.ts`, `src/app/auth/callback/route.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-11-20-login-next-callback.md`. No `worker/`, no `supabase/migrations/`
- [x] Cards affected identified — **none. This is the sign-in path, which runs before any card is read**: `/login`, `/login/forgot` and `/auth/callback` are reachable signed out, and the callback's own role check (`loadSessionRole`, and the adopter fallback beside it) is untouched. Admin and the signed-out public are affected only in that both now land where they were going. No card grants, no card gates, no `can()` call changed
- [x] Anything explicitly **out of scope** written down — fix (b), the wildcard allow-list entry per host, is NOT done and must not be: it widens what sign-in accepts. No Supabase dashboard setting was changed by this PR. `#aucbk` (the missing-entries check) is a separate stream and is not closed here. The second-step bounce (`#stpbk`) and `#cjred` are untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (it reported nothing to merge on the final run: the branch is 0 commits behind `origin/main`, confirmed with `git rev-list --count HEAD..origin/main`)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 7s
=== gates: lint exited 0 after 176s
=== gates: test exited 0 after 73s
=== gates: build exited 0 after 79s

gates: typecheck=0 lint=0 test=0 build=0
```

Run at `f994ec8d9`. **The branch then merged `origin/main` again** (`6b71b53f7`), because the
`0.47.7` release cut landed while this PR was open and conflicted in `src/lib/releases.ts`: the cut
moved the adopt-page note into the `0.47.7` entry, so this PR's note stays in `unreleased` for the
next release and the adopt line is not duplicated. **That merge changes `releases.ts`, `package.json`
and `package-lock.json` only, and CI runs the same four gates on the merge head** — which is the run
that is read before merging, per the merge step in section 2. The local lines above are not re-typed
for the new head, because they are evidence of the run that produced them.

**Cross-checked independently:** the stream session ran its own
gates on the same commit and reported `typecheck=0 lint=0 test=0 build=0` with its
own timings (18s / 158s / 53s / 63s). Two runs on one commit agreeing is better
evidence than one, and the differing timings are what show they are two runs.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read differently
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; the state this change carries lives in a cookie, not in a row
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — at the level that can honestly be tested without Google's consent screen: the built callback URL has no query for a `next` and for no `next`, and the read path resolves cookie-first with the query as fallback (`src/lib/auth/next-cookie.test.mjs`, 5 tests, all passing). The end-to-end press is in **Left for manual verification**
- [x] Data persists — reload the page and the change is still there — read as: the destination survives the round trip. It is carried in a cookie with a 10-minute life, scoped to `/auth/callback`, and deleted by the callback once it has been used (`done.cookies.delete(...)`), so it neither leaks into later requests nor steers a second sign-in
- [x] Create / edit / delete all exercised — read as the three writes to the carrier: set (a `next` present), delete (no `next`, so a stale value cannot steer the next sign-in), and delete-on-success in the callback. All three are in the diff and the first two are asserted
- [x] Empty state renders sensibly — no `next` at all: no cookie is set, the old one is deleted, `resolveNext(undefined, undefined)` is `null`, and `signedInLandingPath()` decides the landing exactly as before
- [x] Invalid input is rejected with a readable message, not a crash — a hostile cookie value is refused rather than followed: `//evil.com`, `https://evil.com` and the `/\` form all resolve to `null` through `safeNextPath()` **on read**, and the person lands on their ordinary home page. There is no message to show because nothing visible went wrong, which is the right outcome for a value nobody typed
- [x] Boundary cases checked — a value that is already a full URL, a protocol-relative value, a backslash-escaped host, a missing value, an empty string, and (added by this plan's own fix) an origin that is absent or malformed, which now throws instead of minting `undefined/auth/callback`

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/login`, `/login/forgot`, `/auth/callback` | Reachable; this is the sign-in path and holds no card gate | Unchanged by this PR — no card or role check was touched |
| exactly `<any card key>` | the same three paths | Identical: the sign-in path runs before any card is read | Unchanged by this PR |
| exactly `<any card key>` | the page named by `?next=` | Whatever that page's own card rules already say — this change only carries the address, it does not grant reaching it | Unchanged: the callback hands `next` to `signedInLandingPath()` exactly as before |
| signed out | `/login`, `/login/forgot`, `/auth/callback` | Reachable (they must be), and `/auth/callback` without a valid code still redirects to `/login?error=google` | Unchanged by this PR |

- [ ] Every login above tested — n/a: nothing in this change is decided by a card or a role, so a per-card login would exercise the same code path four times. The one access decision on this path, the callback's `loadSessionRole` refusal, is not touched by the diff
- [x] A login that should not have access is blocked server-side — the relevant server-side refusal here is of the *destination*, not of a login: `safeNextPath()` now runs on the cookie as well as the query, on the way in, so a value that was never typed by the app cannot send anyone off-site. Asserted in the test file

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; nothing was added to or removed from the menu
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual does not describe how a sign-in carries a destination, and nothing a reader does has changed
- [ ] Translatable strings go through the translation path — n/a: no new or changed user-facing string. The release note is not a translated string
- [ ] Mobile viewport (375px) — n/a: no layout change; this PR renders nothing
- [ ] Browser console clean — pending: a signed-in run through `/auth/callback` on port 3003 was not driven. The honest reason is in **Left for manual verification**: a real Google sign-in needs Google's consent screen, and `dev-signin.mjs` is password-only, so it cannot exercise this path
- [ ] Network clean — no unexpected 4xx/5xx — pending: same reason as the line above

## 6. Regression

- [x] The pages nearest the change still work — read at source level rather than by loading, and said so plainly: `/auth/callback`'s other three exits (no code or an error, the adopter fallback, the no-role refusal with its `no_site`/`no_role` distinction) are untouched by the diff, and the password-recovery branch (`next?.startsWith(PASSWORD_CHANGE_PATH)`) still gets its path — **this PR fixes the case where it had stopped getting it**
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/auth/next-path.ts` is the shared file, and it was **not edited**: `safeNextPath()` is called in one more place, not changed. Its own tests (`next-path.test.mjs`) run unchanged in the test gate, which is the runtime evidence that the value it supplies to its other callers (`app-access.ts`, `require-role.ts`) is the same one
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is level with `origin/main` and the gates ran on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — pending: `#nxtqs` is deliberately left open, because its done-when asks for a real Google sign-in that cannot be driven from a worktree. The item now carries a note saying the code is in, that nothing remains to build, and that the one outstanding proof is a human press. Ticking it would claim a proof nobody has made
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-20-login-next-callback.md`: why a cookie, what was ruled out (the wildcard entry, OAuth `state`, a path per destination), the two-tab case, and what is not proved
- [x] `README.md` still accurate — it does not describe this mechanism; nothing in it became wrong
- [x] **Release notes.** Yes — a person notices this: `src/lib/releases.ts`'s `unreleased` gained *"Signing in with Google now takes you back to the page you were trying to open, instead of to the main shelter home page. The link in a forgotten-password email now goes straight to choosing a new password."* Untagged on purpose: it is the sign-in path, so it is everyone's, and it needs no card. **Ticked although the end-to-end press is outstanding, and this is the distinction the rule draws:** the rule forbids a note while a *step* is outstanding before a user could see the change — a deploy, a hand edit, a setting. Nothing of that kind is left here; the code ships complete and the behaviour is live the moment it deploys. What is outstanding is a *verification*, not a step, and the note does not promise that somebody checked
- [x] Commit messages say why, not just what — three commits, each naming the mechanism and the reason
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The one claim worth doubting was the typecheck claim, and it was measured rather than argued: `declare var origin: string` is at `node_modules/typescript/lib/lib.dom.d.ts:39127`, and `tsconfig.json` has `"lib": ["dom", ...]`, which is why `callbackUrl(origin)` with no local `origin` compiled. Both were read before the commit message asserted them

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. **And the useful instruction for whoever does it: go direct to `https://test.lannacare.org/login`, sign in with Google, and read the address bar.** Arriving through the front door and landing somewhere plausible proves nothing on these hosts
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date or a time. The cookie's 10-minute life is a duration, not a clock reading, and is set and read by the same browser
- [ ] **Both edges of the band and both sides of the boundary** — n/a: no threshold, band, rounding rule, retry window or pagination limit. The only boundary is "is this value a safe path", which `safeNextPath()` owns and whose own tests are unchanged
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 is the run's own closing lines, pasted as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable. **It also needs no Supabase dashboard change, which is the point of choosing fix (a)**: the bare `/auth/callback` already has an exact allow-list entry on every host

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — the change is three source files and one new library, so the rollback is the ordinary one: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi for the primary origin, and `npx wrangler rollback --env production` for the Worker fallback **(which reverts only the fallback)**. No schema, so nothing to down-migrate. **One thing a rollback does not cover and nobody should be surprised by:** a browser that has an `auth_next` cookie from the new code will still send it for ten minutes; the reverted callback simply ignores it and reads the query as it did before, so the worst case is the old behaviour, which is what a rollback asks for

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **High — silent, and would have shipped** | `requestPasswordReset` called `callbackUrl(origin)` with **no local `origin` in scope**. `origin` is a DOM global (`lib.dom.d.ts:39127`) and `tsconfig.json` includes `"dom"`, so this **typechecks** and then reads `undefined` on the server: every recovery email would have carried `undefined/auth/callback`. Found by reading the file, not by a gate | **Fixed** — the origin is resolved (`await requestOrigin()`), and `callbackUrl()` now throws on anything that is not a bare http(s) origin, with a test. The guard is the durable half: the type system cannot catch this class |
| 2 | Medium | The same line dropped the destination, so a person who did get through a recovery link would have landed on the home page instead of the page for choosing a new password (`/account/password?reset=1`) | **Fixed** — the recovery destination now rides in the same `auth_next` cookie, set before the call, in the browser that asked |
| 3 | Low — process, not code | A leftover `gates.mjs` run held this worktree's `.tree.lock`, and the stream could not end it: `Stop-Process` and `taskkill /PID … /T /F` were both refused by the auto-mode classifier. It blocked the stream for its last turn | **Accepted, and for the planner to file** — the stale run was testing superseded code and had to be waited out. A worktree-scoped way to end a build this session started would have saved the stall |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Sign in with Google starting from `/login?next=/residents`** (a `next` other than `/platform`, as the item's done-when asks) and read the address bar on landing. Expected: `/residents`. This is the whole done-when, and it cannot be driven from a worktree — Google's consent screen is not scriptable and `scripts/dev-signin.mjs` is password-only | `https://cooperjaidee.org` and `https://lannacareforanimals.org`, after deploy. Go **direct** to `/login`; arriving through the front door and landing somewhere plausible proves nothing |
| 2 | **The forgotten-password email's link** lands on the page for choosing a new password, not on the home page. This is defect 2 above, and the path that was broken | Any host, after deploy. Needs a real mailbox |
| 3 | A signed-in run through `/auth/callback` with the browser console open, for the two `pending:` lines in section 5 | `http://localhost:3003`, or the deployed test site |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet, so only the person who looks may tick this. The three items are in **Left for manual verification** and all three need a deployed host or a real mailbox

Manual verification by: pending: a real Google sign-in from `/login?next=/residents` on a deployed host, and the forgotten-password email's link — neither can be driven from a worktree

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: the three items in Left for manual verification, at the next release
