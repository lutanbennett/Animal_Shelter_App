# Icon buttons: Admin / Settings (2026-10-05)

Third of four area PRs for the backlog item "Turn word-only action links into
icon buttons" (Mobile). It applies the rule and the three tiers from
`2026-10-04-icon-buttons-resident-hub.md` and the icon map and `hint` from
`2026-10-04-icon-buttons-management.md` without redesigning either. Nothing
changes what an action does.

## The audit (src/app/admin, 25 files with controls)

`/admin` is mostly tables of things you act on in place, so there is little
navigation to leave alone. Every control, one line each.

| Where | Control | Verdict |
|---|---|---|
| enclosures/EnclosuresTable, zones/ZonesTable, immunization-types/ImmunizationTypesTable | Edit, Delete (per row) | row actions: pencil, bin (danger). Delete really deletes (each already behind a confirm) |
| frequencies/FrequenciesTable, procedure-types/ProcedureTypesTable, blood-test-types/BloodTestTypesTable | Edit, Merge, Delete (per row) | row actions: pencil, merge, bin (danger). A disabled Delete keeps its reason, now in `hint` |
| (same five tables) | Save, Cancel, Merge (confirm) in the edit / merge states | form confirm buttons, already filled or bordered with words: unchanged |
| Create*Form (enclosure, zone, immunization, procedure, blood test, frequency), security/CreateUserForm | Add / Create submit | main action: filled, now with the plus and 44 px (shared `ActionButton`) |
| security/UsersTable | Issue temporary password, Reset two-step, Allow / Renew two-step setup | secondary actions: bordered icon + word (key, shield-off, shield-check). They are one per user but each has a long, specific word, so the word stays |
| security/UsersTable | Archive, Restore, Delete (per user) | row actions: archive-box, archive-restore, bin (danger). Archive is reversible so it is not the bin |
| security/VetDoctorLink | Link, Unlink, Create a doctor, Create, Cancel | secondary actions: icon + word (link, unlink, plus, plus, x), compact |
| security/AccessRequests | Approve, Deny | icon + word: filled check, danger ban. These decide whether a person gets in, so the word stays |
| security/page, security/verify/TwoStepForm | Begin / confirm two-step | form submits: unchanged |
| security/verify/page | Back to settings | navigation, standalone: `BackLink` (arrow, 44 px) |
| status/page | Check now | page action: bordered icon + word (refresh) |
| status/AlertActions | Run the check now, Send a test | secondary actions: refresh, send (word kept) |
| status/page | 7 / 30 / 90 day period chips | filter navigation: stays; 44 px on a phone |
| recent-changes/UndoButton | Undo this change | was an underlined word; now a compact bordered icon + word button (undo). The two-step confirm after it is unchanged |
| recent-changes/page | Clear (filters) | action: x icon + word, 44 px (as Clear search in the resident hub) |
| recent-changes/page | Apply filters | form submit: unchanged, 44 px on a phone |
| recent-changes/page | History, Show / Hide values, Newest, Older, All records, resident name | navigation or in-place toggles: stay |
| website/HeroPhoto | Replace photo, Remove | secondary actions: image-up, image-off (danger), word kept |
| website/GalleryPhotos | Add photo | secondary action: image-up + word |
| website/GalleryPhotos | Move earlier / later | row actions: arrow-left / arrow-right (were bare ← → glyphs) |
| website/GalleryPhotos | Remove | row action: **bin** (danger). Unlike the hero photo, this deletes the gallery row and trashes the Drive file |
| website/PublishedProjects | Remove (from the website) | row action: globe-lock (unpublish). The project stays; it only leaves the public site |
| website/PublishedProjects, PagesAccordion | View / View page | navigation (opens the public page): stays |
| website/ContactChannelPicker | Move up / Move down | row actions: arrow-up / arrow-down, 44 px |
| website/FeaturedResident, PublishedProjects | project / resident name | navigation: stays |
| website/SitePageForm, SiteSettingsForm, VetVisitEstimate | Save | form submits: unchanged |
| website/WebsiteTabs, PagesAccordion toggle | tabs, accordion header | choosers and disclosure: unchanged |
| facility-map/MapEditor | Edit (redraw) per placed enclosure | already `RowActionButton` + `ACTION_ICONS.edit`: left alone |
| facility-map/MapEditor | Clear (per placed enclosure) | was a danger bin. Clearing a shape only takes the enclosure off the plan (draw it again any time), so it takes the `clear` x, not the bin |
| facility-map/MapEditor | Remove plan | already a bin + word button with a confirm: it deletes the plan. Left alone |
| facility-map/MapEditor | Add plan | main action: its map-pin icon is now the plus (add) |
| facility-map/MapEditor | plan chips, Rectangle / Polygon, Undo point, Done, Cancel | drawing tools and chooser: unchanged (tool icons, not row actions) |
| page.tsx, DriveStatus, enclosures/zones/etc. `page.tsx` | settings tiles, notices | navigation tiles: unchanged |

## Was `facility-map-editor` (#368) already on the shared components?

Mostly. It used `RowActionButton` and `ACTION_ICONS` for the per-enclosure
Edit and Clear and had its own 44 px bordered icon + word buttons for the
rest. Two things were brought into line: Add plan carried a map-pin where the
rest of the app uses the plus, and Clear used the bin although it destroys
nothing.

## Icon map additions (`ACTION_ICONS`)

Added as generic meanings so area 4 reuses them:

| Key | Icon | Used for |
|---|---|---|
| undo | Undo2 | reverse a change in the audit log (same glyph as `handBack`; a different meaning) |
| moveLeft, moveRight | ArrowLeft, ArrowRight | reorder a row of photos, where up and down would mislead |
| refresh | RefreshCw | run a check again now |
| send | Send | send a test message |
| approve, deny | Check, Ban | let an access request in, or turn it away |
| link, unlink | Link2, Unlink | tie a login to a vet doctor, and cut it |
| issuePassword | KeyRound | issue a temporary password |
| resetTwoStep, allowTwoStep | ShieldOff, ShieldCheck | reset a person's two-step, and open its setup |

## A new shared component: `ActionButton`

`src/components/ActionButton.tsx` is the `<button>` twin of `ActionLink`: icon
and word, `primary` / `secondary` / `danger`, 44 px on a phone and 36 px with a
mouse, and a `compact` size for table cells. Area 1 hand-inlined its one
bordered icon + word button; `/admin` needs about a dozen, so it is a
component now. Area 4 can use it for the maintenance and contact forms.

## Choices worth knowing

- **Word kept where it carries meaning.** Issue password, Reset two-step,
  Approve and Deny are repeated per row but are not guessable from an icon and
  are the actions that matter for security, so they follow rule 2 (icon + word),
  not rule 3.
- **Bin only where something is destroyed.** Delete on every type table and on
  a user or gallery photo; not Archive (users), not Remove from the website,
  not Clear on the map.
- **Pages that were never desktop-only keep their phone layout.** Status,
  Website, Recent changes, Procedure types and Blood test types do not show the
  "Best on a larger screen" notice (the roles work chose which pages do); the
  new buttons were measured on them at 375 px. Enclosures, Zones, Frequencies,
  Immunization types and Facility map do show it, and still do.

## Known limits

- In-table text links on Recent changes (History, Show values) are 16 px tall;
  they are navigation and in-place toggles, so they stay, as the area 2
  "Show / Hide approved" toggle did. Recent changes also lets the "Changed by"
  select run past the right edge at 375 px, which this area did not cause.
- `TranslationPanel` is still area 4's. The website tab bar (38 px) and the
  resident picker's Change button are shared with other pages and left.
- Security's user table sits behind the two-step step-up (`aal2`), so it was
  checked by typecheck and build only; a person should look (test plan).
- No automated 375 px check existed to compare against; measured by hand.
