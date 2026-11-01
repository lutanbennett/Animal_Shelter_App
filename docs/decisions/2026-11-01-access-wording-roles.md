# Dictionary sentences say which permission an action needs, not which role may do it

2026-11-01, stream `access-wording-roles` (batch 12). Closes the pile-(A) half of the backlog item
"about thirty more user-facing strings describe access by naming a role" and the item "two more strings
still tell a user only an admin can withdraw a death". Copy only: no check, policy or `can()` call changed,
and nothing about how Admin is decided was touched.

## The real count (deliverable 1)

The item said "about thirty"; #1151 counted 33 in `en.ts`. Searched `en.ts` for `admin`, `administrator`,
`management`, `manager`, `doctor`, `vet`, `volunteer`, `second in command`, `2IC`, `head of medical`,
`staff`, `director` and `only ... can`: **314 matching lines**, nearly all plain English words ("vet visit",
"Management → Contacts" as a page name, "Doctor" as a column). Read in context, **42 dictionary keys state
who may do or see something by naming a role**, each with its Thai twin (84 string edits; two keys share
one sentence). Higher than 33, as expected: the item's path through the file never reached the three "Ask
Management to set one" notes, "Ask Management" on a closed record, the three "a manager can add them"
empty states, the Shelter Friends pair, the `noAccess` page body, the assignees hint, the recurring-job
refusal, the appeal-photo refusal, or the manager named in the website translation subtitle.

## Pile (A): rewritten to name the permission, in both languages (deliverables 2 and 3)

Style copied from #1151: quote the catalogue label exactly (`admin.whoDoesWhat.activities.*`), say what the
login needs, never a role. Each activity was read off the code that really asks it.

- The `residents.*.notAuthorized` refusals ask `placement.hospital` (send and return), `placement.death`,
  `placement.move`, `placement.rehome` (rehome and shelter return) and `resident.record`; the
  adoption-news refusal asks `resident.adoption_news`. None of the code asks for a role.
- **The two withdraw strings** now name `placement.death_withdraw`, "Withdraw a death recorded in error".
  `undo.notAuthorized` is the sentence shown at the refusal; it no longer sends the person to an admin.
  The comment in `DeceasedBanner.tsx` no longer says "Admin only".
- The stocktake and delivery refusals ("Ask a manager") name `stock.count` and `stock.delivery`.
- "Changing the fixed outgoings is Admin's" was false: the page and its actions ask `reports.cashflow`
  (`cashflow/page.tsx:161`, `fixed-outgoings/actions.ts`).
- **The item called `/admin/medications`, `/admin/diets` and `/admin/units` plain `reference.types` pages.
  That is half the truth.** `canEditItemSettings` (`src/lib/permissions/item-settings.ts`) asks
  `reference.types` AND the list's own stock cell (`stock.medications` / `stock.diets`) together; its header
  says Lutan chose "Admin only" on 2026-10-08, implemented as two activities and no role check. So the old
  sentences were role guesses about a rule that is two permissions, and the new ones say "two permissions
  together". `routes.ts:439` still carries the code comment "Admin only"; left alone, worth a tidy.
- "Ask a manager" / "Management" pointers whose real requirement is an ordinary activity (clinics, contacts,
  Shelter Friends, project folders, photo approval, recurring jobs, medical photo on an appeal) now name the
  permission or say "someone who can...". Where I could not find the activity the code asks (the three
  round notes, the closed-record photo note) the sentence says less rather than guesses.
- `noAccess.body` said "ask a manager or an admin"; only Admin gives or removes cards
  (`who-does-what/actions.ts`, `hasAdminRole`), so it now says "ask an Admin, who gives out the cards".
- Staff-as-audience wording ("Staff only", "that is for staff", "Only signed-in staff", "staff manage the
  folders", the assignees hint) became "internal", "signed-in users" or the permission.

## Pile (B): the verdict on each Admin sentence (deliverable 4)

Admin sits outside the card system and none of this touches that. "Correct" means Admin really is the rule.

| Sentence (key) | Verdict |
|---|---|
| homeView.intro, homeView.readOnly: only an Admin chooses home tiles | correct, left alone (`who-does-what/actions.ts`, `hasAdminRole`) |
| cardsView.readOnly: only an Admin gives or removes cards | correct, left alone (same file) |
| edit.adminOnly: only an Admin changes who does what | correct, left alone |
| stocktaking.errors.adminOnly | correct, left alone (`admin/stocktaking/actions.ts:36`) |
| cardsView.noApproversNow: "Admin does not count" | correct, left alone: Admin holds no cards |
| menuIntro: "Admin always keeps the menu" | consistent with the Admin rule; menu code not traced, left |
| fixed rules: "Admin can do everything, always", "Security is Admin's alone" | correct, settled in `CLAUDE.md` |
| adminNote: "Everything, always" | correct |
| assistantLog "Admin only", privacy "Only an Admin can read other people's requests" | correct (`admin/assistant/page.tsx` calls `requireAdminUser`) |
| security.twoStep.* "another admin", lost phone | correct: Security is Admin's |
| login `noRolePassword`, `step3`, `noGoogle`, requests.subtitle | correct: logins and access requests are Security |
| vetVisits.noClinicForAccount, residents.list.vetScopeNoClinic, vetAppointments.unlinked | correct: linking a doctor is Settings → Security |
| management.vetDoctors.errors.loginLinksAdminOnly | correct in effect: policy `doctor_clinics_insert_perm` (0182) refuses a doctor who has a login, and Security is Admin's; the merge path was not traced |
| Drive strings ("tell an admin": `driveNotConnected`, `driveNotConfigured`, `driveLeftBehind`, `leftInUnsorted`, `moveIncomplete`) | **not established**: Drive set-up is on an admin screen but I did not trace who can act on a left-behind file; left alone |
| "every admin gets one mail", "mailed to admins" | describe who is mailed, not a permission; left |
| units.errors.notAuthorized | **was not Admin's** (above); moved to pile A |

## The Thai is mine and unreviewed

All 84 edits. Permission names reuse the catalogue's own Thai labels (`th.ts` `activities.*`) and the
frames already in the file. That is vocabulary, not proof it reads well. `check-thai-dictionary.mjs`
passes, which only says the strings exist. Added to the existing item "A NEW THAI STRING SHIPPED
UNREVIEWED" rather than a new one.

## Not done

- Dictionary key names that still contain a role (`assistant.volunteerReadOnly`, `staffOnlyBadge`,
  `staffDrafts`, `askManager`): renaming touches callers, outside a copy-only change.
- Plain uses of "staff" or "doctors" as nouns for who typically does a thing (procedure and medication list
  intros): not access claims; left. "Doctors aren't listed" in the recurring-job form and the clinic-rule
  text describe real code that keys on doctors; left, they are true.
