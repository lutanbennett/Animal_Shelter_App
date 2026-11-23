# Reconnecting Drive with the wrong Google account is refused (#rcwrg)

**The hole.** On a LIVE Drive row, Reconnect read the shelter's `drive_root_folder_id`, asked Google to open it with the NEW token, and
treated any failure as "no folder yet": it made an empty folder in whichever account had just been chosen, stored that account's
credentials and repointed the shelter at the empty folder. Existing photos broke (their ids name files the new token cannot read),
new uploads succeeded into the wrong account, and reconnecting to the right account made a third folder.

**The guard.** `liveReconnectAction()` in `src/lib/google/shelter-drive-decide.ts`, called at `shelter-google-connect.ts` (the live path,
after the staged branch): a folder id is recorded and the token cannot open it gives `refuse`, reason `wrong_account`, and the function
returns before the `folders` POST, the credentials upsert and the `update shelters` statement. Only a shelter with NO folder recorded
makes one. The screen shows the message plus the account the shelter is currently connected with, read server-side for an Admin from
`shelter_drive_status()`, so the address is never in the redirect URL.

**Why it is built from "a folder id is recorded", not from the verify result.** `verifyWithGoogle` (scripts/lib/connect-shelter-drive.mjs)
throws one sentence for every non-OK answer from Google (`cannot open folder … HTTP <status>`), so it cannot tell a wrong account from a
deleted folder or a network blip. Refusing is the safe side of all three.

**Deliberately not covered.**
- A shelter whose recorded folder was genuinely deleted or trashed is also refused: an operator must clear `drive_root_folder_id`. Rarer
  and recoverable, against a silent repoint that no shelter can undo.
- The right Google account chosen but a different one than before that can also open the folder (shared folder) is allowed: it can see the files.
- (b) showing the connected account on the button, and (c) staging every account change on a live row, were not needed: (a) closes the hole on
  its own. (b) is still worth a backlog item (the name appears only after a refusal); (c) is probably not, since (a) already stops the repoint.
- Calendar reconnect is untouched; it has no files to strand.
- The real two-account press (connect, upload, reconnect to another account) needs a second Google account on dev and is not driven here.
