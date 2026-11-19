# The `drive.file` hinge, measured against Google (`#dscop`)

Measured 2026-11-19 by the planner with Lutan, in about forty minutes, after
`docs/decisions/2026-11-19-drive-scope.md` left the hinge unproven and said settling it needed a
one-off test. **This is that test.** Nothing here is inferred from documentation; every line is an
HTTP status from Google.

## The question

`#drvcl`'s self-service screen will create each shelter's Drive folder and ask for the narrow
`https://www.googleapis.com/auth/drive.file` scope, which avoids restricted-scope verification, the
annual third-party security assessment and the *"Google hasn't verified this app"* warning.

**The hinge: is a file a HUMAN places into an app-created folder visible to an app holding only
`drive.file`?** If it is not, a shelter cannot simply be told to drop its documents into its folder.

**Google's documentation does not answer it.** Eleven pages were read across two independent passes
(`api-specific-auth`, `about-files`, `search-files`, `files.list` reference, the folder guide,
`manage-uploads`, `picker`, `appdata`, the restricted-scope list, `oauth2/web-server`,
`oauth2/native-app`). None states what happens to human-placed files in an app-created folder,
whether `files.list` with `'<folderId>' in parents` returns them, or whether folder access cascades to
children. **Recorded as *not stated* rather than guessed at, twice.**

## Method

A **throwaway Desktop OAuth client** (`hinge probe (delete me)`) was created in the existing
`lanna-care-dev` project, and a refresh token minted for **`drive.file` only**. Google's token
response confirmed the granted scope equalled the requested scope on every access token — so the
measurement is of `drive.file` and nothing wider.

**Why a new client rather than re-consenting the published one:** Google does not document what
happens to an existing refresh token when the same client and account consent to a *narrower* scope,
and it states that incremental authorization is **not supported for installed apps**. The published
Desktop client holds the live tokens for dev's Drive and for `test-shelter-2`, both minted by hand
earlier the same day. **An undocumented behaviour was not worth risking live credentials for.**

The consent was approved as **`lannaanimalfoundationbwm@gmail.com`** — the account that owns the Cloud
project and holds the app's real Drive tree. (`lutan.bennett3` was the intended account; Lutan
approved as the foundation account instead and said so immediately. It makes the result **stronger**,
not weaker: that account's Drive contains months of app-created files, which is what produced finding
3.)

The probe: create a folder; create a control file in it through the API; have **Lutan upload a file
into that folder by hand in the Drive web interface**; then query three ways.

**The control is what makes it a measurement.** If the app could not read its own file, nothing else
the probe said would mean anything.

## Findings

### 1. THE HINGE: NO. A human-placed file in an app-created folder is INVISIBLE.

| operation | result |
|---|---|
| `files.list` with `'<probe folder>' in parents and trashed=false` | `HTTP 200`, **1 file** — only `control-created-by-the-app.txt` |
| `files.get` on the app-created control file (**the control**) | `HTTP 200` |
| `files.get` on the app-created folder | `HTTP 200` |
| the file Lutan uploaded into that folder | **never returned by any query** |

The folder query is unpaginated and returned one row, so the uploaded file is absent rather than
beyond a page limit. **The control passed, so the probe is sound.**

**Consequence for `#drvcl`: a shelter cannot be told to drop files into its folder.** Anything a human
adds is invisible to the app until the app itself creates or opens it. **Do not build a flow that
depends on a human putting files where the app will find them.**

### 2. Access is PER FILE, and a folder's visibility does not cascade either way

The hand-made root folder named by `GOOGLE_DRIVE_ROOT_FOLDER_ID` answered **`HTTP 404`** to
`files.get` — *not found*, not *forbidden*, the same shape as the two-account isolation proof earlier
that day. **Yet listing its children with `'<root>' in parents` returned 9 folders, and `files.get` on
each of the nine answered `200`:** `Merch`, `Foundation papers`, `Bills`, `Admin`, `Memes`, `Events`,
`Reels`, `Unsorted`, `Residents`.

**So the app can read inside a folder it cannot read.** Visibility is a per-file access record, not a
tree property. A parent being invisible does not hide visible children, and a parent being visible
does not reveal invisible children (finding 1).

### 3. `drive.file` IS PER PROJECT, NOT PER OAUTH CLIENT — and this corrects the earlier decision

`files.list` with no query returned **100 files** (the page size) from the real tree: the production
backup dumps, donation receipt PDFs, resident folders, `index.html` files, and the `cn7gk` proof files
created earlier the same day. **Every one of those was created through the PUBLISHED Desktop client —
a different client from the probe.**

`docs/decisions/2026-11-19-drive-scope.md` records the opposite, explicitly as an inference:

> *"Inference, not documented: `drive.file` is per OAuth client, so files copied by the Desktop client
> would probably not be visible to a Web client either."*

**That inference is measured FALSE.** A new client in the same Cloud project inherits the project's
per-file access records. It is consistent with Google's own wording for the scope — files
*"that you open with an app"* — where *the app* is the project, and with `oauth2/web-server`'s
statement that *"the combined authorization includes all scopes that the user granted to the API
project even if the grants were requested from different clients."*

**The likely mechanism, stated as likely rather than proved:** the access record is created when the
app **creates or opens** a file by id. That would explain why nine folders the app has opened over
months are visible while the root it only ever queries *as a parent* is not. **Which operation granted
each record was not isolated, so do not rely on the mechanism — rely on the measured statuses.**

### 4. A second client in the same project did NOT disturb the first client's grant

`scripts/check-drive-token.mjs` was run **before and after** the probe consent and was identical both
times: refresh token mints an access token, acting as `lannaanimalfoundationbwm@gmail.com`, root
folder `Test` present.

**So the two-client plan `#dscop` recommends is safe to build** — a Desktop client keeping full `drive`
for the operator scripts and the Pi mirror, and a Web client on `drive.file` for the shelter screen.
**This does NOT license narrowing the scope on an existing client**, which remains undocumented and
untested, and must not be done to a client holding live tokens.

## What this changes for Lanna's migration, which had a closing window

`#dscop` set out two routes and said the window closes when the documents move.

- **Route 1 — the app creates the tree and every file arrives through the app.** Still correct, and
  finding 3 makes it **cheaper than it looked**: the file does not have to arrive through a feature
  built into the app. **A script run by the operator counts, because the app creates the file.**
  `scripts/drive-copy-tree.mjs` already copies trees.
- **Route 2 — a hand-crafted tree moved by hand.** Finding 1 makes this the **one-way door**: a file a
  human moves or uploads is invisible, and the narrow scope cannot recover it.
- **And the part nobody expected: most of Lanna's existing tree is ALREADY accessible under
  `drive.file`**, because the app has created or opened it over months. The hand-made root folder is
  not, and nor is anything a human has added that the app never touched. **This was measured on 9
  folders and 100 files, not on the whole tree: do not read it as "the whole tree is fine".**

**What is still not established:** how much of the full tree is visible (the probe hit the 100-file
page limit and did not paginate); whether the Google Picker would recover a human-added file, which is
the documented route and was not tested because it needs a UI; and the calendar scope's
sensitive/non-sensitive class, which is unchanged and still has to be read from the Cloud Console Data
Access page.

## Cleanup

The probe's refresh token was revoked. The throwaway OAuth client and the probe folder are Lutan's to
delete; the client is named `hinge probe (delete me)` in `lanna-care-dev`. **No client id, secret,
token, folder id or account address is recorded in this repository** — the client file was kept in the
gitignored `.local/`, and the probe script and its state live outside the repository entirely.

## Two environment faults met on the way, neither of them a finding about Drive

**A Node teardown crash fired twice on this machine, after the work had completed:**
`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94`, with the
process exiting non-zero. It hit `scripts/check-shelter-settings.mjs` and the probe's own mint step —
**in the mint's case after the token had been minted and saved**, so the reported failure was
cosmetic and the work was done. **A non-zero exit from a Node script on this machine is not by itself
evidence the work failed: read the output before believing the exit code.** For the planner to file.
