# Receipt PDF attached to a Gmail draft: what the PC route costs (2026-11-09)

Stream `receipt-attach-phone`, item `#pvpxz`. **An assessment, not a build. No scope, client or credential was touched.**

## What was built (the phone half)
- `navigator.share()` now passes `title` = the existing subject and `text` = the existing body, with the file. Gmail on Android maps `title` to the subject and `text` to the body. The PDF really is attached on this path, so "is attached" is true there.
- The `mailto:` body used the same "is attached" wording and nothing can be attached to a `mailto:` link. It now uses `emailBodyNoFile` ("Your receipt number is …"). `emailHint` now says to use Share on a phone.
- Thai counterparts added and marked UNREVIEWED (`#y1dqu`).

## The Google question
**Route:** the Gmail API `users.drafts.create` with a MIME message carrying the PDF. It needs `gmail.compose` (or broader).

**Findings, with their source quality:**
- `gmail.compose` is classed as a **restricted** scope. Sources agree: Nylas, Unipile, EmailEngine, GMass. **All are secondary, and several sell a workaround.** Google's own scope page and the Gmail API policy page were not read directly here. Confirm there before acting.
- A restricted scope on a **published** app triggers verification plus an annual third-party security assessment (CASA Tier 2). Reports say it applies when restricted data is stored or transmitted through a server. A server-side draft creation (this app is server-side) would be in that category. One thread suggests a purely client-side tool may escape it; not confirmed.
- **Cost reported:** wildly inconsistent. About $500/yr at the low end; $8,000–$75,000 for an assessor at the high end, and it **renews yearly**. Time: weeks to months.
- **Our client:** Drive runs on the Desktop client "Lanna Care Drive Access" in project `lanna-care-dev` (`docs/google-cloud-inventory.md`). The consent screen belongs to the **project**, not the client. The Drive integration was moved to Published on 2026-09-25 to escape the 7-day Testing expiry. Adding a restricted scope to that project's consent screen would put the published app back through review, and until it passes would risk breaking Drive for every environment. **That is the finding that matters, more than the button.** (Not verified against the live console: reading only.)
- **The way round that costs nothing:** a separate Google Cloud project for Gmail, left in Testing with the Director as a test user. No verification, but refresh tokens expire after 7 days, so she would re-consent weekly. That is exactly the failure that broke Drive on 2026-09-25.

## Conclusion
The PC half **breaks the zero-ongoing-cost rule** if done properly (annual paid assessment, if CASA applies), or **breaks the Director's workflow** if done free (weekly re-consent). It would also put the Drive client at risk unless isolated in its own project. **Not recommended now.** The PC route stays as it is: Download, then Email draft, attach by hand. The planner should put it to Lutan only if he wants to spend money or accept weekly re-consent.
