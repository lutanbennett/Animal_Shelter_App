# 2026-11-20 — What Lutan wants from the product-administrator console

**These are requirements, not a design. Nothing here was built, and no layout, component structure or
schema is proposed.** They were taken from Lutan in a guided session on 2026-11-20, one question at a
time, after he was shown an inventory of everything `cooperjaidee.org/platform` renders today.

**Read this before touching `src/app/platform/page.tsx`, `ProductAdminPanel.tsx` or `actions.ts`.** The
backlog item is `#pacon`, and this file exists because a ticked item is what nobody re-reads — that trap
cost real time twice on 2026-11-20 alone, when facts Lutan had already given were recorded only inside a
ticked item and a session went off to re-ask him for them.

**Why his words and not a specification:** he is the only user of this screen, and the item says in terms
that *a redesign begun from a guess will be rebuilt* and that *his own account of the friction is the
entire requirement*. He is not a developer; anything he must work through item by item is not a delivery.
So the requirement is what he said, and the measurements beside it are there to stop the next session
re-deriving them.

## How this started

**Lutan, 2026-11-20, minutes after signing in to the console for the first time with the second step
passed:** *"I can click on items and add things but the interface is way too confusing for proper
management and needs a redesign"*. And, walking the screen: *"it's so hard to understand what is going
on with that page"*.

**Read the first half of that sentence as carefully as the second: the console FUNCTIONS.** Clicking and
adding both work. This is a usability item, not a fault, and nothing on it is broken or unsafe.

**His direction for the landing page:** *"The landing page needs to be some cards that give me access to
the settings for each shelter and some action buttons, there is way too much information on the landing
page"*. So the landing page becomes **one card per shelter** — enough to see what state that shelter is
in, plus action buttons — and everything else moves behind the card.

## A. What goes on the card

> *"for the shelter card it should have shelter name, website associated with it, contact name and number
> for shelter, then clicking the card allows me to change settings"*

Four things, and **clicking the card opens that shelter's settings**.

**Measured against the live schema the same day, two of the four do not exist as he needs them.**
`shelters` holds `id`, `key`, `name`, `created_at`, `display_name`, `short_name`, `receipt_series`,
`receipt_issuers`, `drive_root_folder_id` and `public_site`. So:

| he asked for | what exists today |
|---|---|
| shelter name | held |
| the website associated with it | held only as a **list** in `shelter_hosts`, each row with its own Remove, with **no notion of *the* website** |
| contact name | held **nowhere at all** |
| contact number | held **nowhere at all** |

## B. Who the contact is — the account holder, and not the Admin login

Asked directly, because the answer decides whether new columns are needed:

> *"it will most likely be the admin for the shelter or could be a director who delegates the admin to
> someone else. It's the account holder"*

**So the contact is the ACCOUNT HOLDER: a distinct concept from the Admin login.** It is the person
responsible for the relationship, who may never use the system. **It cannot be derived from the Admin
login and must be stored.**

**It is already collected once, so it must never be retyped.** Migration `0427` (`shelter_enquiries`,
shipped 2026-11-20) captures `contact_name`, `email`, `phone` and `location`. `#shsup`'s own done-when
already requires turning an accepted enquiry into a shelter *"without retyping what they already told
us"*. **Carry the account holder from the enquiry onto the shelter record.**

## C. Health indicators — his stretch goal, and mostly new work

> *"Possibly as a stretch a health indicator would be good - consolidation of the status KPI's"*

and then, sharpening it himself:

> *"So health indicators will need to be per shelter for things like drive health etc as they are
> different per shelter"*

**He is right, and the measurement is the useful part: of the eight checks in
`src/lib/status/health.ts` — database, Drive, migrations, release, release mail, backup, origin/Pi, cron
jobs — exactly ONE is genuinely per-shelter, and that is Drive**, because each shelter has its own
`drive_root_folder_id` and will have its own connection. **The other seven are properties of the whole
system**: one database, one release, one Pi, one backup. A red there is red for every shelter.

**Per-shelter candidates, for whoever designs it:** Drive connected and reachable (real health, and the
one that ports over), `public_site` open/locked/off (held today, never surfaced), Calendar connected, and
the console's five setup steps.

**He asked that the database dot appear behind the card. It is shared by every shelter, so it must be
labelled as the system's** — otherwise it reads as a fault with that one shelter when it is everyone's.

### The open question he has NOT answered

**Whether "still being set up" and "set up but something is broken" should read as different states on
the card.** The five setup steps mean the first, which is not the same red as the second, and he said he
would act differently on each. **It was put to him and he did not answer it. It is his to answer when
someone builds this — ask him, do not choose for him.**

## D. What sits behind the card, and the one hard limit

> *"When I click on a card I want to have all of the available settings including settings that the
> shelter can perform eg setup google drive button etc and possibly the health indicators for the shelter
> site and database / calendar etc"*

**ONE HARD LIMIT WAS PUT TO HIM, AND HE MUST NOT BE PROMISED OTHERWISE: a product administrator CANNOT
set up a shelter's Google Drive on its behalf.** Connecting Drive means the account holder grants
permission in their own browser, signed in as themselves. Google requires that, and no console can do it
for them.

**So a "set up Google Drive" button can do one of two things, and neither of them is finishing the job:**

1. send the shelter's Admin a link, and show when it is done; or
2. start the flow while he is sitting with them on a call.

**It can never complete in their absence.** A button that looks as though it can is a promise the console
cannot keep.

## E. No delete — an archive switch instead

His own answer, and a better one than the question offered:

> *"With the console I think we don't have a delete but maybe we have a turn off switch so we can shut
> off access but still have all of the data secure and then reopen later if needed - a bit like an
> archive and unarchive"*

**Two things for whoever builds it.**

**(1) There are two doors into a shelter, and the switch must close both.** The public website already
has an off switch — `public_site` open/locked/off, migration `0426`. **Staff access to the app has none.**
So a half-built switch gives a shelter that looks closed from outside while its staff carry on working
inside: the worst of the three states, because it looks safe and is not.

**(2) Off means unreachable, not gone.** Archiving must not touch the shelter's Drive photos, its backups
or its records. **That is the whole reason he chose archive over delete, and it should be stated rather
than inferred.**

`archived_at` is already the house pattern in roughly fifteen places.

**This also disposes of `#tstsh` without anyone building a dangerous delete button.** A `test123` shelter
was created on **production** on 2026-11-20 while diagnosing the console, and there is no way to remove
it: create is one press, the key *"cannot be changed afterwards"*, and the only Remove buttons on the page
are for web addresses. **Archived, it simply stops being reachable** — which is all that was ever needed.

## The supporting detail, measured in his own browser the same day

Context for the redesign, not requirements in themselves:

1. **The reply to a button is painted about two screens above the button.** One shared `msg` state
   rendered at `ProductAdminPanel.tsx:124`, above the Shelters heading, written by ~15 separate `say()`
   calls — while *Create shelter* and *Add a product administrator* sit at the very bottom. **He pressed,
   saw nothing, and reported the saves as broken. They were not**, and they worked the moment he was told
   to scroll up. Carried as `#msgtp`; asked whether to fix it first, he answered **"Wait for the
   redesign"**, so it ships as part of this work and not before it.
2. **There is no overview.** You cannot tell what state a shelter is in without scrolling its whole card.
3. **The first thing under a shelter is an editable name box**, before anything says how that shelter is
   doing.
4. **Two checklist lines can never tick and he cannot act on them** — Drive and Calendar both say the
   shelter's own Admin does it in Settings — so the list is part progress and part notice board.
5. **All four web addresses look identical, with Remove beside each**, including `cooperjaidee.org`, the
   address of the console itself. Nothing says which address does what.

**Worth keeping — not everything is wrong.** The *"→ Next step: Has a web address"* line on an incomplete
shelter is exactly the kind of thing the new cards should lead with.

**One thing that may not belong to the console at all:** he had just been through two unrelated sign-in
faults getting in (`#nxtqs`, `#stpbk`), so some of the confusion may belong to those. Worth separating
before concluding anything.

## Where to look, as context only

`src/app/platform/page.tsx` and `src/app/platform/ProductAdminPanel.tsx` are the whole console, plus
`actions.ts`. `docs/test-plans/platform-console-finish.md`, `shelter-management-app.md` and
`padmin-create-login.md` record what each piece was built to do.

**Related but different, and not to be merged in:** `#nxtqs` and `#stpbk` are the two sign-in hops;
`#apxld` is the product landing page at the apex; `#shsup` is the enquiry that feeds section B.

## Not decided here

**The design.** No layout, no component structure, no schema, no columns, no migration. **The design is
still nobody's**, and the one unanswered question in section C is Lutan's.
