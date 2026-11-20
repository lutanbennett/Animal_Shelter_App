# 2026-11-20 — Three places a second shelter still saw Lanna (#lnlft)

- **Adopt page contact email.** `site_content.contact_email` already existed (0018) and the page already read it; the fault was a `??` fallback to Lanna's gmail. Removed. **With neither a phone nor an email on file, "Book a visit" is not drawn** (both copies of the button). Narrowest change that makes a wrong address impossible; the shelter's own preferred-channel button (LINE etc.) is unaffected, and the page never invites anyone to contact another shelter. No migration.
- **Security string.** The code prompt said "Lanna Animal Care" (not even Lanna's own spelling). Now "this shelter" in en, th and the manual. `totpIssuer()` in `two-step.ts` still names Lanna: it is recorded in the register and is the label inside the authenticator app, so it was left for a separate change.
- **Header badge.** `AppHeader` now reads `shelterNames().shortName` instead of the fixed `t.header.shortName` ("LCA"). The logo image is still Lanna's (not in scope).
- `check-no-lanna-literal.mjs`: 39 recorded, no unrecorded, before the change.
