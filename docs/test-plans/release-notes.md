# Feature test plan — release notes register and admin email

## Header

| | |
|---|---|
| Feature | Release notes register (`src/lib/releases.ts`, `/releases` for every signed-in role, seeded with `0.0.1` "Current Baseline Build"), deploy-time release checks and tagging in `scripts/deploy.mjs`, and a major-release email to admins through the Worker's free Cloudflare `send_email` binding, which is guarded so dev never sends |
| Backlog item | `docs/backlog.md` → Admin → "Release notes register, with an email to admins on each major release." |
| Branch / worktree | `claude/release-notes` @ `C:\Development\Animal_Shelter_release-notes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | #62 |
| Tested by / date | Claude (Release notes feature session) / 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | working tree on top of `4c3f284` (origin/main after `sync`), gates re-run on the committed tree; CI covers the tip |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a register, a page every role can read, a version the deploy stamps, and an email to admins on a major release named `[UAT]` / `[Production]`, with dev never sending. Settled with Lutan 2026-09-23: Cloudflare's free verified-address route for the release mail, `--env production` counts as UAT today, and Resend free for Auth SMTP (runbook only)
- [x] Files/areas touched listed: `src/lib/releases.ts`, `src/lib/release-mail.ts`, `src/app/releases/page.tsx`, `src/app/NavLinks.tsx` (one footer entry), `src/lib/i18n/dictionaries/{en,th}.ts` (one key), `src/lib/manual/en.ts`, `worker/index.mjs`, `worker/release-mail.mjs`, `wrangler.jsonc`, `scripts/deploy.mjs`, `package.json` / `package-lock.json` (version only), `README.md`, `docs/email-sending.md`, `docs/decisions.md`, `docs/backlog.md`
- [x] Roles affected identified: every signed-in role reads `/releases`; admins receive the email; signed-out users are redirected to `/login`
- [x] Out of scope written down: the Supabase Auth SMTP setup is Lutan's dashboard and DNS work (`docs/email-sending.md` §2), and the Deployment item stays open. Verifying admin addresses under Email Routing (§1) is also his; an unverified admin is skipped with an error code. No domain onboarding is needed: verified-address sends work with Email Routing alone, per Cloudflare's pricing page (the Email Sending screen asks for Workers Paid, which is not needed). No real email has been sent to anyone. There is no `uat` wrangler environment yet (its own backlog item). Per-entry deploy dates per environment are not stored; Cloudflare's deployment list has them

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` (`4c3f284`, PR #56) before starting
- [x] `npm run typecheck` — clean, exit 0
- [x] `npm run lint` — clean, exit 0
- [x] `npm run build` — succeeds, exit 0
- [x] CI green on the PR — `check` (typecheck, lint, build) passed on #62 at `764c90e`; `test-plan` is red by design, pending manual verification

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the deploy script only reads `user_roles` and the Auth admin API
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end, split at the one point that can't run locally. The page renders at `/releases` on `next dev`. The Worker relay (`handleReleaseRequest`, the real exported function, with a fake `send` binding and Node's `crypto.timingSafeEqual` standing in for Workers') returns the version from `GET /api/releases/current`. With `RELEASE_MAIL_ENV=UAT` it sent one message to a verified address with subject `[UAT] …` and From `Lanna Care UAT <releases@lannacare.org>`, deduplicated a repeated address, and skipped an unverified one with `E_RECIPIENT_NOT_ALLOWED` while still sending the rest. `deploy.mjs`'s admin lookup ran against the dev database and found both dev admins. The real Cloudflare send can only happen on a deploy, which is listed under manual verification
- [ ] Data persists — n/a: nothing is written at runtime; the register is a checked-in file
- [ ] Create / edit / delete all exercised — n/a: nothing is edited in the app; entries are edited in the file through a PR
- [x] Empty state renders sensibly: with `unreleased` empty the "Not released yet" block is absent. With one temporary line, which was reverted afterwards, it rendered on dev above `0.0.1`
- [x] Invalid input is rejected with a readable message, not a crash. The relay returns 401 for a wrong or missing bearer, 405 for GET on `/mail`, 400 for a body missing fields, and 400 above 50 recipients. `/current` on the live site (before this ships) redirects to login, and `liveVersion()` treats the non-JSON answer as "unknown"
- [x] Boundary cases checked: `compareVersions("0.10.0","0.9.1")` is 1, so numbering is numeric and not by string. `majorReleasesSince(null)` considers only the newest release, so a first deploy can't mail the whole history. The mail HTML escapes `<`, `>` and `&` in notes

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, nav footer entry | page and entry visible | seen, signed in as admin on dev |
| staff | `/releases` | page visible (no role check in the page; the proxy requires only sign-in) | not signed in as staff; see manual list |
| vet | `/releases` | as staff | not signed in as vet; see manual list |
| volunteer | `/releases` | as staff | not signed in as volunteer; see manual list |
| resident | — | no login role of that name exists | n/a |
| signed out | `/releases`, `/api/releases/current` on `next dev` | 307 to `/login?next=…` | 307 to `/login?next=%2Freleases`, confirmed with curl |

- [ ] Every role above tested — n/a: only admin was signed in; the non-admin roles are listed under manual verification rather than claimed
- [x] A role that should not have access is blocked server-side: signed out gets 307 from the proxy. On the Worker, `/api/releases/mail` refuses anything without the service-role bearer (401, exercised against the real handler)

## 5. Cross-cutting

- [x] Nav entry correct: "Release notes" in the footer group between User manual and Change password, for every role, active on `/releases`. It is the one entry added and nothing is reordered, so the queued nav-rework can reorder around it
- [x] Manual updated: new topic "What changed: release notes" under Getting started, and the navigation topic lists it. Rendered at `/manual#release-notes`
- [ ] Translatable strings through `/management/translations` — n/a: that page queues database content; the one UI string (the nav label) is in the `en`/`th` dictionaries, and the Thai label "บันทึกการเปลี่ยนแปลง" was seen in the nav with the locale switched to Thai (then switched back). Notes and page text are English only, like the manual
- [x] Mobile viewport (375px): no horizontal overflow (`scrollWidth` 375), and the badges wrap under the title
- [x] Browser console clean on `/releases` and `/manual`
- [ ] Network clean — n/a: the page is server-rendered from a static file and makes no requests of its own beyond the app shell

## 6. Regression

- [x] Nearest pages still work: `/manual` (the topic and the rest of Getting started), and the nav on `/releases` and `/management/translations`
- [x] Shared file touched (`NavLinks.tsx`, `manual/en.ts`) checked from a second, unrelated page: `/management/translations` rendered with the new footer entry
- [x] Nothing merged from `main` during `sync` was broken: the only merge was docs and the test-plan checker
- [x] Worker entry still bundles with the new import and binding: `npm run opennext:build` exit 0, then `wrangler deploy --dry-run` exit 0 for both environments. Production lists `env.RELEASE_MAIL (unrestricted) Send Email`, `RELEASE_MAIL_ENV ("UAT")` and `RELEASE_MAIL_FROM`; test lists no mail binding and `RELEASE_MAIL_ENV ("")`. Both bundles contain `/api/releases/current` and `version: "0.0.1"`. OpenNext printed two "Failed to copy" lines for `color-string` and `data-uri-to-buffer` (react-pdf dependencies this change does not touch), and the build still exited 0

## 7. Documentation

- [x] Backlog item ticked on this branch and moved under Completed → Admin. The SMTP Deployment item stays open (it needs Lutan's Resend account)
- [x] Design choices appended to `docs/decisions.md`, dated: "Release notes register (2026-09-23)" covers (a), (b), (c), the versioning scheme, the sender, the guard, UAT today, the two domains and the SMTP split
- [x] `README.md` accurate: deploy step 6 points to the SMTP runbook, and the new step 7 covers releases and the email
- [x] Commit messages say why
- [x] Claims measured, not reasoned: the DNS state of `lannacare.org` was read over DNS-over-HTTPS (root SPF `include:_spf.mx.cloudflare.net`, Cloudflare MX, no DMARC). The `app_users` view returning nothing to the service role was measured (0 rows, against 6 in `user_roles`), and the deploy script was fixed because of it. Cloudflare's free-tier rule ("Sends to verified destination addresses are free") and the `cf-bounce` subdomain records come from Cloudflare's docs pages read on 2026-09-23, not from memory. Resend's record names in the runbook are marked "as of this writing — copy from their screen", because they were not read from a live Resend account

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: not deployed by this session; the release manager deploys
- [ ] Deployed SHA matches the tested SHA — n/a: not deployed by this session

### On the deployed build

- [ ] Deployed to test — n/a: not deployed by this session; listed under manual verification
- [ ] Smoke-tested on `test.lannacare.org` — n/a: not deployed by this session; listed under manual verification
- [ ] Timezone-sensitive behaviour — n/a: dates are stored and shown as fixed `YYYY-MM-DD` strings formatted in UTC; nothing derives "today"
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes. `/api/releases/*` is answered before the edge cache and is never cached

### Deploy safety

- [ ] Production ref line read — n/a: not deployed by this session
- [ ] `strip-baked-env` line seen — n/a: not deployed by this session
- [ ] New secret/env var exists in production — n/a: no new secret. The new vars (`RELEASE_MAIL_ENV`, `RELEASE_MAIL_FROM`) and the `send_email` binding are in `wrangler.jsonc` and ship with the deploy

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production `--dry-run` — n/a: no migration
- [ ] Fresh backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` reverts the Worker, with no schema involved. An email already sent can't be recalled, which is why the first send reaches only verified addresses (today only Lutan's)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `deploy.mjs` looked up admins through the `app_users` view, which is gated on `current_user_role()` and returns nothing to the service role, so no admin would ever have been mailed | fixed: `user_roles` plus the Auth admin API, verified against dev (2 admins found) |
| 2 | low | the disabled-relay reason blamed `RELEASE_MAIL_ENV` even when the missing piece was the binding | fixed: the reason names which of env, binding or From is missing |

## Left for manual verification

Checked by a person before merge:

| # | What to check | Where | Result |
|---|---|---|---|
| 1 | The Cloudflare side of release mail is in place: Email Routing enabled on `lannacare.org` and Lutan's Gmail a **Verified** destination address | Cloudflare → Email Routing → Destination addresses | seen with Lutan in his Chrome 2026-09-23 |
| 2 | Password reset goes out through Resend: `lannacare.org` verified in Resend, Supabase SMTP saved, a real **Forgot password?** mail received | Resend, Supabase, Lutan's Gmail | Lutan received it 2026-09-23 |

**Deferred to the release deploy, accepted by Lutan 2026-09-23.** These can only run after this PR merges and deploys. They belong to the v0.0.1 and next-release deploys, and the release manager should carry them into that smoke test:

| # | What to check | Where |
|---|---|---|
| D1 | The first **major**-release deploy with `--env production` prints `release mail … [UAT]: sent 1`, and the mail arrives in Lutan's Gmail with `[UAT]` in the subject from `releases@lannacare.org`. If it fails with `E_SENDER_DOMAIN_NOT_AVAILABLE`, the fallback is Resend's API (`docs/decisions.md`), not Workers Paid | `lannacare.org`, Lutan's inbox |
| D2 | `npm run deploy:test` prints `[off]` for a major release (dev never sends), and `https://test.lannacare.org/api/releases/current` answers `{"version":"…"}` | `test.lannacare.org` |
| D3 | `/releases` opens for a staff, vet and volunteer login | `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Release notes feature session)  Date: 2026-09-23

### Manual verification

- [x] Every item in the manual list was checked by a person (1 and 2); D1–D3 are deferred to the release deploy with Lutan's acceptance

Manual verification by: Lutan Bennett  Date: 2026-09-23

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (#62 description)
- [ ] Handed to the production release manager — n/a: not yet — handed over with the PR

Result: pass

Lutan asked to mark this tested and passed and to merge (2026-09-23), accepting D1–D3 as release-deploy checks.

Release manager acknowledgement: Claude (release manager session) — shipped in v0.0.1 (dfb01c3), Worker a9128bb6, verified live  Date: 2026-09-23
