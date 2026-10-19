# Approving photos is its own activity, photos.approve (2026-10-19)

Lutan: "I did not approve the Residents access can approve photos, this is not appropriate." Then: "If I have the Residents existing permissions I should be able to load a photo and bypass approvals. If a photo is loaded through the Add Shelter Photo path then it requires approval through the Approve photos card."

- `photos.resident_publish` meant two things. It keeps "my own uploads publish on save" and stays on Residents. A new yes/no activity `photos.approve` means "approve or remove what is waiting"; only the Approve photos card bundles it (a test asserts it).
- Migration 0224 (planner-assigned, one file, activity and seed together): adds the activity; `can_approve_photos()`; the approval trigger, the `pending_photos` policies, `assign_pending_photo` and `set_role_cards`' approver guard (0221/0222) now test it. The approval trigger approves on save for a login that may publish OR approve.
- Seed: Management gets the Approve photos card, first, before anything else, so the guard never sees no approver. Nobody else; the 2IC is given it by Lutan on Who does what.
- The 2IC loses her Photos to approve tile (it came from Residents holding the old right); the release note says so.
- The Approve photos bundle drops `photos.resident_publish`. A role holding only that card can approve and manage photos but does not publish its own uploads.
