# (D) tail B: eleven modules wrapped, five GoTrue modules ruled on, three left unwrapped on purpose

Stream `write-paths-tail-b`, 2026-11-01, the last of stream (D)'s sweep outside `src/app/management/**`.
Authority: `2026-10-31-write-request-wrapper.md` (the mechanism), `2026-11-01-write-paths-admin-sweep.md`
(the pattern, and sections 3 and 6 for the files this one finishes), `2026-11-01-write-paths-tail-a.md`
(section 3, the line this paper draws for GoTrue) and `2026-11-01-write-paths-residents.md` (the redirect shape).

**The outcome.** Of the sixteen modules in the brief, **eleven now go through `runWriteAction()`**, **two are
declared replay-safe** under a new declaration (section 5), and **three are deliberately left unwrapped**
with a written reason each (sections 3 and 4). **Nothing was added to `WRAPPED_WRITE_PATHS`**, so this PR
changes no runtime behaviour: no page is on the list that was not before.

## 1. Step zero: it was not already built

`node scripts/check-wrapped-write-paths.mjs --all` on the branch as cut reported **30 modules unwrapped, 47
addresses blocked, 102 complete (of 149)**, which is the planner's figure and not the 46 and 44 that #1155 and
#1156 each reported from their own branches. All sixteen modules reported `NOT`. `git log -S runWriteAction`
showed only the earlier (C)/(D) work. `RecordRowActions` was already passing a request id to its callers and
`prescriptions` was ignoring it, as #1156's body said (section 2, last bullet).

## 2. What was wrapped (deliverables 1, 2 and 3)

Forty-nine writes in twelve files: `admin/status` (3), `admin/website` (21), `photos/approve` (2) and
`photos/approve/pending-actions` (3), `prescriptions` (3), `procedures/new` (1), `projects` (9), `stocktake` (1),
`upcoming-visits/confirm-actions` (2), `weight` (2), and, from the GoTrue five, `account/password` (2).

Judgements worth not re-deriving:

- **Three shapes, chosen by how the browser calls the action.** A form on `useWriteForm` carries the id in its
  `FormData` and the action reads `writeRequestIdFrom(formData)`; a direct call on `useWriteCall` takes the id as
  its **last** argument; an upload that builds its own `FormData` sets the field by hand with `set()` (not
  `append()`, so a retry cannot send two). Five website uploads and `savePagePhotoAlt` keep their signature and
  take the id from the `FormData`, which left their callers a three-line change each.
- **A redirect is taken after the wrapper returns** (`createWeight`, `saveWeightEdit`, `createPrescription`,
  `updatePrescription`, `changeOwnPassword`): the body returns `{ ok: true, redirectTo }`, so a replay redirects
  too instead of answering "cannot tell".
- **State types gained `ok`, and four direct-call actions lost `undefined`.** `useWriteCall` needs
  `{ ok: boolean; error?: string }`, which `undefined` is not, so `createProcedure` and the five website
  upload-style actions return a plain `ActionResult`. `ProcedureFormState` is kept as an alias because it is
  exported; nothing imports it.
- **One `useWriteCall` per action, never shared across two**, with the one exception the admin sweep named: two
  controls that run the *same* action (Move up and Move down on a donation channel) share one.
- **Two controls were server-rendered forms and had to become client components**, because a server component
  cannot carry a request id: `admin/status` "Check now" (`CheckNowButton.tsx`) and each calendar entry's form
  (`ConfirmEntryForm.tsx`, with `DismissEntryButton.tsx` for the second button, which used `formAction`).
  Both read the same strings from the same places. `confirmCalendarEntry` and `dismissCalendarEntry` used to
  fail **silently**; a failed create now returns the shared "something went wrong" reference sentence.
- **`sendTestAlertNow` had two `runAction` calls, one per branch** (the admin sweep section 8 flagged it). Both
  branches now sit inside **one** claim: the mail cannot be unsent, so a replay must return the stored answer
  and never reach the body.
- **`checkNow` writes no row** (it clears a per-process cache). It is wrapped anyway, because the rule is every
  write reachable at the address and not every harmful one (admin sweep section 6, which is Lutan's to weaken).
- **Writes inside imported helpers, which the check cannot see** (its own named limit): `createVisits()` inserts
  as the admin client and `dismissEvent()` PATCHes Google Calendar. Both were already convergent (`createVisits`
  returns early for an event it has imported; a repeated dismiss sets the same flag), so the claim is a second
  line here, not the only one. `recordPrescription` is the case where the limit bit the other way, below.
- **`recordPrescription` moved out of a `"use server"` module.** It was exported from
  `src/app/prescriptions/actions.ts` for the assistant's prescription card, which made it a *public Server
  Action* and so a second, unclaimed way to write a prescription. It now lives in
  `src/lib/prescriptions/record.ts` (not an action) as `writePrescription(supabase, t, formData)` plus the
  assistant's `recordPrescription(formData)`. The form claims in `createPrescription`; the assistant already
  claims its own id in `assistantAddPrescription`. **That is a crossing outside my folders**: one import line in
  `src/app/assistant/actions.ts` changed from `@/app/prescriptions/actions` to `@/lib/prescriptions/record`. No
  other line of that file changed.
- **The `endPrescriptionToday` handoff is closed.** `RecordRowActions` already calls `endToday(requestId)` and
  the resident tab binds the first two arguments (`endPrescriptionToday.bind(null, id, row.id)`), so adding
  `requestId` as the third parameter was the whole change. Driven in the browser: a prescription was created,
  **End today** pressed, and `write_requests` shows `prescriptions.endToday` finished.

## 3. THE GOTRUE RULING (deliverable 4)

The brief doubted that `claim_write_request()` could cover a GoTrue call at all, and said it had not tried.
**It can, and for some of these it should; it cannot for others, and for two the blocker is not GoTrue.**

**What the claim actually guards.** `claim_write_request()` claims a row in an app-database table as
`auth.uid()` and says "run the body", "return the stored answer" or "cannot tell". It does not know or care
what the body writes. So for a caller who is **signed in**, a GoTrue call inside the body is guarded exactly as
a PostgREST one is: it runs once per request id. Verified, not argued: `account.changeOwnName` was driven in the
browser and `write_requests` holds `{"ok":true}` for it, finished. What the claim cannot do is *undo* GoTrue
(same limit as the Google Calendar call in tail A section 3), and a crash between the claim and the finish
leaves `in_flight`, which says "cannot tell" for a save that may have happened. That is the wrapper's documented
availability cost and is the honest answer here.

**What it cannot do is run with no one signed in.** The function raises `42501` when `auth.uid()` is null and is
revoked from `anon`. Sign-in and password reset happen before a session exists.

Per file:

| File | Writes | Verdict | Why |
|---|---|---|---|
| `account/password/actions.ts` | `changeOwnPassword`, `changeOwnName` (GoTrue `updateUser`, `app_metadata`, `signOut others`) | **Wrapped** | Signed in, so claimable. A replay is **harmful in the misleading sense**: the second `updateUser` is refused with "different from the old password", so a change that *happened* reads as an error, and the current-password proof is re-asked against a password that has already moved. The stored first answer fixes both. The result holds no secret (the new password is input, never output). |
| `login/actions.ts` | `login` (`signInWithPassword`), `signInWithGoogle` | **Outside the wrapper, declared replay-safe** | No session, so no claim is possible. A second run makes a second session and changes nothing in the app database. |
| `login/forgot/actions.ts` | `requestPasswordReset` | **Outside the wrapper, declared replay-safe** | No session. A second run sends a second recovery email, bounded by Supabase's own rate limit, and the reply deliberately does not reveal whether the address exists. |
| `admin/security/verify/actions.ts` | `startTwoStepSetup`, `confirmTwoStep` | **Not wrapped; stays blocking** | **`startTwoStepSetup` returns the TOTP secret to the browser, and `finish_write_request()` stores a wrapped action's whole result in `write_requests.result` for seven days.** A secret must not be stored there. `confirmTwoStep` could be claimed (a code is single-use, so a replay would otherwise read as a wrong code for a step that succeeded) but cannot be driven without a real authenticator, and a dev sign-in is aal1 only. |
| `admin/security/actions.ts` | sixteen: user, role, doctor-link and two-step management | **Not wrapped; stays blocking** | `createUser` and `issueTemporaryPassword` **return the temporary password**, which would be stored for seven days. The other fourteen could be claimed, but the file needs a two-step session to drive and is where an untested change costs most. |

**The line to draw, in one sentence:** wrap a GoTrue write when the person is signed in and the result carries
no secret; declare it replay-safe when no one can be signed in yet and a second run is harmless; leave it blocking
and say why when the wrapper would have to store a credential.

**What unblocks the last two.** Two things, both outside this stream: a way for the wrapper to store a
**redacted** result (an optional `redact` argument to `runWriteAction`, which `finish_write_request` already
receives as plain jsonb), and someone with an authenticator driving the two screens. Until both, `/admin/security`
and `/admin/security/verify` **must not go on `WRAPPED_WRITE_PATHS`**. This is a backlog item, not a decision for
Lutan: nothing about the rule is being weakened, the two modules simply stay unwrapped and the check keeps
reporting them.

**Not driven:** `changeOwnPassword`. It asks for the current password, which `dev-signin.mjs` never prints, and
a recovery session cannot be minted without an email. It is the same wrapper and the same redirect shape as
`createWeight`, which was driven, and the part that differs (the GoTrue calls) is moved verbatim into the body.
That is a weaker thing than driving it and is said here rather than implied.

## 4. `services/desexing/actions.ts`: cannot be made idempotent here

`signUpForDrive` writes as **anon**, on purpose (0233): a signed-in staff member trying the form gets what a
visitor gets. So `claim_write_request()` cannot run. The usual escape, making the row carry the request id as its
own primary key so a replay hits a conflict, **does not work today**: anon's insert grant names nine columns and
`id` is not one of them. A replay would add a second row and take a second place against the drive's capacity.

**Left unwrapped, with a comment at the top of the file.** The fix is a migration (`grant insert (id) to anon`,
then treat a primary-key conflict on the request id as done), and this stream was told to add none. One caveat for
whoever writes it: the `BEFORE INSERT` gate trigger runs *before* the key is checked, so a replay after the last
place was taken would meet "full" instead of the conflict. That is a false error, not a double write, and the
rarest of the three outcomes, but it should be known. **`/services/desexing` must stay off
`WRAPPED_WRITE_PATHS` until that lands.**

## 5. A new declaration, `replay-safe` (deliverable 4)

The check understood one declaration, `// write-requests: read-only -- <why>`, which would have been a **false
statement** for the two sign-in modules (they write: sessions, email). Saying it anyway would have been exactly
the `assistantLookup` mistake the script's header describes. So `scripts/check-wrapped-write-paths.mjs` now also
accepts:

```
// write-requests: replay-safe -- <why a second run does no harm, and why it cannot claim>
```

It is guarded exactly as `read-only` is (a write-shaped call of its own refuses it, and a refused declaration
fails the run) and printed in **its own section on every run**, because it is the stronger claim: this module does
something, and the declaration is that doing it twice is harmless. The header says it is for GoTrue calls made
before a session exists and not for an app-database write (which anyone signed in can claim) and not for a write
whose replay is merely unlikely. The check blocks in CI, so the change was kept to the pattern, the verdict, the
two print sites and the header; its exit codes are unchanged and it still exits 0 on this branch.

## 6. The check, before and after (deliverable 6)

`node scripts/check-wrapped-write-paths.mjs --all`, three measurements, and **which tree each is on matters**
(this is the mistake that left the backlog claiming 60 when it was 30):

| | as cut (this branch only) | after `sync` (merged `main` + this branch, at `6d5a516b`) |
|---|---|---|
| modules unwrapped | 30 → **17** | **3** |
| addresses blocked | 47 → **32** | **3** |
| addresses complete | 102 → **117** (of 149) | **146** (of 149) |

The first column is the brief's own comparison: the planner's 30 / 47 / 102 is on merged `main` at 08:40 UTC, and
the 17 / 32 / 117 is **this branch alone**, so 14 of the 17 were stream 19's `management/**` files and 3 were mine.
Stream 19 merged (#1159) while this PR was open, and `sync` brought it in, so the second column is the first
measurement of the union. **It is still not merged `main`**: it is merged `main` plus this PR, which is the
state the PR will be in once it merges, and it holds only if nothing else lands first.

**The three that remain are mine and on purpose:** `admin/security/actions.ts`, `admin/security/verify/actions.ts`
and `services/desexing/actions.ts` (sections 3 and 4). They block exactly three addresses, `/admin/security`,
`/admin/security/verify` and `/services/desexing`, which **must not be listed**.

**For stream 22, as a fact and not a listing (deliverable 5).** Nothing was added to `WRAPPED_WRITE_PATHS`. On the
merged tree **every address except those three is complete by the check's own output**. The addresses this branch
alone moved from blocked to complete (15): `/account/password`, `/admin/status`, `/login`, `/login/forgot`,
`/login/request`, `/photos/approve`, `/prescriptions/[id]/edit`, `/prescriptions/new`, `/procedures/new`,
`/projects`, `/residents/[id]/[section]`, `/stocktake`, `/upcoming-visits`, `/weight/[id]/edit`, `/weight/new`.
The check is a reachability heuristic over imports and cannot see a write inside an imported helper; the two
helpers that matter here are named in section 2.

## 7. What was driven, and what was not

Driven as Admin on dev, on port 3007, with `requestAnimationFrame` confirmed firing, and each one **confirmed
server-side in `write_requests`** (id arrived, claim finished, stored result as expected): account name, weight
create (stored result carries the redirect), project folder create, status "Check now", stocktake save,
prescription create, **End today**, procedure create, website settings form, and the public-page hide and show
toggle (two presses, two ids).

**The replay proof, on project folders.** The POST for "New folder" was captured and re-sent twice unchanged, as
the Worker would after a failed Pi attempt. Both answered the **stored first result**
(`{"ok":true,"folderId":"a5d95ef1-…"}`). The control: the same request with a **fresh** id reached the body and
was refused with "A folder with that name already exists here." A direct count then found **exactly one** folder
of that name. So the two replays short-circuited before the body and did not merely hit the name constraint.

**Not driven, and why:** the two alert buttons on `/admin/status` (they send mail), calendar-entry confirm and
dismiss (no calendar entries exist on dev, and no calendar is configured), photos to approve (no entry link and
no waiting queue found), the five website uploads and the Drive-backed removals (Drive), the other project
actions, `changeOwnPassword` (section 3), and both `admin/security` pages (aal2, no authenticator). Those are
covered by typecheck, lint, the test suite and the shared mechanism, which is a weaker thing.

## 8. Found, not fixed

- **A shared dev login is a hazard to a stream.** `dev-signin.mjs admin` was re-keyed by another stream's run
  twice during this one, each time returning "signed out because you haven't used the app for a while" on the
  next click. `write_requests` shows `clinics.*` rows under the same login that this stream did not run. Not a bug in either stream; worth a
  line in `CLAUDE.md` that `--cards` with a set unique to the stream avoids it.
- **"A button is shown only if the login's cards let it do that action"** was **not** re-listed for these pages,
  as in the two papers before this one: the stream changed how controls *call*, not whether they are *drawn*.
- **`runUploadAction()` swallows a thrown upload into `processingFailed`**, which is not `saveUnknown`. The id is
  nonetheless kept (a throw skips `useWriteCall`'s release), so a retry reuses it; worth knowing because it looks
  like the opposite.

## 9. The test plan's section 7, and the release note

**`n/a`, and no line in `unreleased`.** Nothing was added to `WRAPPED_WRITE_PATHS`, so every page behaves as it
did, and production is behind on `0292`, so a note would say something is live that cannot be
(`2026-10-11-release-note-truth-rule.md`). The one visible difference, a failed calendar confirm now saying so
instead of doing nothing, is not worth a note on its own while none of this is deployed.
