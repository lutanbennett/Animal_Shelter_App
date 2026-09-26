# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` / `deferred` with the reason.

---

## Header

| | |
|---|---|
| Feature | Contact channels: Facebook Messenger, WhatsApp and X on /admin/website, the public footer and the phone menu; Facebook and Instagram added to the phone menu |
| Backlog item | `docs/backlog.md` → More ways to contact the shelter: Facebook Messenger, WhatsApp and X (Twitter) |
| Branch / worktree | `claude/contact-channels` @ `C:\Development\Animal_Shelter_contact-channels` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | linked from the PR itself |
| Tested by / date | Claude (contact-channels session), 2026-09-26 |
| Carries a migration? | no — reads `0092_contact_channels.sql`, merged in #146 and applied to dev |
| Tested at SHA | `1f91863` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three optional fields (Messenger link, WhatsApp number stored as digits, X link) edited on /admin/website with en/th validation, shown only when set — Messenger and WhatsApp under Contact us in the footer and as chat buttons in the phone menu's Talk to us panel, X with Facebook and Instagram under Follow us in both. Lutan also asked in chat that Messenger and Instagram be included and Instagram be linked alongside Facebook: Instagram already had a field (0080) and a footer link, and now also appears beside Facebook in the phone menu
- [x] Files/areas touched listed: `src/lib/links/validate.ts`, `src/lib/site/content.ts`, `src/app/admin/website/{SiteSettingsForm.tsx,actions.ts}`, `src/app/adopt/{PublicFooter,PublicHeader,PublicNav}.tsx`, new `src/components/{MessengerIcon,WhatsAppIcon,XIcon}.tsx`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`. No migration, no `worker/`
- [x] Roles affected identified: admin (edits the fields on /admin/website); signed-out public and everyone else (sees the links on public pages)
- [x] Out of scope written down: the real handles — every field ships empty until the shelter supplies them. No separate About page exists (About & contact is `#contact`, the footer), so the footer is that page. The /foster, /volunteer, /donate "Get in touch" card still offers email and LINE only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.` at `1f91863`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 333s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — all 3 checks passed on #149 at `3166c5e` (mergeStateStatus CLEAN), seen before merging

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration in this PR; 0092 merged in #146
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR; 0092 was applied to dev with #146
- [ ] Re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints exercised in a rollback harness — n/a: no migration in this PR
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR; 0092 must be on production before this deploys (release manager: it is additive and merged earlier)

## 4. Functional checks

- [x] Happy path works end to end: the validators were run under Node against the real exported functions — `checkWhatsAppNumber("+66 81 234 5678")` and `"+66-81-234-5678"` → `66812345678`; `m.me/lannacare` and `https://www.messenger.com/t/…` accepted; `x.com` and `twitter.com` accepted. Test values were then written to the dev `site_content` row through those same checks (the pasted `+66 81 234 5678` stored as `66812345678`) and the public pages rendered `https://wa.me/66812345678`, `https://m.me/…`, `https://x.com/…` and the Instagram link in the footer and the phone menu. Dev values restored to NULL afterwards. The form save itself is under Left for manual verification
- [x] Data persists — the stored digits were read back from dev after the write and rendered on a fresh page load
- [ ] Create / edit / delete — n/a: optional fields on the site_content singleton; set and clear are covered by the happy path and empty-state checks, and the form round-trip is under Left for manual verification
- [x] Empty state renders sensibly: with all four of instagram_url, messenger_url, whatsapp_number and x_url NULL on dev, the footer showed no Messenger, WhatsApp, Instagram or X entry — only Facebook, which dev has set
- [x] Invalid input is rejected with a readable message: `081 234 5678`, `123`, 16 digits and `+66 abc` → `notInternational` (en "Enter the number with its country code, e.g. +66 81 234 5678 (not 081…).", th equivalent); a facebook.com link in Messenger → `wrongHost`; `http://x.com/…` → `notHttps`; `https://evilx.com/a` → `wrongHost`
- [x] Boundary cases checked: blank/whitespace → not set (null); 7 and 15 digits are the band edges of `^[1-9][0-9]{6,14}$`, with 16 digits and 3 digits refused; leading 0 refused

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/website | edits the new fields | not driven in the browser — see Left for manual verification; the action calls `assertAdminRole()` as before |
| management | /admin/website | refused, as before | unchanged by this PR — n/a |
| staff | /admin/website | refused, as before | unchanged by this PR — n/a |
| vet | /admin/website | refused, as before | unchanged by this PR — n/a |
| volunteer | /admin/website | refused, as before | unchanged by this PR — n/a |
| signed out | public footer and phone menu | sees the links that are set | checked on / at desktop and 375px |

- [ ] Every role above tested — n/a: no access rule changed; the new fields live in the existing admin-only action and on already-public pages
- [ ] A role that should not have access is blocked server-side — n/a: `updateSiteContent` still starts with `assertAdminRole()`, untouched by this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): the Website topic now covers X alongside Facebook and Instagram, and a new step for Messenger and WhatsApp
- [ ] Translatable strings through the translation path — n/a: no translatable content; the new UI strings are in the en and th dictionaries
- [x] Mobile viewport (375px): phone menu shows Talk to us with LINE, Call, Messenger, WhatsApp in a 2×2 grid and a Follow us row with Facebook, Instagram and X icons; no overflow
- [x] Browser console clean — `read_console_messages` returned no errors after loading / at desktop and 375px with the menu opened
- [ ] Network clean — n/a: the change adds only outbound links; no new requests

## 6. Regression

- [x] Nearest pages still work: / (footer at desktop, phone menu at 375px) with LINE, Call, phone, email and visiting hours all rendering as before
- [x] Shared file touched (`manual/en.ts`, dictionaries, `PublicNav.tsx`) checked from a second page — the phone menu renders on / from `PublicHeader`, and the build compiled every route including /manual
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: WhatsApp store-digits-render-link, the host lists, and where each icon landed
- [ ] `README.md` still accurate — n/a: README does not list the site's contact fields
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: admins can add Messenger, WhatsApp and X; where each shows; blanks don't show
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the digits conversion and refusals were run against the exported validator, and the placements were read from the rendered pages

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: no date or threshold band; the WhatsApp 7–15 digit edges are covered in section 4
- [ ] Evidence pasted is the tool's actual output — n/a: the only pasted output is the gates lines, copied as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] Production Supabase ref read and matches — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration here; 0092 (#146) must be applied to production before this deploys
- [ ] Production dry-run — n/a: no migration in this PR
- [ ] Production backup — n/a: no migration in this PR
- [ ] Apply plan — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated — deferred: release manager (Worker rollback reverts this fully; it has no schema of its own)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | WhatsApp in the footer first read "WhatsApp: +66812345678" — unspaced digits, hard to read | fixed: labelled plain "WhatsApp", like Messenger |
| 2 | low | The Facebook hint on /admin/website said the link also showed at the top of every public page, which the redesign removed | fixed: hint names the footer and phone menu |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as an admin, type `+66 81 234 5678` in WhatsApp number, a `https://m.me/…` Messenger link, an `x.com` link and an Instagram link, save; the form shows "Saved" and the WhatsApp box shows `+66812345678` after reload | `/admin/website` → Labels and contact details |
| 2 | Type `081 234 5678` in WhatsApp and a facebook.com link in Messenger: each shows its error under the box and Save is disabled; switch to ไทย and the errors read in Thai | `/admin/website` |
| 3 | On a phone, the WhatsApp and Messenger buttons open a chat with the shelter | phone menu on `/` |
| 4 | Clear the test values again so the site ships empty | `/admin/website` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (contact-channels session)  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the list has four items awaiting Lutan

Manual verification by: pending: Left for manual verification items 1–4 (admin form save, errors in en/th, chat links on a phone, clearing test values)

### Result

- [x] Open defects are either fixed or explicitly accepted above — both found were fixed
- [x] Checklist pasted into the PR — the PR description links `docs/test-plans/contact-channels.md`, which is in its diff
- [ ] Handed to the production release manager — n/a: not yet — handed over with the PR

Result: pass
