# Fundraising events: schema and card (0312)

Backlog item `#2zi2j`, schema half. Branch `claude/fundraising-events-schema`.

## The shape, and who chose it

**Lutan, 2026-11-04, asked directly with what each option costs** (its own thing, a kind of campaign, a kind of project):
**an event is its own thing, with its own table.** Not reopened here. An event has a date and a gallery, and may have neither a
money target nor a work programme, so it fits neither appeals nor projects cleanly.

## Columns (`fundraising_events`)

| Column | Why |
|---|---|
| `id`, `title` (not blank), `summary`, `description`, `location` | the prose; all four registered with the Thai queue the way appeals are (0210) |
| `event_date` (not null), `end_date` | a day, or several; `end_date >= event_date` |
| `status` planned / held / cancelled | an event is not a sponsorship drive, so no funded/closed lifecycle and no outcome note |
| `appeal_id` null, `project_folder_id` null | **links, not ownership**; see below |
| `social_links text[]` | the same `appeal_links_ok()` rule appeals use (https only, at most ten) |
| `published`, `published_at` | cancelled can never be published (a check, as draft is for appeals) |
| `created_by/at`, `updated_by/at` | stamped by trigger, audited by `record_audit()` |

**No money column.** Money stays on the appeal and its designated donations. An event stores no amount, so there is no second
figure to disagree with the first.

## Links: tested against what appeals and projects are

The obvious reading, a nullable link each, held, with one change of detail.

- **Appeals are per sick resident** (`appeals.resident_id not null`, target > 0). An event cannot be owned by one, since a
  jumble sale raises money for no particular animal. But it can raise money *for* one, so `appeal_id` is a nullable link,
  `on delete set null`, many events to one appeal.
- **A project is a `project_folders` row** and its photos are `attachments` of owner type `project`. Making each event a hidden
  project folder would make an event a kind of project, which is the answer he declined. `project_folder_id` is a nullable link,
  `on delete set null`, meaning "the folder holding the day's photos". **It is a link only: the event's gallery is its own
  `fundraising_event_photos`.** The website stream must not pull a linked folder's photos into an event page without checking
  approval (see "Found, not fixed", first item).

## Photos, memes and the approval queue

- Event photos are `attachments` with a **new owner type `event`**, listed in `fundraising_event_photos` (position, cover,
  `is_meme`). A trigger refuses a row whose attachment is not an image filed under that very event.
- **A meme is not a distinct thing. It is a photo with `is_meme = true`.** The staff meme library (`social.library`) stays
  staff-only and is not touched; a meme on an event is an uploaded copy, so publishing it never opens the library to the public.
  The flag exists so the website can lay memes out differently.
- **Every event photo waits for approval.** `attachments_approval_stamp()` (0309) auto-approved every non-resident owner type, so
  a bare `event` owner type would have been published unseen. 0312 restates it so an `event` attachment is approved on save only
  for an approver (`photos.approve`) or a session with no login, never for the uploader merely holding `events.run`. Only the
  INSERT condition changes; the update branch is 0309 byte for byte. The harness proves a card holder who is not an approver
  cannot approve their own photo.

## Where the photos live in Drive

Against `src/lib/google/drive.ts:1039-1047`, where `Projects/<Category>/…` mirrors `project_folders` exactly and a category
folder is found by name: **an event does not go under `Projects/`**, because that tree is defined as the mirror of
`project_folders` and an event is not one. Decided: **`Events/<YYYY>/<YYYY-MM-DD> <title>/`** at the top level beside `Projects`,
built with the same `driveSegment()` helper. The year level keeps the folder browsable after a few years of jumble sales. Nothing
in this PR creates a Drive folder; the app half writes `driveEventFolder()`.

## The activity and the card

- **A new activity, `events.run`** (yes/no, area management, sort 79), added to `catalogue.ts` **and** `permission_activities`.
  Reuse was tested and rejected: `appeal.run` would let every appeals holder write events, and `projects.publish`/`projects.photos`
  would conflate two things Lutan has just said are separate. A reused activity also cannot be "given to the events card alone".
- **Card `run_fundraising_events`**, bundle `events.run` only, includes nothing. **Given to no role.** It does not include
  `run_appeals`, `add_photos` or `approve_photos`.
- **The card count moved from 45 to 46.** `check-cards-count.mjs` now asserts 46; `check-card-grants.mjs` reads `card_grants`
  at 121 rows against `cards.ts`. Dev now has 313 migrations applied.
- **`opens` is `/management/appeals` for now.** The card has no page of its own until the app half, and a card's `opens` must be a
  registered route. `tileBlock()` will report that a holder lacks `appeal.run` for it, and `cardsWithoutTile()` says so out loud
  on their home. **The app half must repoint `opens` at its own route in the same change that adds the route.**

## Deliberately not here

- No public view: the website stream adds them, and each must filter on `attachments.approved_at`.
- `record_attachment()` still refuses owner type `event` (its CASE falls to `else false`), proved by the harness. No event photo
  can be saved until the app half teaches it `events.run`. Enum values cannot be used in the transaction that adds them, which is
  why the value is added here and used there.
- No screen, no nav entry, no manual topic.

## Found, not fixed

1. **Project photos are auto-approved on save** (the stamp treats every non-resident owner type as approved), and
   `public_project_photos` does not filter on `approved_at`. So a project photo reaches the public site with no approval, which
   is not the rule the event photos follow. It predates this change. If "the day's photos" ever means a linked project folder,
   that gap becomes the event page's. For the planner to file.
2. **The `/photos/approve` queue and the portal item `#7j2qf` (one approval portal, tabbed by stream)** will need an Events
   stream, or event photos will wait forever. The app half has to do it.
3. **`role_home_tiles` (0225) and the feature/group seeds (0241, 0255)** key cards by name for older cards. The new card has a
   `card_features` row copied from `run_appeals`; I did not add it to a home group, because who sees it is Lutan's to assign.

## Proof

`node scripts/check-fundraising-events-schema.mjs` (30 assertions, rolled back): the card holder can write an event and
publish it, a login without the card cannot create, read or touch the gallery, anon is refused, an event photo from a non-approver
waits and the card holder cannot approve it, and **nothing else became writable** (appeals, project folders, residents). The
card grants exactly one activity and nothing else grants it.
