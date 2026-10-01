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
  "If something goes wrong while saving, moving, completing or deleting a maintenance job or its photos, the Maintenance pages now say so with a short reference you can quote, instead of a numbered error code. That finishes the same fix across the whole app: every page that saves something now explains a failure in words.",
];

/** Newest first. */
export const releases: Release[] = [
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
