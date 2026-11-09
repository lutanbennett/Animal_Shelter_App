# 2026-11-09 — What does anon read, and what carries its approval? (`#7aev4`, the enumeration piece)

**Outcome: an enumeration, no schema, no `src/` change.** `#7aev4` carved out one piece a stream could do: *whether any table the
public reads WITHOUT riding `attachments` exists*. **It does.** For **media**, one table outright (`shop_links`) and one column that
rides `attachments` only by negation and fails open (`residents.profile_photo_drive_file_id`, proven below). For **text** — which
counts, because Lutan's answer of 2026-11-05 was *"Every photo and any text will be reviewed by the Director"* — almost every subject
table the website reads carries **no review state at all**, only a publish switch.

Every line below is marked **[measured]** (read or run on a named database on this date) or **[judgement]** (my reading, open to
correction). Nothing here is a design; where a flag is described it is the input a schema stream would need, not a proposal.

## 1. The denominator [measured]

- **Database:** dev, project `qxkmhwybjggxvsfxsxbd`, 2026-11-09 ~02:16 UTC. Production was not read.
- **21 public views** in `PUBLIC_VIEWS` (`scripts/check-public-views.mjs:63`). The brief said twenty and listed twenty-one; twenty-one is
  the count.
- **`PUBLIC_TABLES` is empty** (`:106`). Asked of the catalogue directly
  (`has_table_privilege('anon', …, 'SELECT')` over every `public` relation), anon can SELECT **exactly those 21 views and no base
  table**. The script's list and the live database **agree**.
- **Four functions** anon may execute, the same four as `PUBLIC_FUNCTIONS`: `is_public_drive_file`, `shelter_date`,
  `shelter_time_zone`, `shelter_today`. Only `is_public_drive_file` gates content (the photo proxy, `src/app/api/photos/[fileId]/route.ts:146`).
- `node scripts/check-public-views.mjs` against dev: **exit 0**, 473 `ok` lines, three `skip`s (dev has no public resident photo,
  blood-test file or public-folder PDF to probe with). **The check still enforces "anon reads nothing else"**: it lists every exposed
  relation and function with the service-role key and fails on any it does not know.
- Dev is nearly empty (2 residents, no shop links, no site-content photos), so **counts on dev prove nothing about volume**; every
  verdict below rests on the view definitions (`pg_get_viewdef` on dev), not on rows.

## 2. Per-view classification

Buckets, from the brief: **(a)** media rides `attachments.approval`; **(b)** an approval column of its own; **(c)** ruled to need
none; **(d)** carries nothing that can be approved; **(e)** reads content that can reach the website and **nothing carries its
approval state**. A view carrying several kinds of content is placed in its **worst** bucket and the others are named beside it.

Two partial approvals appear across many views and are **not** enough on their own to place a view: **`medical_ok`** on
`appeal_photos` (`0216`, a real per-photo approval for Medical files on one campaign) and **`private.approved_translations()`**,
which returns only `translations.status = 'approved'` — so **the Thai text has a review state; the source text it translates does not.**

| # | View | Base tables (from the live definition) | Bucket | Why |
|---|------|------------------------------------------|--------|-----|
| 1 | `public_resident_photos` | `attachments`, `residents` | **(a)** | `a.approved_at is not null`, Medical excluded |
| 2 | `public_project_photos` | `attachments`, `project_folders` | **(a)** | `a.approved_at is not null`; `caption` is on the same attachment row, so it shares the approval |
| 3 | `public_appeal_photos` | `appeal_photos`, `appeals`, `residents`, `attachments` | **(a)** (+ (b) `medical_ok` for Medical) | `att.approved_at is not null and (not medical or p.medical_ok)` |
| 4 | `public_fundraising_event_photos` | `fundraising_event_photos`, `fundraising_events`, `attachments` | **(a)** | `att.approved_at is not null` |
| 5 | `public_donation_channels` | `donation_channels` | **(c)** | `docs/decisions/2026-11-06-approval-flag-public-surfaces.md` (`#h3w7c`): no flag on the QR; it also says a real control would be a separate-approver review of *the whole channel*, i.e. it declined a flag for the row's text too |
| 6 | `public_site_content_photos` | `site_content_photos` | **(c)** | page management, `#7aev4`'s declared exception; named in the same `#h3w7c` file |
| 7 | `public_site_content` | `site_content` | **(c)** | page management: hero and the four page photos are set by `website.gallery`, text by `website.content` or proposed/approved through `0315`, all on Manage website. **[judgement]** the ruling names only `site_content_photos`; the hero/page photos are covered by Lutan's own words *"with the exception of the page management (in manage website)"*, not by a file |
| 8 | `public_site_pages` | `site_pages` | **(c)** | page management, with `0315`'s `website.propose` / `website.approve` two-step |
| 9 | `public_shelter_stats` | `private.resident_current_state`, `residents`, `placement_history`, `prescriptions`, `public_stat_switches` | **(d)** | every one of its eight columns is a `count(*)::integer` (or null when switched off); no text, no file id |
| 10 | `public_impact_figures` | `impact_baselines`, `placement_history`, `community_dog_outings` | **(d)** | numbers, plus a `label`/`label_th` typed on Manage website by `website.content` (page management) |
| 11 | `public_resident_profiles` | `residents`, `attachments`, `immunization_records`, `private.resident_current_state` | **(e)** | text: `name`, `bio`, `temperament_notes`, `past_story_notes`, `hook_line`, `ideal_home` and descriptors — no review state. Media: the profile photo **fails open** (§3.1) |
| 12 | `public_resident_cards` | `residents`, `attachments`, `private.resident_current_state` | **(e)** | as #11, **and no `where` clause at all** (every resident, by ruling DB-7 — see §4) |
| 13 | `public_recent_adoptions` | `placement_history`, `residents`, `attachments` | **(e)** | the profile photo fails open (§3.1); `name`, `species` |
| 14 | `public_enclosures` | `enclosures`, `zones`, `public_resident_cards` | **(e)**, inherited | its own columns are enclosure and zone names **(d)**; its `residents` array is `to_jsonb()` of #12's rows, so it carries #12's content |
| 15 | `public_adoption_updates` | `adoption_updates`, `residents`, `attachments` | **(e)** | media **(a)**; `public_story` and `public_first_name` (an adopter's words and name) carry only `share_publicly`, flipped by the same `resident.adoption_news` holder who types them |
| 16 | `public_appeals` | `appeals`, `residents`, `donations`, `donation_lines`, `appeal_photos`, `attachments` | **(e)** | cover **(a)**; `title`, `what_is_wrong`, `treatment_needed`, `cost_covers`, `outcome_note`, `social_links` carry only `published`/`status`, flipped by `appeal.run` |
| 17 | `public_fundraising_events` | `fundraising_events`, `fundraising_event_photos`, `attachments`, `public_appeals`, `public_projects` | **(e)** | cover **(a)**; `title`, `summary`, `description`, `location`, `social_links` carry only `published`, flipped by `events.run` |
| 18 | `public_projects` | `project_folders`, `attachments` | **(e)** | cover/count **(a)**; `name`, `name_th`, `summary`, `location` carry only `is_public` (`projects.publish`; outreach folders `community.outings`) |
| 19 | `public_desexing_drives` | `desexing_drives`, `desexing_drive_signups` (count only) | **(e)** | no media; `title`, `venue`, `venue_address`, `description`, `price_note`, `eligibility_note` carry only `status`/date |
| 20 | `public_shelter_friends` | `shelter_friends`, `contacts`, `suppliers` | **(e)** | the logo is **(c)** (`#h3w7c`). The text (`blurb`, `help_kind`, `discount_note`, and the contact fields each `show_*` opts in) was **not** ruled. **[judgement]** the same argument (setter = publisher, `friends.manage`) would very likely give the same answer — for Lutan's planner to put, not for me to assume |
| 21 | `public_shop_links` | `shop_links`, `public_shelter_friends` | **(e)** | **`photo_drive_file_id` is a photo outside `attachments`**, plus `title`/`note`/`price_hint`; one gate, `shown`, flipped by the same `shop.manage` holder (card `manage_shop_page`) who uploads the photo. Not ruled. Same shape as `#h3w7c` |

**Totals [measured]: (a) 4 · (b) 0 as a sole bucket · (c) 4 · (d) 2 · (e) 11 = 21.**

**The direct answer to the item's question [measured]:** tables the public reads **without** riding `attachments`:
- **Media:** `shop_links.photo_drive_file_id` (never on `attachments`); `residents.profile_photo_drive_file_id` (rides it only by
  negation, §3.1). The QR code, the Shelter Friends logo and the five site-content photo columns also live outside `attachments` and
  are ruled (c).
- **Text:** `residents`, `adoption_updates`, `appeals`, `fundraising_events`, `project_folders`, `desexing_drives`, `shelter_friends`,
  `shop_links`. None has a review state; each has only the publish switch listed in §4. (`attachments.caption` is the one public text
  that *does* ride the approval.)

## 3. What a flag would need, for each (e) — one paragraph each, no schema

### 3.1 `residents.profile_photo_drive_file_id` — fails open, and it is a security finding, not only an approval gap

**[measured]** `public_resident_profiles`, `public_resident_cards` and `public_recent_adoptions` decide the profile photo with
`case when exists (an attachment of THIS resident with THIS drive id that is Medical or unapproved) then null else the id end`. The
test asks for a **bad** row, not a **good** one, so an id that matches **no** attachment of that resident passes straight through.
`residents` grants column UPDATE to `authenticated` and its update policy asks only `has_permission('resident.record')`
(`residents_update_perm`), so the guarded RPCs (`set_resident_profile_photo` / `delete_resident_photo`, `0319`) are not the only
writers: any login whose cards grant `resident.record` at edit — on dev that is **one card, `residents` (Edit residents)** — can PATCH
the column through the Data API. **Proven on dev** in a rolled-back transaction: an id with no attachment row was returned to `anon` by
`public_resident_cards` and `is_public_drive_file()` answered **true** for it (`PROBE cards=enum-probe-no-attachment-row is_public=t`;
nothing persisted, re-counted after). The photo proxy then serves **any non-video Drive file the service account can read** once that
function says yes (`route.ts:146–220`), so the reach is not just "an unreviewed photo": it is **any internal file** — a blood-test PDF,
another resident's Medical photo, a document — put on the public web by that card's holder, with no approval step. That card's own
comment (`src/lib/permissions/cards.ts`, card review 1) says its photos were moved *"through approval instead of straight to the
website"*; this path undoes that. **What a fix would need:** the views to ask the positive question (an attachment of this resident,
this id, `approval = 'public_ok'`, not Medical, a picture) — the shape `0319` already uses for the RPCs — and/or the column to stop
being directly writable (only through the RPC). **Back-fill risk: low and measurable.** Changing the views hides only profile photos
with no approved own attachment; count those on production first (on dev: 1 resident has a profile photo, 0 orphans). **For the
planner to file, and I would rank it above the rest of this list.** The same "any Drive id" reach exists for every free-text
`*_drive_file_id` column in a public view (`shop_links.photo_drive_file_id` via `shop.manage`; the QR, logo and site-content photo
columns via their own cards) — **[judgement]** those cards are page-management or publishing cards whose holders already publish
deliberately, so they are lower risk, but `#h3w7c` did not consider this angle.

### 3.2 `shop_links.photo_drive_file_id` (and the row's text)

The photo is uploaded straight to Drive by `uploadShopPhotoAction` (`src/app/admin/shop/actions.ts:187`, `shop.manage`) and stored on
the row; the same card flips `shown`. A flag would need **either** a column of its own (`photo_approval`, three values, plus who/when)
**or** moving the photo onto `attachments` (a new `owner_type`, then it rides `approval` for free). The second is more work and more
consistent. **[judgement]** first put the `#h3w7c` question to Lutan: the setter is the publisher, so he may rule it out exactly as he
did the QR and logo. **Back-fill: trivial on dev (0 rows)**; on production every existing photo must back-fill to *Public ok* or it
leaves `/shop` the moment a view tests the flag.

### 3.3 Subject text: `residents`, `appeals`, `fundraising_events`, `project_folders`, `desexing_drives`, `adoption_updates`, `shelter_friends`, `shop_links`

These are one finding, not eight, because the shape is the same: **text typed into a subject row, published by a switch on the same
row, with no state meaning "the Director has read this"**. A flag for text cannot be a column per text field (`residents` alone has six
public prose fields) without becoming unmanageable; the realistic shapes are **(i)** one `content_approval` (three values + who/when)
per subject row, reset to blank whenever a public text column changes — the trigger is the dangerous part, since a save that touches
only an internal column must **not** reset it — or **(ii)** a review queue keyed `(table, row, column)` exactly like `translations`,
which already does this for Thai (`status = 'approved'`) and whose shape the views already read through
`private.approved_translations()`. **[judgement]** (ii) reuses a working pattern and answers "which sentence changed"; (i) is smaller.
**Back-fill is the dangerous part, as the item says:** every published row must back-fill to *Public ok* in the same transaction as any
view starting to test it, or every resident page, campaign, event and project empties at once. And it changes every save path for these
eight tables. **This is the Director-volume question again, larger:** text edits are far more frequent than photo uploads; the weekly
count Lutan was going to see for photos needs a text line beside it before anyone writes this.

## 4. The second gate: every route by which a subject becomes public [measured, from the `where` clauses]

Lutan, 2026-11-05: a *Public ok* photo reaches the website only when its resident or project is also flagged for the website. The
routes as the live views actually draw them:

**A resident** reaches anon by any of:
1. **`is_public_visible = true` and status not Deceased/Adopted** — `public_resident_profiles`, `public_resident_photos` (and the home
   page's featured resident, which `src/app/page.tsx:194` reads through `public_resident_profiles`).
2. **No gate at all** — `public_resident_cards` (and `public_enclosures`, for a resident in a non-`Lifecycle` zone). Every resident ever,
   dead and adopted included, name, bio, temperament and profile photo. This is **ruled**: DB-7,
   `docs/decisions/2026-10-02-public-roster-stays-full.md` (*"Closed, and not to be re-proposed"*) and
   `docs/decisions/2026-09-24-the-public-enclosure-page-lists-its-residents-public.md`. **[judgement] It conflicts with the second gate as
   stated on 2026-11-05**: a *Public ok* profile photo of a resident who is *not* flagged for the website is shown on `/r/<code>` and
   `/e/<id>` and served by `is_public_drive_file()`. Not reopened here; it is a conflict between two of Lutan's own rulings and his to
   resolve.
3. **Adopted in the last 90 days, placement open, `is_public_visible`, not Deceased** — `public_recent_adoptions` (an adopted animal
   stays public here after leaving #1).
4. **`adoption_updates.share_publicly` and `is_public_visible` and not Deceased** — `public_adoption_updates` (adopted animals included).
5. **A campaign `published` and `status <> 'draft'`, and `is_public_visible`** — `public_appeals`, `public_appeal_photos`.
6. As a count only (not content): `public_shelter_stats`, `public_impact_figures`.

**A project** (`project_folders`): **`is_public` and `parent_folder_id is not null`** — `public_projects`, `public_project_photos`; also
named by an event (`public_fundraising_events.project_folder_id`) only when that project passes the same test.

**Other subjects:** event `published and status <> 'cancelled'`; campaign as in 5; desexing drive `status in ('open','cancelled') and
drive_date >= shelter_today()`; Shelter Friend `published` and its contact/supplier not archived; shop link `shown` and (no friend, or
the friend public); donation channel `shown`; impact figure `show_on_website` and a baseline set; a statistic
`public_stat_switches.show_on_website` — **[measured] defaulting to shown when no switch row exists, and four of the eight statistics
(`in_hospital`, `ready_for_adoption`, `adopted_last_7_days`, `intakes_this_year`) have no switch at all.** Site content and site pages
have no subject gate (single row / every page; `hidden_public_pages` is applied by the app, not the view).

**Found while listing route 1, and it bears directly on Lutan's ready ↔ visible question [measured]:** the app has had **no separate
"visible on the website" control since 2026-09-20** (`7312f38b`). `src/app/residents/[id]/edit/actions.ts:200` writes
`is_public_visible: readyForAdoption` on **every** save of the edit form, and intake does the same (`src/app/residents/new/actions.ts:123`).
So the two flags are **already linked, as a permanent equality applied on each save** — the shape `#7aev4` warns against ("a
constraint … that makes `is_public_visible` always equal `ready_for_adoption`"), only per-row on save instead of all at once. A
visible-but-not-ready resident (the long-stay / sanctuary case the item protects) can exist only through a script or a direct write, and
**the first time anyone saves its edit form, it leaves the website silently.** This changes what the production counts the item asks
for will mean, and it means the "link them one way" build is partly a *removal*. **For the planner to put beside those counts.**

## What this did not do

- No migration, no view change, no `src/` change. `check-public-views.mjs` needed no change (its list matched the database).
- Did not read production. Every count above is dev and says so.
- Did not reopen `#h3w7c`, `site_content_photos`, DB-7 or `#vib7j` (video rides `attachments`; untouched).
- `#7aev4` is **not** ticked: its build still waits on Lutan's numbers.
