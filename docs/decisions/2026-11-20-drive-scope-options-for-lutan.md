# The Drive scope, as one decision for Lutan (`#dscop`, deliverables 4 to 7)

Written 2026-11-20. The research is in two earlier files and is **not repeated**:
`2026-11-19-drive-scope.md` (what Google says, every code path) and
`2026-11-19-drive-file-hinge-proved.md` (measured against Google). This file turns them into a
decision and records the switch-over sequence.

## Step zero, recorded as a finding for the planner
A filename grep (`docs/decisions/ | grep drive|scope|oauth`) made this look settled; the stream
first stopped on that reading. The brief was then corrected: `scripts/google-oauth-setup.mjs:79`
still asks for the full `auth/drive` scope, so the item is live. **But the premise that no decision
file existed was also wrong**: the two files above were already on `main` (PR #1727 merged the
second). What was missing was the decision laid out for Lutan, the switch-over sequence and the tick.
This stream added those, and re-verified nothing against Google (no setting was touched).

## The three options, in plain English

**A. Two apps: keep full access for our own tools, use narrow access for the shelter screen.**
(Recommended.)
- Cost: **nothing recurring.** No yearly security assessment, no "Google hasn't verified this app"
  warning for a director.
- What it forbids: the app can only see files **it created or opened itself**. A file someone drops
  into a folder by hand is invisible to the app. The shelter screen must create the folder and files
  through the app; it cannot be told "put your documents here".
- Work: a new Web client in the existing Google project, then the screen (`#drvcl`) asks for the
  narrow scope. The existing Desktop client is not touched.

**B. Keep full access for everyone.**
- Cost: Google treats full Drive access as *restricted*. By Google's own description a public app
  needs a **yearly third-party security assessment**. Its price is **not established** (no page read
  states it). That is a recurring bill, so it **breaks the zero-ongoing-cost rule**; it is named
  here, not recommended.
- Also: until verified, every director sees the unverified-app warning and a 100-new-user cap.
- Work: none in code; a lot of paperwork and a bill.

**C. Do nothing yet.**
- Cost: nothing now. But `#drvcl` cannot be built honestly, and Lanna's own move to its own Drive
  has a closing window: files a human moves or uploads by hand become invisible to the narrow scope
  for good. Moving them with the operator script (`scripts/drive-copy-tree.mjs`) keeps option A open.

**Recommendation: A.** It is the only option with no bill and no warning screen.

## Switch-over sequence (deliverable 6) — NOT done in this PR, and the scope is unchanged
Changing the scope on an existing client is **undocumented and untested** and the earlier file says
not to do it to a client holding live tokens. So the order is:
1. Lutan creates a **new Web OAuth client** in the existing Drive Google project, a redirect URI per
   environment host, consent screen limited to the narrow scope. (The consent screen is verified:
   edit nothing on it without reading `#pltfd` and `docs/domain-checklist.md` P3 first.)
2. `#drvcl` builds the screen on that client: it **creates** the shelter's folder.
3. **Nothing breaks for Lanna**: the Desktop client keeps its token and full scope, so uploads,
   the Pi mirror and the operator scripts continue. No one re-consents.
4. Only a shelter that connects through the new screen consents, once, to the narrow scope. Existing
   refresh tokens are **never** invalidated. Narrowing the Desktop client, if ever wanted, is its own
   piece of work: every environment's token would need re-minting.
5. Lanna's move: use route 1 (the app or the operator script creates every file).

## Not established
The assessment price and elapsed time; the Desktop token's lifetime in days; whether the Google
Picker would recover a human-added file (untested); how much of Lanna's full tree is visible under
the narrow scope (the probe saw 100 files, no pagination); Calendar's scope class (read it from the
Cloud Console Data Access page). **Nothing was re-read from Google's documentation in this PR**, so
the page citations are those in the 2026-11-19 file, dated 2026-11-19.

## For the planner to file
Nothing new beyond the above; `#drvcl` and `#gidty` are unblocked by this answer. The doc-read cost
is moot: this stream used no Google pages.
