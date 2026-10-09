/**
 * The release notes register, rendered at /releases and mailed to admins on
 * a major release (scripts/deploy.mjs → worker/release-mail.mjs).
 *
 * How it is kept (docs/decisions.md, "Release notes register"):
 *
 *  - A PR that changes something a user would notice adds a line to
 *    `unreleased`, in the same PR — written for a shelter user, not as a
 *    commit message. Fixes nobody sees don't need one, but the test plan
 *    says so: its release-notes line is `n/a: <reason>`, and
 *    scripts/check-test-plan.mjs flags a PR that touches pages, components,
 *    the manual, i18n or the Worker with neither.
 *  - Cutting a release is its own small PR: move `unreleased` into a new
 *    entry at the top of `releases`, give it the next version and today's
 *    date, decide `major`, and set package.json's "version" to match.
 *    `scripts/deploy.mjs --env production` refuses to deploy while
 *    `unreleased` has lines in it or package.json disagrees with the newest
 *    entry, so what goes live is always a release someone wrote down.
 *  - Numbering, until go-live: a major release bumps the middle number
 *    (0.1.0 → 0.2.0), anything else the last (0.1.0 → 0.1.1). Go-live is
 *    1.0.0, and from there major bumps the first number.
 *
 * Plain data with no imports: scripts/deploy.mjs loads this file directly
 * under Node's type stripping, and the Worker bundles it to answer
 * /api/releases/current.
 */

export type Release = {
  /** Semver without the "v": "0.1.0". */
  version: string;
  /** The day the release was cut, YYYY-MM-DD. */
  date: string;
  title: string;
  /**
   * Worth an email: something admins should know has changed. Only a major
   * release is mailed; the rest just appear on the page.
   */
  major: boolean;
  /** What changed, one plain-language line each. */
  notes: ReleaseNote[];
};

/** The signed-in roles, as the manual names them (src/lib/manual/types.ts). */
export type ReleaseRole = "admin" | "management" | "staff" | "vet" | "volunteer";

/**
 * One line of a release. A plain string is for everyone; `roles` narrows
 * it to the people who will notice it, and /releases opens on the reader's
 * role (docs/decisions.md, "Release notes by role"). Tag a line only when it
 * is plainly not for some role — a vet has no use for a stocktake line —
 * since an untagged line is never filtered out, and a wrong tag hides it
 * from the people it is for. Lines released before tagging existed stay
 * untagged: they are history, and untagged reads as everyone.
 */
export type ReleaseNote = string | { text: string; roles: ReleaseRole[] };

export const noteText = (note: ReleaseNote): string =>
  typeof note === "string" ? note : note.text;

export const noteRoles = (note: ReleaseNote): ReleaseRole[] | undefined =>
  typeof note === "string" ? undefined : note.roles;

/** Written by feature PRs; becomes the next release when one is cut. */
export const unreleased: ReleaseNote[] = [
  "New: Operations → Outreach visits. After helping dogs at a temple or in a village, record it on your phone in about 30 seconds: the date and place, what you did (fed, treated, sterilised, vaccinated, rehomed from a temple), how many dogs, and photos if you like. A new temple or village can be added as you go. The visits add up to \"Dogs helped at our outreach visits\" on the home page, and the sterilised dogs also count in \"Sterilisations in local villages\". The home page shows the outreach figure once its starting number and date are entered on Settings → Website. Management can record visits today; Admin can change who may on Settings → Security. Photos are never shown on the website. In Thai too.",
  "When you foster or rehome a resident, the carer list now shows each carer's name only, without their phone number. Management still sees carers' phone numbers and addresses on the Contacts page.",
  "The deceased-resident summary PDF and the printable manual no longer drop the last letter or bracket from a line with ำ in it (for example a Thai name ending in จำกัด (…)), and Thai text copied out of either PDF now comes out right.",
  "New: Management → Donations. Record a gift (who gave, when, how, what it is for, and one line per item with its amount in baht, or a description for a gift in kind) and the app issues its receipt straight away, numbered from LCA0009000 and never repeated or skipped, in the same layout as the receipts made by hand. Choose a Thai or a US receipt; today they differ only in the date order. Thai donor names print correctly. Each receipt is saved on Google Drive under Admin → Donations → Receipts. On a phone, Share sends the PDF through Gmail, LINE or any other app; on a PC, Download and Email draft. A wrong receipt is voided, keeping its number, and a new one issued. The list shows every gift between two dates with its total. For Admin and Management.",
  "Management → Translations is now the one place to translate everything. Besides the long text it always had, it lists every short name a Thai reader sees — diets, medicines, vaccines, procedures, blood tests, how-often labels, stock units, clinics, places, project folders, fixed outgoings and the website's captions — grouped by kind, with a count of what is missing at the top and Missing, Out of date and All buttons. Type the Thai in the box and press Save; you can translate a list here even if you cannot open the list itself. Medicine and clinic names left empty say Shown as typed: that is fine when the name reads the same in Thai. Each of those lists also has a Thai name box of its own, so a new diet or vaccine can be given its Thai as it is added, and every screen that shows these names now shows the Thai to someone reading in Thai.",
  "Recurring job titles and descriptions now wait on Management → Translations with the rest of the text that needs translating, so they can be given their Thai there.",
  "Enclosures and Residents now have one row of zone chips instead of two. The Everywhere / On-site / Off-site buttons are gone: the shelter's own zones each have a chip as before, and every off-site zone is now under one Off-site chip, which also takes in any off-site zone you add later under Settings → Zones. Pick no chip to see everything. Old links and bookmarks still open the matching chips.",
  "The menu's Shelter Operations is now called Operations. On the Residents list, the Status zone chip is replaced by Unallocated, which lists only residents waiting for an enclosure (it used to list the adopted too), and Fostered and Hospitalised chips now sit beside Adopted. On a computer the cursor starts in the Search box, and a chip reader works there too. Enclosure cards show the maintenance spanner only when there is open work, with just the number. In Thai too.",
  "On a vet's page, every card now opens what it counts. Tap Scheduled for a list of the clinic's overdue visits — in red, oldest first — then the upcoming ones, each with the resident's photo and an Edit button to mark it done or cancelled. Visits and Residents seen open their lists; Spend, Procedures, Blood tests and Prescriptions show just the visits with a cost or with those records. On a doctor's Appointments page, the visits still to write up now have their count and dates in red.",
  "Contacts now have two boxes, Address and Map link, instead of one. The address is printed as words on the contact's page, the contact list and the Shelter Friends card — never as a long web link — and the map comes from the Map link, which you get in Google Maps with Share, then Copy link. Both are on Management → Contacts (add and edit) and the Add a Shelter Friend wizard. A link pasted into Address by mistake moves to Map link when you save. In Thai too.",
  "Settings → Recent changes now names every kind of change it lists: impact figures, facility plans, roles and permissions no longer show a blank, and you can pick them in Kind of record. Adding or replacing a facility plan now appears there too. An impact figure edit can be undone from the list; a plan change is undone with Undo the replace on Settings → Facility map; roles and permissions are never undone from the list, and the line says why instead of wrongly blaming files. In Thai too.",
];

/** Newest first. */
export const releases: Release[] = [
  {
    version: "0.22.0",
    date: "2026-10-08",
    title:
      "Medication and Diet lists move to Settings, Management runs the website, and zones have their own colours",
    major: true,
    notes: [
      "Medications and Diets are each now two pages. The lists themselves (names, units, the daily amount for each size, merging duplicates, the units things are bought and counted in) are under Settings → Medications and Settings → Diets, for an admin. Management → Medication stock and Diet stock keep what changes day to day: how much is in the cupboard, the price, when to reorder, label photos and the forecast, laid out as cards that fit a phone. A price can now have up to 4 decimal places, so food bought by the sack can be priced per gram. In Thai too.",
      "Management can now edit the public website: Management → Website opens for a Management login, on a phone or a computer, and every save works — the home page, the information pages, the gallery, the contact details and the impact figures. Until now only Admin could.",
      "Each zone can now have a colour, so the blue zone is blue in the app too. The Director picks it under Settings → Zones from twelve named colours (or No colour), and it shows as a small dot beside the zone's name on the residents list, a resident's page, the Enclosures page, the maintenance board, every zone picker and the medical and diet lists. The zone filter chips are filled with their zone's colour, with a tick on the ones chosen. Zone names no longer need the colour typed into them. In Thai too.",
      "Zones and enclosures now appear in the shelter's own order instead of A-Z, everywhere they are listed: the Enclosures page, every zone and enclosure picker, the residents list and the medical and diet lists. The Director sets the order under Settings → Zones and Settings → Enclosures with up and down arrows that work on a phone, and a new zone or enclosure goes last. Numbers are now read as numbers, so Enclosure 2 comes before Enclosure 10. In Thai too.",
      "The stocktake now lists medicines and food in the order they sit in the cupboard, so whoever counts walks the shelves once. Management sets the order with up and down arrows under Cupboard order on Medication stock and Diet stock, on a phone. A price per gram or per ml now shows the pack price beside it (฿0.035 per g, ฿35 per kg). Medication stock, Diet stock, Vets, Contacts and Stock between counts in Management no longer show the 'Best on a larger screen' note: they work on a phone.",
      "Facility map plans are now added and replaced in the app, with no developer needed. Under Settings → Facility map, take a photo of the drawing or choose a picture file, on a phone or a computer. Replacing a plan shows the new picture with everything already placed drawn over it, and asks whether to keep those shapes (the same drawing, a sharper copy) or clear them to place again (a new layout). A replace can be undone, and the page says who last replaced each plan and when. Plan pictures can only be seen by people signed in to the app. In Thai too.",
      "Tapping the map on a contact's page, or on a Shelter Friend's card, now opens the place in Google Maps every time, instead of sometimes landing on a Google 'not found' page. A map link that no longer works shows no map rather than a broken one, and the contact's page says so. The address boxes now explain, in English and Thai, how to get a link that pins the exact place: in Google Maps, find the place, tap Share, copy the link and paste it in. Management → Website no longer accepts a map link that Google says doesn't exist.",
      "On a phone, your name and role at the top of the screen are a proper button again for vets and the head of medical. It had been squeezed to a sliver beside the logo; it now sits on its own line, so you can tap it to see which account you are on.",
    ],
  },
  {
    version: "0.21.0",
    date: "2026-10-08",
    title:
      "Shelter Operations: the daily work in one menu entry, and more buttons you can tap on a phone",
    major: true,
    notes: [
      "The menu has a new entry, Shelter Operations, for the daily work: Enclosures, the Medication list, Maintenance, Stocktake, Deliveries, Projects, Vets and Contacts are now tiles inside it instead of separate menu entries. You see only the tiles you can use. Staff and volunteers will see Shelter Operations in their menu for the first time. The pages themselves have not changed, and links to them still work. The Website page is now a tile on Management instead of Settings. In Thai too.",
      "Home page: the rehomed and village sterilisation figures now show just the number, without \"About\" in front or the note underneath about earlier work being estimated. In Thai too.",
      "Enclosures: each zone now shows how many residents are in it and how many spaces are free, with a total for all zones above. A full or over-capacity enclosure never takes spaces away from the others.",
      "Web addresses on the public pages are now links you can tap, such as the DonorBox address on the Donate page. Staff can also put words on a link, for example [Give monthly](https://…), and add email and phone links. This works on the information pages and on project stories.",
      "More buttons are now big enough to tap with a thumb on a phone: Undo, Skip, Add note and Done on My tasks, the buttons in the photo viewer (close, Remove photo, Set as profile, Move, Show all), the Units buttons, and the account menu at the top. On a computer they look as before.",
      "The rest of the small buttons are now big enough to tap on a phone: Save and Cancel when editing, Retry and Remove on uploads, Confirm and Cancel in the assistant, and the setup tables in Management and Admin. The × that removes a file from a blood test or procedure now shows on a phone (before, it only appeared under a mouse), and it asks before deleting the file.",
    ],
  },
  {
    version: "0.20.1",
    date: "2026-10-07",
    title:
      "Phones stop zooming in when you tap a box, the menu stays put on a computer, and the map shows three more rooms",
    major: false,
    notes: [
      "Tapping a text box or a drop-down on a phone no longer zooms the page in on an iPhone. Every box on every form now uses a size Safari leaves alone, so the page stays put and does not slide sideways after you tap.",
      "Enclosures → Map now shows the Medical room, the Kitchen and Storage as blue dashed shapes with their names, so you can see where they are; tapping one shows its name and opens nothing. The Director places them under Settings → Facility map.",
      { text: "Settings → Website → Home page now has Impact figures: enter how many animals were rehomed, and how many village sterilisations were done, before the system began, with the date that is true up to. The home page then shows that number plus every adoption recorded since, marked \"About\" with a note that the early part is an estimate. A figure with nothing entered is not shown, and every change is kept in Recent changes.", roles: ["admin"] },
      "The Notes boxes on the resident forms (Rehome / foster, Return to shelter, Move, Send to hospital, Return from hospital, Record a death, Undo a death, Adoption updates, Edit a resident and Add a resident) are now taller on a phone, so they look like somewhere to write a sentence, and tapping into one no longer zooms the page in and lets it scroll sideways on an iPhone.",
      { text: "Settings → Recent changes now fits on a phone. The filter row (table, person, dates) used to push the page sideways because the person list was wider than the screen; it now stays inside it, so the audit log reads without side-scrolling.", roles: ["admin"] },
      "On a computer, the top bar and the menu on the left now stay in place while the page scrolls, so you can reach any other page without scrolling back to the top first. A long menu scrolls by itself inside its own column. On a phone nothing changes.",
      "Tapping a resident's name card with your phone now always shows at least what a visitor would see. Before, the 2IC, the Heads of Medical and Maintenance and volunteers saw less than a stranger (just the name and where the resident lives), and a vet saw an error for a resident their clinic does not treat. Now they see the resident's card with photo, age and temperament, plus where the resident lives and buttons for the jobs they can do. Whether these roles also read the medical record from a card is the Director's choice and has not changed.",
    ],
  },
  {
    version: "0.20.0",
    date: "2026-10-07",
    title:
      "Your name and role instead of your email, the Director’s answers on who sees what, and full-size buttons on a phone",
    major: true,
    notes: [
      { text: "The Contacts page (the list of carers, volunteers and suppliers with their phone numbers and addresses) is now for Management and the 2IC only, as the Director decided. The 2IC sees each person's name and phone number, no address. Staff and volunteers no longer see Contacts in the menu: if you need a carer's number, ask Management. Choosing a carer when you take in or rehome a resident works as before.", roles: ["management", "staff", "volunteer"] },
      "The top of every screen now shows your name and role (for example \"Lutan · Admin\") instead of your email address. Tap it to see which account you are signed in to, change your name, or sign out. You can set your own name under Change password, and an admin can set anyone's under Settings → Security. Everyone with a name set is shown by it wherever people are picked or listed, in English and Thai.",
      "On a phone, the buttons across the top of every screen are now full-size: Sign out (it was the smallest button in the app, easy to miss and easy to hit by accident), the menu button and the Assistant button. The top bar now takes two lines on a phone so everything fits, and your full name and role show in Thai as well as English. On a computer nothing changes.",
      "On a phone, the small controls that were easy to mis-tap are now full-size buttons: the cross that removes a resident from a vet visit or immunization (it was 7 pixels wide), Record chip, Add a new carer, Select residents, Add more, Change, and Show anyway. The Cancel and Done buttons in the resident picker and in every confirmation box are bigger too.",
      "The Save, Filter, Send, Move and Book buttons on resident, medical and account forms are now big enough to tap reliably on a phone, in English and Thai.",
      { text: "Management can now record or correct a resident's microchip number, as the handbook always said they could. Before, the chip form was refused for Management.", roles: ["management"] },
      { text: "The vaccine list on the Log immunizations form no longer shows what a vaccine costs to anyone: the 2IC can record vaccinations without seeing the price, and prices stay under Settings → Immunization Types.", roles: ["admin", "management", "staff", "vet"] },
      { text: "Staff keep seeing a Shelter Friend's card; the Director agreed there is nothing to hide, since the Friends band is public on the website.", roles: ["management", "staff"] },
      "Choosing a folder when you add resident photos now says whether the photo will appear on the public website (every folder except Medical) or never will (Medical). Only people allowed to publish photos can file one outside the Medical folder, and that is checked in the database as well as on the page.",
      "When a resident who has died has a profile photo that could not be put in their summary PDF, the page now says so as soon as you choose or save it, instead of leaving a PDF with no picture and no word. Phone (HEIC) photos are handled by Drive.",
    ],
  },
  {
    version: "0.19.3",
    date: "2026-10-06",
    title:
      "Download the residents you are looking at, and a Thai project title where you cannot miss it",
    major: false,
    notes: [
      "On the Residents list, a new Download spreadsheet button saves the residents you are looking at (the same place, zone, search and Show all as the list) as a file for Excel or Google Sheets, with more than the list shows: sex, age and estimated birth year, size, colour, whether chipped, prescriptions running today, the next vet visit, diet and latest weight. On a computer, tick residents first to save only those. The page says where the file went, and a volunteer's file holds only who and where.",
      "A project's Thai title is now easy to find and hard to forget. It shows under About this project (with the Thai title field in Edit details), and a published folder with no Thai title says that Thai visitors see the English title. Settings → Website marks those projects with an Add Thai title link, and Management → Translations lists them at the top, so visitors reading Thai see Thai project titles on Our work.",
      { text: "On Management → Purchasing, the medicines and food that need nothing for the period are now folded into one line under each table (\"12 items need nothing for this period\"), so the page shows what to buy. Tap the line to see them, with the working that shows why. An item that has never been counted, or was counted long ago, is never folded, even when the sum says nothing to buy.", roles: ["admin", "management"] },
      { text: "On the Purchasing screen on a phone, the \"Not counted yet\" box now also names items nobody has ever counted that show nothing to buy. Before, they were left out, so \"nothing to buy\" looked safe when it was only a guess. The same items are now counted in the banner on the computer page.", roles: ["admin", "management"] },
      "On a computer, the map under a contact's address is now a sensible size instead of stretching across the whole page.",
    ],
  },
  {
    version: "0.19.2",
    date: "2026-10-05",
    title:
      "Phones get bigger buttons and stop sliding sideways, and a weekly job can go to the 2IC",
    major: false,
    notes: [
      { text: "A weekly job that links to a page, such as the stocktake, can now be given to the 2IC from Recurring jobs, and it keeps its link on her My tasks. The same goes for the Head of Medical and the Head of Maintenance: they are judged by what their own role may open, not by the plain Volunteer role they share a login type with.", roles: ["admin", "management", "volunteer"] },
      { text: "The English / Thai switch at the top of every page, and the sign-in screens, is now a full-size button on a phone (it was only 24 px tall), and so are the numbered step buttons when logging a maintenance job, registering a resident or adding a Shelter Friend. On a computer they are slightly smaller than on a phone.", roles: ["admin", "management", "staff", "volunteer", "vet"] },
      { text: "On Maintenance, Projects, Deliveries, Contacts, Vets and Enclosures, the actions that were plain words are now buttons with an icon beside the word, at least 44 px tall on a phone: Edit details, Delete job, Rename, Move, Delete folder, the Manage links to Management and Settings, Log a job on an enclosure, the Friend profile's Publish, Edit, Remove and logo buttons, and the Back links on pages you cannot edit. Deleting a delivery is now a small bin button with the word showing when you hold over it, and on a project's photos the caption, cover and remove actions are icon buttons that are easy to tap. Adding or editing a translation is a button too. The sign-in page's links are easier to tap. Deleting still asks first.", roles: ["admin", "management", "staff", "volunteer", "vet"] },
      { text: "On a phone, the Rehome / foster form no longer slides sideways because of a long carer name, and the Medications and Diets pages no longer slide sideways because of the \"Stock between counts\" link, which now wraps onto a second line.", roles: ["admin", "management", "staff"] },
      { text: "On a phone, the Hand over section of Recurring jobs no longer makes the whole page scroll sideways when a person's name or email is long.", roles: ["admin", "management"] },
    ],
  },
  {
    version: "0.19.1",
    date: "2026-10-05",
    title:
      "A facility map an admin can draw, a shorter Management home on a phone, and icon buttons across Management and Settings",
    major: false,
    notes: [
      { text: "Settings now has a Facility map page where an admin places the enclosures on the shelter's plans: pick an enclosure, click two corners (or each corner of an odd shape) on the plan, and it is saved and the next one is picked for you. Corners can be dragged to fix a shape, and a plan picture is added to a zone or to the overview from the same page. Everything placed shows at once on the Map under Enclosures, and the enclosures not yet drawn there are still listed beneath it. Best on a computer.", roles: ["admin"] },
      { text: "The Management home on a phone is now a short screen instead of every page: Recurring jobs, Intake and Residents, with My tasks after them. Booking a vet visit, a resident's medical records and their details are on the resident, one tap from Residents. Everything else is still in the menu.", roles: ["admin", "management"] },
      { text: "On the Management pages, the actions that repeat on every row (edit, count, merge, delete, archive, restore, make standard, pause, resume, publish, unpublish, move up and down, mark a doctor as left) are now small icon buttons, each at least 44 px square on a phone, with the word showing when you hold or hover over it. A delete that is not allowed says why when you hold over it. Add buttons carry a plus, the stock shortcuts at the top of Medications and Diets are real buttons, and Print and Download CSV are easier to tap. The phone screens for purchasing and the medication list were already big icon-and-word buttons and are unchanged.", roles: ["admin", "management"] },
      { text: "On the Settings pages, the actions that repeat on every row (edit, delete, merge, archive, restore, move a photo earlier or later, take a project off the website) are now small icon buttons, each at least 44 px square on a phone, with the word showing when you hold or hover over it. Add buttons carry a plus; Replace photo, Issue temporary password, Approve and Deny, Check now, Send a test and Undo this change now show an icon beside the word, and Clear on Recent changes is easier to tap. Deleting a gallery photo, a user or a type still asks first.", roles: ["admin"] },
    ],
  },
  {
    version: "0.19.0",
    date: "2026-10-04",
    title:
      "Two more logins with their own home screens, medicine rounds, a map of the site, and deliveries step by step",
    major: true,
    notes: [
      { text: "A new kind of login now exists: 2IC. Her home has four big buttons: Do Stocktaking, Do the Purchasing, Record a Delivery and Do Maintenance. She can count the stock, see what to buy, record what arrived, and run the maintenance board and her own recurring tasks. She sees the stock figures but never the price of a medicine or a diet, and she cannot correct a stock figure, set up recurring tasks, see residents beyond who they are and where they live, or see medical records, contacts or money.", roles: ["admin", "management"] },
      { text: "A new kind of login now exists: Head of Maintenance. Her home is one big button, Do Maintenance, which opens the maintenance board. She can log a job, assign it, move it on and complete it, and mark her own recurring tasks done on My tasks. She sees who a resident is and where they live, and the enclosures, and nothing else: no medical records, stock, contacts or money. She cannot set up recurring tasks, add photos to a job or delete one.", roles: ["admin", "management"] },
      "The Head of Medical now has three more jobs on her phone, each with pictures first. Record Weight: tap the resident's photo, type the weight on a big open keypad, save; weighing the same animal again the same day replaces the reading instead of adding a second. Add Medical Photos: tap the resident, then Take a photo or Choose from phone; the photos go in the Medical folder and never on the website. Feed Special Diets: a list, by zone and enclosure, of everyone on a non-standard diet, with the amount for one meal beside a bowl and the meals as sunrise and moon, for the Morning or Evening meal you pick. A page you are not allowed to open now shows the in-app \"You don't have access\" page for this role, instead of sending you out to the public website.",
      "The medication list now asks which round you are doing: Morning, Lunch or Evening. It starts on the one that suits the time of day, but you can tap another, so bagging up lunch at nine in the morning shows lunch, not the morning round. You see only the doses for that round, and a new Stock-room pick list adds up what each zone and enclosure needs, medicine by medicine, to bag before going out. Amounts are now pictures (tablets, capsules, a syringe filled to the mark, drops) and the rounds a medicine is given in show as sunrise, sun and moon, so the words are only there as backup.",
      { text: "Recording a delivery is now a few short steps on a phone, one question at a time: what arrived, which one, how much, when, and who sent it. The last screen says in words what will be recorded, and Back never loses what you typed. After a save, Record another item keeps the day and supplier. Deliveries now has its own place in the menu, next to Stocktake, instead of being a small link at the top of Stocktake.", roles: ["admin", "management", "staff"] },
      { text: "Enclosures now has a Map next to the List, so you can find your way round the site and open an enclosure from the plan. It shows the shelter's hand-drawn plan, a zone at a time, with every enclosure coloured by how full it is, its count, a spanner for open maintenance and a bowl for special diets. Tap a shape to see it, then Open enclosure; pinch, double-tap or use + and − to zoom. Enclosures not yet drawn on the plan are listed beneath it. The Map button appears once a plan has been loaded.", roles: ["admin", "management", "staff", "volunteer"] },
      "On a resident's page, the actions that repeat on every record (edit, remove, restore, end today, and log a blood test, prescription, weight, procedure or hospital stay against a vet visit) are now small icon buttons, each at least 44 px square on a phone, with the word showing when you hold or hover over it. The delete on an adoption update is red. 'Back to …' links have an arrow, and 'Register this chip as a new resident' and 'Edit that reading' are real buttons.",
      "When a save is refused (a date in the future, a move that starts before the last one), the form now keeps everything you chose and typed, so you fix the one thing and press Save again instead of starting over. On My tasks, a \"Done today\" list at the bottom shows what you marked done, skipped or completed today, still there after a reload, each with Undo. Marking a job done that is waiting for another job now asks first.",
    ],
  },
  {
    version: "0.18.0",
    date: "2026-10-04",
    title:
      "A Home screen for everyone, a Head of Medical login, and volunteers narrowed to what they need",
    major: true,
    notes: [
      "Signing in now lands on a Home screen: big buttons, an icon and a word each, one for every job you can do (My tasks, Residents, Stocktake and so on), and nothing you cannot. Home is also the first link in the menu. A vet still lands on their appointments.",
      {
        text: "There is now a Head of Medical login. It opens to one big button, Administer Medication, which shows the medication list for today: who needs which medicine, how much and how often, enclosure by enclosure, with a photo of each animal and each medicine's label. It shows nothing else about an animal and nothing can be changed or ticked off. Managers see the same list, and so does Staff, who could not before.",
        roles: ["admin", "management", "staff"],
      },
      {
        text: "For the Director, who signs in as Admin: on a phone, sign-in opens the Management home; on a larger screen it opens Settings. Across the top of both is a row of buttons to open any other home, Settings, Management, Staff, Vet or Volunteer, to see exactly what that role sees when they ring to say something is wrong. Only Admin has the row, and typing one of those addresses as anyone else is refused.",
        roles: ["admin"],
      },
      { text: "Search on the Residents list now finds a resident by their ID however it is typed: R-0055, R0055, r 0055 or just 0055. On a phone the search box has its own full-width row instead of squeezing in beside the buttons. The manual now writes IDs the way the app does (R-0042).", roles: ["admin", "management", "staff", "volunteer", "vet"] },
      { text: "The assistant now gets out of the way: tapping Open resident, Open enclosure or a resident in its answer closes the panel so you can see the page it opened. A new Confirm card scrolls into view instead of opening below the message box, and asking where a fostered animal is now answers with the foster carer rather than a place that does not exist.", roles: ["admin", "management", "staff", "volunteer", "vet"] },
      { text: "Once a resident is adopted they no longer show the green Ready for adoption badge or the microchip warning on their page, and they drop off the public Adopt page straight away.", roles: ["admin", "management", "staff", "vet"] },
      "On the public website, a visitor reading in Thai who opens a page whose Thai text has not been written yet (Foster and Volunteer today) now sees a short Thai note saying the page is in English for now, instead of unexplained English. On a phone, the website's menu now has Staff login, just under the language switch, so staff no longer scroll to the very bottom of a page to sign in.",
    ],
  },
  {
    version: "0.17.0",
    date: "2026-10-04",
    title:
      "Counting and ordering on a phone, and the app speaking Thai where it still spoke English",
    major: true,
    notes: [
      {
        text: "Counting medicines on a phone is now one card at a time. Each card shows a big photo of the box's label (or the name, if there isn't one), the last count, and a number keypad already open: type what's on the shelf and tap Save to move on, tap Same as last time to keep the old figure, or Skip to come back to it — skipped ones are offered again at the end. It tells you how far you are (23 of 100), and if you close the page, lock the phone or lose signal in the kennels, your counts are kept on the phone and it picks up where you left off. The computer's stocktake sheet is unchanged.",
        roles: ["admin", "management", "staff", "volunteer"],
      },
      {
        text: "Ordering medicine and food is now one simple screen on a phone instead of a table. Pick how long it should last, then open Medicines or Food (they are bought at different shops) to see what to buy from each supplier, how much of each. Tap an item to see how it was worked out. Print the list or save it from the bottom. Nothing is ordered or saved by the app. Anything nobody has counted yet is assumed to have none on the shelf, so a newly prescribed medicine still gets bought; it is shown in yellow with a button to count it. The computer table is unchanged.",
        roles: ["admin", "management"],
      },
      "Release notes and the Manual now have their headings, buttons and intro in Thai when the app is in Thai, and the Manual says plainly that its text is still English. The Dev/UAT tag on each release is shown to admins only.",
      "On Intake, Change password and Deliveries, the \"please fill in this field\" style messages now follow the app's language (English or Thai) instead of the phone's.",
      "Signing in with a wrong password now says, in English or Thai, \"That email or password isn't right\" and keeps the email you typed, instead of the sign-in service's English message and two empty boxes.",
      "Wording fixes on staff screens: the blood-test notes hint no longer mentions a future feature, the zone named Lifecycle shows as Status (สถานะ), a placement with an adopter says Adopter instead of Carer, photo folders and dates read in the app's language, a medication whose name already says tablet no longer repeats it in brackets, and the Adopt page no longer tells a signed-in person they are browsing as a guest.",
      "Management → Translations: text waiting for its other-language version can now arrive with a machine-written draft already filled in, marked as machine-written, for a manager to read, correct and approve instead of writing from scratch. Nothing is shown to the public until a manager approves it. Drafts begin once the shelter's translation service is switched on, at about twenty a day.",
    ],
  },
  {
    version: "0.16.0",
    date: "2026-10-03",
    title:
      "Changing your password now needs your current one, a Medication list for the phone, maintenance by tap, and pages that fit a phone screen",
    major: true,
    notes: [
      "Changing your password now asks for your current password first, and signs you out everywhere else once it's changed. Before, anyone holding your phone while you were signed in could set a new password without knowing the old one and take over your account. If you've forgotten the current password, sign out and use Forgot password? on the sign-in page instead. If you still sign in with a temporary password, or arrive from a reset link, nothing changes: you just choose a new one.",
      {
        text: "New Medication list under Management: open one page on your phone and see who needs medicine today, enclosure by enclosure in walking order. Each animal shows their photo and name, and each medicine shows a photo of its box, how much to give and how often, so you can match what's in your hand. A medicine given every other day, weekly or monthly appears only on the days it's due. It is a list to read: nothing is ticked off and the app does not record that a dose was given.",
        roles: ["admin", "management"],
      },
      {
        text: "Staff and managers can now record a blood test. Until now, tapping Save blood test on a resident (or the Log blood test link on a vet visit) answered \"You don't have permission to do that\" and nothing was saved, even though the form was offered. It now saves, with or without a lab scan attached.",
        roles: ["admin", "management", "staff"],
      },
      "On a phone, a maintenance job can now be moved on with a tap: each job on the Maintenance list has a Move job on button, which asks where it goes, says in words what will happen, and moves it, including back a step and on to Completed. Logging a job is now a few short steps (what is wrong, where, who and when, then a check before it is saved), and going Back keeps everything you typed. Dragging a card still works on a computer.",
      "Pages now fit a phone screen instead of sliding sideways. On a resident's page the Edit pencil and the Record death heart are back on screen (they were cut off the right edge), and the Enclosures, Vets, Contacts, Deliveries, Book vet visit and Move/Return forms no longer push their buttons and boxes out of view; long enclosure and clinic names wrap instead of stretching the page. In Thai, Sign out no longer runs off the edge: on a phone it is a small door-and-arrow icon in the header (the words still show on a larger screen).",
      "Scan a chip on the Residents page now finds the animal: type or scan the 15 digits and you go straight to their page. Before, it always answered \"0 residents\" even for a chip you had just recorded.",
      "Logging an immunization, a blood test or a procedure is no longer refused as \"in the future\" for today's date between midnight and 7 am. A resident can also be moved, sent to hospital, brought back or recorded as deceased on the same day they arrived or were last moved, instead of having to wait until the next day. If you pick a date before the current placement began, the message now says so.",
    ],
  },
  {
    version: "0.15.1",
    date: "2026-10-03",
    title: "A photo of each medicine's label, on the stocktake sheet and the delivery form",
    major: false,
    notes: [
      {
        text: "Each medication can now have a photo of its box or bottle label. A manager taps Upload label on Management → Medications (on a phone this opens the camera); the photo then shows beside the medicine on the Stocktake sheet and on the Record a delivery form, so whoever is holding the box can match it at a glance. It is only visible to people signed in to the app, never on the public website.",
        roles: ["admin", "management", "staff", "volunteer"],
      },
    ],
  },
  {
    version: "0.15.0",
    date: "2026-10-02",
    title:
      "Undo a recent change, a Deny that cannot remove an approved person, and signing in that keeps working while the shelter server is down",
    major: true,
    notes: [
      {
        text: "Settings → Recent changes can now undo a mistake. Tap Undo this change on the newest change to a record and confirm: an edit puts the fields back as they were, and a deleted contact, prescription, vet visit, weight or vaccination is put back. If the record has been changed again since, or something has taken its place (a new weight for the same day, say), the page tells you instead of overwriting anything. The undo shows up in the list as a change of its own.",
        roles: ["admin"],
      },
      {
        text: "Settings → Security: Deny on an access request now says plainly that the sign-in is deleted for good, and refuses if the person was given access in the meantime, so it can no longer remove someone who has just been approved. Requests are listed newest first.",
        roles: ["admin"],
      },
      "If the shelter's main server is switched off or off the network, signing in and saving now keep working instead of showing \"The shelter's server did not answer in time\". Pages may be a little slower until it is back. If a page you already had open will not save, reload it and try again.",
    ],
  },
  {
    version: "0.14.0",
    date: "2026-10-02",
    title:
      "Encrypted backups and a one-off sign-out, a Purchasing page, a guided Shelter Friend path, and doctors across clinics",
    major: true,
    notes: [
      "Everyone was signed out on 2 October 2026 and has to sign in again once. A security review the shelter commissioned found that the database backups were not encrypted; they now are, and only the administrator can open them. Signing everyone out was a precaution taken at the same time — nothing was lost or changed, and every account and record is exactly as it was. Sign in as usual.",
      {
        text: "New Management → Purchasing page works out how much of each medicine and food to buy, so whoever orders no longer does the arithmetic by hand. Pick 1 week, 2 weeks or 1 month and every item shows its working — what was last counted, roughly how much has been used since, what has been delivered since, and what the period needs — with the amount to buy rounded up to whole bags or boxes. An item nobody has counted is flagged instead of guessed, and a count more than three weeks old is marked as probably out of date. Items can now have a safety stock (a floor kept on the shelf whatever is prescribed): set it when adding or editing a medication or food, in the unit it is bought in if you like. The page ends with a list of just the items to buy, grouped by supplier, to print or download as a CSV. Days of stock on Medications and Diets now also counts deliveries recorded since the last count, which it had been ignoring, so it may read longer than before.",
        roles: ["admin", "management"],
      },
      {
        text: "Adding a Shelter Friend is now one guided path instead of five places. Tap Add a Shelter Friend on Management → Shelter Friends or Management → Contacts, then follow five short steps: who they are (pick a supplier you already have, or add a new business there and then), how they help, their logo and links, what the public may see, and a Review with a preview of their card exactly as the website will show it. Finish with Publish now or Save as a draft. Nothing is ticked for you in the what-the-public-may-see step: phone, email, LINE and address stay private unless you tick them, so ask the business first. Refreshing the page keeps your place and what you typed. If the logo cannot be uploaded the Friend is still saved and you are told to add the logo from their card.",
        roles: ["admin", "management"],
      },
      {
        text: "A doctor can now work at more than one clinic, and a vet can work at more than one too. A doctor is one person with a list of clinics: add a doctor from another clinic with Also works here on the clinic's Doctors page, or merge two entries for the same person, even from different clinics, with Merge. A vet login is linked to its doctor in Settings → Security, and sees and records for all of that doctor's clinics and no others. When a vet records a visit the Doctor is themselves, filled in and locked. A doctor needs only a name to be added: no email or account.",
        roles: ["admin", "management", "staff", "vet"],
      },
      {
        text: "Vets and volunteers now see less of the shelter’s address book, to protect people’s personal details. A volunteer sees each contact’s name and phone number, enough to ring a carer, but not their email, address, LINE or notes. A vet sees only the name behind a carer or sender, and no longer sees other people’s email addresses in the list of logins. Staff and above see everything, as before.",
        roles: ["vet", "volunteer"],
      },
    ],
  },
  {
    version: "0.13.0",
    date: "2026-10-02",
    title:
      "Records can be removed and put back, a Recent changes page, and the assistant keeps the doctor you name",
    major: true,
    notes: [
      "The Lanna Care for Animals logo is sharper: it has been replaced with a higher-quality copy of the same artwork, so it no longer looks blurry in the header, on the sign-in pages or on a high-resolution phone screen.",
      {
        text: "Booking a vet visit through the assistant now keeps the doctor you name. Say \"book a vet visit for Panda with Dr Somchai on Friday at 10am\" (or \"หมอสมชาย\") and the card shows Somchai in an optional Doctor field, which you can change or clear. If the clinic's doctor list has a matching name, the card offers that spelling; if it has no such doctor yet, the card says the name will be added. The assistant never asks for a doctor.",
        roles: ["admin", "management", "staff"],
      },
      {
        text: "Weight readings, prescriptions, vet visits and immunizations can now be removed. If one was entered by mistake, tap Remove on its row on the resident's page and, if you like, say why. It leaves the list, the weight chart, the forecasts and the counts, but it is kept, not deleted. Under each list, Show removed brings the removed ones back into view, greyed out with the reason, and Restore puts one back. A removed weight or vaccination no longer blocks entering the correct one for that day. Remove is for admin, management and staff; vets and volunteers don't see it.",
        roles: ["admin", "management", "staff"],
      },
      {
        text: "Settings now has a Recent changes page that shows who added, edited, archived or deleted a resident, contact, prescription, vet visit, weight, file or vaccination record, and when. You can filter by kind of record, person and date, and open one change to see the values before and after.",
        roles: ["admin"],
      },
    ],
  },
  {
    version: "0.12.1",
    date: "2026-10-02",
    title:
      "A printable manual with its pictures back, safer confirmations, and a note when a stock figure was typed by hand",
    major: false,
    notes: [
      "The printable manual (Manual → Download PDF) has its screenshots again. For a short while after the app moved to its new server the PDF came out with text only; it now includes every picture, and builds faster.",
      "Deleting or removing something now opens a box that names exactly what you are about to lose, with Cancel selected so a stray Enter cannot confirm it. The Security page's archive, delete and reset actions work the same way. Buttons on the Settings tables are taller, so they are easier to tap on a phone. A red bar now warns you when the app is offline and changes will not save.",
      "If you are signed out because you have not used the app for a long time, the sign-in page now says so and takes you back to the page you were on once you sign in again.",
      {
        text: "Management → Stock between counts now says when someone typed a figure by hand during the dates being compared. The row still shows the same used figure — a correction isn't counted as use, because fixing a typo would otherwise look like stock disappearing — but if an item is far off its plan and carries the note, the figure someone typed is the first thing to check. It appears in the downloaded CSV too.",
        roles: ["admin", "management"],
      },
    ],
  },
  {
    version: "0.12.0",
    date: "2026-10-01",
    title:
      "2-step verification needs a second admin, faster photos on the website, and longer passwords",
    major: true,
    notes: [
      {
        text: "Admins are now reminded on My tasks to set up 2-step verification, and the Security page flags any admin who hasn't. Setting up the first authenticator app now needs another admin to allow it (press Allow set-up beside their name in the 2-step column; making someone an admin allows it for three days), so someone who has only a stolen password can no longer set up their own app and lock the real admin out. The Security page also now lists every login and every access request however many there are, where before a long list of junk sign-ups could push real people off it.",
        roles: ["admin"],
      },
      "The public website now loads photos much faster. Project cards, resident cards, galleries, thumbnails and logos used to download the full-size photo straight off the phone, several megabytes each, which was slow on a phone connection; they now download a smaller copy sized for where it is shown, and the large photo is still sharp. Photos you view inside the app are unchanged.",
      "Passwords must now be at least 12 characters (it was 8), with no other rules about capitals or symbols. Existing passwords keep working; the longer minimum applies when you next choose one. Exported spreadsheets (Cashflow, Stock) no longer let a name that starts with = or @ run as a formula when opened in Excel, and the Website settings now check the map link is a real https address.",
      {
        text: "The vet line on the Cashflow page now follows how often the shelter really goes. Each week it counts the larger of the typical number of visits (the last 90 days' completed visits, averaged) and the visits actually booked that week, so a quiet week still carries the usual cost and a busy one is not understated. A booked visit with its real cost recorded uses that cost; the rest use the average of recorded costs, or the typical-visit figure until enough are recorded. A line under the table says exactly which numbers were used.",
        roles: ["admin", "management"],
      },
      "If something goes wrong while saving, moving, completing or deleting a maintenance job or its photos, the Maintenance pages now say so with a short reference you can quote, instead of a numbered error code. That finishes the same fix across the whole app: every page that saves something now explains a failure in words.",
    ],
  },
  {
    version: "0.11.0",
    date: "2026-10-01",
    title:
      "Sign-in and saving fixed, units of measure, and the website now runs on a Pi at the shelter",
    major: true,
    notes: [
      "Signing in on lannacare.org works again, and so does every other form on the site. Since the evening of 30 September, trying to sign in — or to save, add or change anything at all — answered \"A server error occurred\" and nothing was saved. Pages you were only reading were not affected.",
      "When you change the bio or photos of a resident who has died, and the copy in Google Drive couldn't be refreshed, you are now told straight away instead of it staying out of date silently. The resident's page has a Refresh archive button to try again.",
      "If something goes wrong while saving, renaming, moving or deleting a project folder or photo, the Projects pages now say so with a short reference you can quote, instead of showing a numbered error code.",
      "Food and medicines can now be bought, delivered and counted in a different unit from the one they are fed or dosed in. Under Management → Diets or → Medications, Units of measure lets you say that a bag (20 kg) is 200 cups, say, and which unit the item is bought and counted in. Record a delivery and the stocktake then let you pick that unit, show what it comes to in cups, and save the cups; In stock also shows it in bags. Enter the price per bag and the cost per cup is worked out for the forecasts. Correcting a bag's size later never changes deliveries and counts already saved.",
      "The website and the app are now prepared by a Raspberry Pi at the shelter instead of by Cloudflare's own servers, which should stop the \"Error 1102: Worker exceeded resource limits\" page that some heavier pages showed now and then. If a page ever does fail, the app falls back to the old way by itself, so you keep working. The weekly database backup also now runs on the Pi.",
    ],
  },
  {
    version: "0.10.1",
    date: "2026-09-30",
    title:
      "Website settings in tabs, a tidier Residents list, vets can record microchips, and clearer Management messages",
    major: false,
    notes: [
      { text: "Settings → Website is now split into tabs — Home page, Contact & settings, Pages, Gallery and Our work — instead of one long page. Under Pages, each information page is a row you open to edit, with when it was last edited and a Thai missing tag. Nothing has moved between sections or changed how it saves.", roles: ["admin"] },
      { text: "On a phone the Residents list now shows just the name, so long names (with Thai and other names) no longer wrap; the ID is still on the resident's page and on the computer list. The list search also finds a resident by their ID (for example R0042), and there is a new Adopted filter. If a search has adopted residents that On-site, Off-site, a zone or an enclosure is hiding, the list now says how many and links to them.", roles: ["admin", "management", "staff", "volunteer", "vet"] },
      { text: "Vets can now record or correct a resident's microchip themselves: tap Record chip (or Correct) under the name on the resident's page, or at the top of their Vet appointments and Procedures pages and a visit's Edit page, where the chip is now shown. After logging a Microchipping procedure you are asked for the chip number straight away. Staff and admins can use the same form.", roles: ["vet", "staff", "admin"] },
      "The public adoption page now says Microchipped for an animal with a chip on file, beside Desexed and Vaccinated. The number itself is never shown on the website.",
      { text: "The Residents list has a No microchip filter, and the management dashboard counts the residents in care with no microchip; tap it to see who they are.", roles: ["admin", "management", "staff", "vet"] },
      { text: "The summary PDF and offline index filed when a resident dies now include their microchip number and implant date.", roles: ["admin", "management", "staff"] },
      {
        text: "On the Management pages (vets and their doctors, diets, medications, contacts, recurring jobs and translations), a refused save or delete now tells you why, in words, instead of showing a numbered error code.",
        roles: ["admin", "management"],
      },
    ],
  },
  {
    version: "0.10.0",
    date: "2026-09-30",
    title:
      "Microchip numbers, an Appointments page for vets, fixed monthly costs in the forecast, and a printable manual",
    major: true,
    notes: [
      "The manual can now be printed. On the Manual page, tap Print this as a PDF for a paper copy of your own role's topics, or of the whole manual if you chose Show everything. Without screenshots gives a small, text-only file.",
      { text: "The cashflow forecast now includes the shelter's fixed monthly costs. Under Management → Cashflow, Edit fixed outgoings lets you list rent, electricity, internet and salaries (as one total, never per person) with an amount in baht per month and an optional first and last month; they appear as a Fixed outgoings column in the chart, table and CSV.", roles: ["admin", "management"] },
      { text: "Vets now land on a new Appointments page instead of My tasks. It lists every visit booked with your clinic — ones still to write up, upcoming ones, and those finished in the last 30 days — and each one opens the resident and offers the procedure, blood test, prescription and weight forms already linked to that visit. Vets no longer have a My tasks page.", roles: ["vet"] },
      { text: "Residents can now have a microchip number. Enter it (15 digits, spaces and dashes are fine) under Edit resident or on the Health step of intake; it shows under the name on the resident's page, and a resident marked ready for adoption with no chip gets a gentle reminder. On the Residents page, the new Scan a chip box takes a reader's 15 digits and opens that resident straight away; an unknown chip offers a new resident with the number filled in. The number is never shown on the public website.", roles: ["admin", "management", "staff"] },
      { text: "A Shelter Friend's profile now says what went wrong instead of showing a numbered code. Making a contact a Friend, saving, publishing or unpublishing a profile, moving one up or down the order, changing or removing its logo, and removing a profile all give a plain message, with a short reference to quote if it is something unexpected.", roles: ["admin", "management"] },
    ],
  },
  {
    version: "0.9.1",
    date: "2026-09-29",
    title:
      "Preferred contact channels, clearer messages on resident pages, and a way to ask for an account",
    major: false,
    notes: [
      "Settings → Website has a new Preferred way to contact us: put LINE, Messenger, WhatsApp, Instagram, phone and email in the order you want. The public website follows it: the button at the bottom of each animal's page (Ask on LINE, Ask on Messenger and so on), the Get in touch card on the information pages, the footer, and the Talk to us buttons in the phone menu all lead with your first choice. Only channels you have filled in are offered, and if the first is cleared the next takes its place. Nothing changes until you choose: LINE still leads.",
      "The public website now makes the way back obvious. The phone menu starts with Home and the footer has a Home link. Every page below the home page shows a Home › Adopt › Panda style trail under the header (on tablets and computers). The link at the top of a resident or project page (All dogs and cats, All our work) takes you back to the list exactly as you left it, filters and scroll position kept, and if you arrived from Facebook or a search it still opens the list rather than leaving the site.",
      "Resident pages now show a real message when something goes wrong, instead of a numbered code. Recording an intake, editing a resident, moving or rehoming one, sending one to hospital, recording or undoing a death, and deleting or refiling a photo, blood-test file or procedure file all say what happened, with a short reference to quote if it is something unexpected.",
      { text: "A vet can now change only their own clinic's records. Another clinic's vet visits, prescriptions, procedures, blood tests and their files stay visible on a resident's page but are read-only, and a vet can no longer record a visit for a clinic other than their own. Opening Edit on another clinic's visit now says it is read-only.", roles: ["vet", "admin"] },
      "The sign-in page now has a Request access link that explains how to ask for an account: continue with Google, and an administrator will see the request and approve it. The message a new Google account gets afterwards now says it has been told, instead of sounding like a dead end, and people with no Google account are pointed to the shelter's email.",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-09-28",
    title:
      "Vets see only their own clinic's residents, access requests at a glance, and refiling photos",
    major: true,
    notes: [
      { text: "A vet now sees only the residents their own clinic treats: any resident the clinic has a vet visit, prescription, procedure or blood test for, with that resident's whole history, other clinics' visits included. Other residents no longer appear anywhere a vet can look, including by typing a resident's address. The Residents list names the clinic, and a vet account with no clinic set sees no residents until an admin sets one under Security.", roles: ["vet", "admin"] },
      { text: "Admins can now see whether anyone is waiting for access without signing in with the authenticator app. Settings → System status has an Access requests card saying how many are waiting and how long the oldest has waited, and while anyone waits every admin has a Review access requests task at the top of My tasks. Neither says who is asking — names and email addresses are still only on Settings → Security, which both link to.", roles: ["admin"] },
      "A prescription or diet that ended yesterday no longer shows as current on a resident's page between midnight and 7 in the morning. It used to stay listed as current until 7. The date on Return from hospital, Rehome and Return to shelter also no longer offers the day before a move made in those hours, which the save then refused.",
      { text: "Admin pages (Zones, Enclosures, Frequencies, Immunization types, Procedure types, Blood test types, Website, System status) now show the real reason an action was refused, instead of a generic error.", roles: ["admin"] },
      "Going from the home page to the dogs up for adoption now shows our puppy-at-a-laptop loading animation for a moment before the list appears. Changing a filter or the ready-only toggle on that page stays instant.",
      "A resident photo filed under the wrong folder can now be refiled without deleting and re-uploading it — open it in the photo viewer and choose Move to folder. Its date taken and caption stay; only its folder, in Drive and in the app, changes. A vet can move a photo into Medical but not out of it, and a photo can't be moved into Medical while it's the resident's profile photo.",
    ],
  },
  {
    version: "0.8.1",
    date: "2026-09-28",
    title:
      "Vets record to their own clinic, one weight per visit, and International adoption",
    major: false,
    notes: [
      "Each vet or clinic now has a list of its doctors, which you can see and correct. It fills itself from the doctors' names typed on visits, and the visit forms suggest from it. Under Management → Vets, a new Doctors column opens a clinic's list, where you can rename a misspelt doctor, merge two spellings of one person (\"Somchai\" and \"Dr Somchai\" — the page points out names that look alike), and mark a doctor who has left so they are no longer suggested. A rename or merge also corrects the name on that doctor's past visits, and the page says how many before it does. A vet's hub now shows the clinic's doctors with how many visits each saw.",
      { text: "A vet booking or editing a vet visit now records it for their own clinic, shown by name, instead of choosing from every clinic the shelter uses. An admin sets which clinic a vet account belongs to under Security, where a Clinic choice now appears under the role of every vet account; until it is set, the vet-visit form tells the vet to ask for it. The Status choices on the vet-visit forms also say what they mean — Scheduled is a visit not yet confirmed as done, which is why a past one shows as overdue.", roles: ["admin", "vet"] },
      "A vet visit now holds one weight, and a resident one weight per day. When logging a weight, the linked-visit list leaves out visits that already have one (and visits still to come), and choosing a day that already has a reading turns the save into a correction of that reading — so a vet weighing an animal on its intake day updates the intake weight rather than adding a second. Any reading can now be corrected with Edit on the Weight page, or Edit weight on its vet visit.",
      { text: "The Pet relocation page is gone from the website — moving pets is not a service the shelter offers — and an International adoption page has taken its place, for people abroad who would like to adopt one of the animals. It is under Adopt in the menu and the footer (Adopt now opens to Meet our residents and International adoption), with a caped puppy flying over the globe at the top, and the adoption listing's line for adopters abroad now points to it. Anyone following an old link to the relocation page lands on the new one. The Services menu is hidden while it has nothing in it. The page starts with standard text in English and Thai; admins can rewrite it under Settings → Website, where it is already filled in to edit.", roles: ["admin", "management", "staff", "volunteer"] },
      { text: "A date you don't have to fill in can now be emptied again once it has been set: a Clear button appears beside it. On a phone, tapping the date could fill it in with no way back to blank, so an optional date became one you had to keep. It is on a diet's and a medication's end date, a maintenance job's due date, a recurring job's end date, a shelter friend's Friend since and a project folder's date.", roles: ["admin", "management", "staff", "volunteer"] },
      "The user manual now opens on what your own role does: a vet sees sign-in, residents, medical records and photos rather than intake, stocktake and Settings. Show everything, at the top of the manual, brings back the rest, greyed where it isn't part of your role — and Find on page still finds a topic that is tucked away, so you can check whether something is yours to do.",
      "A prescription can only be linked to a vet visit that has already happened. The linked-visit list on the prescription form leaves out visits still to come, a visit still to come no longer has an Add prescription link on the Vet Appointments page, and a visit that has prescriptions linked to it can no longer be moved to a later day than today. A prescription already linked to a visit keeps its link when it is edited.",
      "Release notes now open on what changed for your own role, like the manual: a vet no longer reads about stocktake or the website. Every release stays in the list with its number, and one with nothing for you says so. Show everything, at the top of the page, brings back the rest, greyed where it isn't for your role. Changes from before this release are shown to everyone, as they always were.",
      "A blood test or procedure logged from a vet visit between midnight and 7 in the morning now takes that visit's date. It used to fill in the day before. Sending a resident to hospital from such a visit also starts on the visit's own day.",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-09-27",
    title:
      "2-step verification, medical photos off the website, and two new website pages",
    major: true,
    notes: [
      "A vet's menu is now just My tasks and Residents. Enclosures, Maintenance, Vets, Contacts and Projects are the shelter's own pages, and opening one by its address now says You don't have access to this page instead of showing it — or, for Maintenance, an empty board. A vet who scans a kennel's QR code sees who lives there, each opening their resident page.",
      "Recurring jobs now only offer people who can actually do them. Vets are no longer offered at all — their work comes from their vet appointments — a maintenance job lists admin, management and staff, and a job on a Management or Settings page lists only those who can open it. A job already given to someone who can't have it is marked in red on Management → Recurring jobs until it is reassigned, and on that person's My tasks it says so instead of linking to a page that may turn them away.",
      "Booking a vet visit now takes you back to the resident's Vet Appointments page (or the Residents list, when you booked for several) instead of the public website. And opening a page your role doesn't include — Stocktake, Deliveries, Management or Settings — now says You don't have access to this page, inside the app with a button back to My tasks, instead of dropping you on the public website.",
      "Admins now get an email when something behind the app stops working — the database, photo storage, backups and the other System status tiles — and another when it is working again, so nobody has to open the page to find out. Settings → System status has a new Alerts tile showing that the checks are running and who the last mail reached, with a button to send yourself a test.",
      "Photos filed under Medical when they were added to an animal no longer appear on the public adoption page, and their links no longer open for someone who is not signed in.",
      "A Medical photo can no longer be chosen as an animal's main photo, since the main photo is what the website shows — the photo viewer and the Edit page say why instead of offering it. A vet adding photos no longer picks a folder: their photos go straight into Medical. When an animal's first photo is a Medical one it still becomes the main photo on its own, as the first photo always has — but the website now shows no photo for that animal rather than the Medical one, until someone chooses a photo from another folder.",
      "Settings → Security now asks admins for a 6-digit code from an authenticator app on their phone (2-step verification), once per sign-in. The first visit walks you through setting the app up. The rest of the app signs in as before. A lost phone is reset by another admin from Security.",
      "New on the website: a Pet relocation page, under a new Services menu and in the footer, saying the shelter can help move a dog or cat within Thailand or abroad — with a flying puppy in a cape at the top. The adoption listing now points adopters from abroad to it. It starts with standard text in English and Thai; admins can rewrite it under Settings → Website, where it is already filled in to edit.",
      "New on the website: a Become a Shelter Friend page for local businesses, saying what a Shelter Friend is, how a business can help, what it gets in return and that its contact details only show with its agreement. The home page's Become a Shelter Friend button and Your business here? tile now open it instead of jumping to the footer, and it is under Get involved in the menu. Its email and LINE buttons start the message for them. It starts with standard text in English and Thai, which admins can rewrite under Settings → Website.",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-09-27",
    title:
      "Adoption updates, recurring jobs, and recording deliveries",
    major: true,
    notes: [
      "New: adoption updates. When an adopter sends news about an animal — on LINE, Facebook, by email or on a visit — add it from the Adoption updates card on the animal's page: the date, who sent it (the adopter is filled in for you), how it came in, what they said, and their photos. Those photos always say who sent them, when and how, on the Photos page too, where you can now show just the shelter's photos or just the adopters'. An animal returned to the shelter keeps the updates from their time away.",
      "Settings → Security now says what went wrong when an action on a login fails, instead of showing an error code. Deleting someone who has records in the system is refused with a note to archive them instead.",
      "New: recurring jobs. Managers set up the routine that comes round every week or month — the Monday stocktake, ordering medication after it, the monthly worming — under Management → Recurring jobs, with who does it and a preview of the next dates. Each date then appears on that person's My tasks with Done and Skip buttons, stays there as overdue (with how many days late) until someone marks it, and can link straight to the screen it's done on. When someone is off, their dates can be handed to someone else for just those days; when someone leaves, their jobs can be moved in one go. The page also keeps the record of who did each one and when.",
      "New: record deliveries. Staff and managers can record each medication or food as it arrives — quantity, supplier, cost and a note — from Record a delivery on the Stocktake page or Management → Medications / Diets. Management → Stock between counts now uses them to show what was actually used between two stocktakes, instead of only how the count changed. It is only as good as the delivery records: a delivery nobody recorded makes usage look lower than it was, and the page says so.",
      "Management → Stock between counts: a Difference column shows how far each item's use was from the plan, also as a percentage, and Download CSV saves the table for a spreadsheet. Small items no longer stand out over a miscount — a row is only marked when the gap is bigger than two counts of that item could be off by. On Deliveries, a delivery on a stocktake day now says whether it came before or after that day's count.",
      "The Pet of the week card on the home page now shows the animal's hook line — the one-line introduction written on Edit resident, in Thai too once its translation is approved. An animal without one still shows the start of their bio, as before.",
    ],
  },
  {
    version: "0.6.1",
    date: "2026-09-26",
    title:
      "More ways to get in touch, a new look for each resident, and System status",
    major: false,
    notes: [
      "The website can now show Facebook Messenger, WhatsApp and X (Twitter) as well as Facebook, Instagram and LINE. An admin adds them under Labels and contact details on the Website page; Messenger and WhatsApp then appear under Contact us in the footer and as chat buttons in the phone menu, and Facebook, Instagram and X appear under Follow us in both. Anything left blank doesn't show.",
      "A photo or document that is empty, damaged or not really the kind of file its name says is now refused when you upload it, with a message saying so, instead of being saved and showing as a broken picture. And when you replace or remove the website's hero photo, a gallery photo or a Shelter Friend logo, the old file now goes to the shelter's Google Drive trash for 30 days instead of being deleted, so it can be put back.",
      "While a page is loading, the website now shows a puppy typing on a laptop instead of a blank screen, and the staff app shows a small version beside “Loading…”. It only appears when a page takes more than a moment, and it stays still if your device is set to reduce motion. It also appears on the website photo and Shelter Friend logo upload buttons when an upload is slow.",
      "Each resident's page on the website has the new look: a large photo, their name with a one-line hook, quick facts, who they get along with, their story and ideal home, how to meet them, and a bar along the bottom with Ask on LINE and Book a visit. Edit resident has two new boxes under Adoption for the hook line and the ideal home; until they are filled in, the page leaves them out.",
      "New for managers: Management → Stock between counts. It sets how much each medication and food count went down or up between two stocktakes beside what the prescriptions and diets planned for the same dates, and marks the big gaps. It can't show what was actually used, because deliveries aren't recorded yet: a count that went up means stock arrived, and a smaller fall than planned may be a delivery nobody logged. Pick any two stocktakes to compare, or leave it on each item's last two counts.",
      "New for admins: Settings → System status. A green, amber or red tile each for the database, photo storage, database updates, the running release, release mail, the weekly backup and the Pi, each saying when it was checked and, when something is wrong, why. Below them, how much the app was used over the last 7, 30 or 90 days: people signing in, records added, uploads, assistant requests and website visitors. The privacy page now also says that Cloudflare gives the shelter daily visit totals — numbers only, never who visited.",
      "The website feels a little more alive: headings, text and cards now rise gently into place with a slight spring as you scroll down to them, and cards and buttons lift a touch when you point at or press them. Each part moves only once, nothing on the page jumps around, and nothing moves at all if your device is set to reduce motion. The staff app is unchanged.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-09-26",
    title:
      "A new public website, My tasks as your home page, and Stocktake",
    major: true,
    notes: [
      "The public website has a new look — cream pages, warmer type and a new menu: Adopt, Get involved (Foster, Volunteer, Sponsor a resident, Shelter Friends), Our work, and About & contact, with the language switch and Donate beside it. On a phone the menu fills the screen and ends with LINE and Call buttons. The footer now has four columns, with Staff login at the very bottom.",
      "The website's home page is redesigned to match: a new welcome with Meet the animals and Give monthly, the shelter's live numbers on a green band, a thank-you band for Shelter Friends with room for the next business, four ways to help, and the Pet of the week beside Our story. The home page now shows the first three gallery photos, and recent Our work stories are reached from the link under Our story.",
      "When photo storage is not connected, uploads now say so in plain words (“Photo storage is not connected — tell an admin”) instead of Google's error text, and Settings shows whether photo storage is connected, so an admin sees it before anyone's upload fails.",
      "A Shelter Friend logo's upload message now appears next to the logo instead of below the Save button.",
      "A new Public viewer account type, for testing the website as a visitor while the testing sites are closed: it signs in, sees every public page, and never opens the app. Admins give it under Settings → Security.",
      "Archived accounts, and accounts that were never given a role, can no longer sign in with a password — they are turned away as Google sign-in already turned them away.",
      "A new resident now always gets a starting diet: intake picks the standard diet for you, and you change it only if they need something else. Enclosure cards show how many residents there are on a special diet (tap to see who), the enclosure page shows each one's diet under their photo, and Management → Diets marks which diet is the standard and lets management choose a different one.",
      "New: My tasks, at the top of the menu, lists the maintenance jobs assigned to you that aren't finished — overdue, due today, coming up and undated — with who else is on each job and buttons to change its status there and then. The number beside it in the menu is how many are due today or overdue. It is now the app's home page: signing in, or tapping Open the app on the public website, takes you there instead of the Residents list.",
      "New: Stocktake, in the menu for staff, volunteers and management. Count every medication and diet on one sheet — built for a phone, so you can walk the shelves and press Enter to move down the list — then check a summary of what changed (big differences are highlighted) and save it all at once. Leave a row blank if you didn't count it and it stays as it was; tap Same as last time to confirm an unchanged figure.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-09-25",
    title:
      "The testing sites ask you to sign in, stock on hand, and bigger photo uploads",
    major: true,
    notes: [
      "Four topics in the user manual showed a broken picture — adding a diet, Management → Diets, Management → Cashflow and Settings → Blood test types. Each now shows its screenshot.",
      "Uploading a photo or logo larger than 1 MB — a Shelter Friend logo, or the Website page's hero and gallery photos — failed with a “Minified React error” code. Files up to 15 MB now upload, a larger file is refused straight away with a message saying so, and if the server ever can't process an upload you are told in words, with the suggestion to try a smaller image.",
      "The testing sites (lannacare.org and test.lannacare.org) are closed to the public until go-live. Visitors see a Staff testing site page with a Sign in button; once you sign in, everything — public pages included — works as before. Scanning a resident card or enclosure QR code asks you to sign in first, then opens what you scanned.",
      "Management → Medications and → Diets now keep track of what's in the cupboard. Tap Count after a stocktake to record how much is left; the table shows how long ago it was counted and roughly how many days it will last at the next 30 days' rate. Give an item its supplier's lead time and it is flagged Reorder when stock gets that low.",
      "A Shelter Friend profile that has been saved but not published now says so: its badge reads “Draft — not on the website”, the card reminds you that saving keeps it a draft until you tap Publish, and signed-in staff looking at the Shelter Friends page see a note when drafts are waiting.",
      "The Residents list has the same On-site / Off-site choice and zone chips as the Enclosures page, on phones too. Pick one or more zones, or none to see the whole place. Residents waiting for an enclosure count as on site; residents in hospital or with a foster carer count as off site. The Location column now shows On-site or Off-site to match.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-09-25",
    title:
      "Social links on the website, on-site and off-site enclosures, and one way into Assistant",
    major: true,
    notes: [
      "The public website can link to the shelter's Facebook page and Instagram. An admin pastes the links under Settings → Website, and each appears as a small icon in the footer of every public page — Facebook also at the top of the page on a computer. Until a link is added, nothing shows.",
      "Shelter Friends: \"Remove profile\" is now \"Remove Shelter Friend status\", and it has moved out of Edit profile onto the card, next to Unpublish. A short line under the buttons says which is which: Unpublish hides the card for now, and Remove Shelter Friend status means the business is no longer a Friend. Removing never deletes the contact, and the confirmation now says that first.",
      "A link to a topic in the user manual now opens on that topic. Before, the pictures above it could load after the page had jumped there and push the topic off the screen — most often on an iPhone or iPad.",
      "Enclosures: choose Everywhere, On-site or Off-site above the zone chips to see just the enclosures at the shelter or just those away from it, and the zone chips narrow to match. You can now pick more than one zone — tap a chip to add it, tap again to take it off. Hospital, Unassigned and Fostered show only under Everywhere.",
      "Assistant is no longer in the menu on the left — it was the same as the Assistant button at the top of every screen. Press that button to open it over the page you are on. For the full-page version, press Open full page just under the title in the panel that slides in.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-09-24",
    title: "Shelter Friends, public kennel QR codes, and phone-friendly setup pages",
    major: true,
    notes: [
      "On a phone, the setup pages made for a computer — Zones, Enclosures, Immunization Types, and Management's Contacts, Vets, Medications and Diets — now say \"Best on a larger screen\" instead of opening as a table you have to scroll sideways, and their tiles are marked Larger screen. Tap Show anyway if it can't wait.",
      "Shelter Friends: thank the local businesses that help the shelter on the public website. Open a supplier under Contacts and tap Make a Shelter Friend, write what they do for the shelter and any offer for supporters, add their logo, website and Facebook page, tick only the contact details they agreed to show, and Publish. Their card appears on a new Shelter Friends page — linked from the website's menu, with a thank-you strip of logos on the home page and a mention on Donate — and Management → Shelter Friends sets the order. Nothing shows on the website until you publish, and archiving the contact takes their card down.",
      "Visitors who scan the QR code on a kennel now see who lives there instead of a sign-in page: the enclosure's name and zone, and a card for each resident that opens their public card. Nothing about capacity, notes or repairs is shown, and Hospital, Fostered and the other status buckets have no public page. Signed in, the code still opens the enclosure page as before.",
      "Frequency options — the \"how often\" choices on a prescription, like Twice daily or Weekly — have moved off Management → Medications to their own page, Settings → Frequencies, beside the other lists the app picks from. Only an admin can rename, merge or delete one there. Staff and vets can still add a new one while writing a prescription, as before.",
    ],
  },
  {
    version: "0.2.2",
    date: "2026-09-24",
    title: "The manual's Contents list stays put",
    major: false,
    notes: [
      "In the user manual on a computer, the Contents list beside the text now stays in place with its own scroll bar, so you can reach any topic without scrolling back to the top of the page. Opening a link to a particular topic highlights it in the list and scrolls the list to show it.",
    ],
  },
  {
    version: "0.2.1",
    date: "2026-09-24",
    title: "Archiving contacts, and a tidier release list",
    major: false,
    notes: [
      "Contacts can now be archived instead of deleted. Archive a carer, volunteer or supplier the shelter no longer works with, from Management → Contacts or their own page, and add a reason if you like. They leave the contact lists and the carer picker but keep their history: a resident's housing history still names them, with an Archived badge. Show archived lists them again, a search still finds them, and Restore brings them back. A resident can't be placed with an archived carer until they're restored.",
      "The Enclosures page has a new Has open maintenance tick that shows only the enclosures with a repair job still outstanding. It works with the zone buttons and the search, and a filtered page can be bookmarked. Vets don't see it, because maintenance isn't part of their access.",
      "Release notes now show each release as a single line — its number, title and date — so older releases are no longer buried under the newer ones. Click a release to see what changed; the newest opens by itself.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-09-24",
    title: "Cashflow CSV, clearer PDFs, capacity warnings and doctor names",
    major: true,
    notes: [
      "On the Cashflow page, the \"Not priced yet\" card now takes you to the prices that are missing: straight to the right page when they are all in one category, or to the row that links each category when they are spread out.",
      "The Cashflow table can be downloaded as a CSV file for the monthly report.",
      "The summary PDF kept for a resident who has died is easier to read: the name no longer prints on top of the line beneath it, and every page now has a footer with the resident's name and ID, the date the PDF was made, and the page number.",
      "That PDF now shows the resident's profile photo much more reliably. Photos taken on iPhones, and large photos, used to be left out without any warning.",
      "In that PDF, a long name followed by a Thai name no longer gets a stray hyphen where it wraps onto a second line.",
      "Registering a new resident now warns you when the enclosure you've chosen is nearly full or full, just like moving a resident does. The enclosure list shows how many residents each one holds, and Register asks you to confirm before putting one more into a full enclosure — you can still go ahead.",
      "A vet visit can now record which doctor saw the resident. It is optional: fill it in when booking the visit, or later with Edit on the resident's Vet Appointments tab. The name shows on that tab and on the vet's page.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-09-24",
    title: "Dates, navigation and the cashflow forecast",
    major: true,
    notes: [
      "Dates now follow Thailand's clock. Anything dated \"today\" between midnight and 7am used to record the day before, and an animal taken in overnight could not be dated today at all.",
      "The menu has been reworked: links are grouped with icons, and the Admin section is now called Settings.",
      "New Cashflow page under Management: what the shelter is about to spend on food, medication, immunizations and vet visits, in one place. Anything nobody has priced yet shows as a gap rather than as zero.",
    ],
  },
  {
    version: "0.0.1",
    date: "2026-09-23",
    title: "Current Baseline Build",
    major: false,
    notes: [
      "The starting point of this register: everything the system does as of 23 September 2026.",
      "From here on, every release lists what changed for you, newest at the top.",
    ],
  },
];

export const latestRelease: Release = releases[0];

/** -1, 0 or 1, comparing "a.b.c" version strings numerically. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

/**
 * The major releases a deploy brings to a site that was running `since`
 * (null when the site didn't say — then only the newest release counts,
 * so a first deploy can't mail the whole history).
 */
export function majorReleasesSince(since: string | null): Release[] {
  const newer = since
    ? releases.filter((r) => compareVersions(r.version, since) > 0)
    : releases.slice(0, 1);
  return newer.filter((r) => r.major);
}
