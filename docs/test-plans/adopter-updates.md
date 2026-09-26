# Feature test plan

## Header

| | |
|---|---|
| Feature | Adoption updates: hub card, section, add / correct / delete, photos tagged with their update and showing where they came from (feature half of `0097`) |
| Backlog item | `docs/backlog.md` → "Record updates from adopters on an adopted resident" (Lutan, 2026-09-26, with the "keep each photo tagged with its update" addition) |
| Branch / worktree | `claude/adopter-updates` @ `C:\Development\Animal_Shelter_adopter-updates` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | #162 |
| Tested by / date | Claude (adopter-updates session), 2026-09-27, signed in as the dev test user (admin) in the browser pane |
| Carries a migration? | no — builds on `0097` (#158), applied to dev |
| Tested at SHA | browser checks ran on the tree committed as `d736e66` (which includes the "saved" hint fix); gates ran on `9824601`, that plus the merge of `main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: an adopted resident's hub gets an Adoption updates card and section where staff record news from the adopter (date, sender preselected from the Adopt placement's carer, LINE / Facebook / email / visit, a note and photos), and every photo an adopter sent is tagged with its update and says who sent it, when and how wherever it appears
- [x] Files/areas touched listed: new `src/app/residents/[id]/adoption-updates/` (actions, form, delete control, shared page, `new/` and `[updateId]/edit/` routes), new `src/lib/adoption-updates/` (channels, roles, `RESIDENT_PHOTO_SELECT`, sender loader); changed `src/app/api/residents/[id]/photos/route.ts` (optional `adoptionUpdateId`), `src/lib/google/drive.ts` (Adoption updates folder), `src/app/residents/[id]/[section]/page.tsx` (new section, shared select), `ResidentHub.tsx` + hub `page.tsx` (card), `edit/page.tsx` (shared select), `src/components/PhotoGallery.tsx` (provenance, filter), `PhotoUploader.tsx` (upload helper exported), `hub-icons.ts`, `src/lib/archive/resident-record.ts` + `resident-index-html.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/`. No `worker/`, no migration
- [x] Roles affected identified: admin, management and staff add / correct / delete updates; vet and volunteer read them (volunteers can still add ordinary photos); signed-out public unaffected
- [x] Anything explicitly **out of scope** written down: the public "Happy endings" card on `/adopt` (the item's "ask first" follow-on — anon has no access to `adoption_updates`); a Thai manual (the manual is English-only, `src/lib/manual/` has no `th.ts`); the residents list itself is unchanged — the manual tells staff to search under Everywhere

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (first "Already up to date"; re-run after a machine restart brought in #161, `0098_status_alerts.sql`, with no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed, run after the second sync:

```
=== gates: build exited 0 after 306s

gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR (#162): check, migration-numbers and test-plan all passed on d2933ea

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0097` shipped in #158
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (`0097` was already applied to dev)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; existing untagged photos still show their category caption on the Photos tab (Panda's 45)
- [ ] Constraints and defaults exercised against real rows in a harness — n/a: no migration. `0097`'s harness was re-run for this feature's role rules, see §4
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration in this PR; `0097` must be on production before this deploys (§8)

## 4. Functional checks

All on dev in the browser pane. Photos were real PNGs drawn on a canvas in the page and attached to the form's file input, so they went through the route's magic-byte check and Drive as any upload does.

- [x] Happy path works end to end: on Panda (R-0002, adopted by "Sylvia and Estella", since returned) Add update preselected Sylvia and Estella; saved with LINE, a note and two photos; both uploaded one after the other and the page moved to the section, which listed the update with both photos captioned "Sent by Sylvia and Estella · 27 Sep 2026 · LINE"
- [x] Data persists: after reloads, `adoption_updates` held the row (`channel` `line`, `sender_contact_id` the carer, `created_by` the signed-in login) and both `attachments` rows had `adoption_update_id` set, `sub_folder` `20260927`, `date_taken` `2026-09-27`
- [x] Photos tab shows the provenance: chips "All (47) · Taken by the shelter (45) · Sent by adopters (2)"; Sent by adopters showed only the two, captioned; opening one showed "Sent by Sylvia and Estella · 27 Sep 2026 · LINE · See the update", linking to the update on the section
- [x] Create / edit / delete all exercised: create (above); Edit reopened the update with every field as saved and switching to Facebook stuck; a second update with one photo was deleted — the confirm read "Delete this update and its photo?", and afterwards neither the update nor its attachment row was left
- [x] Empty state renders sensibly: R-0077 (adopted now, no carer) shows "No updates yet…" and no "not with an adopter" line; Panda (returned) shows "This resident is not with an adopter now…" above its updates
- [x] Invalid input is rejected with a readable message: a never-adopted resident (Summer) gets no hub card, and its `/adoption-updates/new` URL says "This resident has never been adopted, so there is no adopter to hear from." — the same check `saveAdoptionUpdate` makes before writing
- [x] Boundary cases checked: an Adopt placement with no carer preselects "Not recorded" (R-0077); a photo with no sender recorded, or for a vet who cannot read contacts, reads "Sent by the adopter" (code path; `sender` null); the date input's `max` is today and the action refuses a future date; an oversized file is refused before sending (`MAX_UPLOAD_BYTES`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | card, section, add / edit / delete | everything | as expected (dev test user, admin) |
| management | same as admin | same as admin | not signed in as this role; database side proven by the harness (A6 management edits); left for manual verification |
| staff | same as admin | same as admin | not signed in as this role; harness A1 staff writes; left for manual verification |
| vet | card, section (read) | reads updates, no Add / Edit / Delete; sender may read "the adopter" | not signed in as this role; harness A7 vet reads but cannot edit; left for manual verification |
| volunteer | card, section (read), Photos | reads, no Add / Edit / Delete | not signed in as this role; harness A2 volunteer reads, cannot write an update; left for manual verification |
| signed out | any of the pages | redirected to `/login` | as expected: `/residents/…` redirected to `/login?next=…` before sign-in |

- [ ] Every role above tested — n/a: only admin and signed-out were available in the browser pane; the other roles are in Left for manual verification
- [x] A role that should not have access is blocked server-side: both actions check `ADOPTION_UPDATE_ROLES` before writing, and the table's RLS refuses the rest. `scripts/check-adoption-updates.mjs` (rolled back, dev) was re-run: as committed it now stops at its first line, `A0 existing attachments came out tagged: 2` — a one-off "the migration tagged no existing photo" check that this feature's test photos make false (see Defects). A scratch copy with only that line relaxed ran every role assertion:

```
HARNESS-OK 0097 twice | A0 no existing photo tagged, one record_attachment | A1 staff writes, created_by forced to caller, channel sms / LINE / empty refused | A2 volunteer reads, cannot write an update, tags a photo; photo reaches sender, date, channel in one join; first photo still becomes profile | A3 six named arguments still resolve, untagged | A4 function refuses another resident's update and a non-resident owner | A5 composite FK and check hold for direct writes | A6 delete refused while photos point at it, allowed once untagged; management edits | A7 vet reads but cannot edit, anon refused on table and function
```

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; the section is reached from the hub card like every other hub section
- [x] Manual updated (`src/lib/manual/en.ts`): a hub step for the card, a new Residents topic "Adoption updates" (including searching under Everywhere), and a Photos step for the captions and filter
- [ ] Translatable strings go through the translation path — n/a: update notes are staff records of what an adopter said, not public text, so there is no translation row; UI strings are in both dictionaries and the section rendered in Thai (Buddhist-era date, Thai channel badge text where translated)
- [x] Mobile viewport (375px) — the section at 375 px: header, note, action links and two-column photo grid fit with no horizontal scroll
- [x] Browser console clean — only HMR / Fast Refresh / React DevTools lines
- [x] Network clean — the dev server log's only error line was "The destination stream closed early", from navigating away mid-render, not a request of this feature

## 6. Regression

- [x] The pages nearest the change still work: Panda's hub (every card), the Photos tab with 45 untagged photos (category captions unchanged), the Photos uploader still requiring a folder, the section pages loaded after the `[section]` change
- [x] Shared files checked from a second page by loading it: `PhotoGallery` on the Photos tab and inside each update; `PhotoUploader` on the Photos tab (its upload helper was extracted); both dictionaries by switching the section to Thai and back
- [x] Nothing merged from `main` during `sync` was broken by this branch: the second sync brought in only the `0098` schema PR (a migration, a script and its test plan — no app code), and the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated ("Adoption updates: the feature") — where the section shows for a returned resident, and how provenance renders on the Photos tab
- [x] `README.md` still accurate (it does not list hub sections)
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for adoption updates, written for a shelter user
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the folder (`sub_folder` `20260927`), the tag, the delete taking its photo, the preselection and the returned-resident line were all observed on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan
- [ ] Timezone-sensitive behaviour proved — n/a: the only date is `received_on`, a date input defaulting to `todayIso()` (fixed to Asia/Bangkok) and stored as a `date`; nothing is computed across it
- [ ] For a boundary or banding change, both edges covered — n/a: no band or threshold changed
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the harness line; the gates lines)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration here, but this code reads `0097` (the table, `attachments.adoption_update_id` and the seven-argument `record_attachment`), so `0097` must be applied to production before this deploys — deferred: release manager to confirm it is
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR; see above for `0097`

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` removes the card, section and captions together; `0097` stays (additive; the old photo route works against it unchanged). Updates and tagged photos recorded meanwhile stay in the tables and Drive and reappear on redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | "The update is saved…" hint showed while photos were still uploading | fixed: shown only once saving has finished |
| 2 | low | `scripts/check-adoption-updates.mjs` fails its A0 line on dev now that tagged photos exist — a migration-time assumption about data, not a feature fault | accepted: the harness is the schema PR's record of 0097; its role assertions were re-run from a scratch copy (§4) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As **staff** (or management): the card's Add update, the form's preselected adopter, saving with a photo from a phone, and Delete | a resident adopted with a carer, on dev |
| 2 | As **volunteer** and **vet**: the card and section show, with no Add / Edit / Delete; a vet sees "Sent by the adopter" if contacts are hidden from them | same resident |
| 3 | The photos landed in `Residents/Panda (R-0002)/Adoption updates/20260927/` in the dev Drive | dev Google Drive |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (adopter-updates session)  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items await Lutan

Manual verification by: pending: the three items in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (#162 description)
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open

Result: pass with accepted defects

Release manager acknowledgement: pending
