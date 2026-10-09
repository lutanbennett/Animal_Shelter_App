// The words of the acceptance matrix: one entry per manual topic, one boundary
// per "must not" line of docs/role-walkthrough.md. scripts/acceptance-matrix.mjs
// reads the manual for WHICH activities exist and WHICH roles do them, and reads
// this file for what a shelter worker is told to do and what they should see.
//
// It is the half that cannot be generated, and it is meant to be edited: when a
// PR adds a manual topic, the generator stops until the topic has an entry here.
// Write for the person holding the phone — plain activity names, one line each,
// no file paths, no jargon. The Director reads this.
//
// ── An activity ─────────────────────────────────────────────────────────────
//   activity   what the row is called, as a shelter worker would say it
//   device     "phone" | "desktop" | "both" — where it is really done. Field work
//              is phone; setup and reporting are desktop; "both" where the
//              2026-09-24 admin-on-mobile decision calls a page nice-to-have or
//              where the work is genuinely done either way
//   do         the one-line instruction
//   expect     what the tester should see, in plain words
//   needs      (optional) the catalogue activity the row exercises, e.g. "placement.move", with
//              ":read" for a read level ("resident.record:read"). The does / must-not cells then
//              come from who holds it by default, and the generator fails if the roles above it
//              (this entry's or the manual topic's) say something else. The residents area
//              names its rows this way; the other areas follow as their sweeps land.
//   roles      (optional) narrows the manual's roles, where the topic mixes
//              activities — e.g. everyone may read the maintenance board, only
//              staff and up may change a job's status
//   who        (optional) explicit list of roles that do it, instead of the
//              manual's — for the public site and for signing in
//   audience   (optional) "five" (default: the manual's roles), "signedin" (five
//              plus public viewer), "all" (every column, signed out included)
//   na         (optional) roles for which the row simply does not apply, rather
//              than "must not": e.g. a doctor has no My tasks
//   naRest     (optional) every role not in `does` is n/a, not "must not"
//   notes      (optional) { role: "what is different for that role" }, appended
//              to the expected result in that role's sheet
//
// A role outside the activity's roles is "must not" unless `na`/`naRest` says
// otherwise: the app both hides the button and refuses the request, and the
// tester tries both.

const MENU = {
  doctor: "The menu shows only Appointments and Residents, then Manual, Release notes and Change password. No Operations.",
  volunteer: "The menu is Home, Residents and Operations, then Manual, Release notes and Change password. Operations has one tile, Enclosures: no Stocktake, no Maintenance, Projects, Contacts or Clinics. No Assistant button, no Management and no Settings.",
  staff: "The menu has Operations, with Stocktake among its tiles, and the Assistant button, but no Management, no Settings and no Security.",
  management: "The menu has Operations and Management, but no Settings and no Security. Website is a tile on Management.",
  admin: "The menu has Operations, Management, Settings, and Security at the bottom.",
};

export const ENTRIES = {
  // ── Getting started ──────────────────────────────────────────────────────
  "sign-in": [
    {
      activity: "Sign in and sign out",
      device: "both",
      audience: "all",
      do: "Open the app's address, tap Staff & Volunteer Login, sign in with your own email and password, then sign out.",
      expect: "You land on your home page — Appointments for a doctor, a screen of big job tiles for most other roles — and Sign out brings you back to the public site.",
      notes: { management: "On a phone your home has four tiles: Recurring jobs, Intake, Residents and My tasks. Every other page is in the menu. If a tile is missing, the role no longer holds what it needs; it should never be a tile that refuses.", public_viewer: "You land on the public home page; there is no app menu.", visitor: "Signing in is how a visitor becomes one of the roles; test it with any account." },
    },
    {
      activity: "Choose a new password after forgetting the old one",
      device: "phone",
      audience: "all",
      do: "On the sign-in page tap Forgot password?, enter your email and follow the link in the message.",
      expect: "You can choose a new password and sign in with it.",
    },
    {
      activity: "Change your password",
      device: "both",
      audience: "signedin",
      do: "Choose Change password at the bottom of the menu, change it, sign out and sign in again with the new one.",
      expect: "The new password works and the old one does not.",
    },
    {
      activity: "Ask for access with a Google account",
      device: "phone",
      who: ["visitor"],
      naRest: true,
      do: "On the sign-in page tap Request access, then Continue with Google and choose a Google account that has no access yet.",
      expect: "You are told your request has been noted, and nothing else in the app opens.",
    },
  ],
  "confirm-and-offline": [
    {
      activity: "Be asked before something that cannot be taken back",
      device: "both",
      do: "Start an action that cannot be undone (for example removing a record, or deleting a job), then cancel at the question.",
      expect: "The app asks first, and cancelling changes nothing.",
    },
    {
      activity: "See the offline warning",
      device: "phone",
      do: "Turn the phone's internet off while a page is open.",
      expect: "A red bar says \"You're offline, changes will not save\", and goes away when the internet is back.",
    },
  ],
  language: [
    {
      activity: "Switch between English and Thai",
      device: "both",
      audience: "all",
      do: "Tap EN / ไทย in the header, open three different pages — one with a form — then switch back.",
      expect: "Every label, button and message changes language; nothing is left in the other language and no Thai text is cut off or overlaps.",
    },
  ],
  "print-manual": [
    {
      activity: "Print the manual as a PDF",
      device: "desktop",
      do: "Open the Manual and tap Print this as a PDF.",
      expect: "A PDF opens holding the topics for your role, and it can be saved or printed.",
    },
  ],
  navigation: [
    {
      activity: "Find your way around the menu",
      device: "both",
      do: "Open the menu (the ☰ button on a phone) and read it item by item.",
      expect: "The menu is the one for your role. Manual, Release notes and Change password are last, under a dividing line.",
      notes: MENU,
    },
  ],
  "shelter-operations": [
    {
      activity: "Open Operations and its tiles",
      device: "phone",
      do: "Open the menu (the ☰ button), tap Operations, then tap each tile and come back.",
      expect: "Only the tiles for pages your role can open are shown, each opens its page, and Operations stays lit in the menu while you are on one. A role that opens none of them has no Operations in its menu. The page does not slide sideways at 375 px.",
      notes: MENU,
    },
  ],
  "release-notes": [
    {
      activity: "Read the release notes",
      device: "both",
      do: "Open Release notes and open the newest release.",
      expect: "It shows the current version and the changes that affect your role, in plain words.",
    },
  ],
  assistant: [
    {
      activity: "Ask the assistant a question",
      needs: "assistant.ask",
      device: "both",
      do: "Tap Assistant in the header and ask \"Where is <a resident's name>?\"",
      expect: "It answers straight away with no card to confirm, and the screen behind it stays where it was.",
    },
    {
      activity: "Record something with the assistant",
      needs: "assistant.record",
      device: "both",
      roles: ["admin", "management", "staff"],
      do: "Ask the assistant to record a weight for a resident, check the card, and press Confirm.",
      expect: "The weight really appears on that resident's Weight page. Cancel writes nothing.",
    },
  ],
  roles: [
    {
      activity: "Read what your role can and cannot do",
      device: "both",
      do: "Open the Manual and read \"Roles — who can do what\".",
      expect: "The manual opens on your own role's view, and topics your role cannot do carry the right role labels.",
    },
  ],

  // ── Doctors ───────────────────────────────────────────────────────────────
  "appointments-vet": [
    {
      activity: "See your clinic's appointments",
      device: "both",
      do: "Open Appointments (the first item in a doctor's menu).",
      expect: "Visits are in three groups — To write up, Upcoming, Recently done — each with a count, and only this clinic's visits show. A clinic with none reads as empty, not broken.",
    },
  ],

  // ── My tasks ─────────────────────────────────────────────────────────────
  "my-tasks-page": [
    {
      activity: "See the maintenance jobs assigned to you",
      needs: "maintenance.jobs:read",
      device: "phone",
      na: ["doctor"],
      do: "Open My tasks and look at the list.",
      expect: "Jobs assigned to you are listed by due date with their place, and the number beside My tasks in the menu counts those due today or overdue.",
      notes: { doctor: "A doctor has no My tasks: typing its address sends the doctor to Appointments." },
    },
    {
      activity: "Change a maintenance job's status from My tasks",
      needs: "maintenance.jobs",
      device: "phone",
      roles: ["admin", "management", "staff"],
      na: ["doctor"],
      do: "Tap In progress, then Completed on one of your jobs, then tap Undo.",
      expect: "The status changes each time, and the completed job comes back with Undo.",
    },
  ],
  "my-access-requests": [
    {
      activity: "See the access-requests task on My tasks",
      device: "both",
      naRest: true,
      do: "While someone is waiting for a role, open My tasks.",
      expect: "A Review access requests task shows how many are waiting, and it disappears by itself once nobody is waiting.",
    },
  ],
  "my-recurring-jobs": [
    {
      activity: "Mark a recurring job done or skipped",
      needs: "recurring.do_own",
      device: "phone",
      na: ["doctor"],
      do: "On My tasks tap Done on a recurring job due today, and Skip with a note on another.",
      expect: "Each leaves the list and the note is kept. A job that waits for another shows \"Waiting for …\" until that one is done.",
    },
  ],

  // ── Residents ────────────────────────────────────────────────────────────
  "residents-list": [
    {
      activity: "Find a resident",
      needs: "resident.record:read",
      device: "both",
      do: "Open Residents and search by name (English or Thai), by ID such as R-0042, then try a zone chip and the Off-site chip.",
      expect: "The list narrows each time and a name opens that resident's hub. Residents who have died are hidden, with a count.",
      notes: {
        doctor: "A doctor's list names the clinic at the top and shows only that clinic's residents; any other resident is absent.",
        volunteer: "A volunteer's list is name, ID, enclosure, zone and status only: no Scan a chip box, no No microchip chip, no ticking residents, no New resident and no pencil; searching by another name finds nothing.",
      },
    },
  ],
  "name-card": [
    {
      activity: "Tap a resident's name card with your phone",
      device: "phone",
      do: "Hold the top of your phone to a resident's name card.",
      expect: "The resident's page opens. Admin, Management, Staff and a doctor whose clinic treats that resident see the full page; everyone else signed in sees the public card (photo, name, age, temperament) plus where the resident lives and a button for each job they can do. Nobody sees an error or a page with less than a visitor sees.",
    },
  ],
  microchip: [
    {
      activity: "Find a resident by their microchip number",
      device: "both",
      do: "On Residents, scan or type a 15-digit chip number in the Scan a chip box.",
      expect: "The resident with that chip opens. A number nobody has says so.",
    },
    {
      activity: "Record or correct a microchip number",
      device: "both",
      do: "On a resident, tap Record chip (or Correct), type 15 digits and Save.",
      expect: "The number shows under the resident's name. Fewer than 15 digits, or a number another resident has, is refused.",
    },
  ],
  intake: [
    {
      activity: "Register a new resident (intake)",
      needs: "resident.register",
      device: "phone",
      do: "Tap New resident (intake) and go through the steps with an obviously made-up name, then tap Register resident.",
      expect: "You are taken to the new resident's hub, which shows the name, enclosure and intake date you entered.",
    },
  ],
  hub: [
    {
      activity: "Open a resident's hub and read its cards",
      needs: "resident.record:read",
      device: "both",
      do: "Open a resident and look at every card; on a phone, switch between Overview and Medical.",
      expect: "Photo, details, housing, adoption updates and the medical cards all load, and nothing says an error.",
      notes: {
        doctor: "The doctor sees the info, medical and placement parts, but no New resident, Edit, Move, Hospital, Foster, Adopt or Record a death controls.",
        volunteer: "A volunteer's page for a resident is smaller: photo, name, ID, species, sex, status, enclosure and zone, and a link to the enclosure. There are no cards, no tabs and no medical part.",
      },
    },
  ],
  "adoption-updates": [
    {
      activity: "Record news from an adopter, with a photo",
      needs: "resident.adoption_news",
      device: "both",
      do: "On an adopted resident tap Add update, fill in who sent it and how, choose a photo, and Save update.",
      expect: "The update shows with its date, how it came in, the note and the photo.",
    },
  ],
  edit: [
    {
      activity: "Edit a resident's details",
      needs: "resident.record",
      device: "phone",
      do: "Tap the pencil next to a resident's name, change the bio, and Save changes.",
      expect: "The hub and the resident's page show the change.",
    },
  ],

  // ── Housing ──────────────────────────────────────────────────────────────
  move: [
    {
      activity: "Move a resident to another enclosure",
      needs: "placement.move",
      device: "phone",
      do: "Tap Move enclosure, pick a zone and enclosure, and tap Move resident.",
      expect: "The hub shows the new enclosure and Placement history records the move. A nearly full enclosure asks you to confirm first.",
    },
  ],
  hospital: [
    {
      activity: "Send a resident to hospital",
      needs: "placement.hospital",
      device: "phone",
      do: "Tap Send to hospital, enter the date and reason, and confirm.",
      expect: "The housing card reads \"In hospital\" and Move enclosure is hidden.",
    },
    {
      activity: "Bring a resident back from hospital",
      needs: "placement.hospital",
      device: "phone",
      do: "Tap Return from hospital and choose the enclosure.",
      expect: "The resident is back in that enclosure and both steps show in Placement history.",
    },
  ],
  "foster-adopt": [
    {
      activity: "Record a foster placement",
      needs: "placement.rehome",
      device: "phone",
      do: "Tap Foster / adopt, choose Foster, pick a carer, and Record foster.",
      expect: "The housing card shows the carer and the placement is in the history.",
    },
    {
      activity: "Record an adoption",
      needs: "placement.rehome",
      device: "phone",
      do: "Tap Foster / adopt, choose Adopt, pick the adopter, and Record adoption.",
      expect: "The resident is shown as adopted and no longer appears on the public Adopt page.",
    },
    {
      activity: "Bring a fostered or adopted resident back to the shelter",
      needs: "placement.rehome",
      device: "phone",
      do: "Tap Return to shelter and choose the enclosure.",
      expect: "The resident is in that enclosure again, and the history shows it.",
    },
  ],
  deceased: [
    {
      activity: "Record a death",
      needs: "placement.death",
      device: "phone",
      do: "Tap the broken-heart icon, enter the date and cause, and confirm. Use a made-up resident.",
      expect: "The status becomes Deceased, the resident leaves the public pages, and only the bio and photos can still be changed.",
    },
  ],
  "undo-deceased": [
    {
      activity: "Withdraw a death recorded in error",
      needs: "placement.death_withdraw",
      device: "both",
      do: "On the deceased resident, tap Withdraw this death, give the reason, and confirm.",
      expect: "The resident is back where they were and reappears on the public Adopt page if they were listed.",
    },
  ],
  "placement-history": [
    {
      activity: "Read a resident's placement history",
      device: "both",
      do: "Tap the Housing & Status title on a resident's hub.",
      expect: "Every placement is listed newest first with its type, dates, carer and notes.",
    },
  ],

  // ── Medical ──────────────────────────────────────────────────────────────
  immunizations: [
    {
      activity: "Log immunizations for one or several residents",
      needs: "medical.immunizations",
      device: "both",
      do: "Open Log immunization, choose residents (or Add all in enclosure), tick the vaccines given, enter the date, and tap the button.",
      expect: "A table shows each resident, vaccine and next-due date, and the records appear on each resident's Immunizations page.",
    },
  ],
  "vet-visits": [
    {
      activity: "Book a clinic visit",
      needs: "visit.book",
      device: "both",
      do: "On a resident tap Book clinic visit, choose the clinic, date and reason, and save.",
      expect: "The visit is listed on the resident's Clinic visits page.",
      notes: { doctor: "A doctor is offered only their own clinic, and picks the doctor from the clinic's list." },
    },
    {
      activity: "Record how a visit went",
      needs: "medical.visits",
      device: "both",
      do: "Tap Edit on the visit, mark it Completed, add the doctor and the cost, and save.",
      expect: "The visit shows as Completed with the doctor's name.",
    },
  ],
  prescriptions: [
    {
      activity: "Add a prescription",
      needs: "medical.prescriptions",
      device: "phone",
      do: "Open Prescriptions on a resident, tap Add prescription, pick the medication, dose, frequency and start date, and save.",
      expect: "It appears under Current. Linking it to a visit in the future is refused.",
    },
    {
      activity: "Stop a prescription early",
      needs: "medical.prescriptions",
      device: "phone",
      do: "Tap End today on a current prescription.",
      expect: "It moves to Expired and drops out of the medication forecast from tomorrow.",
    },
  ],
  diet: [
    {
      activity: "Record a resident's diet",
      needs: "medical.diet",
      device: "both",
      do: "Open Diet on a resident, tap Add diet, pick the diet and meals a day, and save. Then clear the end date on a phone.",
      expect: "The diet shows as Current; the end date can be emptied on a phone and stays empty.",
    },
  ],
  weight: [
    {
      activity: "Log a resident's weight",
      needs: "medical.weight",
      device: "phone",
      do: "Open Weight on a resident, tap Log weight, enter kg and the date, and save.",
      expect: "The weight chart updates. Weighing the same resident twice on one day corrects the first reading instead of adding a second.",
    },
  ],
  procedures: [
    {
      activity: "Log a procedure",
      needs: "medical.procedures",
      device: "both",
      do: "Open Procedures on a resident, tap Log procedure, pick the type and date, drop in a file, and save.",
      expect: "The procedure appears with its file.",
    },
  ],
  "blood-tests": [
    {
      activity: "Log a blood test with its report",
      needs: "medical.blood_tests",
      device: "both",
      do: "Open Blood Tests on a resident, tap Log blood test, pick the type, and attach a PDF report.",
      expect: "The test is listed and the PDF shows a file icon, not a broken picture.",
    },
  ],
  "archive-records": [
    {
      activity: "Remove a medical record entered by mistake, then bring it back",
      needs: "medical.archive",
      device: "both",
      do: "Tap Remove on a weight reading, then Show removed, then Restore.",
      expect: "The record leaves the list and charts when removed and returns when restored. Doctors are not offered Remove.",
    },
  ],

  // ── Photos ───────────────────────────────────────────────────────────────
  "resident-photos": [
    {
      activity: "Add photos to a resident",
      needs: "photos.resident_add",
      device: "phone",
      do: "Open Photos on a resident, choose a folder, and add a photo from the phone.",
      expect: "The photo appears in the gallery under the folder you chose.",
      notes: { doctor: "A doctor has no folder choice: photos go into Medical, and never to the website." },
    },
  ],

  // ── Enclosures ───────────────────────────────────────────────────────────
  "enclosure-map": [
    {
      activity: "Find an enclosure on the map",
      needs: "facility.map",
      device: "phone",
      do: "Open Enclosures, tap Map, tap a zone and Open this zone, pinch to zoom, tap an enclosure and then Open enclosure.",
      expect: "The plan zooms and moves, the enclosure shows its count, and Open enclosure goes to its page. Enclosures not drawn yet are listed under the plan. The page does not scroll sideways.",
    },
  ],
  "browse-enclosures": [
    {
      activity: "Browse enclosures and see how full they are",
      needs: "facility.enclosures:read",
      device: "phone",
      do: "Open Enclosures, tap a zone chip, and tick Has open maintenance.",
      expect: "The cards narrow each time and show residents against capacity. The page does not scroll sideways.",
      notes: { volunteer: "A volunteer has no Has open maintenance tick: they cannot read maintenance." },
    },
  ],
  "enclosure-hub": [
    {
      activity: "Open an enclosure and see who lives in it",
      needs: "facility.enclosures:read",
      device: "phone",
      do: "Tap an enclosure card.",
      expect: "Its notes, its residents and its open maintenance jobs show, and a resident opens that resident's hub.",
      notes: { volunteer: "A volunteer sees the residents who live there and opens each one's who-and-where page; there is no maintenance part." },
    },
  ],

  // ── Maintenance ──────────────────────────────────────────────────────────
  "log-maintenance": [
    {
      activity: "Log a maintenance job with photos",
      needs: "maintenance.jobs",
      device: "phone",
      do: "Tap Log maintenance and go through the steps: what is wrong (title, photo), where, who and when (assign it), then check the Review and Save job.",
      expect: "The job is on the board and on the assignee's My tasks.",
    },
  ],
  "maintenance-board": [
    {
      activity: "See the maintenance board",
      needs: "maintenance.jobs:read",
      device: "both",
      do: "Open Maintenance and switch Assigned to between Me and Everyone.",
      expect: "The jobs show in columns by status, coloured when overdue or blocked.",
    },
    {
      activity: "Change a job's status on the board",
      needs: "maintenance.jobs",
      device: "both",
      roles: ["admin", "management", "staff"],
      do: "On a phone, tap Move job on under a job, choose Move to In progress, and confirm; then do the same to reach Completed and to go back a column. On a desktop, drag the card to another column.",
      expect: "The confirmation says in words what will happen; the status changes and stays after a refresh.",
    },
    {
      activity: "Edit a job, record its cost, add before and after photos",
      needs: "maintenance.jobs",
      device: "both",
      roles: ["admin", "management", "staff"],
      do: "Open a job, enter the actual cost, and add an After photo.",
      expect: "The cost and photo show on the job.",
    },
  ],

  // ── Projects ─────────────────────────────────────────────────────────────
  "browse-projects": [
    {
      activity: "Add photos to a project folder",
      needs: "projects.photos",
      device: "phone",
      do: "Open Projects, tap a category and a folder, and tap Add photos.",
      expect: "The photos appear in the folder.",
    },
  ],
  "outreach-visits": [
    {
      activity: "Record an outreach visit on a phone",
      needs: "community.outings",
      device: "phone",
      do: "Operations → Outreach visits → Record a visit. Pick or add the temple or village, tick what you did, type how many dogs, Save visit.",
      expect: "The visit is at the top of the list with its place, dogs and what was done.",
    },
    {
      activity: "Correct or delete an outreach visit",
      needs: "community.outings",
      device: "both",
      do: "Tap Edit beside a visit, change the number of dogs and save; then Edit again and Delete this visit.",
      expect: "The list shows the new number, then the visit is gone.",
    },
    {
      activity: "Change who may write outreach notes",
      needs: "community.outings",
      device: "desktop",
      do: "As Admin, Settings → Security → Who may write outreach notes: set Staff to Write and correct, then back to No.",
      expect: "Saved. While set, a staff login sees Outreach visits under Operations; after, it does not.",
    },
  ],
  "manage-projects": [
    {
      activity: "Create a project folder and write its story",
      needs: "projects.folders",
      device: "both",
      do: "Tap New folder, give it a name, then Edit details and write the story.",
      expect: "The folder and its story are saved.",
    },
    {
      activity: "Put a project on the public website",
      needs: "projects.publish",
      device: "both",
      do: "Turn on Show on website for the folder, then open the public Our work page.",
      expect: "The folder's title, story and photos show there; turning it off removes them.",
    },
  ],

  // ── Clinics and contacts─────────────────────────────────────────────────
  vets: [
    {
      activity: "Look up a clinic",
      needs: "clinics.list:read",
      device: "both",
      do: "Open Clinics and tap a clinic.",
      expect: "Visit counts and the clinic's doctors show.",
    },
  ],
  contacts: [
    {
      activity: "Look up a contact and reach them",
      needs: "contacts.browse",
      device: "phone",
      do: "Open Contacts, search for a carer, and tap Call or LINE.",
      expect: "The right app opens with that person's number or LINE ID.",
    },
  ],

  // ── Management ───────────────────────────────────────────────────────────
  dashboard: [
    {
      activity: "Read the dashboard",
      needs: "reports.dashboard",
      device: "both",
      do: "Open Management, then Dashboard.",
      expect: "The counts for right now, this month and the last twelve months show, and they match what you know about the shelter.",
    },
  ],
  "manage-contacts": [
    {
      activity: "Add, edit, archive and restore a contact",
      needs: "contacts.directory",
      device: "desktop",
      do: "Add a contact, change its phone number, archive it, then Show archived and Restore it.",
      expect: "An archived contact drops out of the pickers; a restored one returns.",
    },
  ],
  "shelter-friends": [
    {
      activity: "Add a Shelter Friend and publish it",
      needs: "friends.manage",
      device: "desktop",
      do: "Tap Add a Shelter Friend, go through the steps with a made-up business, and publish.",
      expect: "The business's card appears on the public Shelter Friends page showing only the details you ticked.",
    },
    {
      activity: "Unpublish a Shelter Friend",
      needs: "friends.manage",
      device: "desktop",
      do: "On Management → Shelter Friends tap Unpublish on that card.",
      expect: "The card leaves the public page but the profile is kept.",
    },
  ],
  "donation-receipts": [
    {
      activity: "Record a donation and issue its receipt",
      needs: "donation.receipt",
      device: "both",
      do: "Record a donation from a made-up donor with a Thai name and two lines, then Share it from a phone (or Download it on a PC).",
      expect: "A receipt numbered LCA… opens with the Thai name in full, both lines and the total; it is saved on Drive under Admin, Donations, Receipts.",
    },
    {
      activity: "Void a receipt and issue a new one",
      needs: "donation.receipt",
      device: "both",
      do: "Open that donation, Void this receipt with a reason, then Issue a new receipt.",
      expect: "The old receipt stays on the list marked Void with its number; the new one has the next number.",
    },
  ],
  "manage-vets": [
    {
      activity: "Add a clinic",
      needs: "clinics.list",
      device: "desktop",
      do: "Management → Clinics: add a clinic by its name (a mobile doctor is a clinic with no address).",
      expect: "It is offered in the clinic visit form.",
    },
  ],
  "vet-doctors": [
    {
      activity: "Manage a clinic's doctors",
      needs: "clinics.doctors",
      device: "desktop",
      do: "Open a clinic's Doctors list, add a doctor, then rename or merge one.",
      expect: "The doctor is suggested on the visit form; renaming or merging also changes past visits and says so first.",
    },
  ],
  "manage-medications": [
    {
      activity: "Add a medication and set its stock",
      needs: "stock.medications",
      device: "desktop",
      do: "Management → Medications: add one with its unit, tap Count and enter what is in the cupboard.",
      expect: "It is offered on the prescription form and the stock figure shows. A blank count means \"not counted\".",
    },
    {
      activity: "Add a label photo to a medication",
      needs: "stock.medications",
      device: "both",
      do: "Tap Upload label on a medication and take or choose a picture.",
      expect: "The picture shows beside its name here and on the stocktake sheet.",
    },
  ],
  "medication-list": [
    {
      activity: "Read today's medication list",
      device: "phone",
      do: "Operations → Medication list (the Head of Medical: Home → Administer Medication), then scroll down the page.",
      expect: "Animals with medicine due in the chosen round (Morning, Lunch or Evening) are grouped by zone and enclosure, each with a photo, name, the medicine's label photo, the amount drawn as tablets or a syringe, and the day's rounds as sunrise, sun and moon. Nothing is ticked off and the page does not slide sideways.",
    },
    {
      activity: "Choose the round, then read the stock-room pick list",
      device: "phone",
      do: "Open the medication list at a time that is not the round you are preparing, tap the round you are doing (for example Lunch in the morning), then tap Stock-room pick list.",
      expect: "The round you tapped stays selected whatever the clock says. The list shows, per zone and then per enclosure, each medicine and how many doses to bag, and anything with no round set is called out rather than left out.",
    },
  ],
  "manage-diets": [
    {
      activity: "Add a diet and read the food forecast",
      needs: "stock.diets",
      device: "desktop",
      do: "Management → Diets: add a diet with its cost and portions, then read the Next 30 days forecast.",
      expect: "The forecast shows how much food and money the residents will need.",
    },
  ],
  stocktake: [
    {
      activity: "Count the stock and save the count",
      needs: "stock.count",
      device: "phone",
      do: "Open Stocktake (the 2IC: tap Do Stocktaking on Home), type what is on the shelf for several items, tap Review and save, and save.",
      expect: "Big changes are listed first for checking; after saving, the counts show as new.",
    },
    {
      activity: "Count the medicines one card at a time",
      needs: "stock.count",
      device: "phone",
      do: "Open Stocktake on a phone. On each medicine card type what is on the shelf and tap Save; tap Same as last time on one and Skip on another. At the end choose Count them now for the skipped one, then Review and save.",
      expect: "Each card shows the box's photo (or the name), the keypad is open, the top says how far you are, and nothing is saved until Review and save.",
    },
    {
      activity: "Close the page half-way and come back",
      needs: "stock.count",
      device: "phone",
      do: "Count a few medicines on the cards, close the tab, then open Stocktake again.",
      expect: "It says it picked up where you left off, with the same counts and the same card.",
    },
    {
      activity: "Skip an item, or keep its figure with \"Same as last time\"",
      needs: "stock.count",
      device: "phone",
      do: "Leave one row blank and tick Same as last time on another, then save.",
      expect: "The blank one is left exactly as it was; the ticked one is recorded as counted now.",
    },
  ],
  "stock-usage": [
    {
      activity: "Compare stock used with what was planned",
      needs: "stock.usage",
      device: "desktop",
      do: "Open Stock between counts and tap Download CSV.",
      expect: "Used, Planned and Difference add up for each item, and the CSV opens in a spreadsheet.",
    },
  ],
  purchasing: [
    {
      activity: "Work out what to buy",
      needs: "stock.purchasing",
      device: "phone",
      do: "Open Purchasing (the 2IC: tap Do the Purchasing on Home), pick 2 weeks, open the Medicines fold, tap an item to open its working, and tap Download CSV.",
      expect: "One screen: Medicines and Food in separate folds, each grouped by supplier, each item opens to show its working.",
    },
  ],
  deliveries: [
    {
      activity: "Record a delivery",
      needs: "stock.delivery",
      device: "phone",
      do: "Open Deliveries from the menu (the 2IC: tap Record a Delivery on Home), tap Medicine, pick a medication, type the amount, tap Next three times, and tap Record this delivery. Then tap Back from the last screen to check the amount is still there.",
      expect: "One question per screen, each with a Back button that keeps what you typed; the last screen says in words what will be recorded. It appears under Recent deliveries with your name. A delivery dated in the future cannot be chosen.",
    },
  ],
  "recurring-jobs": [
    {
      activity: "Set up a recurring job for a person or a team",
      needs: "recurring.manage",
      device: "desktop",
      do: "Tap New recurring job, set a weekly rule, tick who does it, and check Next dates before saving.",
      expect: "The job lists its next dates and shows on the assignees' My tasks on those days. A doctor is not offered as an assignee.",
    },
    {
      activity: "Hand a date over to someone else",
      needs: "recurring.manage",
      device: "desktop",
      do: "Use Hand over, choose these dates only, who covers, and a reason.",
      expect: "The covering person sees the job marked \"handed to you\" with the reason, and only for those dates.",
    },
  ],
  cashflow: [
    {
      activity: "Read the cashflow forecast",
      needs: "reports.cashflow:read",
      device: "both",
      do: "Open Cashflow, pick Next 90 days, and tap Download CSV.",
      expect: "Totals, the monthly chart and the table show; items with no price read \"not priced yet\".",
    },
  ],
  translations: [
    {
      activity: "Translate a public text and see it on the website",
      needs: "translations.manage",
      device: "both",
      do: "Open Translations, write and approve a translation, then open the public site in that language.",
      expect: "The approved text shows to visitors in that language; until approved they see the original.",
    },
  ],

  // ── Settings (admin) ─────────────────────────────────────────────────────
  security: [
    {
      activity: "Create a user and pass on the temporary password",
      device: "both",
      do: "Open Security, create a made-up user with a role, and read the temporary password.",
      expect: "The password is shown once and the new person can sign in with it, then must choose their own.",
    },
    {
      activity: "Approve a person waiting for access",
      device: "both",
      do: "Under Access requests, give a waiting person a role.",
      expect: "They can sign in and see the menu for that role.",
    },
    {
      activity: "Change a person's role",
      device: "desktop",
      do: "Change a made-up user's role in the table.",
      expect: "After a hard refresh they see the menu for the new role. You cannot remove the last admin.",
    },
    {
      activity: "Archive a person who has left",
      device: "desktop",
      do: "Archive the made-up user.",
      expect: "They can no longer sign in and no longer appear in the maintenance Assigned to list.",
    },
  ],
  "recent-changes": [
    {
      activity: "Find who changed a record, and undo the change",
      needs: "audit.view",
      device: "desktop",
      do: "Open Recent changes, filter by who and date, open a line and tap Undo this change.",
      expect: "The record goes back to its old values. Undo is offered only on the newest change to a record.",
    },
  ],
  "two-step": [
    {
      activity: "Set up and use 2-step verification",
      device: "both",
      do: "Open Security, set up an authenticator app, then sign out and open Security again.",
      expect: "The page asks for the 6-digit code and opens when it is right.",
    },
  ],
  website: [
    {
      activity: "Change something on the public website",
      needs: "website.content",
      device: "both",
      do: "Open Settings → Website, change the tagline or add a gallery photo, and save.",
      expect: "The change shows on the public site straight away.",
    },
    {
      activity: "Choose the Pet of the week",
      needs: "website.content",
      device: "desktop",
      do: "On the Home page tab choose a resident who is on the Adopt page.",
      expect: "That resident is featured on the home page.",
    },
  ],
  "zones-enclosures": [
    {
      activity: "Add a zone and an enclosure",
      needs: "facility.enclosures",
      device: "desktop",
      do: "Settings → Zones: add a zone; Settings → Enclosures: add an enclosure with a capacity.",
      expect: "The enclosure is on the Enclosures page and offered when moving a resident.",
    },
  ],
  "facility-map-editor": [
    {
      activity: "Place an enclosure on the facility map",
      needs: "facility.enclosures",
      device: "desktop",
      do: "Settings → Facility map: pick a plan, pick an enclosure, click two opposite corners on the plan, then drag a corner to adjust it.",
      expect: "The shape is saved at once and the next unplaced enclosure is picked. It shows on the Map under Enclosures, and the Not on this plan yet list there is one shorter.",
    },
    {
      activity: "Add a plan to the facility map",
      needs: "facility.enclosures",
      device: "desktop",
      do: "Settings → Facility map → Add a plan: choose the zone or the overview, type the file name of a plan picture, check it appears, tap Add this plan.",
      expect: "The plan is offered in the buttons above the editor and the Map button appears on Enclosures. A name with no picture behind it cannot be added.",
    },
  ],
  "immunization-types": [
    {
      activity: "Add an immunization type",
      needs: "reference.types",
      device: "desktop",
      do: "Add a vaccine with a repeat interval and tick Mandatory.",
      expect: "It is offered on the immunization form and counted in the \"missing\" check on the hub.",
    },
  ],
  "procedure-types": [
    {
      activity: "Add or merge a procedure type",
      needs: "reference.types",
      device: "both",
      do: "Add a type, then merge a duplicate into it.",
      expect: "The type is offered on the procedure form; a type with logged procedures cannot be deleted, only merged.",
    },
  ],
  "blood-test-types": [
    {
      activity: "Add or merge a blood test type",
      needs: "reference.types",
      device: "both",
      do: "Add a type, then merge a duplicate into it.",
      expect: "The type is offered on the blood test form; a type with logged tests cannot be deleted, only merged.",
    },
  ],
  frequencies: [
    {
      activity: "Add a frequency",
      needs: "reference.types",
      device: "desktop",
      do: "Add \"Every 6 hours\" with its schedule.",
      expect: "It is offered on the prescription form.",
    },
  ],
  "system-status": [
    {
      activity: "Read the system status",
      needs: "system.status",
      device: "desktop",
      do: "Open Settings → System status and tap Check now.",
      expect: "Every health tile is green or says plainly what is wrong, and the Usage numbers are plausible.",
    },
  ],

  // ── The public website ───────────────────────────────────────────────────
  "public-pages": [
    {
      activity: "Read the public home page and menu",
      device: "both",
      audience: "all",
      do: "Open the shelter's public address and tap through Adopt, Our work, Foster, Volunteer and Donate.",
      expect: "Every page opens and reads well, with no staff-only information on any of them.",
    },
    {
      activity: "Browse the animals for adoption and open one",
      device: "both",
      audience: "all",
      do: "Open Adopt and tap an animal.",
      expect: "Its public profile opens. No animal that has been adopted or has died is listed, and no microchip number is shown.",
    },
    {
      activity: "Read the Shelter Friends pages",
      device: "both",
      audience: "all",
      do: "Open Shelter Friends and Become a Shelter Friend.",
      expect: "Each published friend shows only the contact details they agreed to show.",
    },
    {
      activity: "Scan an animal's tag or an enclosure's QR code",
      device: "phone",
      audience: "all",
      do: "Open a resident's tag address (or scan a kennel QR code) without signing in.",
      expect: "The public card opens, not the staff page. Signed in, the QR code opens the enclosure page.",
    },
  ],
  "getting-help": [
    {
      activity: "Find out who to tell when something looks wrong",
      device: "both",
      do: "Read the Getting help note at the end of the Manual.",
      expect: "It says whom to tell and it is clear what to do.",
    },
  ],
};

// ── The "must not" lines of docs/role-walkthrough.md ─────────────────────────
// One per bullet under each pass's "Must not be able to" (Pass 6 has no such
// heading; all its bullets are here). `starts` is the beginning of the bullet
// with asterisks and backticks removed — the generator prints the exact text
// to paste when one has no entry or has been reworded. `text` is what the
// tester is told, in plain words. These stay in a separate list because they
// are about a role, not an activity: they are what a role must NOT be able to
// do, tried by typing the address as well as by looking for a button.
export const BOUNDARIES = [
  // Pass 1 — Doctor
  { role: "doctor", starts: "/my — redirects", text: "Type the address of My tasks: you are sent to Appointments (a doctor has no My tasks)." },
  { role: "doctor", starts: "/clinics and a clinic page", text: "Type the address of the Clinics list and of a clinic page: refused, with the \"no access\" page inside the app." },
  { role: "doctor", starts: "/contacts — refused", text: "Type the address of Contacts: refused." },
  { role: "doctor", starts: "/enclosures, and a zone", text: "Type the address of Enclosures, a zone and an enclosure: refused." },
  { role: "doctor", starts: "/projects — refused", text: "Type the address of Projects: refused." },
  { role: "doctor", starts: "/maintenance — refused", text: "Type the address of Maintenance: refused; a doctor gets no board at all." },
  { role: "doctor", starts: "/stocktake — refused", text: "Type the address of Stocktake: refused." },
  { role: "doctor", starts: "/management and /management/dashboard", text: "Type the address of Management and of its Dashboard: refused." },
  { role: "doctor", starts: "/management/clinics/<id>/doctors", text: "Type the address of a clinic's Doctors list in Management: refused; a doctor cannot rename, merge or mark doctors as left." },
  { role: "doctor", starts: "/admin, /admin/security", text: "Type the address of Settings, Security and Recent changes: refused." },
  { role: "doctor", starts: "/deliveries — refused", text: "Type the address of Deliveries: refused." },
  { role: "doctor", starts: "Resident hub shows no New resident", text: "On a resident's hub there is no New resident, Edit, Move, Hospital, Foster, Adopt or Record a death control." },
  { role: "doctor", starts: "/residents/<id>/edit, /move", text: "Type the address of a resident's Edit, Move, Hospital, Rehome and Deceased pages: all refused." },
  { role: "doctor", starts: "No Remove control on a weight", text: "There is no Remove button on a weight, prescription, clinic visit or immunization." },
  { role: "doctor", starts: "A resident whose only record", text: "After admin or staff remove the only record from this clinic, the resident has left the doctor's list and its address is refused (it reads as absent, not broken)." },
  { role: "doctor", starts: "A resident outside the clinic's scope", text: "Type the address of a resident this clinic has no record for: refused, nothing is shown." },
  { role: "doctor", starts: "Photo upload to any folder but Medical", text: "A doctor's photo upload to any folder other than Medical is refused. Needs the browser's developer tools; write \"not run\" if you cannot." },
  { role: "doctor", starts: "The Assistant slide-over", text: "There is no Assistant button, and no address that opens it." },
  { role: "doctor", starts: "The doctor is not offered when a recurring job", text: "When a recurring job is assigned, the doctor is not in the list of people to choose." },
  // Pass 2 — Staff
  { role: "staff", starts: "/management/ — redirected", text: "Type the address of each Management page — dashboard, cashflow, stock usage, recurring jobs, translations, Shelter Friends, medications, diets, clinics, contacts: all are refused." },
  { role: "staff", starts: "/admin/ — redirected", text: "Type the address of Settings and any page under it: refused." },
  { role: "staff", starts: "Withdraw a death recorded in error", text: "On a deceased resident there is no Withdraw this death, and its address is refused. Only admin can." },
  { role: "staff", starts: "Cannot create, edit or delete a recurring job", text: "Staff cannot create, edit or delete a recurring job; they only mark done the ones given to them." },
  // Pass 3 — Admin
  { role: "admin", starts: "Deleting a reference type that is in use", text: "Delete an immunization, procedure, blood-test or other type that is in use: refused or handled, never leaving records pointing at nothing." },
  { role: "admin", starts: "Removing the last admin", text: "Try to remove or demote the last admin: refused." },
  // Pass 4 — Management
  { role: "management", starts: "/admin and /admin/ — redirected", text: "Type the address of Settings and any page under it: refused." },
  { role: "management", starts: "/admin/security — redirected", text: "Type the address of Security: refused." },
  { role: "management", starts: "Cannot withdraw a death", text: "On a deceased resident there is no Withdraw this death. Only admin can." },
  // Pass 5 — Volunteer (rewritten for R1, 2026-10-04)
  { role: "volunteer", starts: "Anything else on a resident", text: "Look for a resident's breed, age, bio, notes, microchip, carer or dates, on the page or in the list, or find one by a chip number: none of it is shown, and a chip search finds nothing." },
  { role: "volunteer", starts: "Intake, edit, move, hospital", text: "Register, edit, move, send to hospital, foster, adopt or record a death: controls absent, and the pages refused when typed." },
  { role: "volunteer", starts: "Any medical page", text: "Open a medical tab of a resident, or any of the seven new-record pages (immunization, clinic visit, prescription, diet, weight, procedure, blood test): all refused. A volunteer neither reads nor writes medical records." },
  { role: "volunteer", starts: "Add or set a photo", text: "Add or set a photo on a resident, a project or a maintenance job, or attach a file to a record: no control, and the upload is refused." },
  { role: "volunteer", starts: "/stocktake and /deliveries", text: "Type the address of Stocktake and of Deliveries: refused. A volunteer does not count stock." },
  { role: "volunteer", starts: "/maintenance, /projects", text: "Type the address of Maintenance, Projects, Contacts and Clinics: each refused, and none is a tile on Operations or on Home." },
  { role: "volunteer", starts: "Assistant", text: "Look for the Assistant button in the header, and open the assistant's page by its address: no button, and no answers." },
  { role: "volunteer", starts: "/management/, /admin/", text: "Type the address of any Management or Settings page: refused." },
  // Pass 6 — Public viewer
  { role: "public_viewer", starts: "No app menu at all", text: "After signing in there is no app menu at all." },
  { role: "public_viewer", starts: "Lands on the public home page", text: "Signing in lands on the public home page, not My tasks." },
  { role: "public_viewer", starts: "/my, /residents, /enclosures", text: "Type the address of My tasks, Residents, Enclosures, Maintenance, Stocktake, Clinics, Contacts, Projects, Deliveries, Management and Settings, one by one: every one is refused or redirected." },
  { role: "public_viewer", starts: "Public pages all open", text: "These all open: the home page, Adopt, one animal's page, Donate, Foster, Volunteer and Our work." },
  { role: "public_viewer", starts: "A resident QR link", text: "A resident's tag address opens the public profile, not the staff page." },
  { role: "public_viewer", starts: "/account/password still opens", text: "Change password still opens — the one staff-style page a public viewer needs." },
  { role: "public_viewer", starts: "No deceased or adopted animal", text: "No animal that has died or been adopted is listed on Adopt." },
];

// The signed-out visitor has no pass in the walkthrough (Pass 6 is the signed-in
// public viewer). These come from what the manual promises about the public site.
export const VISITOR_BOUNDARIES = [
  { role: "visitor", text: "Type the address of any staff page — Residents, My tasks, Management, Settings: you are asked to sign in and nothing from the shelter's records is shown." },
  { role: "visitor", text: "Look through every public page and a resident's public profile: no microchip number, medical record, clinic visit, medication, adopter or carer contact, or internal note appears anywhere." },
  { role: "visitor", text: "Open a resident's public profile for an animal that has since been adopted or has died: it does not show as available." },
];
