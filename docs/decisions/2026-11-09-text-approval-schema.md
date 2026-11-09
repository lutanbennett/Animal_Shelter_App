# 2026-11-09 — A review state for public text, and the appeal override (`#7aev4` schema half, folded with `#r9wtk`; migration 0343)

**What shipped:** `text_approval` (`public_ok` / `private_only` / `NULL` = not reviewed) plus `text_approval_by` / `text_approval_at` on
eight tables: `residents`, `adoption_updates`, `appeals`, `fundraising_events`, `project_folders`, `desexing_drives`, `shelter_friends`,
`shop_links`. Nine public views were re-created from their **live** definitions (`pg_get_viewdef` on dev, 2026-11-09, after `0342`) to read it.
`public_enclosures` inherits through `public_resident_cards` and was not edited. `#r9wtk`'s appeal override is in the same file.

**It changes nothing a visitor sees, except the appeal override.** Every existing row has `public_ok` and the column default is `public_ok`
(the `add column … default` is the back-fill: Postgres fills existing rows without running triggers, which matters because an `UPDATE`
on `residents` trips the deceased-resident lock). The app half flips the default to `NULL`. `0217`'s approve-on-save is untouched.

## Step zero (the result)

Read live on dev before writing anything: none of the eleven views filtered on a review state; the gap was real. Next migration number on
`origin/main` was `0343` (highest `0342`). No earlier decision file or migration built a text review state (`approval` in the
decisions is the photo flag, `0318`).

## Per-view table (deliverable 1)

| View | Reads | Was | Now |
|---|---|---|---|
| `public_resident_profiles` | `residents` | `is_public_visible` and status not Deceased/Adopted | **+ `r.text_approval = 'public_ok'`** (row hidden) |
| `public_resident_cards` | `residents` | no `where` (DB-7, every resident) | **still no `where`**; `bio`, `temperament_notes` and `translations` read `NULL` unless `text_approval = 'public_ok'` |
| `public_recent_adoptions` | `placement_history`, `residents` | adopted ≤ 90 days, visible, not Deceased | **+ `r.text_approval = 'public_ok'`** |
| `public_enclosures` | `public_resident_cards` | unchanged | **unchanged**; its `residents` JSON is `to_jsonb(cards)`, so the blanked prose falls out (proved) |
| `public_adoption_updates` | `adoption_updates`, `residents` | `share_publicly`, visible, not Deceased, approved Non-Medical media | **+ `u.text_approval = 'public_ok'`** |
| `public_appeals` | `appeals`, `residents` | `published`, not draft, **`r.is_public_visible`** | `published`, not draft, **`a.text_approval = 'public_ok'`**; `is_public_visible` test removed (#r9wtk) |
| `public_appeal_photos` | `appeal_photos`, `appeals`, `residents`, `attachments` | as above incl. `r.is_public_visible` | `r.is_public_visible` removed; every other test (approved, Medical needs `medical_ok`, picture) kept |
| `public_fundraising_events` | `fundraising_events` | `published`, not cancelled | **+ `e.text_approval = 'public_ok'`** |
| `public_projects` | `project_folders` | `is_public`, has a parent | **+ `f.text_approval = 'public_ok'`** |
| `public_desexing_drives` | `desexing_drives` | status open/cancelled, not past | **+ `d.text_approval = 'public_ok'`** |
| `public_shelter_friends` | `shelter_friends` | unchanged | **unchanged, by decision** (below) |
| `public_shop_links` | `shop_links` | unchanged | **unchanged, by decision** (below) |

Column lists, names and order are exactly as before; grants restated (anon and authenticated may SELECT, nothing else) and declared in
`docs/hard-coded-security-registry.json` as `grant to anon`.

## Decisions taken (all reversible, none put to Lutan)

1. **Shelter Friends text and shop-link text need no flag.** Same argument Lutan accepted for the QR code, the Friends logo and the
   shop-link photo ("Yes same shape"): whoever sets `published` / `shown` (`friends.manage`, `shop.manage`) is the publisher. The two
   columns exist on `shelter_friends` and `shop_links` but **nothing reads them**. **To reverse:** add
   `AND (sf.text_approval = 'public_ok')` to `public_shelter_friends`' `where`, and `AND (s.text_approval = 'public_ok')` to `public_shop_links`'.
   One line each. Because it is a judgement the enumeration marked **[judgement]**, say so in the PR.
2. **`public_resident_cards` keeps every row and blanks only the prose.** DB-7 (`2026-10-02-public-roster-stays-full.md`, "not to be
   re-proposed") lists every resident. Filtering rows would reopen it; hiding the prose honours both. Identity fields (name, species,
   breed, colour) stay, as they do today for a resident who is not on the website.
3. **Back-fill covers every row, not only published ones.** A row back-filled only when public would be invisible the moment its switch is
   flipped between this merge and the app half. That is a behaviour change.
4. **The stamp trigger is not a permission check.** `text_approval_stamp()` (plain, not `security definer`) stamps who/when when the value
   changes. Any login that can update the row can still set `text_approval` through the Data API **until the app half adds the guard**.
   That is harmless today (the default is already `public_ok`) and **must be closed before the default is flipped** (spec point 4).

## What the override newly exposes on dev

**Nothing, because dev has no appeals** (`appeals` 0 rows, `public_appeals` 0 before and after). Proven in a rolled-back harness instead:
a published, `live` appeal for a resident with `is_public_visible = false` is returned to `anon` (1); the same appeal with `text_approval`
`NULL` is not (0). **Production count: not read** (ad-hoc production reads are refused here); the planner should read
`select count(*) from appeals a join residents r on r.id=a.resident_id where a.published and a.status<>'draft' and not r.is_public_visible`
on production before release.

## Before / after (deliverable 4), dev, as `anon`

```
profiles 0 | cards 3 | recent_adoptions 0 | enclosures 64 (2 resident entries) | adoption_updates 0 | appeals 0 | appeal_photos 0 |
events 0 | projects 0 | drives 0 | friends 0 | shop_links 0 | cards with bio 0 | cards with temperament 0
```

Identical before and after. **That proves little on its own (dev is nearly empty).** The rolled-back harness is the real proof: on one
resident, `public_ok` shows (profiles 1, card bio 1, enclosure JSON bio 1); `NULL` hides (profiles 0, card row **still 1**, card bio 0);
`private_only` hides; and on an appeal, an event and a drive the same flip takes the view from 1 to 0. **Not exercised with rows:**
`public_projects`, `public_adoption_updates`, `public_recent_adoptions` (dev has no project folders, adoption updates or open adoptions); each is the
same mechanical `and <alias>.text_approval = 'public_ok'`.

## SPECIFICATION FOR THE APP HALF (deliverable 7)

1. **The column and its values.** `text_approval`: `public_ok` · `private_only` · `NULL` (not reviewed) on the eight tables, with
   `text_approval_by` / `text_approval_at` stamped by `text_approval_stamp()`.
2. **The activity each control must ask**, read from the action file the screen already uses, never guessed from a label:

   | Table | The save action that publishes its text | Activity it asks |
   |---|---|---|
   | `residents` | `src/app/residents/[id]/edit/actions.ts:83` | `resident.record` |
   | `adoption_updates` | `src/app/residents/[id]/adoption-updates/actions.ts:73`, `:148` | `resident.adoption_news` |
   | `appeals` | `src/app/management/campaigns/actions.ts:51` | `appeal.run` |
   | `fundraising_events` | `src/app/management/events/actions.ts:41` | `events.run` |
   | `project_folders` | `src/app/projects/actions.ts:147` | `projects.publish` (folders: `projects.folders`) |
   | `desexing_drives` | `src/app/management/sterilisation-drives/actions.ts:26` | `website.content` |
   | `shelter_friends` / `shop_links` | no flag (decision 1) | n/a |

   **Who may SET `public_ok` is a separate question from who may edit**: the point of the review is the Director reading it. That needs
   one activity for "approve public text". Lutan said *"New cards will be created for specific activities"*; **that card is the app
   half's to create**, and it is the activity every approve control and the guard below must ask. This migration adds none, on purpose.
3. **The default flips to `NULL`**: `alter column text_approval set default null` on the six tables in the table above.
4. **Close the Data API hole first.** Before (3), a guard so a plain row update cannot set `public_ok`: either a trigger that refuses a
   change to `text_approval` unless the caller's cards allow the approve activity (the shape of `attachments_approval_stamp()` in
   `0318`), or narrowing the column grants as `0325` did for the photo approver columns. `text_approval_stamp()` is the place.
5. **A text edit must reset the state.** When a public prose column changes, `text_approval` goes back to `NULL`; a save that touches only
   an internal column must not. Public prose columns: `residents` (`bio`, `temperament_notes`, `past_story_notes`, `hook_line`,
   `ideal_home`, plus the descriptors), `adoption_updates` (`public_story`, `public_first_name`), `appeals` (`title`, `what_is_wrong`,
   `treatment_needed`, `cost_covers`, `outcome_note`, `social_links`), `fundraising_events` (`title`, `summary`, `description`, `location`,
   `social_links`), `project_folders` (`name`, `name_th`, `summary`, `location`), `desexing_drives` (`title`, `venue`, `venue_address`,
   `description`, `price_note`, `eligibility_note`).
6. **Remove `0217`'s approve-on-save** (and rewrite the assertions of `check-photo-approval`, `check-adoption-media-approval`,
   `check-fundraising-events-schema`) only once the review screens exist. Script-written rows (`auth.uid()` null) will then land blank and
   need the queue.
7. **The review screens and the queue** must draw their buttons only when `can(perms, <approve activity>)`, per the "buttons follow
   cards" rule. A resident with blank text vanishes from `/adopt` and its card shows no prose, so the queue must be visible to the approver
   *before* the default flips.
8. **Files the app half will touch:** the six action files above; `src/lib/permissions/cards.ts` (the new card); the queue page; the
   public readers (`src/app/adopt/ResidentCard.tsx`, `src/app/adopt/[id]/page.tsx`, `src/app/r/[code]/page.tsx`, `src/app/e/[id]/page.tsx`)
   which must render a card with no prose without breaking; `scripts/check-public-views.mjs` if a probe is added.

## Not done / for the planner to file

- **Production override count** (see above) not read.
- The migration carries no card, no policy and no role key.
- `public_resident_cards` still lists every resident (DB-7), and a *Public ok* profile photo of a resident who is not flagged for the website
  is still shown there: the conflict between DB-7 and the 2026-11-05 second gate that the enumeration already named. Not reopened.
