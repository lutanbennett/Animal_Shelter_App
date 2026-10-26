# Who does what: the Features panel moves to /admin/who-does-what/features

2026-10-26. Lutan, 2026-10-25: the Features section comes off Who does what and becomes a subordinate page reached by one button.

- **Button** sits beside "See every activity (Details)" in the page header, same styling (`featuresLink`, English and Thai).
- **Access is a copy of `details/page.tsx`**: signed-in, then `opensWhoDoesWhat(perms)` or `refuseFor`. The panel's own flags are the ones it had: `canEdit = isAdmin && hasTwoStep()`, `locked = isAdmin && !canEdit`, with the same "verify with your authenticator app" prompt, so a half-authenticated Admin sees it read-only. The server actions are untouched and still hold the real rules.
- **`FeaturesPanel` is unchanged.** Only its caller moved.
- **`features` / `card_features` are still read on Who does what**, because the card board sections Available cards by feature. The new page reads them itself.
- `actions.ts` also revalidates the new path; `check-permission-catalogue.mjs` and `check-phone-width.mjs` list it beside Details.
- No migration; nothing about who may do what changes.
