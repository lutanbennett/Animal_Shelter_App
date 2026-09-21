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
      "Everything, including the Admin section (users, website, zones, enclosures, immunization and procedure types) and the Management section.",
    management:
      "Everything staff can do, plus the Management section: the reporting dashboard and the contact, vet and medication lists.",
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
        "The app runs in a web browser on a phone, tablet or computer — nothing to install. On a phone it works as a field tool: find a resident, log what you did, add photos. On a computer you get the extra columns, filters and the Management and Admin sections.",
      topics: [
        {
          id: "sign-in",
          title: "Signing in",
          path: "Home page → Staff & Volunteer Login",
          steps: [
            "Open the app's address in your browser and tap Staff & Volunteer Login (or go straight to /login).",
            "Enter your email and password and tap Sign in — or tap Continue with Google if your account was set up with Google.",
            "You land on the Residents list. Sign out any time with the Sign out button at the top right.",
          ],
          screenshot: {
            src: "/manual/login.png",
            alt: "The sign-in page with email, password, Sign in and Continue with Google",
            caption: "The sign-in page. The EN / ไทย switch at the top changes the app's language.",
          },
          callouts: [
            {
              kind: "note",
              text: "If Google sign-in says your account hasn't been given access yet, an admin needs to add you under Admin → Security first.",
            },
          ],
        },
        {
          id: "language",
          title: "Switching language",
          steps: [
            "Use the EN / ไทย switch in the header (or on the sign-in page).",
            "The choice is remembered on that device. Free-text notes stay in whatever language they were typed in.",
          ],
        },
        {
          id: "navigation",
          title: "Finding your way around",
          steps: [
            "On a computer the menu is always visible down the left: Residents, Enclosures, Maintenance, Projects, Vets, Contacts, this manual, and — depending on your role — Management and Admin.",
            "On a phone tap the ☰ button at the top left to open the same menu; tap outside it to close.",
            "The LCA logo and your email are in the header, with the language switch and Sign out.",
          ],
          screenshot: {
            src: "/manual/nav-mobile.png",
            alt: "The phone menu drawer open over the residents list",
            caption: "The menu on a phone. On a computer the same links sit in a sidebar.",
            mobile: true,
          },
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
          ],
        },
        {
          id: "intake",
          title: "Registering a new resident (intake)",
          roles: ["admin", "management", "staff"],
          path: "Residents → New resident (intake)",
          intro:
            "Intake creates the resident record and their first placement in one step.",
          steps: [
            "On the Residents list tap New resident (intake).",
            "Identity: name (required), Thai name, other names, species, breed, sex, size (required — small, medium or large, which sets their default meal size) and an estimated age in years.",
            "Arrival & placement: the intake date (required), where they came from (pick an existing origin or add a new one), and the zone and enclosure they're going into. Leave the enclosure blank and they're recorded as Unassigned until you move them.",
            "Optionally enter a weight at intake — it becomes their first weight reading — and pick a starting diet from the list management keeps under Management → Diets; it's recorded from the intake date and can be adjusted on the hub's Diet page.",
            "Bio & background: bio, temperament, past story and behaviour notes. These can be filled in later from Edit.",
            "Tick Ready for adoption only if they should appear on the public adoption page straight away.",
            "Tap Register resident. You're taken to their new hub.",
          ],
          screenshot: {
            src: "/manual/resident-intake.png",
            alt: "The resident intake form",
            caption: "The intake form. Only name, intake date and size are required — everything else can be added later.",
          },
        },
        {
          id: "hub",
          title: "The resident hub",
          path: "Residents → (a resident)",
          intro:
            "The hub is the resident's front page: who they are, where they are, and a card for each part of their record. Every card is a link to the full list behind it.",
          steps: [
            "Top: profile photo, name, ID, species, sex, age, status and intake date. The pencil opens Edit resident details.",
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
            "Tick the immunization types given. Mandatory ones are marked; each type's repeat interval is set under Admin → Immunization Types.",
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
            "Choose one or more residents and the vet or clinic (vets are set up under Management → Vets).",
            "Enter the date and time. Use a past date to record a visit that already happened, including emergencies.",
            "Give the reason, set the status — Scheduled (upcoming) or Completed (already happened) — and add notes.",
            "Tap Book vet visit.",
            "On the resident's Vet Appointments page each visit has quick links to log a blood test, prescription, weight or procedure against that visit, and to send the resident to hospital.",
            "After the visit, tap Edit on its row to mark it Completed (or Cancelled), fix the date or vet, and enter the cost from the invoice. The vet's hub totals those costs for the period shown.",
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
            "Pick the test type — CBC is preselected as the routine panel; the list (chemistry, thyroid, heartworm, tick-borne, cortisol, urinalysis) is kept under Admin → Blood Test Types.",
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
            "The Maintenance card shows open jobs on this enclosure, with Log maintenance to add one already pointed at this enclosure.",
            "Admins can change the name, capacity and notes under Admin → Enclosures.",
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
            "Set the status, a due date and an estimated cost in baht if known, and who it's assigned to — anyone with a login who does the work (staff, volunteers, management).",
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
            "Filter the board by zone or enclosure. Completed jobs from the last 30 days are shown; tick Show all completed jobs for older ones.",
            "Drag a job card to another column to change its status. Cards are coloured when a job is overdue, due soon, or blocked.",
            "Tap a card to open the job: edit its details, record the actual cost, and add Before and After photos. The person it's assigned to is shown under the title and on the card.",
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
            "Turn on Show on website to publish the folder's title, story and photos on the public Our work page. Turn it off — or use Admin → Website — to take it down.",
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
            "Open Contacts to find carers, volunteers, suppliers and donors. Search by name, phone, email or chat ID, and filter by type.",
            "Each contact has one-tap buttons: Call, LINE, Messenger, WhatsApp, Email and Map — handy on a phone.",
            "Tap a contact for their page, including the residents currently fostered or adopted with them and past placements.",
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
            "Add a contact with their type (Carer, Volunteer, Supplier, Donor, Other), phone, email, LINE ID, Messenger, WhatsApp, address and notes — what a supplier sells, when a volunteer is free, a carer's home set-up. Notes show on the contact's page and are searched from the contact list.",
            "Edit details in the table. A contact who has fostered or adopted must stay a Carer, and one with placements can't be deleted.",
          ],
          screenshot: {
            src: "/manual/management-contacts.png",
            alt: "The contacts management table",
          },
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
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "admin",
      title: "Admin",
      icon: Settings,
      intro: "Admin-only setup: accounts, the public website, and the shelter's structure.",
      topics: [
        {
          id: "security",
          title: "Accounts and roles",
          roles: ["admin"],
          path: "Admin → Security",
          steps: [
            "Create a user with an email and a role. A temporary password is generated and shown once — copy it and pass it on (LINE is fine; it only works until they've signed in). The first time they sign in with it they must choose their own password before anything else opens. Someone who will only use Google sign-in can ignore the temporary password.",
            "Someone signing in with Google for the first time is turned away with \"hasn't been given access yet\" and appears under Access requests at the top of the page. Choose a role and tap Approve, then ask them to try again — or Deny to remove the account. If their Google email matches a login you created, the two are linked automatically.",
            "Change a role from the dropdown in the table, or delete an account. Issue temporary password does what it says — their old password stops working and they choose a new one at their next sign-in. You can't change your own role, reset your own password here or delete yourself; change your own password from Change password in the menu.",
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
          path: "Admin → Website",
          steps: [
            "Hero photo: the big photo at the top of the welcome page.",
            "Tagline, story heading, story text, contact email and address. Separate story paragraphs with a blank line.",
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
          path: "Admin → Zones, Admin → Enclosures",
          steps: [
            "Zones are the physical areas of the shelter (marked Internal) plus off-site ones (External). Add a zone with a name.",
            "Enclosures belong to a zone and have a capacity and notes. The capacity drives the occupancy colours and the nearly-full warning when moving a resident.",
            "The Lifecycle zone and its pseudo-enclosures (Hospital, Fostered, Adopted, Deceased, Unassigned) are used by the app's status logic and can't be edited.",
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
          path: "Admin → Immunization Types",
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
          path: "Admin → Procedure Types",
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
          path: "Admin → Blood Test Types",
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
            "Home: the hero photo, the shelter's story and gallery, live counts of residents in care and adoptions, and the Pet of the week.",
            "Adopt: every resident with Ready for adoption ticked, except those adopted or deceased. Each has a profile with their photos, bio and an email link.",
            "Our work: project folders marked Show on website, by category, with their story and photos.",
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
