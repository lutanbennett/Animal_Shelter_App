# Access wording, pile (B): which "Admin" sentences are true, the five Drive messages, four key renames

2026-11-02, stream `access-wording-pile-b`. Copy and key names only: no `can()` call, policy, card, catalogue,
`can.ts` or migration changed, and Admin was not given cards. Follows `2026-11-01-access-wording-roles.md`.

## 1. The fourteen Admin sentences (backlog lines 767, 769, 855, 892, 966, 996, 997, 1156, 1665, 1847, 1896, 1898, 1902, 1905)

Line numbers had moved (now ~773/775, 861, 898, 972/975, 1005/1006, 1164, 1673, 1855, 1905-1914); each was found by its text.
Admin is outside the card system (`CLAUDE.md`), so "only Admin" is true wherever the thing is Admin's alone. **All fourteen were kept; none is an ordinary card activity.**

| Sentence | Verdict | Settled by |
|---|---|---|
| `homeView.intro` / `homeView.readOnly` (only an Admin chooses home tiles) | true, kept | `src/app/admin/who-does-what/actions.ts:45,326` (`hasAdminRole`); `page.tsx:44` |
| `cardsView.readOnly` (only an Admin gives/removes cards) | true, kept | same file, `actions.ts:45` |
| `cardsView.noApproversNow` ("Admin does not count") | true, kept: Admin holds no cards | `CLAUDE.md` |
| `menuIntro` ("Admin always keeps the menu") | true, kept: page shows the toggle locked for Admin | `who-does-what/page.tsx:260-265` |
| `edit.adminOnly` (only an Admin changes who does what) | true, kept | `actions.ts:45` |
| fixed rules "Admin can do everything, always" / "Security is Admin's alone" | true, kept | `CLAUDE.md` Admin settlement |
| `stocktaking.errors.adminOnly` | true, kept | `admin/stocktaking/actions.ts:36` |
| `assistantLog` "Admin only" and privacy "Only an Admin can read other people's requests" | true, kept | `src/app/admin/assistant/page.tsx:31` (`requireAdminUser`) |
| `login.*` / `security.twoStep.*` ("another admin", lost phone) | true, kept: Security is Admin's | `security` pages |
| `management.vetDoctors.errors.loginLinksAdminOnly` | kept, **partly unsettled** | insert is refused for a login-linked doctor by `doctor_clinics_insert_perm` (`0182_perm_policy_cleanup.sql:57-61`); the update/delete refusal (`doctors/actions.ts:184,246`) is a row-level filter whose policy I did not trace |

## 2. The five Drive messages

Nothing in the card system reconnects Drive: it is a server token/environment setting. "Admin" was a guess.
- `common.driveNotConnected` (`src/lib/google/drive-errors.ts:25`): **reworded** — a server setting no card can change; tell whoever looks after the server; System status shows it (`/admin/status` asks `system.status`, `routes.ts:467`).
- `memes.form.errors.driveNotConfigured` (`src/app/memes/actions.ts:109`): **reworded**, same reason. (The Thai twin of this key at `th.ts` ~4716 is the one changed; the other `driveNotConfigured` keys under `admin.website` are developer-facing and untouched.)
- `photoApproval.driveLeftBehind` (`photos/approve/actions.ts:91`, `pending-actions.ts:182`), `photoApproval.pending.errors.leftInUnsorted` (`pending-actions.ts:130`), `photos.errors.moveIncomplete` (`residents/[id]/photos/actions.ts:229`): **reworded** — the person needing to act is anyone who can open the shelter's Google Drive folder; that is Google sharing, not an app role or card. (The photo approval actions themselves ask `photos.approve`.)

## 3. Key renames (callers updated; repo-wide grep found no use outside `src/` and old decision/test-plan prose)

- `adoptionUpdates.form.staffOnlyBadge` → `internalOnlyBadge` (caller `AdoptionUpdateForm.tsx`)
- `shelterFriends.staffDrafts` → `draftsNotice`, and inside it `askManager` → `needsPublishPermission` (caller `src/app/friends/page.tsx`)
- `assistant.volunteerReadOnly` **no longer exists** (deleted by `2026-11-01-assistant-read-only-copy.md`); nothing to rename. The backlog's "four" is therefore three keys (the family counts as two names).

## Could not settle
- Update/delete policy behind `loginLinksAdminOnly` (above).
- Whether "whoever looks after the server" should be a named person on the System status page — not in scope.

## Thai written by this stream, unreviewed (for the planner to file)
`common.driveNotConnected`, `memes.form.errors.driveNotConfigured`, `photoApproval.driveLeftBehind`, `photoApproval.pending.errors.leftInUnsorted`, `photos.errors.moveIncomplete` (all in `th.ts`).
