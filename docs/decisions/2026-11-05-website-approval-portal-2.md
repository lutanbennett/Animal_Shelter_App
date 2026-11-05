# 2026-11-05 — Website approval portal, part 2 (#7j2qf)

## Step zero (redone after the 0.43.0 fixes, PR #1294)
The gap was still open: `actions.ts` had one propose call, passing `"site_pages"`. #1294 touched only the menu entry, the
adoption-update publish tick, the Who does what label and release notes.

## What `0315` already did for `site_content`
The database half was complete: the `website_drafts` check, `propose_website_draft()` and `approve_website_draft()` all accept
`site_content` (singleton, so the draft is keyed `'site'`), and `drafts.ts` is typed for both. No migration was needed.
The missing piece was the app half only.

## What was built
- `proposeSiteContent` in `src/app/admin/website/actions.ts` asks `website.propose` and calls the RPC with `p_target: "site_content"`.
- The column checks (links, map link, WhatsApp, gift split, channel order) moved out of `updateSiteContent` into one
  `siteContentPatch()` that both actions call, so a draft can never hold what a publish would refuse.
- `SiteSettingsForm` takes `canEdit` (website.content) and `canPropose` (website.propose), both default false; Save is drawn
  only for one of them and the label says "Save as a draft" for a proposer.
- `/admin/website` opens for a login holding `website.propose` without `website.content`, showing the settings form alone
  (the same draft-only rule the page editor already used). The `propose_website` card opened `/admin/website` before, and that
  page refused it.
- `WebsiteDraftQueue` already names a `site_content` draft "Home page" and lists each column, so it needed nothing.

## Deliverables 4 and 5: no new tabs, deliberately
- **Medical / Drive photos:** `attachments_approval_stamp` approves a Medical-folder file on save (0224), so no row can wait.
  A tab would be empty for ever, and a card must never do nothing. Not built.
- **Adoption updates:** the pending rows are `attachments` with `owner_type = 'resident'` and `approved_at is null` (0309).
  `loadWaitingPhotos` already lists them, videos included, in the Resident photos tab. A second tab would be a second view of the
  same rows. Not built.

## Deliverable 6: the photo-gallery draft path
`0315:11` ("a photo is a Drive file, and the photo path is already approved through photos.approve in the same portal") still
holds. A gallery photo is a file plus an alt text, with no text patch to review; a draft table would add a second approval for
a thing the portal already approves. **Strike the clause from the item.**

## Found, not fixed
`ClinicVisitEstimate` shares the Contact tab and asks `website.content`; it is not drawn for a proposer, which is correct.
