# 2026-10-02 — Shelter Friend wizard: one save, no RPC, opt-ins reset with the contact

Backlog: "A step-by-step wizard to add a Shelter Friend, like intake". Today the
sequence was five places (create a contact, open it, Make a Shelter Friend, fill
in and Save, Publish). Every piece worked; nobody could find the order. The
wizard lives at `/management/shelter-friends/new`, with an **Add a Shelter
Friend** button on Management → Shelter Friends and on Management → Contacts.
The existing card stays, for editing.

## Chrome is shared, not copied

`WizardProgress`, `WizardNav`, `ReviewSummary` (`src/app/residents/new/WizardChrome.tsx`)
and `parseStepParam` (`steps.ts`) now take their step count and wording as props,
defaulting to intake's, so the intake form is unchanged. The Friend wizard passes
its own labels and a `finalActions` slot in place of the single Register button,
because it ends in a choice (Publish now / Save as a draft). `?step=` and
hidden-not-unmounted come with the chrome and the same pattern.

One difference from intake, on purpose: intake reads its answers back out of the
DOM (they live in uncontrolled inputs) and a refresh clears them. The Friend
wizard holds them in React state, because the Review step draws the live card
from them, and mirrors them to `sessionStorage` so a refresh keeps the typing as
well as the step. The draft is cleared on a successful save. A chosen logo file
cannot be stored; after a refresh the wizard says which file it was and asks for
it again. Because the draft is read from `sessionStorage`, the form renders on
the client only.

## Saving: one server action, no RPC, clean-up instead

`addShelterFriend` (`management/shelter-friends/actions.ts`) checks everything
that can be refused before the first write (role, both links, the date, the
Vendor gate through `canBecomeFriend`, an already-a-Friend contact), then inserts
the contact if it is new, then the profile **as one row** carrying its text,
opt-ins and `published` flag. The only half-finished state possible is "contact
made, profile insert failed", and that contact is deleted again; if even that
fails the message says the contact was kept and how to finish. The brief allowed
a `security definer` RPC with a schema PR first; it was not worth a migration for
two inserts where the second failing is cheap to undo, and the profile row's
trigger-driven translation queue works unchanged.

The logo goes afterwards, through the existing `uploadFriendLogo`, so every rule
there (signature check, size, Drive folder, plain-language "Photo storage is not
connected") is the same code. A failed logo does not fail the save: the done
screen says "Saved without a logo — add it from the friend's card" with the
reason.

Rules are shared, not repeated: `checkFriendFields` (links, date, opt-ins as
strict booleans) now serves both `updateFriend` and the wizard, `insertContact`
(`src/lib/contacts/create.ts`) serves both `createContact` and the wizard, and
`nextSortOrder` serves `createFriend` and the wizard.

## Step 4: the opt-ins

Every box starts off and nothing in the wizard ticks one. The plain-words "ask
the business first" sits beside them, above the boxes. Because a tick records
that **a particular business** said yes, switching the chosen contact (or
switching between "existing" and "new") clears every box again, and the draft
restore reads them as strict booleans. The server treats anything other than
exactly `true` as off, as `updateFriend` always has.

## Departures from the suggested steps

- **Address on a new contact.** The brief said a new contact needs only name,
  type and phone/LINE/email. The wizard also offers an optional address, because
  the Address and Map opt-ins in step 4 are meaningless for a contact with none.
  It is optional and can be left empty.
- **No "Friend since" in the wizard.** It is on the card for editing and was not
  in the suggested steps; a new Friend starts without one.
- **Preview map.** The preview draws the map from a pasted maps link or plain
  address as the contact hub does, but does not follow a short `maps.app.goo.gl`
  link (that needs the server round trip); the real card on the contact page and
  `/friends` does.
- **Who step offers `FRIEND_CONTACT_TYPES`**, the same single list the card's
  gate reads, so widening the gate later also widens the picker and the type
  select with no change here.
