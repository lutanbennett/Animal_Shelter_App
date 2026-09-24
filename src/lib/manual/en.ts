import {
  BookOpen,
  Camera,
  ClipboardList,
  Fence,
  FolderOpen,
  Globe,
  HeartPulse,
  House,
  PawPrint,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import type { Manual } from "./types";

/**
 * The English user manual, rendered at /manual. Content only — the page
 * layout lives in src/app/manual/. Screenshots are written by
 * scripts/manual-screenshots.mjs into public/manual/, so after a screen
 * changes, re-run that script rather than editing images by hand.
 */
const manual: Manual = {
  title: "User manual",
  subtitle:
    "How to use the Lanna Care for Animals app day to day — finding a resident, recording what happens to them, keeping the shelter's enclosures, contacts and website up to date.",
  version: "Draft 1 · September 2026 · English only for now",

  roleNames: {
    admin: "Admin",
    management: "Management",
    staff: "Staff",
    vet: "Vet",
    volunteer: "Volunteer",
  },
  roleSummary: {
    admin:
      "Everything, including the Settings section (users, website, zones, enclosures, immunization and procedure types) and the Management section.",
    management:
      "Everything staff can do, plus the Management section: the reporting dashboard, the contact, vet, medication and diet lists, and the translations of public text.",
    staff:
      "Day-to-day resident work: intake, moves, hospital, foster and adoption, photos, maintenance, projects. Can read medical records.",
    vet: "Vet visits, procedures, blood tests, prescriptions and immunizations. Can read resident details.",
    volunteer:
      "Can see everything; can add photos and move residents between enclosures.",
  },

  sections: [
    // ------------------------------------------------------------------
    {
      id: "getting-started",
      title: "Getting started",
      icon: BookOpen,
      intro:
        "The app runs in a web browser on a phone, tablet or computer — nothing to install. On a phone it works as a field tool: find a resident, log what you did, add photos. On a computer you get the extra columns, filters and the Management and Settings sections.",
      topics: [
        {
          id: "sign-in",
          title: "Signing in",
          path: "Home page → Staff & Volunteer Login",
          steps: [
            "Open the app's address in your browser and tap Staff & Volunteer Login (or go straight to /login).",
            "Enter your email and password and tap Sign in — or tap Continue with Google if your account was set up with Google.",
            "You land on the Residents list. Sign out any time with the Sign out button at the top right.",
            "Forgotten your password? Tap Forgot password? under the Sign in button, enter your email, and follow the link in the message to choose a new one — it's valid for an hour. If you were given a temporary password and it's lost, ask an admin to issue another instead.",
            "To change your password at any time, pick Change password from the bottom of the menu.",
          ],
          screenshot: {
            src: "/manual/login.png",
            alt: "The sign-in page with email, password, Sign in and Continue with Google",
            caption: "The sign-in page. The EN / ไทย switch at the top changes the app's language.",
          },
          callouts: [
            {
              kind: "note",
              text: "If Google sign-in says your account hasn't been given access yet, an admin needs to add you under Settings → Security first.",
            },
          ],
        },
        {
          id: "language",
          title: "Switching language",
          steps: [
            "Use the EN / ไทย switch in the header (or on the sign-in page).",
            "The choice is remembered on that device. Free-text notes stay in whatever language they were typed in; the ones the public reads (a resident's bio, a project's story) get a translation written by a manager — see Management → Translating public text.",
          ],
        },
        {
          id: "navigation",
          title: "Finding your way around",
          steps: [
            "On a computer the menu is always visible down the left, each link with its own icon: Residents, Enclosures and Maintenance first, then Vets, Contacts and Projects, then the Assistant — and, depending on your role, Management and Settings. Those two open a front page of tiles, one for each page inside them; the same icons are used on the tiles and in the menu.",
            "Under a dividing line at the very bottom of the menu sit the things you only need now and then, so they are always in the same place: this manual, Release notes, Change password and — for admins — Security, where accounts and roles are managed.",
            "On a phone tap the ☰ button at the top left to open the same menu; tap outside it to close. The same links are the last entries in it, below the same line.",
            "The LCA logo and your email are in the header, with the language switch and Sign out. Tap the logo to see the public website as a visitor does — it opens in a new tab so you don't lose your place.",
          ],
          screenshot: {
            src: "/manual/nav-mobile.png",
            alt: "The phone menu drawer open over the residents list",
            caption: "The menu on a phone. On a computer the same links sit in a sidebar.",
            mobile: true,
          },
        },
        {
          id: "release-notes",
          title: "What changed: release notes",
          path: "Release notes (bottom of the menu)",
          intro:
            "Every update to the system is listed on the Release notes page, newest at the top, in plain words: what you will notice, not how it was built. Everyone who can sign in can read it.",
          steps: [
            "Open Release notes from the bottom of the menu.",
            "Each release shows its number, the date it was prepared and the environment you are looking at. A Major badge marks a release worth reading before you carry on working.",
            "Click a release to see what changed in it, and click it again to fold it away. The newest release is already open.",
            "Admins also get each major release by email. The subject starts with [UAT] or [Production], so a test release is never mistaken for a live one.",
          ],
          callouts: [
            {
              kind: "note",
              text: "The first entry, 0.0.1 “Current Baseline Build”, is where the record starts: it stands for everything the system did on 23 September 2026. Changes are listed from there on.",
            },
          ],
        },
        {
          id: "assistant",
          title: "Asking the assistant",
          roles: ["admin", "management", "staff", "volunteer"],
          path: "Assistant in the header (any screen), or Assistant in the left nav",
          intro:
            "The assistant turns one typed sentence into a filled-in form, shows it to you, and writes nothing until you press Confirm. It is not a chatbot and it does not guess: it recognises the requests listed below, in English or Thai, and leaves blank whatever your sentence didn't say. Anything else gets a polite \"I didn't understand that one\" — so the list below is the whole of what it knows.",
          steps: [
            "Open it with the Assistant button in the header — it slides in over whatever you were looking at — or from Assistant in the left nav for a full page.",
            "Type one request and press Send. Check the card that comes back, fill in or correct anything on it, then press Confirm. Cancel writes nothing.",
            "To record something: \"Send Panda to the vet hospital today\" · \"Panda is back from hospital\" · \"Panda weighs 12.4 kg\" (or \"log weight 12.4 for Panda\") · \"Move Panda to B1 today\" · \"Book a vet visit for Panda with Dr Somchai on Friday at 10am\".",
            "To ask something: \"Where is Panda?\" · \"Who is in B1?\" · \"What is due this week?\" — these are answered straight away, with no card and nothing to confirm.",
            "Names: use the name as it is written on the resident's record, or their code (R-0042). If more than one resident has that name, the assistant shows you their photos, codes and enclosures and asks which one you meant.",
            "Dates: today, tomorrow, yesterday, a weekday name (Friday means the next Friday), or a full date such as 2026-09-30. Times: 10am, 2.30pm, 14:30.",
            "Thai works the same way: ส่ง … ไปโรงพยาบาล · … กลับจากโรงพยาบาล · … น้ำหนัก 12.4 กก. · ย้าย … ไป … · นัดหมอให้ … · … อยู่ไหน · ใครอยู่ใน … · สัปดาห์นี้มีอะไรครบกำหนด.",
          ],
          callouts: [
            {
              kind: "note",
              text: "The assistant can't do anything you couldn't do yourself on the page it stands in for. It runs the same checks and obeys the same permissions — so volunteers can ask it questions, but recording a change is for staff and management.",
            },
            {
              kind: "tip",
              text: "Everything it records carries a note saying it came from the assistant, together with the sentence you typed, so the resident's history shows where the entry came from.",
            },
            {
              kind: "warning",
              text: "If it says it didn't understand, it has written nothing — use the ordinary page instead. It is worth typing the request anyway: the sentences it can't place are kept, and they are what the next version is taught on.",
            },
          ],
        },
        {
          id: "roles",
          title: "Roles — who can do what",
          intro:
            "Every account has one role. The app hides buttons you can't use, and the database refuses the change even if a button is reached another way. Sections below say which roles can do each task.",
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "residents",
      title: "Residents",
      icon: PawPrint,
      intro:
        "Residents are the dogs and cats in the shelter's care — including those in hospital, with foster carers, or adopted. Everything about a resident hangs off their hub page.",
      topics: [
        {
          id: "residents-list",
          title: "Finding a resident",
          path: "Residents",
          steps: [
            "Open Residents from the menu. Every resident is listed by name with their ID, enclosure, zone and status.",
            "Residents who have died are left out. The line under the heading says how many are hidden — \"212 residents · 38 deceased hidden\" — and Show all brings them back, dimmed, with Deceased in the Status column. Tap Hide deceased to put them away again.",
            "Type part of a name (English, Thai or an \"also known as\" name) in Search and tap Filter.",
            "On a computer you can also narrow the list by Zone and Enclosure. Tap Clear to see everyone again.",
            "Tap a resident's name to open their hub.",
          ],
          screenshot: {
            src: "/manual/residents-list.png",
            alt: "The residents list with search, zone and enclosure filters",
            caption: "The residents list on a computer. Phones show just the ID and name — browse by enclosure instead (see Enclosures).",
          },
          callouts: [
            {
              kind: "tip",
              text: "Tick several residents (computer only) to log immunizations or book one vet visit for all of them at once — the buttons appear above the table.",
            },
            {
              kind: "tip",
              text: "Searching for an animal who has died still finds them: the count line says \"1 deceased resident matches — show\", and show adds them to the list.",
            },
          ],
        },
        {
          id: "intake",
          title: "Registering a new resident (intake)",
          roles: ["admin", "management", "staff"],
          path: "Residents → New resident (intake)",
          intro:
            "Intake creates the resident record and their first placement in one go. The questions come a few at a time over five short steps and a final review, so it fits on a phone at the gate — and the whole record is written when you tap Register resident, never before.",
          steps: [
            "On the Residents list tap New resident (intake).",
            "Step 1, Who: name (required), Thai name, other names, species, breed, sex and size (required — small, medium or large, which sets their default meal size). Tap Next.",
            "Step 2, Arrival: the intake date (required), where they came from (pick an existing origin or add a new one), the zone and enclosure they're going into, intake notes, and the Ready for adoption tick. Each enclosure in the list shows how many residents it holds against its capacity, and the one you pick shows it again underneath — green for space, orange for nearly full or full, red for over. Leave the enclosure blank and they're recorded as Unassigned until you move them; tick Ready for adoption only if they should appear on the public adoption page straight away.",
            "Step 3, Health — all optional: an estimated age in years, a weight at intake (it becomes their first weight reading), how often they need routine blood work, and a starting diet from the list management keeps under Management → Diets. The diet is recorded from the intake date and can be adjusted on the hub's Diet page.",
            "Step 4, For adopters — all optional: colour, desexed, good with dogs / cats / children, and energy level. These fill the \"Is (name) right for you?\" block on the public profile.",
            "Step 5, Story — all optional: bio, temperament, past story and behaviour notes. These are the ones most often written later, from Edit resident.",
            "Step 6, Review: every answer on one page, with an Edit link beside each group to go back and change something. Tap Register resident and you're taken to their new hub. If the enclosure you chose is nearly full or full, you're shown its current and new occupancy first and asked to confirm — Register anyway still takes them in, because the animal at the gate has to go somewhere; Cancel lets you pick another.",
          ],
          screenshot: {
            src: "/manual/resident-intake.png",
            alt: "The first step of the resident intake form, with the step numbers along the top",
            caption: "Step 1 of the intake form. Only the name, the size and the intake date are required — everything else can be added later.",
          },
          callouts: [
            {
              kind: "tip",
              text: "Next won't move on while a required field on the step is empty — it highlights the box to fill in. The numbered steps along the top go back to anything you've already been through, and so does Edit on the review.",
            },
            {
              kind: "note",
              text: "Nothing is saved until Register resident, so walking away part-way through leaves no half-made resident. Refreshing the page keeps your place in the steps but empties the answers.",
            },
          ],
        },
        {
          id: "hub",
          title: "The resident hub",
          path: "Residents → (a resident)",
          intro:
            "The hub is the resident's front page: who they are, where they are, and a card for each part of their record. Every card is a link to the full list behind it.",
          steps: [
            "Top: profile photo, name, ID, species, sex, age, status and intake date. The pencil opens Edit resident details.",
            "Link for this resident's RFID card: the address to program into the card by the kennel. Tap Copy link, or select it by hand; the residents list has the same copy icon on every row. Someone who scans the card while signed in lands on this hub; a visitor sees a public card for the resident — photo, name, age, sex, temperament and bio — with a link to the adoption profile when the resident is shown on the public site (Edit resident details).",
            "Housing & Status: current enclosure (or hospital / carer) and the actions that apply right now — Move enclosure, Send to hospital, Foster / adopt, and so on.",
            "Photos: the Google Drive gallery for this resident.",
            "Medical cards: Immunizations, Vet Appointments, Prescriptions, Weight, Procedures and Blood Tests. Each shows the latest state (for example \"2 missing\" mandatory vaccines, or the next vet visit) and a quick link to add a record.",
            "On a phone the hub is split into two tabs — Overview and Medical.",
          ],
          screenshot: {
            src: "/manual/resident-hub.png",
            alt: "A resident hub with the details card, housing card and medical cards",
            caption: "A resident hub. Green, orange and red card colours mean fine, needs attention soon, and overdue or missing.",
          },
        },
        {
          id: "edit",
          title: "Editing a resident's details",
          roles: ["admin", "management", "staff"],
          path: "Resident hub → pencil icon",
          steps: [
            "Tap the pencil next to the resident's name.",
            "Change identity fields, adoption flags, bio and background, or pick a different profile photo from their gallery.",
            "Housing on this form lets you record a move at the same time as saving; the dedicated actions on the hub do the same thing with more guidance.",
            "Tap Save changes.",
          ],
          callouts: [
            {
              kind: "note",
              text: "\"Estimated age now\" is the age as of today. Only change it when you have a better estimate — the record keeps ageing from the date you set it.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "housing",
      title: "Housing and where a resident is",
      icon: House,
      intro:
        "A resident is always somewhere: in an enclosure, in hospital, with a foster carer, adopted, or (sadly) deceased. Each change is recorded as a placement with a date, and the full history is on the Housing & Placement History page. Which buttons you see depends on where they are now.",
      topics: [
        {
          id: "move",
          title: "Moving between enclosures",
          roles: ["admin", "management", "staff", "volunteer"],
          path: "Resident hub → Housing & Status → Move enclosure",
          steps: [
            "Tap Move enclosure on the hub.",
            "Pick the zone, then the enclosure. Lifecycle statuses (hospital, foster, adoption) are not in this list — they have their own actions.",
            "Enter the move date (today by default) and a note if useful, e.g. \"kennel being repaired\".",
            "Tap Move resident. If the enclosure is nearly full or full you're shown its current and new occupancy and asked to confirm.",
          ],
          screenshot: {
            src: "/manual/resident-move.png",
            alt: "The move resident form with zone and enclosure pickers",
            caption: "Moving a resident. The current location is shown above the picker.",
          },
        },
        {
          id: "hospital",
          title: "Sending to hospital and bringing them back",
          roles: ["admin", "management", "staff"],
          path: "Resident hub → Housing & Status → Send to hospital",
          steps: [
            "Tap Send to hospital, enter the date admitted and the reason, and tap Send to hospital. Their enclosure is remembered.",
            "You can also start this from a vet visit on the Vet Appointments page — the date and notes are pre-filled from the visit.",
            "While they're away the Housing card reads \"In hospital · Returns to …\" and Move enclosure is hidden.",
            "When they're back, tap Return from hospital. The enclosure they left from is pre-selected; choose a different one if they need to go into isolation first. Enter the date returned and tap Return from hospital.",
          ],
          screenshot: {
            src: "/manual/resident-hospital.png",
            alt: "The send to hospital form",
          },
        },
        {
          id: "foster-adopt",
          title: "Foster and adoption",
          roles: ["admin", "management", "staff"],
          path: "Resident hub → Housing & Status → Foster / adopt",
          steps: [
            "Tap Foster / adopt on the hub and choose what's happening: Foster (the shelter stays responsible for medical care) or Adopt (they leave the shelter's care for good).",
            "Pick the carer from the list. Only contacts of type Carer are shown — if the person isn't there yet, tap Add a new carer and enter their name, phone, email and LINE ID. They're saved to Contacts so they can be picked next time.",
            "Enter the date and any notes, then tap Record foster or Record adoption.",
            "A fostered resident can later be adopted (by the same or a different carer), moved to another carer, or sent to hospital. An adopted resident can only be returned.",
            "If a resident comes back, tap Return to shelter and choose the enclosure they're going into.",
          ],
          screenshot: {
            src: "/manual/resident-rehome.png",
            alt: "The foster or adopt form with the carer picker",
            caption: "Foster or adopt. The hint under each option explains the difference.",
          },
          callouts: [
            {
              kind: "note",
              text: "Adopted residents disappear from the public adoption page automatically. Fostered residents stay listed, because foster-to-adopt is common.",
            },
          ],
        },
        {
          id: "deceased",
          title: "Recording a death",
          roles: ["admin", "management", "staff"],
          path: "Resident hub → broken-heart icon next to the pencil",
          steps: [
            "Tap the broken-heart icon beside the pencil on the hub.",
            "Enter the date of death, the cause and any notes. The page lists exactly what will happen.",
            "Tap Record death and confirm.",
            "The resident's status becomes Deceased; future vet visits are cancelled, prescriptions ended, and they leave the public pages. The record closes — only their bio and photos can still be changed, and the archive files below are refreshed when they are. Their Drive folder moves to Residents/Deceased/ with a summary PDF and an offline index page — the hub shows links to these, and a Retry button if Drive was unavailable.",
          ],
          screenshot: {
            src: "/manual/resident-deceased.png",
            alt: "The record death form listing what recording a death does",
          },
          callouts: [
            {
              kind: "warning",
              text: "Double-check you have the right resident before confirming. Only an admin can withdraw a recorded death afterwards, and the mistake stays in the resident's history.",
            },
          ],
        },
        {
          id: "undo-deceased",
          title: "Withdrawing a death recorded in error",
          roles: ["admin"],
          path: "Resident hub → deceased banner → Withdraw this death",
          steps: [
            "On the hub of the resident recorded as deceased, tap Withdraw this death at the bottom of the banner.",
            "Check where they'll go back to — the enclosure or carer they were with when the death was recorded — and say why it was recorded in error. The reason is required.",
            "Tap Withdraw death and confirm.",
            "The resident is back where they were, the vet visits the death cancelled are scheduled again, the prescriptions it ended get their old end dates back, and their record can be edited again. The Drive folder moves back under Residents/ and the generated summary PDF and index page are deleted — a Retry appears on the hub if Drive was unavailable.",
          ],
          callouts: [
            {
              kind: "note",
              text: "This is for a death that didn't happen — the wrong resident, or a slip. Both the death and the withdrawal stay in the Housing & Placement History, dated when they were made. If the death did happen but a detail is wrong, this isn't the tool.",
            },
          ],
        },
        {
          id: "placement-history",
          title: "Placement history",
          path: "Resident hub → Housing & Status card",
          steps: [
            "Tap the Housing & Status card title to open Housing & Placement History.",
            "Every placement is listed newest first with its type (intake, moved enclosure, sent to hospital, fostered…), dates, carer and notes.",
          ],
          screenshot: {
            src: "/manual/resident-housing.png",
            alt: "The housing and placement history page",
          },
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "medical",
      title: "Medical records",
      icon: HeartPulse,
      intro:
        "Six kinds of medical record hang off each resident. All of them are reached from the resident hub's medical cards, or from a vet visit so the record is linked to that visit. Staff can read all of these; adding to them is for vets, staff, management and admins as noted.",
      topics: [
        {
          id: "immunizations",
          title: "Logging immunizations",
          roles: ["admin", "management", "staff", "vet"],
          path: "Resident hub → Immunizations → Log immunization, or tick residents on the list",
          intro:
            "One form records any number of vaccines for any number of residents — a litter's first shots, or a whole enclosure's rabies boosters.",
          steps: [
            "Choose the residents: pick them individually, or use Add all in zone / Add all in enclosure.",
            "Tick the immunization types given. Mandatory ones are marked; each type's repeat interval is set under Settings → Immunization Types.",
            "Enter the date administered, who gave it, and any notes. The notes apply to every record in the batch.",
            "The button tells you how many records will be created. Tap it, and a table shows each resident, vaccine, and its next-due date.",
          ],
          screenshot: {
            src: "/manual/immunizations-new.png",
            alt: "The log immunizations form",
            caption: "Log immunizations. The count on the button is residents × immunization types.",
          },
          callouts: [
            {
              kind: "tip",
              text: "A resident's Immunizations card goes red when a mandatory vaccine hasn't been recorded, and names what's missing.",
            },
          ],
        },
        {
          id: "vet-visits",
          title: "Booking and recording vet visits",
          roles: ["admin", "management", "staff", "vet"],
          path: "Resident hub → Vet Appointments → Book vet visit",
          steps: [
            "Choose one or more residents and the vet or clinic (vets are set up under Management → Vets). If you know which doctor will see them, type their name in Doctor — it is optional. Names already recorded for that vet are offered as you type, so pick one rather than spelling it a new way.",
            "Enter the date and time. Use a past date to record a visit that already happened, including emergencies.",
            "Give the reason, set the status — Scheduled (upcoming) or Completed (already happened) — and add notes.",
            "Tap Book vet visit.",
            "On the resident's Vet Appointments page each visit has quick links to log a blood test, prescription, weight or procedure against that visit, and to send the resident to hospital.",
            "After the visit, tap Edit on its row to mark it Completed (or Cancelled), fix the date or vet, add the doctor who saw them, and enter the cost from the invoice. The vet's hub totals those costs for the period shown.",
          ],
          screenshot: {
            src: "/manual/vet-visit-new.png",
            alt: "The book vet visit form",
          },
          callouts: [
            {
              kind: "note",
              text: "A visit whose date has passed but is still Scheduled shows as overdue on the hub and the Vets pages until its status is updated.",
            },
          ],
        },
        {
          id: "prescriptions",
          title: "Adding a prescription",
          roles: ["admin", "management", "staff", "vet"],
          path: "Resident hub → Prescriptions → Add prescription",
          steps: [
            "Pick the medication from the list (or add a new one, giving what one unit is — tablet, ml, drop…). Management keeps this list tidy under Management → Medications.",
            "Enter the dose per administration and pick a frequency, e.g. Twice daily or Every 8 hours. New frequencies can be added inline too.",
            "Set the start date, and an end date if it's a course; leave the end blank if ongoing.",
            "Optionally link the vet visit that prescribed it and add notes such as \"give with food\".",
            "Tap Save prescription. The resident's Prescriptions page separates Current from Expired.",
            "To change one later, tap Edit on its row — same form, prefilled. To stop a course early, tap End today on a current row; it sets the end date to today and the medication drops out of the forecast from tomorrow.",
          ],
          screenshot: {
            src: "/manual/prescription-new.png",
            alt: "The add prescription form",
          },
        },
        {
          id: "diet",
          title: "Recording a resident's diet",
          roles: ["admin", "management", "staff", "vet"],
          path: "Resident hub → Diet → Add diet",
          steps: [
            "Pick the diet from the list (dry kibble, wet food, a prescription diet…). Management keeps this list, with its costs and portion sizes, under Management → Diets.",
            "Enter the meals a day. Leave Daily quantity blank to use the diet's default for the resident's size — the hint under the field shows what that is — or enter a figure to override it for this resident.",
            "Set the start date, and an end date if it's for a fixed period; leave the end blank if ongoing. Add notes such as allergies or \"soak before serving\". A resident can have several diets running at once.",
            "Tap Save diet. The resident's Diet page separates Current from Past, and the hub's Diet card shows what they're on now.",
            "To change one later, tap Edit on its row. To stop one, tap End today on a current row — it drops out of the food forecast from tomorrow.",
          ],
          screenshot: {
            src: "/manual/diet-new.png",
            alt: "The add diet form",
          },
        },
        {
          id: "weight",
          title: "Logging weight",
          roles: ["admin", "management", "staff", "vet"],
          path: "Resident hub → Weight → Log weight",
          steps: [
            "Enter the weight in kg and the date weighed. The last reading is shown for comparison.",
            "If the weighing happened at a vet visit, link it so the reading stays with that visit.",
            "Tap Save weight. The Weight page charts every reading and shows the change since the previous and first readings.",
          ],
          screenshot: {
            src: "/manual/weight-history.png",
            alt: "The weight history page with its trend chart",
            caption: "Weight history. Weigh at intake, at each vet visit, and whenever condition changes.",
          },
        },
        {
          id: "procedures",
          title: "Logging a procedure",
          roles: ["admin", "management", "staff", "vet"],
          path: "Resident hub → Procedures → Log procedure",
          steps: [
            "Pick the procedure type — X-ray, ultrasound, spay/neuter, dental… — or add a new type.",
            "Enter the date, link the vet visit if there was one (leave unlinked for things done on site, like nail clipping), and add notes.",
            "Drop in any X-rays, scans or paperwork, then tap Save procedure — the files upload as part of the save. Files that arrive later go in from the row's Attach files link on the Procedures page.",
          ],
          screenshot: {
            src: "/manual/procedure-new.png",
            alt: "The log procedure form",
          },
        },
        {
          id: "blood-tests",
          title: "Logging a blood test",
          roles: ["admin", "management", "staff", "vet"],
          path: "Resident hub → Blood Tests → Log blood test",
          steps: [
            "Pick the test type — CBC is preselected as the routine panel; the list (chemistry, thyroid, heartworm, tick-borne, cortisol, urinalysis) is kept under Settings → Blood Test Types.",
            "Enter the date of the test and, if it was done at a vet visit, link the visit.",
            "Type the results or the vet's summary in the notes (optional — you can just attach the scan).",
            "Drop in the lab scan or PDF (several files can go on one test), then tap Save blood test — the files upload as part of the save. A report that arrives later goes in from the row's Attach files link on the Blood Tests page.",
          ],
          screenshot: {
            src: "/manual/blood-test-new.png",
            alt: "The log blood test form",
          },
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "photos",
      title: "Photos",
      icon: Camera,
      intro:
        "Photos live in the shelter's Google Drive, in a folder per resident — the app shows them and uploads into the right place. Everyone who can sign in can add photos.",
      topics: [
        {
          id: "resident-photos",
          title: "Adding resident photos",
          path: "Resident hub → Photos",
          steps: [
            "Open the Photos card on the hub.",
            "Choose the Drive folder the batch belongs in and, optionally, the date taken.",
            "Drop photos on the upload area or tap it to choose from your phone. You can select several at once.",
            "The first photo ever uploaded becomes the profile photo. To change it, hover or tap a photo and choose Set as profile photo, or pick one on the Edit page.",
          ],
          screenshot: {
            src: "/manual/resident-photos.png",
            alt: "A resident's photo gallery with the uploader",
          },
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "enclosures",
      title: "Enclosures",
      icon: Fence,
      intro:
        "Enclosures are the kennels, catteries and runs, grouped into zones. This is the quickest way to find who's where on a phone, and where enclosure repairs are logged.",
      topics: [
        {
          id: "browse-enclosures",
          title: "Browsing by zone and enclosure",
          path: "Enclosures",
          steps: [
            "Open Enclosures. Tap a zone chip to show only that zone, search by enclosure name, or sort by zone, name or Fullest first.",
            "Each card shows how many residents are in the enclosure against its capacity — green for space available, orange for nearly full or full, red for over capacity.",
            "Tick Has open maintenance to show only enclosures with a job that isn't Completed; it works alongside the zone chips, search and sort, and the address keeps it, so a filtered view can be bookmarked or shared. It counts jobs logged on the enclosure itself — a zone-wide job doesn't put every enclosure in that zone on the list; it stays as the zone-wide count beside the zone's name. Hospital, Unassigned and Fostered are hidden while it's ticked. Vets don't see this option, as maintenance isn't part of their access.",
            "Tap a card to open the enclosure: its notes, every resident in it with a thumbnail, and its open maintenance jobs.",
          ],
          screenshot: {
            src: "/manual/enclosures.png",
            alt: "The enclosures browser with zone chips and occupancy bars",
          },
        },
        {
          id: "enclosure-hub",
          title: "The enclosure page",
          path: "Enclosures → (an enclosure)",
          steps: [
            "The occupancy bar and notes are at the top; tap a resident to jump to their hub.",
            "Link for this enclosure's QR code: the address to program into the QR code on the enclosure. Tap Copy link, or select the address by hand. The enclosure browser has the same copy icon on every card, for doing a batch.",
            "The Maintenance card shows open jobs on this enclosure, with Log maintenance to add one already pointed at this enclosure.",
            "Admins can change the name, Thai name, capacity and notes under Settings → Enclosures.",
          ],
          screenshot: {
            src: "/manual/enclosure-hub.png",
            alt: "An enclosure page listing its residents and maintenance",
          },
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "maintenance",
      title: "Maintenance",
      icon: Wrench,
      intro:
        "Repairs and jobs around the shelter, on a board with a column per status: Not started, In progress, Blocked and Completed. Photos of the problem and of the finished work are filed in Drive alongside the job.",
      topics: [
        {
          id: "log-maintenance",
          title: "Logging a job",
          roles: ["admin", "management", "staff"],
          path: "Maintenance → Log maintenance (or from an enclosure page)",
          steps: [
            "Give the job a title, e.g. \"Gate latch broken\", and describe what needs doing.",
            "Choose where: pick the zone and enclosure, or tick Zone-wide for something like a fence line or drainage.",
            "Set the status, a due date and an estimated cost in baht if known, and tick everyone it's assigned to — anyone with a login who does the work (staff, volunteers, management). A big job can go to a team.",
            "Add photos of the problem as it is now. They upload when you save.",
            "Tap Save job.",
          ],
          screenshot: {
            src: "/manual/maintenance-new.png",
            alt: "The log maintenance form",
          },
        },
        {
          id: "maintenance-board",
          title: "Tracking jobs on the board",
          roles: ["admin", "management", "staff"],
          path: "Maintenance",
          steps: [
            "Staff and volunteers open on the jobs assigned to them; switch Assigned to from Me to Everyone to see the whole board (management and admin start there). Filter by zone or enclosure. Completed jobs from the last 30 days are shown; tick Show all completed jobs for older ones.",
            "Drag a job card to another column to change its status. Cards are coloured when a job is overdue, due soon, or blocked.",
            "Tap a card to open the job: edit its details, record the actual cost, and add Before and After photos. Who it's assigned to is shown under the title and on the card.",
            "A job logged by mistake can be deleted from its page (Delete job, bottom right). Its photos and Drive folder go with it and it can't be undone — for a job that was real but is finished, mark it Completed instead.",
          ],
          screenshot: {
            src: "/manual/maintenance-board.png",
            alt: "The maintenance board with its four status columns",
          },
          callouts: [
            {
              kind: "note",
              text: "Volunteers and vets can view jobs and add photos, but not create or move them.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "projects",
      title: "Projects",
      icon: FolderOpen,
      intro:
        "Photos and stories from the shelter's work — sterilisation drives, rescues, events, fundraising — filed in a folder tree that mirrors the Projects folder in Google Drive. Twelve fixed categories sit at the top; staff create folders under them.",
      topics: [
        {
          id: "browse-projects",
          title: "Browsing and adding photos",
          path: "Projects",
          steps: [
            "Open Projects and tap a category, then a folder. Search folders by name from any level, and sort by name, newest or project date.",
            "Inside a folder, tap Add photos and drop in photos or PDFs. They go straight into that folder in Drive.",
            "Tap a photo to give it a caption (English and Thai), make it the folder's cover, or remove it.",
          ],
          screenshot: {
            src: "/manual/project-folder.png",
            alt: "A project folder with its story, details and photos",
          },
        },
        {
          id: "manage-projects",
          title: "Creating folders and writing the story",
          roles: ["admin", "management", "staff"],
          path: "Projects → (a category or folder)",
          steps: [
            "Tap New folder, give it a name (this is also its Drive folder name) and, optionally, a Thai name.",
            "Use Rename, Move or Delete on a folder's page. Only an empty folder can be deleted; the twelve categories can't be changed.",
            "Under About this project tap Edit details to write the story, set the date and location.",
            "Turn on Show on website to publish the folder's title, story and photos on the public Our work page. Turn it off — or use Settings → Website — to take it down.",
          ],
          screenshot: {
            src: "/manual/projects.png",
            alt: "The projects page showing the category folders",
          },
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "vets-contacts",
      title: "Vets and contacts",
      icon: Users,
      intro:
        "Two read-only directories for everyday use. The lists themselves are edited under Management.",
      topics: [
        {
          id: "vets",
          title: "Vets",
          path: "Vets",
          steps: [
            "Open Vets to see every vet and clinic with their visit count, residents seen, last visit and what's upcoming or overdue.",
            "Tap a vet for their hub: contact details and notes, visits per month, the residents they've seen, spend on visits with a recorded cost, and the procedures, blood tests and prescriptions logged against their visits. Change the period (3, 6, 12 months or all time) at the top.",
          ],
          screenshot: {
            src: "/manual/vet-hub.png",
            alt: "A vet's hub with visit statistics",
          },
        },
        {
          id: "contacts",
          title: "Contacts",
          path: "Contacts",
          steps: [
            "Open Contacts to find carers, volunteers and suppliers. Search by name, phone, email or chat ID, and filter by type.",
            "Each contact has one-tap buttons: Call, LINE, Messenger, WhatsApp, Email and Map — handy on a phone.",
            "Tap a contact for their page, including the residents currently fostered or adopted with them and past placements.",
            "Contacts the shelter no longer works with are archived rather than deleted. They're hidden from the list; tap Show archived under the search box to see them, greyed out with an Archived badge and the reason. A search always finds them, so you can still look up an old number.",
          ],
          screenshot: {
            src: "/manual/contacts.png",
            alt: "The contacts list with call and chat buttons",
          },
          callouts: [
            {
              kind: "note",
              text: "To place a resident with a carer, go to the resident's hub and use Foster / adopt — not the contact's page.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "management",
      title: "Management",
      icon: ClipboardList,
      intro:
        "For the management and admin roles: the monthly reporting dashboard and the reference lists the rest of the app picks from.",
      topics: [
        {
          id: "dashboard",
          title: "The dashboard",
          roles: ["admin", "management"],
          path: "Management → Dashboard",
          steps: [
            "Right now: residents in care (in the shelter, in hospital, fostered), ready for adoption, vet visits in the next 7 days, and open maintenance jobs.",
            "The month at a glance: intakes, adoptions, fosters, deaths, hospital stays, returns, blood work, initial and follow-up vet visits and procedures — with the residents' names under each. Use Previous month / Next month to move around.",
            "Last 12 months: intakes, adoptions and deaths by month.",
          ],
          screenshot: {
            src: "/manual/management-dashboard.png",
            alt: "The management dashboard",
            caption: "Every figure the monthly report asks for. Click a name to open the resident.",
          },
        },
        {
          id: "manage-contacts",
          title: "Managing contacts",
          roles: ["admin", "management"],
          path: "Management → Contacts",
          steps: [
            "Add a contact with their type (Carer, Volunteer or Supplier), phone, email, LINE ID, Messenger, WhatsApp, address and notes — what a supplier sells, when a volunteer is free, a carer's home set-up. Notes show on the contact's page and are searched from the contact list.",
            "Edit details in the table. A contact who has fostered or adopted must stay a Carer.",
            "When the shelter stops working with someone — a carer who no longer fosters, a volunteer who has moved on, a supplier you no longer buy from — tap Archive on their row or on their page and, if you like, say why. They leave the lists and the carer picker but keep their history: a resident's housing history still names them, with an Archived badge.",
            "Show archived lists them again, and Restore brings one back. A resident can't be placed with an archived carer until they're restored, and a carer with a resident living with them now can't be archived until that resident has been returned or moved — the Archive button says who, with a link to each one's Return to shelter form.",
            "Delete is only for a contact with no placements at all, such as a duplicate or a typo. Anyone with history is archived instead.",
          ],
          screenshot: {
            src: "/manual/management-contacts.png",
            alt: "The contacts management table",
          },
        },
        {
          id: "shelter-friends",
          title: "Shelter Friends — thanking the businesses that help",
          roles: ["admin", "management"],
          path: "Contacts → a supplier → Shelter Friend; Management → Shelter Friends",
          intro:
            "Local businesses that donate goods or give a discount to the shelter's supporters can be thanked on the public website's Shelter Friends page — a card each, with what they do for the shelter and how to find them. Everyone who signs in sees the Shelter Friend badge on a contact; only admin and management can change a profile.",
          steps: [
            "Enter the business as a contact first, with the type Supplier — a business that only donates is a Supplier too. Open it from Contacts and, in the Shelter Friend box, tap Make a Shelter Friend. Only suppliers are offered this for now.",
            "Fill in the profile: Kind of help (a short line such as \"Donates cat litter every month\"), What they do for the shelter (a sentence or two), an Offer for supporters if they give one (\"10% off for adopters — show your adoption card\"), their logo, website and Facebook page, and Friend since. Links must be secure (start with https://), and the Facebook page must be a facebook.com or fb.com link — the form says so if one isn't.",
            "What they agreed to show: phone, email, LINE, the address as text, and a map. Each is off until ticked, and each ticked box shows exactly that one detail on their card — the map can be shown without printing the address, or the other way round. Details the contact doesn't have are marked \"not recorded\".",
            "Preview shows the card exactly as visitors will see it, including changes you haven't saved yet.",
            "Save, then tap Publish. The card goes on the Shelter Friends page, which from then on is linked from the website's menu and footer, gets a strip of logos on the home page and a mention on the Donate page. Unpublish takes it down again; View on the website opens their card.",
            "Management → Shelter Friends lists every profile in the order the website shows them: use the arrows to move one up or down, and Publish / Unpublish from the list. To edit one, open the contact.",
            "Archiving the contact takes their card off the website straight away and keeps the profile; restoring the contact brings the card back. Remove profile (while editing) deletes the profile and its translations but keeps the contact.",
            "What they do, Kind of help and the Offer are translated like other public text: they appear under Management → Translations, and the translation box sits under each one on the contact's page.",
          ],
          callouts: [
            {
              kind: "warning",
              text: "Ask the business before you tick anything under What they agreed to show, and tick only what they said yes to. Their name, the text you write and their links are public as soon as you publish — their phone, email, LINE and address never are unless ticked.",
            },
            {
              kind: "note",
              text: "The Shelter Friends link, the home-page strip and the Donate mention only appear once at least one friend is published, so the website looks exactly as before until then.",
            },
          ],
        },
        {
          id: "manage-vets",
          title: "Managing vets",
          roles: ["admin", "management"],
          path: "Management → Vets",
          steps: [
            "Add a vet with the name staff will pick when booking, the clinic, free-text contact details, and notes — specialities, opening hours, an emergency line — which show on their hub.",
            "A vet with logged visits can't be deleted — the visits are part of the residents' medical records.",
          ],
          screenshot: {
            src: "/manual/management-vets.png",
            alt: "The vets management table",
          },
        },
        {
          id: "manage-medications",
          title: "Managing medications and frequencies",
          roles: ["admin", "management"],
          path: "Management → Medications",
          steps: [
            "The medications table is the product list the prescription form offers. Add one with its unit (tablet vs suspension are two medications); rename or fix a unit in place.",
            "Merge a duplicate into the one to keep — its prescriptions move across. Only medications with the same unit can be merged.",
            "Next N days shows how much of each medication current prescriptions will need. For any other period — next month's order, say — enter From and To dates above the table and tap Show window; a column for that period is added beside the fixed ones.",
            "Frequency options are the \"how often\" choices: a label plus a schedule (so many times a day, or one dose every so many days, weeks or months).",
          ],
          screenshot: {
            src: "/manual/management-medications.png",
            alt: "The medications management page with the forecast column",
          },
        },
        {
          id: "manage-diets",
          title: "Managing diets and the food forecast",
          roles: ["admin", "management"],
          path: "Management → Diets",
          steps: [
            "The diets table is the food list the diet form offers. Add one with its unit (g, ml, can, sachet…), the cost per unit in baht, and the daily quantity for a small, medium and large animal.",
            "Edit any of those in place — a price rise or a corrected portion flows straight through to the forecast. A diet on any resident's record can't be deleted.",
            "Next N days shows how much of each diet the residents living at the shelter will eat and what it costs, with a total across all diets. Fostered, adopted and deceased residents aren't counted; a resident with no size set counts as Medium. For any other period enter From and To dates above the table and tap Show window.",
          ],
          screenshot: {
            src: "/manual/management-diets.png",
            alt: "The diets management page with the forecast and cost columns",
          },
        },
        {
          id: "cashflow",
          title: "The cashflow forecast",
          roles: ["admin", "management"],
          path: "Management → Cashflow",
          intro:
            "Food, medication, vaccinations, vet visits and maintenance are each forecast on their own page in their own unit. This is the one page where they add up, in baht.",
          steps: [
            "Pick a window: Next 30 days or Next 90 days, or enter From and To dates for any period up to a year.",
            "The three cards are the window's total, the average month, and how many items still have no price. Below them, a stacked column — one column per month, one colour per category — and the table it is drawn from.",
            "Tap a category name to take it out of the chart, the table and the totals; tap it again to bring it back.",
            "A category with items but no prices reads “not priced yet” rather than ฿0, and the “Not priced yet” row links straight to the page where that price is entered. A figure with a small orange +3 beside it means three more items that month have no price, so the real cost is higher.",
            "The “Not priced yet” card is a shortcut to the same fix. If every missing price is in one category, it opens that category's page; if they are spread across several, it jumps down to the “Not priced yet” row so you can pick one.",
            "Download CSV saves the table as a spreadsheet for the monthly report — the same months and the same categories that are switched on. Amounts are plain numbers so the spreadsheet can add them up, and each category has a second column counting what is not priced yet, so a 0 there never hides a gap.",
            "Under each category name is where its figure came from: priced (a price someone entered, times what the records imply), estimated (a stand-in — a maintenance job's estimated cost, or the typical vet visit) or invoiced (every visit that month already has its real cost).",
          ],
          callouts: [
            {
              kind: "warning",
              text: "This is not a budget. It is only what the shelter's own records imply it is committed to spending — no donations or other income, no salaries, no rent, no utilities. Treat it as a floor under the month, not the whole picture.",
            },
            {
              kind: "note",
              text: "Vet visits that are booked but not yet invoiced are costed at one flat “typical vet visit” figure, set on Settings → Website. A visit that already has its real cost recorded uses that instead. If the figure is blank, booked visits are not costed at all and the page says so.",
            },
          ],
          screenshot: {
            src: "/manual/management-cashflow.png",
            alt: "The cashflow forecast page with the stacked column chart and the table below it",
            caption:
              "One column per month, one colour per category. The table below is the same figures, with a link to fix anything still unpriced.",
          },
        },
        {
          id: "translations",
          title: "Translating public text",
          roles: ["admin", "management"],
          path: "Management → Translations",
          steps: [
            "The app's own labels are in both languages already; this page is for text one person types and another reads in the other language: a resident's bio, temperament and past story on the adoption pages, a project's story and photo captions under Our work, and the title and description of every maintenance job. Whichever language it was written in, the other language needs a version, and that is written by hand here.",
            "Every such text lands on this page when it is first written and again whenever it changes: Needs translation for a new one, Out of date when the original has been edited since it was translated — with the old and new original shown side by side so you fix the translation rather than start over. Work down the list, type the translation and tap Save & approve.",
            "Only an approved translation is shown to visitors reading that language; until then they see the original. Show approved too lists the ones already live if you need to correct one, and Remove translation takes one down.",
            "The same box appears under the text on the resident's page, on the project folder and on the maintenance job, so you can translate right after writing without coming here. On the board and the job page, staff reading Thai see the approved Thai title and description in place of the English. Nobody has to translate internal notes (weights, vet visits, prescriptions): those stay as typed.",
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "admin",
      title: "Settings",
      icon: Settings,
      intro: "Admin-only setup: accounts, the public website, and the shelter's structure.",
      topics: [
        {
          id: "security",
          title: "Accounts and roles",
          roles: ["admin"],
          path: "Security (bottom of the menu)",
          steps: [
            "Create a user with an email and a role. A temporary password is generated and shown once — copy it and pass it on (LINE is fine; it only works until they've signed in). The first time they sign in with it they must choose their own password before anything else opens. Someone who will only use Google sign-in can ignore the temporary password.",
            "Someone signing in with Google for the first time is turned away with \"hasn't been given access yet\" and appears under Access requests at the top of the page. Choose a role and tap Approve, then ask them to try again — or Deny to remove the account. If their Google email matches a login you created, the two are linked automatically.",
            "Change a role from the dropdown in the table. Issue temporary password does what it says — their old password stops working and they choose a new one at their next sign-in. You can't change your own role, reset your own password here or delete yourself; change your own password from Change password at the bottom of the menu.",
            "When someone leaves, Archive them rather than delete: they can no longer sign in, they disappear from the maintenance Assigned to list, and their name stays on the jobs they did. Archived accounts sit at the bottom of the table with Restore beside them. Delete is for accounts made by mistake — it removes them from past jobs too.",
          ],
          screenshot: {
            src: "/manual/admin-security.png",
            alt: "The security page with the create user form and users table",
          },
        },
        {
          id: "website",
          title: "The public website",
          roles: ["admin"],
          path: "Settings → Website",
          steps: [
            "Hero photo: the big photo at the top of the welcome page.",
            "Labels and contact details: the tagline, hero photo description and visiting hours in English and Thai side by side, plus the email, phone, LINE id, address and map link shown in the footer of every public page and on each resident's profile.",
            "Pages: the wording of Our story, How adoption works, Foster, Volunteer and Donate. Separate paragraphs with a blank line; start a line with ## for a sub-heading or - for a bullet. The other language's version is written or approved in the translation panel under each field.",
            "Photo gallery: the strip of photos in the Our story section, in order.",
            "Pet of the week: one resident to spotlight, chosen from those on the public adoption page.",
            "Our work — published stories: everything on the public Our work page, with Remove from website. Stories are published from their folder under Projects.",
            "Changes go live immediately.",
          ],
          screenshot: {
            src: "/manual/admin-website.png",
            alt: "The website admin page",
          },
        },
        {
          id: "zones-enclosures",
          title: "Zones and enclosures",
          roles: ["admin"],
          path: "Settings → Zones, Settings → Enclosures",
          steps: [
            "Zones are the physical areas of the shelter (marked Internal) plus off-site ones (External). Add a zone with a name and, optionally, a Thai name.",
            "Enclosures belong to a zone and have a capacity and notes. The capacity drives the occupancy colours and the nearly-full warning when moving a resident.",
            "The Thai name is what staff reading the app in Thai see everywhere a zone or enclosure is shown — the residents list, the hub, the enclosure browser, the maintenance board and every picker. Leave it blank and the English name is used. The English name stays the one Google Drive folders and the app's own logic go by, so renaming in Thai never moves anything.",
            "The Lifecycle zone and its pseudo-enclosures (Hospital, Fostered, Adopted, Deceased, Unassigned) are used by the app's status logic and can't be edited; their Thai names are built in.",
          ],
          screenshot: {
            src: "/manual/admin-enclosures.png",
            alt: "The enclosures admin page",
          },
        },
        {
          id: "immunization-types",
          title: "Immunization types",
          roles: ["admin"],
          path: "Settings → Immunization Types",
          steps: [
            "Add each vaccine with how many months until it must be repeated (leave blank for a one-off) and whether it's mandatory.",
            "Mandatory types are what the resident hub checks when it says \"2 missing\"; the repeat interval sets the next-due date when a dose is logged.",
          ],
          screenshot: {
            src: "/manual/admin-immunization-types.png",
            alt: "The immunization types admin page",
          },
        },
        {
          id: "procedure-types",
          title: "Procedure types",
          roles: ["admin"],
          path: "Settings → Procedure Types",
          steps: [
            "The list the procedure form offers — X-ray, ultrasound, teeth cleaning, nail clipping. Staff and vets can add a type inline when logging a procedure, so this is where duplicates and misspellings get tidied up.",
            "Rename a type in place, or Merge… a duplicate into the one to keep — its procedures move across. A type with logged procedures can't be deleted; merge it instead.",
          ],
          screenshot: {
            src: "/manual/admin-procedure-types.png",
            alt: "The procedure types admin page",
          },
        },
        {
          id: "blood-test-types",
          title: "Blood test types",
          roles: ["admin"],
          path: "Settings → Blood Test Types",
          steps: [
            "The panels the blood test form offers — CBC, Blood Chemistry Panel, Thyroid Panel, Heartworm Test, Tick Borne Disease Panel, Cortisol Test, Urinary Analysis. Add one here when the vet starts running a new panel; the form defaults to CBC.",
            "Rename a type in place, or Merge… a duplicate into the one to keep — its blood tests move across. A type with logged blood tests can't be deleted; merge it instead.",
          ],
          screenshot: {
            src: "/manual/admin-blood-test-types.png",
            alt: "The blood test types admin page",
          },
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "public-site",
      title: "What the public sees",
      icon: Globe,
      intro:
        "Without signing in, visitors get the welcome page, the adoption listing and the Our work stories — nothing else. Everything on them is controlled from inside the app.",
      topics: [
        {
          id: "public-pages",
          title: "The public pages",
          steps: [
            "Home: the hero photo, live counts (in care, adopted this year, in vet care, in foster care), the shelter's story and gallery, the Pet of the week, recent stories and the ways to help.",
            "Adopt: every resident with Ready for adoption ticked, except those adopted or deceased, with species / size / ready filters. Each profile shows their photos, bio, the For adopters answers (good with dogs, cats, children; energy level; desexed; vaccinated from the immunization history), where and when to meet them, a share button and similar residents. Recent adoptions show as Happy endings, and How adoption works sits at the foot of the listing.",
            "Our work: project folders marked Show on website, by category, with their story and photos.",
            "Foster, Volunteer and Donate: the pages written under Settings → Website, each with the shelter's email and LINE.",
            "Shelter Friends: a card for each published friend of the shelter, with only the contact details they agreed to show (see Shelter Friends under Management). It is linked from the menu once there is at least one.",
          ],
          screenshot: {
            src: "/manual/public-adopt.png",
            alt: "The public adoption listing",
            caption: "The public adoption page. A resident appears here when Ready for adoption is ticked on their record.",
          },
        },
        {
          id: "getting-help",
          title: "Getting help",
          intro:
            "This manual is a first draft and will change as the app does. If a screen doesn't match what's described here, or something is missing, tell the person looking after the app so it can be corrected.",
        },
      ],
    },
  ],
};

export default manual;
