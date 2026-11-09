# Maintenance job page: enclosure link and read-only notice follow cards (#m4wq2)

Rule: Lutan, 2026-10-27, a control is drawn only when its own destination's activity is held.

- Enclosure link gated on `can(perms, "facility.enclosures", "read")`, the activity `src/app/enclosures/[id]/page.tsx:12` asks. Computed in `page.tsx`, passed as `canEnclosure` (defaults false). Without it the name shows as plain text.
- Notice shape chosen: two variants (`readOnly`, `readOnlyWithPhotos`) picked by `canPhotos` (`maintenance.photos`), rather than a vague reword, so a login that can add photos is still told so. Thai changed with it; Thai draft unverified (joins #y1dqu).
- Server/database checks untouched.

## Other controls on the page: found, not fixed
| Control | Where | Activity its action asks | Gated |
|---|---|---|---|
| Status buttons | MaintenanceJobView.tsx ~205 | maintenance.progress (`canMove`) | yes |
| Photo add/remove | PhotoSection, `canPhotos` | maintenance.photos | yes |
| Make meme | `canMakeMeme` | social.library | yes |
| Delete job | `canDelete` | maintenance.delete | yes |
| Bills | `canBills` | maintenance.bills | yes |
| Translation panel | `canManageTranslations` | translations.manage | yes |
| Edit/log details | not verified here | maintenance.jobs | not checked |
