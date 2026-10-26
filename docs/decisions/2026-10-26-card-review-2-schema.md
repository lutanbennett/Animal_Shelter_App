# Card review 2, the schema half (migration 0268) — 2026-10-26

Source: Lutan's answers to the card reports for cards 11–29 (backlog items "Card review decisions, cards 11–21" and "22–29"). This is
clause (a) of both. The app half (hidden buttons, the broken saves, wording, the preview idea) is a later stream.

## What changed

- **Medical and Contacts split, keys kept.** `medical_records` stays and is shown as *Manage medical*; new `view_medical` holds the reads.
  `contacts` stays as *Manage contacts*; new `view_contacts`; and a third, `publish_shelter_friends` (`friends.manage`). Keeping the old key
  as the manage half means no role is re-pointed and no tile moves. The only holders on production (read 2026-10-26) were staff
  (`medical_records`) and management (`contacts`); the file gives management the publishing card, and `cards-union` is unchanged.
- **Card count 30 → 32, not 34.** The brief's "six new minus two deleted" counted Manage medical and Manage contacts as new; they are the
  existing keys. New: `view_medical`, `view_contacts`, `publish_shelter_friends`, `website_photos`. Deleted: `operations_landing`,
  `management_landing`. 30 + 4 − 2 = 32. `check-cards-count.mjs` asserts 32.
- **Book clinic visits** includes View medical (clinic list + medical history at read) and holds `medical.visits` at edit, so it edits and
  cancels. `clinic_visits` has no delete policy, so there is no delete.
- **Reads:** Dashboard (who-and-where, clinic visits, maintenance jobs), Donations (who-and-where, project folders), Bills (maintenance
  jobs), Enclosures / Meme library / Assistant (who-and-where; Assistant also enclosures and **loses `assistant.record`**), Add Shelter
  Photos (who-and-where **instead of** `resident.record`), Approve photos and Run appeals (include View residents).
- **Who does what read only:** `roles.view` is now a level activity held at read; routes, `opensWhoDoesWhat` and the page guard ask `read`.
- **Website photo strip:** new `website.gallery`; `site_content_photos` writes now ask it. The Website card no longer adds a public photo.
- **Landings deleted** as cards. Nobody held them; the landings open on `opensAnyIn`, which never read them.

## Left out on purpose

- **Run appeals gets no medical-history read.** His word was "potentially"; it goes back to him as a yes/no.
- **Donations: the appeals list.** The appeals policy asks `appeal.run` at edit, a yes/no; there is no read to grant without handing over
  write. Needs an app-half decision (a read level, or a names-only view).
- **Website hero photo** is a column of `site_content`, writable only under `website.content` edit. It stays with Website until the app
  half moves it behind a function.
- **Website photo card opens the page on `website.content` at read**, but the page and its actions still ask edit; the app half must ask
  `website.gallery` for the strip.
- **No new card reports.** `build-card-report.mjs --check` requires none, and a report is written from driving the card in a browser.
  Retired: the two landing reports.

## Not caught by `check-card-grants` here

Dev also carries `0267` (PR #967), so the check reports `record_weight` / `feed_special_diets` `recurring.do_own` as extra until #967 merges.
