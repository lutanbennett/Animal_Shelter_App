# Partner contact type, app half (#xkfsv, Partner piece)

Schema half: `0333_contact_type_partner.sql` (PR #1381). This is the app half. No migration, no new card.

## Order (deliverable 2)
`CONTACT_TYPES` is `Carer, Volunteer, Vendor, Partner`, Partner **last**, the same order as the enum.
`isContactType()` ignores order, but the type picker and the filter chips render the array in order, so
matching the database keeps the picker and the enum reading the same way and a future type just appends.

## Filter chips (deliverable 5)
Chips are now: All, the four types (Foster or adopter, Volunteer, Supplier, Partner), then Friends.
**Friends stays in the same row.** The old reason ("they are all Vendors today") was true only while a
Friend could only be a Vendor. Now a Friend is a Vendor or a Partner and not every Vendor/Partner is one,
so Friends cut across two type chips and are a list of their own, not a repeat of either. A second filter
control would add a row on a phone for no new information. The comment in `ContactList.tsx` says this.

## Cards (deliverable 6)
**No new card is needed.** A Partner is an ordinary contact: the `contacts` card opens it and
`publish_shelter_friends` makes and edits its Friend profile.

Action controls on the screens touched, and the activity each one's own server check asks:

| Control | Gate in the page | Activity the server asks |
|---|---|---|
| Contact hub edit/archive controls (`ContactHub.tsx`) | `canManage` = `can(perms, "contacts.directory")` | `contacts.directory` (`management/contacts/actions.ts`) |
| Make a Shelter Friend, Publish/Unpublish, Edit profile (`ShelterFriendCard.tsx`) | `canManage` = `can(perms, "friends.manage")` | `friends.manage` (`management/shelter-friends/actions.ts`) |
| Add a Shelter Friend wizard actions | page and actions | `friends.manage` |

They agree, so nothing found-and-not-fixed. Contact list filter chips are not actions.
Neither `ShelterFriendCard.tsx` nor `shelter-friends/actions.ts` does its own type test beside
`canBecomeFriend()`; it stays the one gate (the wizard's new-business type select reads
`FRIEND_CONTACT_TYPES`, so it now offers Supplier and Partner).

## Wording
Messages that said "only suppliers can be Shelter Friends for now" (en and th: notOffered, the wizard's
Who step, search label, empty states) now say suppliers and partners; the manual's Shelter Friends and
Contacts topics say the same. **Thai is unreviewed**: `พันธมิตร` and the reworded sentences are my own
and are not checked by a Thai speaker (`translatable_fields` queues them).

## Not touched
`stock_vendors`, deliveries, bills, purchasing and the Supplier half of #xkfsv. A Partner is correctly not a supplier
(proved by `scripts/check-contact-type-partner.mjs`).
