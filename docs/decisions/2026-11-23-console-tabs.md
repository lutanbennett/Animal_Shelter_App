# The console's shelter settings become tabs with measured marks (#pacon)

2026-11-23, `claude/product-console-build`. Lutan's words, from the 2026-11-23 guided session recorded on `#pacon`:
*"what would be good on teh card is a link to teh shelter site"*; *"Can I suggest using tabs for the different sections eg Security,
Website, Contact etc"*; *"I think doing a summary tab and colour coding the tabs is a good solution"*; *"Green Amber Red - Red not done,
Amber waiting on someone else, Green is complete"*.

## What the brief assumed, and what was true

The brief described the 2026-11-20 redesign as still to build. It had already shipped (PR #1789, `2026-11-20-console-cards-redesign.md`):
one card per shelter, settings behind the card, per-control answers (#msgtp), archive and reopen (#tstsh). `shelter_hosts.is_primary` was **not**
dropped on purpose: migration 0428 *adds* it, and its "undo" comment is what the brief read. So open question 1 was already answered by 0428
(a primary flag, backfilled only where unambiguous). **No migration is needed and none was written.** This stream built what the item's own
"WHAT IS LEFT" names that was not yet built.

## What was built

- **Settings are tabs**: Summary, Setup, Google, Website, Contact, Close. The existing sections moved, unchanged, under them.
- **Marks on the tabs, a shape beside every colour** (`tabTone()`): red `✕` not done, amber `◐` waiting on the shelter, green `✓` done, grey `○`
  recorded but not measured. Google is amber while Drive or Calendar is unconnected (only the shelter's own Admin can finish it, which is his
  amber), red when a connection has died. Setup is green only when all five steps are. Contact is green when the account holder and both names exist.
- **Website is never green.** His condition (a): green must be measured. Nothing on this screen checks that a host answers, so a recorded
  address is grey with the words "nothing here checks that it answers yet". Making it green is `#hstau`'s job (the does-it-answer check).
- **Card**: the website is a link ("Visit site", opens in a new tab).
- **Finding 5**: the console's own address (`PLATFORM_HOST`) is labelled as such and offered no Remove.
- **Finding 2, the visible half**: the names form opens with the shelter's current name filled in, not blank. The two-columns defect itself
  (`name` versus `display_name`/`short_name`) is `#nmcol`'s and was not touched.

## The three open questions

1. The website: the primary-flag answer from 0428, as above.
2. Health indicators: already per shelter (Drive, Calendar, website setting, setup progress), the database dot labelled as the system's.
3. Setting up versus broken: the card has four states already; the tabs add amber for waiting-on-someone-else, so red is never used for a wait.

## Left out, on purpose

- The Security tab: `#shsec`'s. Admin role and login stay in Setup.
- A Drive-connect button: a product administrator cannot do it for a shelter; the Google tab says so.
- Card-gating: these writes are product administrator plus aal2, not a card (`2026-11-18-product-admin-screen.md`); controls are still drawn only when `canWrite`. No card invented.
- Production and `test123`.
