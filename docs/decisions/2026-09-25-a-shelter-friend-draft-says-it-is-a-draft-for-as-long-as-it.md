# 2026-09-25 — A Shelter Friend draft says it is a draft, for as long as it is one

Saving and publishing a Shelter Friend stay two separate steps
(`updateFriend`, `setFriendPublished`); nothing about the behaviour
changed. What changed is what staff are told, because an unpublished
profile was indistinguishable from a broken or undeployed feature — the
public page just looked empty, and that cost a round of "the release did
not deploy" on 2026-09-24.

- **A persistent Draft marker, not only a line after Save.** The backlog
  item offered three options cheapest-first. A one-off "Saved as a draft"
  message is gone on the next page load, and the failure is discovered
  later by someone who never saw it. So an unpublished profile of a live
  contact now reads **Draft — not on the website** on its badge (card,
  Management → Shelter Friends, and the pill tooltips in both contact
  lists), and managers see a notice on the card saying Save keeps it a
  draft, shown in edit mode too, just above Save. The after-Save message
  is also changed ("Saved as a draft. Publish to show this on the
  website."), since "Saved." read as done. It is set on the client from
  the profile's `published`, so the action is unchanged.
- **Not a publish-on-Save prompt.** A profile is often saved several times
  before the business has agreed to what it shows; asking to publish on
  every save trains people to click past it, and publishing is the step
  that must stay deliberate.
- **Archived stays "Not on the website".** An archived contact's profile is
  off the site for a different reason, which the card already explains
  (`archivedHidden`); calling it a draft would point at the wrong fix.
- **A staff-only note on `/friends`.** The visitor empty state is right for
  visitors and stays as written. A signed-in viewer additionally sees how
  many drafts are waiting and, if they can publish, a link to Management →
  Shelter Friends. `staffDraftFriends()` is the one read of
  `shelter_friends` a public page makes, and deliberately only a count
  under the viewer's own RLS — nothing from a draft is rendered, and a
  visitor has no user so the query never runs for them. It is shown
  whether or not other Friends are published, since a missing card among
  published ones is the same confusion.
