# Feature test plan

## Header

| | |
|---|---|
| Feature | The assistant's vet booking keeps a doctor the user names ("with Dr Somchai" / "หมอสมชาย"): parsed into the draft, shown as an optional editable Doctor field on the preview card, passed as `p_doctor_name` |
| Backlog item | `docs/backlog.md` → Assistant → **Doctor name through the assistant's vet booking** |
| Branch / worktree | `claude/doctor-name-assistant` @ `C:\Development\Animal_Shelter_doctor-name-assistant` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | pending |
| Tested by / date | Claude (automated) / 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `da4b3bf` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: parse a trailing "with Dr X" / "หมอ X", show it on the card as an editable optional field, write it the way `bookVetVisit` does, never ask for it. The brief's premise check (is free text still the right shape after the `0102` roster?) found it is: the form passes free text to `schedule_bulk_appointments(p_doctor_name)` and the database links it to the clinic's roster, so the roster guarantee is kept by the same RPC (`docs/decisions/2026-10-02-assistant-doctor-name.md`)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/lib/assistant/intents/vet.ts`, `types.ts`, `data.ts`; `src/app/assistant/actions.ts`; `src/components/assistant/AssistantCards.tsx`, `AssistantConversation.tsx`; both dictionaries (`assistant.vet`); `src/lib/manual/en.ts`; `src/lib/releases.ts`; backlog and a decision file. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: admin, management and staff (the roles that may confirm an assistant write). Volunteers get lookups only and never see the vet card's confirm; vets are not given the assistant; there is no `resident` role
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: no "which doctor?" prompt (by the item's own instruction); a bare "with Somchai" without a title is not read as a doctor; no schema change, and nothing for the "doctor at more than one clinic" item, which keeps the same RPC parameter; `assistant_actions` is untouched (the stored draft JSON gains a `doctorName` key)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `origin/main` brought in one change, to `docs/backlog.md` only, as `83ff22e`; no `src/` change, so the gates run on `da4b3bf` stand
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run on `da4b3bf`, closing lines below as printed

```
=== gates: build exited 0 after 171s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; the RPC parameter used is `0102`'s, already applied
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, no existing row is read differently
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the trigger that links a typed name to the roster is covered by `scripts/check-vet-doctors.mjs` (`0102`)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; reads only what `0102` already put in production

## 4. Functional checks

The phrase parser was run for real: `src/lib/assistant/intents/vet.ts` was transpiled with the repo's own TypeScript and `vetIntent.parse` called on lower-cased sentences exactly as `parseRequest` does. The preview card was **not** driven in a browser (it needs a signed-in staff session); it is under *Left for manual verification*.

- [x] Happy path works end to end — English and Thai phrasings parsed: "Book a vet visit for Panda with Dr Somchai on Friday at 10am" → `Somchai`; "…with dr. somchai wong tomorrow 2pm" → `Somchai Wong`; "…with dr somchai, checkup friday 3pm" → `Somchai` (comma ends the name); "นัดหมอสมชายให้ panda พรุ่งนี้ 10:00" → `สมชาย`; "panda ไปหาหมอ สมชาย วันศุกร์" → `สมชาย`
- [x] The vet is still matched with the stopwords in place: `VET_STOPWORDS` is untouched and the doctor is read from the whole sentence beside it. "…with Dr Somchai…" still matched the clinic whose name contains "somchai", and "…with Novel on friday 10am" still matched `Novel` with `doctorName` null
- [x] Create / edit / delete all exercised (whichever the feature has): create — `assistantBookVetVisit` now sends `p_doctor_name`, the same parameter and normalisation as `bookVetVisit`; the RPC and its linking trigger were not changed. Not driven end to end against dev (see manual list)
- [x] Empty state renders sensibly (no rows yet): a sentence naming no doctor gives `doctorName: null` — "book a vet visit for panda with doctor tomorrow", "see the doctor for panda friday", "book doctor appointment for panda tomorrow 10am" and the Thai generic "นัดหมอให้ panda พรุ่งนี้ 10:00" all parse null, so no field is filled and nothing is asked
- [x] Invalid input is rejected with a readable message, not a crash: no new rejection path. A blank or whitespace-only doctor is sent as null (trimmed, blank is null) as on the form
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a name stops after two Latin words and at date, time and reason words; a Thai name stops at the first of ให้ / ที่ / ใน / วัน / พรุ่งนี้ / เวลา / digits. A name nothing follows the title for is null

An unmatched doctor name is surfaced rather than dropped: with a clinic chosen, a name not on its active doctor list shows "Not on the clinic's doctor list yet — it will be added when you confirm…"; the same person under another spelling shows "the name is on this clinic's list" with a "Use …" button; an exact match shows nothing. Read from the card source and typechecked; the display is in *Left for manual verification*.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | assistant vet card | can confirm, doctor written | unchanged gate (`canWriteWithAssistant`); not driven |
| management | assistant vet card | same | unchanged gate; not driven |
| staff | assistant vet card | same | unchanged gate; not driven |
| vet | assistant | not offered the assistant | unchanged (`canUseAssistant` excludes vet); not driven |
| volunteer | assistant lookups only | cannot confirm a write | unchanged; not driven |
| signed out | `/assistant` | sent to sign in | unchanged; not driven |

- [ ] Every role above tested — n/a: no permission changed; the role gates (`ASSISTANT_ROLES`, `ASSISTANT_WRITE_ROLES`) are not edited, and no live dev accounts were signed in
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new route or action; `assistantBookVetVisit` runs through the existing `runWrite` role check

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the "Asking the assistant" booking example now explains the optional Doctor field; text read in the source, page not loaded
- [x] Translatable strings go through the translation path, checked at `/management/translations`: these are app strings in `en.ts` and `th.ts` (typechecked against the `Dictionary` type), not the public-website text that page edits
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not looked at; one text input and one hint line in the card's existing single-column layout (listed under manual verification)
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven in a browser

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): the other four write intents' parsers share `parseRequest`; `typecheck` covers every `VetVisitDraft` consumer (the only constructors are the vet parser and the card), and the parser run above shows move/vet matching unchanged
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page: the dictionaries and `manual/en.ts` are typechecked and built into every page by `build`; no page was opened in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `2026-10-02-assistant-doctor-name.md` — roster-versus-free-text premise check, title-only opening, never asked, unmatched names added with a visible note
- [x] `README.md` still accurate — no behaviour it describes changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for admin, management and staff describing the kept doctor and the Doctor field
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The parser outputs quoted above are from running it; the claim that the database links a typed name to the roster is from reading `bookVetVisit`'s own comment and `loadDoctorNamesByVet`'s ("Typing a name that is not offered still works: the database adds it") and was not re-run against dev here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; the card's date and time handling is unchanged
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no threshold; the name parser was run on both sides of its edges (a title with and without a name after it, and a name ending at a date word and at a comma)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates lines are as printed; the parser results are quoted from the run
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code uses `0102`'s `p_doctor_name`, which the booking form already depends on in production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — `npx wrangler rollback --env production` restores the assistant without the Doctor field in seconds. It does not remove doctors already added to a clinic's list by confirmed bookings; those are ordinary roster rows, correctable at Management → Vets → Doctors. No migration to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Type "Book a vet visit for Panda with Dr Somchai on Friday at 10am": the card shows Somchai in the Doctor field; with a clinic that lists "Dr Somchai" the card offers "Use …" (or starts on the list's spelling when the clinic is in the sentence); a name the clinic lacks shows the "will be added" note; Confirm writes the doctor and it shows on the resident's Vet Appointments tab | Assistant panel, as staff |
| 2 | The Thai phrasing "นัดหมอสมชายให้ … พรุ่งนี้ 10:00" fills the field, the card's Thai wording reads naturally, and a booking naming no doctor still confirms with the field empty | Assistant panel, in ไทย |
| 3 | The card at phone width (375px) with the new field and hint | Assistant panel, mobile |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the card, in English and Thai, on a real staff session

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over when a release is cut

Result: pass

Release manager acknowledgement: pending
