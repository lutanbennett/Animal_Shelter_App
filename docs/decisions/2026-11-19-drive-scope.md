# Which Google Drive scope the self-service connect screen asks for (#dscop)

Read on 2026-11-19. Documentation URLs are Google's own; none showed a last-updated date, so the
date is the day they were fetched. **Nothing was tested against Google (no second client, no trial
consent): the brief asked for documentation and our own call sites only.**

## Step zero
Not already decided: no file in `docs/decisions/` covers the scope, and `drive.file` appears in
git history only in the backlog item that filed this. `scripts/google-oauth-setup.mjs:56` asks for
`https://www.googleapis.com/auth/drive` (its Calendar branch asks `calendar.events`). Confirmed.

## What Google's documentation says (deliverable 3)
- `drive` is a **restricted** scope; `drive.file` is **non-sensitive** and is in neither the
  sensitive nor the restricted list.
  (https://developers.google.com/workspace/drive/api/guides/api-specific-auth;
  https://support.google.com/cloud/answer/13464325, which lists `drive` under restricted and not `drive.file`.)
- Restricted scopes need restricted-scope verification, and "If you store or transmit restricted
  scope data on servers" an independent third-party security assessment (CASA, App Defense
  Alliance), **revalidated every year**.
  (https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification;
  https://support.google.com/cloud/answer/13465431.) Verification "can potentially take several weeks".
- **Cost of the assessment: not stated on any page read. Not established.** By Google's description
  it is a recurring third-party bill, so **a hosted self-service screen on full `drive` would break
  the zero-ongoing-cost rule** (`CLAUDE.md`). Do not absorb it and do not propose a paid plan.
- The unverified-app screen appears for sensitive or restricted scopes until verified, and an
  unverified app is capped at 100 new users (https://support.google.com/cloud/answer/7454865).
  Exemptions exist for an app used by a few users personally known to the owner, and for Testing
  status (tester warning screen, user cap, limited refresh-token lifetime; the number of days is not in the pages read).
- Google recommends `drive.file` for "straightforward verification" and says it grants per-file access.

## The hinge (deliverable 5): NOT ESTABLISHED
Is a file a human drags into an app-created folder visible to an app holding `drive.file`?
Google's pages say `drive.file` covers files the app creates or opens, or that the user shares with
it through the Picker. **No page read states what happens to human-placed files in an app-created
folder, whether the app can list that folder's children, or how `files.list` behaves.** Pages read:
api-specific-auth, about-files, manage-uploads, search-files, picker, appdata, and the 13464325
restricted list. One guessed URL (a migrate-to-drive-file guide) returned 404. The planner's
suspicion (not visible) is therefore **unproven from documentation**. Settling it takes a one-off
test with a throwaway Web client; that is an instrument this stream was told not to build, so
**it is the planner's to price.** Until then, design as though the suspicion is TRUE, the safe direction.

## Every code path touching Drive (deliverable 4)
Found by grepping for `googleapis.com/drive`, `drive/v3`, `upload/drive`.

| Path | What it does | Only app-created files? |
|---|---|---|
| `src/lib/google/drive.ts` (the app) | create folder, multipart/resumable upload, move (add/removeParents), list by parent and name, get file | **Not established.** Only the call shapes were read. It creates and moves app-uploaded files, but it also moves and lists folders under a hand-made root and resident folders that predate the app (status and archive moves, `getFile` on stored ids). Under `drive.file` anything hand-made is invisible, so these would break against Lanna's current tree |
| `scripts/pi/drive-mirror.mjs` | lists `'<id>' in parents` from the root folder and downloads everything | **No.** It walks the whole tree, so under a narrow scope it would silently mirror only app-created files. Keep it on a full-scope token |
| `scripts/upload-blood-work.mjs` | reads a human-filled Blood Work inbox, moves files to loaded or no-match | **No.** The inbox is filled by hand. Needs full scope |
| `scripts/lib/connect-shelter-drive.mjs`, `scripts/check-drive-token.mjs` | read a folder by id and `about` to verify a token | Only if the folder is app-created. A hand-made folder id would fail (inferred, not tested) |
| `scripts/drive-copy-tree.mjs`, `drive-partition-tree.mjs`, `drive-sharing.mjs`, `reset-test-data.mjs` | operator scripts: copy, move, list, share | **No.** They act on hand-made trees by design: operator-only, Desktop client, full scope |

Not opened beyond the grep: whatever else calls `drive.ts` (logos, archive PDFs): **not established.**

## Calendar (deliverable 7): NOT ESTABLISHED
https://developers.google.com/workspace/calendar/api/auth does not classify `calendar.events`; it
lists the narrower `calendar.events.owned` and says to choose the narrowest scope. It is not on
Google's restricted list (13464325), so it cannot need the assessment, but whether it is sensitive
(ordinary verification and a warning screen) is not stated in anything read. Read it from the Cloud
Console Data Access page.

## Lanna's position (deliverable 6)
The documents have not moved to the shelter's own account, so the tree can still be created from
scratch. **The window is open until the files are moved by any route other than the future Web
client**; how long that is depends on when Lutan moves them, which is not known to this stream.
1. **The app creates the tree and every file arrives through the app** (the move included). Keeps
   `drive.file` available. Costs a migration feature built into the app.
2. **A hand-crafted tree, moved by hand or by `drive-copy-tree.mjs`.** Closes the door on `drive.file`
   for Lanna at the moment those files land. Inference, not documented: `drive.file` is per OAuth
   client, so files copied by the Desktop client would probably not be visible to a Web client either.

Until the hinge is answered, route 2 is the one that cannot be undone cheaply; route 1 keeps the option.

## Recommendation
- **Two clients** (the planner's guess, now argued from the call sites): the existing **Desktop** client
  keeps full `drive` for the operator's scripts and the Pi mirror, which are not a published app. A new
  **Web** client asks for **`drive.file` only** for the self-service screen, and the screen **creates
  the shelter's folder** rather than asking for an id. That avoids verification, the assessment bill
  and the warning screen.
- **Do not build the consent step until the hinge is tested**: if human-placed files are invisible, a
  shelter cannot simply be told to drop files into its folder.
- **For Lanna:** leave the Desktop token and the existing tree alone; choose route 1 or 2 after the hinge test.
- **Calendar:** put `calendar.events` (or `.owned`) on the Web client and read its class in the console.

## What Lutan must do (nothing before the hinge is settled)
Create a Web OAuth client in the Drive Google project with a redirect URI per environment host, set
its consent screen to the `drive.file` scope only, and fix the product name on the consent screen (`#gcnst`).

## Not established
The assessment price; the refresh-token lifetime in days; the hinge; calendar's class; whether
`drive.ts` callers beyond the grep touch only app-created files; whether a copy made by one client
is visible to another.
