# 2026-09-27 — Adoption updates: the feature (hub card, section, photo provenance)

The feature half of "Record updates from adopters", built on `0097` without
another migration. What `0097` left to the feature:

- **Where the section shows: any resident who has ever had an Adopt
  placement, whatever their status now.** A resident returned to the
  shelter keeps the card and the list, with a line saying these are from
  their time away; news can also arrive after the return, so Add update
  stays offered. A resident never adopted gets no card, and the add page
  and `saveAdoptionUpdate` both refuse ("never been adopted") rather than
  offering a form with nobody to hear from. Deceased residents are not
  treated specially: `0097` adds no lock, and photos stay open after death
  (0052), so a family's last news can still be recorded.
- **The sender is preselected from the newest Adopt placement's carer and
  picked from every active contact**, adopters first in their own group,
  with "Not recorded" for an Adopt placement with no carer. Any contact,
  not only type Carer: the point of storing `sender_contact_id` (0097) is
  that a partner or grown child sends the photos.
- **Photos go through the existing resident photo route**, which now takes
  an optional `adoptionUpdateId` in place of a category. The route checks
  the update belongs to the resident before touching Drive, files the photo
  under `Residents/<Name> (<ID>)/Adoption updates/<YYYYMMDD>/` (the date
  received, one folder per day, as Blood Tests do) and passes
  `p_adoption_update_id` to `record_attachment`, so the photo is tagged in
  the insert that records it. `sub_folder` holds that `<YYYYMMDD>`; the
  archive rebuilds the path from it. Same magic-byte check, same size
  limit. The form saves the update first (it needs an id to tag with),
  then sends photos one at a time; if any fail the update is already
  saved, the form stays on it, and Save retries only the failed photos —
  never a second update.
- **Provenance on the Photos tab comes from one shared select**,
  `RESIDENT_PHOTO_SELECT`, which embeds the update through the composite
  foreign key. Every list of resident photos uses it — the Photos tab, the
  Edit page's profile-photo picker, each update's own gallery, and the
  deceased archive — so a photo cannot carry its provenance on one page and
  lose it on another. An adopter's photo gets a coloured caption, "Sent by
  <sender> · <date> · <channel>" (or "the adopter" when no sender is
  recorded, or for vets, who cannot read contacts), in place of the
  category; the full-size view adds a link back to the update. Once a
  resident has both kinds, chips filter the gallery to the shelter's photos
  or the adopters'. The archive's offline index says "Sent by … on … via …"
  under the tile and gives the Adoption updates folder in its file table.
  The public "Happy endings" card is still the follow-on to ask about;
  anon has no access to `adoption_updates`.
- **Delete takes the photos with it, and says so.** The foreign key refuses
  to delete an update that still has photos, and untagging them would pass
  an adopter's photos off as the shelter's, so `deleteAdoptionUpdate`
  deletes each photo (`delete_resident_photo`, then Drive) and then the
  update, and the confirm reads "Delete this update and its 2 photos?".
- Both actions return `ActionResult` (2026-09-26) through `runAction`.
