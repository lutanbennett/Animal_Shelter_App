import {
  BookOpen,
  CalendarClock,
  Camera,
  ClipboardList,
  Fence,
  FolderOpen,
  Globe,
  HeartPulse,
  House,
  ListTodo,
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
/**
 * Who to tell when the app or this manual is wrong (dry run 2026-10-03, F-17).
 * Set to null to fall back to the general wording; otherwise the topic names
 * them with whichever of phone and LINE are given.
 */
const SUPPORT_CONTACT: { name: string; phone?: string; line?: string } | null = {
  name: "Lutan Bennett",
  line: "lutan1",
};

function supportContactLine(c: NonNullable<typeof SUPPORT_CONTACT>): string {
  const reach = [c.phone && `phone ${c.phone}`, c.line && `LINE ${c.line}`].filter(Boolean);
  return reach.length ? `${c.name} (${reach.join(", ")})` : c.name;
}

const manual: Manual = {
  title: "User manual",
  subtitle:
    "How to use the Lanna Care for Animals app day to day — finding a resident, recording what happens to them, keeping the shelter's enclosures, contacts and website up to date.",
  version: "Draft 1 · September 2026 · English only for now",

  roleNames: {
    admin: "Admin",
    management: "Management",
    doctor: "Doctor",
    volunteer: "Volunteer",
  },
  roleSummary: {
    admin:
      "Everything, including the Settings section (users, zones, enclosures, immunization and procedure types, frequencies) and the Management section.",
    management:
      "Day-to-day resident work — intake, moves, hospital, foster and adoption, photos, maintenance, projects — plus the Management section: the reporting dashboard, the public website, the contact, clinic, medication and diet lists, and the translations of public text.",
    doctor:
      "Clinic visits, procedures, blood tests, prescriptions and immunizations, for the residents their own clinics treat — any resident the clinic has a visit, prescription, procedure or blood test for, with that resident's whole history — plus every resident the doctor was the doctor for at a clinic they have since left, which they can read but not change. Other residents are not shown at all. The menu is Appointments and Residents only — the shelter's enclosures, maintenance, projects, contacts and clinic list are not part of a doctor's access.",
    volunteer:
      "Sees who each resident is and where they live, and browses the enclosures. Nothing else is read or changed: no medical records, notes or microchip numbers, no moving a resident, no photos to add, and no maintenance, projects, contacts, clinics, stock or assistant. The menu is Home, Residents and Enclosures.",
  },

  filter: {
    showingRole: (role, count) =>
      `Showing the ${count} topics for the ${role} role.`,
    showEverything: "Show everything",
    findHint:
      "The rest are tucked away, not gone: Show everything lists them, greyed, to answer \"can I do this?\".",
    showingEverything: (role) =>
      `Showing everything. Topics outside the ${role} role are greyed.`,
    showOnlyRole: (role) => `Show only the ${role} role`,
    notForRole: (role) => `Not part of the ${role} role`,
    you: "You",
  },

  sections: [
    // ------------------------------------------------------------------
    {
      id: "getting-started",
      title: "Getting started",
      icon: BookOpen,
      intro:
        "The app runs in a web browser on a phone, tablet or computer — nothing to install. On a phone it works as a field tool: find a resident, log what you did, add photos. On a computer you get the extra columns, filters and the Management and Settings sections. Settings' setup pages — zones, enclosures, immunization types, frequencies, the facility map, and the medication and diet lists — are wide tables made for a computer, so on a phone they show a \"Best on a larger screen\" note first, and their tiles say \"Larger screen\". If it can't wait, tap Show anyway and the page is all there. Management's pages, which Management and the 2IC open on a phone during the day, work on a phone with no note.",
      topics: [
        {
          id: "sign-in",
          title: "Signing in",
          path: "Home page → Staff & Volunteer Login",
          steps: [
            "Open the app's address in your browser and tap Staff & Volunteer Login — or, once the website is open to the public, Staff login at the very bottom of any public page, or in the menu on a phone (or go straight to /login). Already signed in? The public pages have Open the app at the top instead, which takes you to the same place.",
            "Enter your email and password and tap Sign in — or tap Continue with Google if your account was set up with Google.",
            "You land on My tasks, the app's home page: what's assigned to you today (a doctor lands on Appointments instead). Sign out any time with the Sign out button at the top right.",
            "Forgotten your password? Tap Forgot password? under the Sign in button, enter your email, and follow the link in the message to choose a new one — it's valid for an hour. If you were given a temporary password and it's lost, ask an admin to issue another instead.",
            "To change your password at any time, pick Change password from the bottom of the menu. You'll be asked for your current password first, and once it's changed every other phone or computer signed in as you is signed out — you stay signed in on this one. If you've forgotten the current one, sign out and use Forgot password? instead.",
            "The top of every screen shows who is signed in — your name and your role, such as \"Noi · Volunteer\". Tap it to see the email address of the account, change your name (under Change password), or sign out. If your account has no name yet, the email is shown instead; add one under Change password so people can tell you from someone with the same first name.",
            "New here and don't have an account? Tap Request access under Continue with Google, then Continue with Google and choose the Google account you want to use. You'll be told you don't have access yet — that is the request being sent. An administrator sees it under Access requests and approves you; try signing in again later. Without a Google account, the same page gives the shelter's email: email and password logins are created by an administrator, not requested.",
          ],
          screenshot: {
            src: "/manual/login.png",
            alt: "The sign-in page with email, password, Sign in and Continue with Google",
            caption: "The sign-in page. The EN / ไทย switch at the top changes the app's language.",
          },
          callouts: [
            {
              kind: "note",
              text: "If sign-in says your account doesn't have access, an admin needs to give you a role under Settings → Security first. With Google, a new account saying so has also just sent an access request; with an email and password it hasn't, because admins create those logins. An archived account is turned away the same way, with a password or with Google.",
            },
            {
              kind: "note",
              text: "On the testing sites (lannacare.org and test.lannacare.org) the public website is closed until the shelter goes live: the home page shows a Staff testing site page with a Sign in button instead. Once you've signed in you see everything as normal, public pages included. Someone testing the website as a visitor signs in with a Public viewer account: it opens the public pages and nothing else, and lands on the home page. A resident card or enclosure QR code scanned there asks you to sign in first, then opens what you scanned.",
            },
          ],
        },
        {
          id: "confirm-and-offline",
          title: "Confirming a delete, and working offline",
          steps: [
            "Anything that can't be taken back — deleting or removing a record, archiving or deleting a login, issuing a temporary password, resetting 2-step verification — asks first, in a box that names exactly what you're about to lose (\"Delete zone \\\"Quarantine\\\"?\"). The Cancel button is the one selected, so pressing Enter by accident cancels; tap the red button, or Delete, to go ahead. Esc or tapping outside the box also cancels.",
            "If the app can't reach the internet, a red bar across the top says \"You're offline, changes will not save.\" It appears when your device drops its connection and also when the Wi-Fi is connected but nothing gets through, which a phone often can't tell the difference between. It clears by itself once something goes through. Until then, don't rely on anything you just entered: wait for the bar to go, then try the change again.",
          ],
        },
        {
          id: "language",
          title: "Switching language",
          steps: [
            "Use the EN / ไทย switch in the header (or on the sign-in page).",
            "The choice is remembered on that device. Free-text notes stay in whatever language they were typed in; the ones the public reads (a resident's bio, a project's story) get a translation written by a manager — see Management → Translating.",
          ],
        },
        {
          id: "print-manual",
          title: "Printing this manual",
          path: "Manual → Print this as a PDF",
          steps: [
            "Open the Manual and tap Print this as a PDF, just under the line about your role. The PDF opens in a new page of your browser; use its Save or Print button to keep a paper or file copy.",
            "The PDF holds the same topics you are looking at: your own role's, or the whole manual if you chose Show everything first. Without screenshots gives a much smaller, text-only file that prints quickly.",
            "The copy is a snapshot of today's manual. Print it again after the manual changes.",
          ],
          callouts: [
            {
              kind: "note",
              text: "You need to be signed in to get the PDF, like the manual itself. To give a volunteer who has no login a paper copy, print one for them.",
            },
          ],
        },
        {
          id: "navigation",
          title: "Finding your way around",
          steps: [
            "On a computer the menu is always visible down the left, each link with its own icon: Home and My tasks at the top, then Residents and Operations — and, depending on your role, Management and Settings. A doctor's menu is just Appointments and Residents.",
            "Operations, Management and Settings each open a front page of tiles, one for each page inside that you can open; Residents does the same for a resident's record. The same icons are used on the tiles and in the menu, and the menu entry stays lit while you are on any page inside it.",
            "Under a dividing line at the very bottom of the menu sit the things you only need now and then, so they are always in the same place: this manual, Release notes, Change password and — for admins — Security, where accounts and roles are managed.",
            "On a phone tap the ☰ button at the top left to open the same menu; tap outside it to close. The same links are the last entries in it, below the same line.",
            "The LCA logo and your email are in the header, with the Assistant button, the language switch and Sign out. Tap the logo to see the public website as a visitor does — it opens in a new tab so you don't lose your place.",
            "Open a page your role doesn't include — a link someone sent you, or a job that points at Stocktake — and you see You don't have access to this page, still inside the app, with a Go to My tasks button. If you need that page for your work, ask a manager or an admin.",
          ],
          screenshot: {
            src: "/manual/nav-mobile.png",
            alt: "The phone menu drawer open over the residents list",
            caption: "The menu on a phone. On a computer the same links sit in a sidebar.",
            mobile: true,
          },
        },
        {
          id: "shelter-operations",
          title: "Operations: the daily work",
          path: "Operations (in the menu)",
          intro:
            "One place for the jobs that keep the shelter running day to day. You only see the tiles for the pages your role can open, and if your role opens none of them the section is not in your menu.",
          steps: [
            "Open Operations from the menu. Its tiles are Enclosures (who is where), Medication list (today's round), Maintenance, Stocktake, Deliveries, Projects, Clinics and Contacts.",
            "Clinics and Contacts here are the lookups: find a clinic or a person and call or message them. Changing their records — adding a contact, archiving one, a clinic's doctors — is under Management → Contacts and Management → Clinics.",
            "Every page kept its web address, so links in notifications, emails and your bookmarks still open it. Only the medication list has a new address, and its old one still takes you there.",
          ],
          callouts: [
            {
              kind: "note",
              text: "Before 8 October 2026 these pages were separate entries in the menu, and the medication list was under Management. The pages themselves have not changed, and nobody can open a page they could not open before.",
            },
          ],
        },
        {
          id: "release-notes",
          title: "What changed: release notes",
          path: "Release notes (bottom of the menu)",
          intro:
            "Every update to the system is listed on the Release notes page, newest at the top, in plain words: what you will notice, not how it was built. Everyone who can sign in can read it, and it opens on the changes for your own role.",
          steps: [
            "Open Release notes from the bottom of the menu.",
            "Each release shows its number, the date it was prepared and the environment you are looking at. A Major badge marks a release worth reading before you carry on working.",
            "Click a release to see what changed in it, and click it again to fold it away. The newest release is already open.",
            "The page lists the changes for your role and the ones for everyone. Every release stays in the list, so the numbers run in order; one with nothing for your role carries a badge saying so — Nothing for Doctor, for a doctor — and opening it says its changes are for other roles. Show everything, at the top, lists every change, greyed where it isn't for your role.",
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
          roles: ["admin", "management"],
          activity: "assistant.ask",
          path: "Assistant button in the header (any screen)",
          intro:
            "The assistant turns one typed sentence into a filled-in form, shows it to you, and writes nothing until you press Confirm. It is not a chatbot and it does not guess: it recognises the requests listed below, in English or Thai, and leaves blank whatever your sentence didn't say. Anything else gets a polite \"I didn't understand that one\" — so the list below is the whole of what it knows.",
          steps: [
            "Open it with the Assistant button in the header, at the top of every screen — it slides in over whatever you were looking at, so you don't lose your place. On a phone the button shows just its speech-bubble icon. For more room, press Open full page under the panel's title: the same assistant fills a page of its own.",
            "Type one request and press Send. Check the card that comes back, fill in or correct anything on it, then press Confirm. Cancel writes nothing.",
            "To record something: \"Send Panda to hospital today\" · \"Panda is back from hospital\" · \"Panda weighs 12.4 kg\" (or \"log weight 12.4 for Panda\") · \"Move Panda to B1 today\" · \"Book a clinic visit for Panda with Dr Somchai on Friday at 10am\" (\"vet\" works too). If you name the doctor (\"with Dr Somchai\", \"หมอสมชาย\") the card keeps the name in an optional Doctor field you can change or clear; it never asks for one. A name the clinic's doctor list doesn't have yet is added when you confirm, and the card says so first.",
            "To ask something: \"Where is Panda?\" · \"Who is in B1?\" · \"What is due this week?\" — these are answered straight away, with no card and nothing to confirm.",
            "Names: use the name as it is written on the resident's record, or their code (R-0042). If more than one resident has that name, the assistant shows you their photos, codes and enclosures and asks which one you meant.",
            "Dates: today, tomorrow, yesterday, a weekday name (Friday means the next Friday), or a full date such as 2026-09-30. Times: 10am, 2.30pm, 14:30.",
            "Thai works the same way: ส่ง … ไปโรงพยาบาล · … กลับจากโรงพยาบาล · … น้ำหนัก 12.4 กก. · ย้าย … ไป … · นัดหมอให้ … · … อยู่ไหน · ใครอยู่ใน … · สัปดาห์นี้มีอะไรครบกำหนด.",
          ],
          callouts: [
            {
              kind: "note",
              text: "The assistant can't do anything you couldn't do yourself on the page it stands in for. It runs the same checks and obeys the same permissions — so recording a change is for staff and management, and it is not offered to a volunteer, who reads only who a resident is and where they live.",
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
            "Every account has one role. The app hides buttons you can't use, and the database refuses the change even if a button is reached another way. Sections below say which roles can do each task. The manual opens on the topics for your own role; Show everything, above Roles at a glance, brings back the rest, greyed where they aren't part of your role.",
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "appointments",
      title: "Appointments",
      icon: CalendarClock,
      intro:
        "A doctor's home page: the visits booked with your clinics. It replaces My tasks for a doctor — tasks are the shelter's own routine work, and a doctor has none.",
      topics: [
        {
          id: "appointments-vet",
          title: "Your clinic's appointments",
          roles: ["doctor"],
          path: "Appointments (first in the menu)",
          intro:
            "Appointments is the page you land on when you sign in. It lists every visit booked with your clinic — not just your own patients' — in three groups: To write up (the visit date has passed and it is not marked done — oldest first, its count and dates in red), Upcoming (today or later) and Recently done (marked done in the last 30 days). Each row names the resident, which opens their page, and offers Log procedure, Log blood test, Add prescription, Log weight and Edit, all already linked to that visit; prescription and weight appear once the visit has started. Marking a visit done does not lock it: you can still add records to it, and anything you were typing when someone marked it done is saved as normal. A cancelled visit is not listed. The visits of all your clinics are listed together. If the page says your account is not linked to a clinic, ask an admin to link it to your doctor entry (Accounts and roles).",
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "my-tasks",
      title: "My tasks",
      icon: ListTodo,
      intro:
        "What you need to do today: the work assigned to you, in one place. For now that is your recurring jobs (the routine that comes round every week or month, like the Monday stocktake) and your maintenance jobs; other kinds of work will appear here as further sections as they are added.",
      topics: [
        {
          id: "my-tasks-page",
          title: "Seeing what's assigned to you",
          roles: ["admin", "management"],
          activity: "recurring.do_own",
          path: "My tasks (first in the menu)",
          steps: [
            "My tasks is the page you land on when you sign in or tap Open the app on the public website; get back to it any time from the top of the menu. Every maintenance job you are on that isn't Completed is listed, grouped as Overdue, Due today, Coming up and No due date — most urgent first.",
            "Each job shows its place, its due date and, when it went to a team, who else is on it. Tap the title to open the job with its photos and details.",
            "Change a job's status with the buttons beside it: Not started, In progress, Blocked or Completed. A job marked Completed leaves the list, with Undo in case you tapped the wrong one.",
            "The number beside My tasks in the menu is how many of your jobs are due today or overdue. It disappears when there are none.",
            "Open the board takes you to the maintenance board showing only your jobs.",
            "Done today, at the bottom, lists what you marked done, skipped or completed today. It is still there after you reload the page, and Undo on a row puts the job back. If a job says Waiting for another job, Done asks you to confirm before it goes through.",
          ],
          callouts: [
            {
              kind: "note",
              text: "Doctors and volunteers aren't given maintenance jobs.",
            },
          ],
        },
        {
          id: "my-access-requests",
          title: "Access requests on My tasks",
          roles: ["admin"],
          path: "My tasks → Access requests",
          intro:
            "While anyone who has signed in is waiting for a role, every admin has one Review access requests task at the top of My tasks. It says how many are waiting, is dated the day the oldest one arrived, and counts towards the number beside My tasks in the menu. It names nobody: who is asking is shown only on Settings → Security, after your authenticator app.",
          steps: [
            "Tap the title to go to Settings → Security. Sign in with your authenticator app when asked, then give each person a role or leave them waiting.",
            "The task has no Done button. It goes from every admin's list on its own once nobody is waiting, whichever admin dealt with them.",
          ],
        },
        {
          id: "my-recurring-jobs",
          title: "Doing your recurring jobs",
          roles: ["admin", "management"],
          activity: "recurring.do_own",
          path: "My tasks → Recurring jobs",
          intro:
            "Recurring jobs are the routine management has set to come round on a calendar — the Monday stocktake, ordering medication after it, the monthly worming. Each date appears on your list for its day: staff can be given one as well as management. Doctors are not given recurring jobs — a doctor's work comes from their clinic visits.",
          steps: [
            "Recurring jobs are listed first on My tasks, grouped like the rest: Overdue, Due today and Coming up (the next seven days). Each shows its time of day (morning, afternoon, evening or any time), its date, and who else is on it.",
            "When the job is done on a particular screen, tap its title to go there — a stocktake job opens the Stocktake page, on the right tab.",
            "If a job says “your role isn't given this job”, it was given to you by mistake — a job given to a doctor, or a maintenance job given to a volunteer. Its title doesn't link anywhere, because the page may only refuse you. Ask management to give it to someone else; you can still skip a date meanwhile.",
            "Tap Done when you have done it, or Skip when it isn't happening this time (for example the shelter is closed). To leave a note with it — what was short, why it was skipped — tap Add a note first. Either way the row leaves the list, with Undo in case it was the wrong one.",
            "A job that is waiting for another one shows “Waiting for …”, for example ordering medication waiting for the stocktake the same morning. It goes away as soon as that job is marked done or skipped. You can still mark it done if you have done it anyway.",
            "A date nobody marked stays on the list as overdue, with how many days late it is, until someone marks it done or skipped. Dates ahead can be skipped but not marked done before their day.",
            "If a date was handed to you because someone is off, it says “handed to you”, with the reason. It is only that date; the job goes back to its usual person afterwards.",
          ],
          callouts: [
            {
              kind: "tip",
              text: "When a job is with a team, any one of you can mark it done — it then leaves everyone's list, and the record says who did it.",
            },
          ],
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
            "Type part of a name (English, Thai or an \"also known as\" name) or an ID such as R-0042 in Search and tap Filter. On a computer the cursor is already in Search when the page opens, so you can just start typing; on a phone, tap the box first (so the keyboard does not cover the list until you want it).",
            "The row of zone chips works as on the Enclosures page: one chip for each zone at the shelter, then one Off-site chip for every zone away from it. Tap a chip to add it, tap it again to take it off; All zones clears them. Picking no chip shows everyone. After Off-site comes Unallocated: residents at the shelter who have not been given an enclosure yet. It works like a zone chip, and picked with zones it adds those residents to them. The Location column shows whether each resident is On-site or Off-site.",
            "Off-site is the residents in off-site zones. Residents in hospital or with a foster carer have chips of their own, Hospitalised and Fostered, further along.",
            "Show all and Hide deceased bring residents who have died back into the list, and put them away again.",
            "On a computer you can also narrow the list to one Enclosure. Tap Clear to see everyone again.",
            "Beside Show all are three chips, Adopted, Fostered and Hospitalised, offered when no zone chip, Unallocated or enclosure is picked. Each lists only the residents with that status (Hospitalised: in hospital now), one chip at a time; tap the one that is on to take it off. Picking one clears the zones and enclosure, because these residents are not in an enclosure.",
            "Adopted, fostered and hospitalised residents are not in a zone or enclosure, so any zone chip (Off-site too) leaves them out. If your search matches any of them that a filter is hiding, the line under the heading says so (\"2 fostered residents match — show\"), with a link that shows them.",
            "Tap a resident's name to open their hub.",
            "Tap No microchip to list only residents with no chip number recorded; tap it again to show everyone. It works alongside the search and the other filters. To find one animal by their chip, see Scanning a microchip.",
            "Tap Download spreadsheet (the arrow beside the buttons above the list) to save the residents you are looking at as a spreadsheet: the same zone, Off-site, Unallocated, enclosure, search, Show all, Adopted, Fostered or Hospitalised choices as the list on screen, nothing more and nothing less. On a computer, tick some residents first and the button becomes Download spreadsheet (3) and saves only those. It is a CSV file, one row per resident, that opens in Excel or Google Sheets and sorts and filters there. It goes to your Downloads folder (on an iPhone, the Files app, under Downloads), and the page says the file name when it starts.",
            "The spreadsheet has more than the list shows: R-code, name, Thai name, other names, species, breed, sex, age (worded as on the resident's hub) and the estimated birth year so it sorts, size, colour, microchipped (Yes or No, never the number), zone, enclosure, status, place (On-site or Off-site), intake date, ready for adoption, and, if your role can read them, the prescriptions running today, the next clinic visit and its clinic, the current diet, and the latest weight with its date. Headings are in English for everyone. A column your role cannot read is left out of the file rather than left blank.",
          ],
          screenshot: {
            src: "/manual/residents-list.png",
            alt: "The residents list with search, zone and enclosure filters",
            caption: "The residents list on a computer. Phones show just the name — browse by enclosure instead (see Enclosures).",
          },
          callouts: [
            {
              kind: "tip",
              text: "Tick several residents (computer only) to log immunizations or book one clinic visit for all of them at once — the buttons appear above the table.",
            },
            {
              kind: "tip",
              text: "To tick every resident in a zone, pick the zone chip, then tick the box at the top of the tick column: every resident listed is ticked in one go. Tick it again to untick them all. A dash in the box means only some are ticked. Adopted and deceased residents are left out (the line above the table says how many); tick one by hand if you really mean them. If you change the zone, search or any other filter, ticked residents that are no longer listed are unticked and the page says how many, so nothing is booked for an animal you cannot see.",
            },
            {
              kind: "tip",
              text: "Searching for an animal who has died still finds them: the count line says \"1 deceased resident matches — show\", and show adds them to the list.",
            },
            {
              kind: "note",
              text: "A volunteer's list is who and where only: name, ID, enclosure, zone and status. Their spreadsheet download holds only those columns (plus species and sex). There is no microchip search or No microchip filter, no ticking residents, no new resident and no pencil, and no search by other names.",
            },
            {
              kind: "note",
              text: "Signed in as a doctor, the list is your clinics': every resident your clinics have a clinic visit, prescription, procedure or blood test for — a cancelled visit included — plus every resident you were the doctor for at a clinic you have since left, and no one else. You can read those but not change them: you add and change records only at the clinics you work at now. The line under the heading names the clinic. A resident appears once the shelter books them a visit with you, and their hub shows all of their history, other clinics' visits included. A doctor who works at more than one clinic sees the residents of all of them; the line under the heading names the clinics. A Doctor login not linked to a doctor sees no residents until an admin links it (Accounts and roles).",
            },
          ],
        },
        {
          id: "name-card",
          title: "Scanning a name card",
          roles: ["admin", "management", "doctor", "volunteer"],
          path: "Hold your phone to a resident's name card",
          intro:
            "Every resident has a name card with an NFC chip. Hold the top of your phone to it (an iPhone XS or later, or an Android phone with NFC on) and the resident's page opens. What you see depends on who you are, but never less than a visitor sees.",
          steps: [
            "Signed out, or signed in only to test the public website: you see the resident's public card, the same as any visitor: photo, name, age, temperament and the rest of what the website shows.",
            "Admin, Management, Staff, and a doctor whose clinic treats that resident: the tap opens the resident's full page, with the record your role may read.",
            "The 2IC, the Heads and volunteers: you see the public card, plus where the resident lives and a button for each job you can do for that resident (for example Add Medical Photos or Record Weight). The medical record itself is not shown to these roles.",
            "A doctor looking at a resident their clinics do not treat sees the public card instead of an error.",
            "If you are signed in on another browser, the card opens the public page in the one your phone uses. Sign in there once and stay signed in.",
          ],
        },
        {
          id: "microchip",
          title: "Scanning a microchip",
          roles: ["admin", "management", "doctor"],
          path: "Residents → Scan a chip, or a resident's hub",
          intro:
            "A microchip number is exactly 15 digits, and no two residents can share one. It is for staff, Management and doctors only: the public website says only whether an animal is microchipped, never the number.",
          steps: [
            "To find an animal by their chip, open Residents. A USB or Bluetooth chip reader types the 15 digits and presses Enter, so scan straight into the Search box, where the cursor already is on a computer, or click the Scan a chip box and scan there; both work the same. A known chip opens that resident straight away, whatever the place, zone or deceased filters say. An unknown chip says so and, for staff, offers New resident with this chip, which starts intake with the number filled in. Typing the 15 digits works just as well, spaces and dashes included. Phones cannot read the usual 134.2 kHz chips, so use a reader.",
            "The chip shows under the resident's name on their hub, and at the top of their Clinic visits and Procedures pages and a visit's Edit page, so it is in front of a doctor wherever they work. It is also in the summary PDF and offline index filed when a resident dies.",
            "To record or correct a chip, tap Record chip (or Correct, beside a number already recorded), scan or type the number, add the date it was implanted if you know it, and tap Save chip. Admins, staff and doctors can do this; a doctor can for any resident their clinics treat. Staff can also enter it under Edit resident or on the Health step of intake.",
            "After you log a Microchipping procedure, you are asked Record the chip number? straight away, with the implant date set to the procedure's date. Scan the chip and tap Save chip, or tap Not now to do it later from the hub.",
            "To remove a number recorded in error, open the form, clear the number and tap Save chip. The implant date is removed with it.",
          ],
          callouts: [
            {
              kind: "note",
              text: "Saving the chip always saves the implant date shown in the form too, so if you correct only the number, check the date is still right before you save.",
            },
            {
              kind: "note",
              text: "A chip already recorded on another resident is refused, since one of the two numbers must be wrong: check the number, or correct the other resident's record first. A resident who has died cannot have their chip changed, since their record is closed.",
            },
            {
              kind: "tip",
              text: "Management's dashboard counts the residents in care with no microchip, and tapping it opens the Residents list with No microchip on.",
            },
          ],
        },
        {
          id: "intake",
          title: "Registering a new resident (intake)",
          roles: ["admin", "management"],
          activity: "resident.register",
          path: "Residents → New resident (intake)",
          intro:
            "Intake creates the resident record and their first placement in one go. The questions come a few at a time over five short steps and a final review, so it fits on a phone at the gate — and the whole record is written when you tap Register resident, never before.",
          steps: [
            "On the Residents list tap New resident (intake).",
            "Step 1, Who: name (required), Thai name, other names, species, breed, sex and size (required — small, medium or large, which sets their default meal size). Tap Next.",
            "Step 2, Arrival: the intake date (required), where they came from (pick an existing origin or add a new one), the zone and enclosure they're going into, intake notes, and the Ready for adoption tick. Each enclosure in the list shows how many residents it holds against its capacity, and the one you pick shows it again underneath — green for space, orange for nearly full or full, red for over. Leave the enclosure blank and they're recorded as Unassigned until you move them; tick Ready for adoption only if they should appear on the public adoption page straight away.",
            "Step 3, Health: an estimated age in years, a weight at intake (it becomes their first weight reading) and how often they need routine blood work, all optional; and a starting diet, which is required. The diet list is the one an admin keeps under Settings → Diets, and it starts on the shelter's standard diet — change it only if the resident needs something else. The diet is recorded from the intake date and can be adjusted on the hub's Diet page.",
            "Step 4, For adopters — all optional: colour, desexed, good with dogs / cats / children, and energy level. These fill the quick facts and \"Gets along with\" on the public profile.",
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
            "Adoption updates: news from the adopter — how many updates there are and the latest. It appears on any resident who has been adopted, including one since returned to the shelter. See Adoption updates below.",
            "Medical cards: Immunizations, Clinic Visits, Prescriptions, Weight, Procedures and Blood Tests. Each shows the latest state (for example \"2 missing\" mandatory vaccines, or the next clinic visit) and a quick link to add a record.",
            "On a phone the hub is split into two tabs — Overview and Medical.",
          ],
          screenshot: {
            src: "/manual/resident-hub.png",
            alt: "A resident hub with the details card, housing card and medical cards",
            caption: "A resident hub. Green, orange and red card colours mean fine, needs attention soon, and overdue or missing.",
          },
          callouts: [
            {
              kind: "note",
              text: "A volunteer's page for a resident is smaller: photo, name, ID, species, sex, status and the enclosure and zone, and a link to the enclosure. Everything else on the hub, and everything it links to, is not opened to a volunteer.",
            },
          ],
        },
        {
          id: "adoption-updates",
          title: "Adoption updates",
          roles: ["admin", "management"],
          activity: "resident.adoption_news",
          path: "Resident hub → Adoption updates",
          intro:
            "When an adopter sends news — a message on LINE or Facebook, an email, or on a visit — record it on the animal's hub so it stays on their record, photos and all.",
          steps: [
            "Find the resident: on the Residents list search for their name with no zone chip picked, as adopted residents are not in a zone (or tap Adopted).",
            "On the hub, tap Add update on the Adoption updates card.",
            "Date received: the day the news arrived. Sent by: the adopter from their adoption is already chosen — change it if a partner or someone else in the family sent it, or choose Not recorded.",
            "Came in by: LINE, Facebook, Email or Visit. What they said: the message, in your words or theirs — optional when there are only photos.",
            "Photos: choose any photos they sent — several at once is fine. Tap Save update. The update is saved first, then each photo uploads with a progress bar, and you're taken to the list of updates.",
            "Each update lists its date, how it came in, who sent it, the note and its photos. Edit / add photos corrects any of it or adds more photos; Delete removes the update and says how many photos go with it.",
          ],
          callouts: [
            {
              kind: "note",
              text: "Every photo an adopter sent stays labelled with who sent it, when and how — on the update, and on the resident's Photos page too. In Drive they are kept apart from the shelter's own, under Adoption updates in the resident's folder.",
            },
            {
              kind: "tip",
              text: "If a photo doesn't upload, the update itself is already saved: the form stays open and Save again retries just the photos that failed.",
            },
            {
              kind: "note",
              text: "A resident returned to the shelter keeps the updates from their time away, and the card stays on their hub. Doctors can read updates but not add them.",
            },
          ],
        },
        {
          id: "edit",
          title: "Editing a resident's details",
          roles: ["admin", "management"],
          activity: "resident.record",
          path: "Resident hub → pencil icon",
          steps: [
            "Tap the pencil next to the resident's name.",
            "Change identity fields, adoption flags, bio and background, or pick a different profile photo from their gallery.",
            "The Adoption section also has the two lines written for their public page: the Hook line, one sentence shown under their name (up to 120 characters), and Ideal home, a short paragraph on the home they would thrive in (up to 600). Both are optional — until they are filled in the page simply leaves them out — and both go to Translations like the bio.",
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
          roles: ["admin", "management"],
          activity: "placement.move",
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
          roles: ["admin", "management"],
          activity: "placement.hospital",
          path: "Resident hub → Housing & Status → Send to hospital",
          steps: [
            "Tap Send to hospital, enter the date admitted and the reason, and tap Send to hospital. Their enclosure is remembered.",
            "You can also start this from a clinic visit on the Clinic Visits page — the date and notes are pre-filled from the visit.",
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
          roles: ["admin", "management"],
          activity: "placement.rehome",
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
          roles: ["admin", "management"],
          activity: "placement.death",
          path: "Resident hub → broken-heart icon next to the pencil",
          steps: [
            "Tap the broken-heart icon beside the pencil on the hub.",
            "Enter the date of death, the cause and any notes. The page lists exactly what will happen.",
            "Tap Record death and confirm.",
            "The resident's status becomes Deceased; future clinic visits are cancelled, prescriptions ended, and they leave the public pages. The record closes — only their bio and photos can still be changed, and the archive files below are refreshed when they are. Their Drive folder moves to Residents/Deceased/ with a summary PDF and an offline index page — the hub shows links to these, and a Retry button if Drive was unavailable. If you change the bio or photos afterwards and Drive can't be updated, the page warns you that the PDF and index are out of date; tap Refresh archive on the banner to try again.",
            "Checked end to end on 2 October 2026: after a death, adding a photo, changing the bio, choosing a different profile photo and removing a photo each updated both the summary PDF and the offline index in Drive within a few seconds. The out-of-date warning only shows at the moment you make the change and is gone once the page is reloaded, so if you see it, press Refresh archive before leaving. A phone photo (HEIC) chosen as the profile is turned into a picture for the PDF by Drive; if the PDF still could not get the picture, the page says so at the moment you choose it — pick a JPEG or PNG photo instead, or press Refresh archive. A resident whose first archive never finished is not archived by a later edit — use Retry archiving on the hub, which includes everything saved so far.",
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
          activity: "placement.death_withdraw",
          path: "Resident hub → deceased banner → Withdraw this death",
          steps: [
            "On the hub of the resident recorded as deceased, tap Withdraw this death at the bottom of the banner.",
            "Check where they'll go back to — the enclosure or carer they were with when the death was recorded — and say why it was recorded in error. The reason is required.",
            "Tap Withdraw death and confirm.",
            "The resident is back where they were, the clinic visits the death cancelled are scheduled again, the prescriptions it ended get their old end dates back, and their record can be edited again. The Drive folder moves back under Residents/ and the generated summary PDF and index page are deleted — a Retry appears on the hub if Drive was unavailable.",
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
          roles: ["admin", "management", "doctor"],
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
        "Six kinds of medical record hang off each resident. All of them are reached from the resident hub's medical cards, or from a clinic visit so the record is linked to that visit. Staff can read all of these; adding to them is for doctors, staff, management and admins as noted.",
      topics: [
        {
          id: "immunizations",
          title: "Logging immunizations",
          roles: ["admin", "management", "doctor"],
          activity: "medical.immunizations",
          path: "Resident hub → Immunizations → Log immunization, or tick residents on the list",
          intro:
            "One form records any number of vaccines for any number of residents — a litter's first shots, or a whole enclosure's rabies boosters.",
          steps: [
            "Choose the residents: pick them individually, or use Add all in zone / Add all in enclosure.",
            "Tick the immunization types given. Mandatory ones are marked; each type's repeat interval is set under Settings → Immunization Types. The list shows names only — what a vaccine costs is kept on that Settings page and is not shown on this form, even to people who can log immunizations.",
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
          title: "Booking and recording clinic visits",
          roles: ["admin", "management", "doctor"],
          activity: "medical.visits",
          path: "Resident hub → Clinic Visits → Book clinic visit",
          steps: [
            "Choose one or more residents and the clinic (clinics are set up under Management → Clinics). If you know which doctor will see them, type their name in Doctor — it is optional. The doctors on that clinic's list are offered as you type, so pick one rather than spelling it a new way. A name that isn't offered is added to the clinic's list when you book.",
            "Enter the date and time. Use a past date to record a visit that already happened, including emergencies.",
            "Give the reason, set the status and add notes. The status follows the date you enter — a past date sets Completed, a future one Scheduled — but it is yours to change: choose Scheduled for a past visit you can't yet confirm took place.",
            "Tap Book clinic visit. With one resident you go straight to their Clinic Visits page, where the new visit is listed; with several, back to the Residents list.",
            "On the resident's Clinic Visits page each visit has quick links to log a blood test, prescription, weight or procedure against that visit, and to send the resident to hospital. A visit still to come has no prescription or weight link — those are recorded once the visit has happened.",
            "After the visit, tap Edit on its row to mark it Completed (or Cancelled), fix the date or clinic, add the doctor who saw them, and enter the cost from the invoice. The clinic's hub totals those costs for the period shown.",
          ],
          screenshot: {
            src: "/manual/vet-visit-new.png",
            alt: "The book clinic visit form",
          },
          callouts: [
            {
              kind: "note",
              text: "A visit whose date has passed but is still Scheduled shows as overdue on the hub and the Clinics pages until its status is updated. That is why the status is a choice and not worked out from the date: Scheduled means nobody has confirmed the visit happened, Completed that it did, and Cancelled that it didn't.",
            },
            {
              kind: "note",
              text: "Signed in as a doctor, the form offers only your own clinics: one clinic is shown by name, two or more are a short list to choose from. The Doctor field is you — filled in and locked, because a visit you record is yours; staff and admins still choose any doctor at the clinic. If your account hasn't been linked to a doctor yet the form says so — ask a shelter admin to link it (Accounts and roles).",
            },
          ],
        },
        {
          id: "prescriptions",
          title: "Adding a prescription",
          roles: ["admin", "management", "doctor"],
          activity: "medical.prescriptions",
          path: "Resident hub → Prescriptions → Add prescription",
          steps: [
            "Pick the medication from the list (or add a new one, giving what one unit is — tablet, ml, drop…). An admin keeps this list tidy under Settings → Medications.",
            "Enter the dose per administration and pick a frequency, e.g. Twice daily or Every 8 hours. New frequencies can be added inline too.",
            "Set the start date, and an end date if it's a course; leave the end blank if ongoing.",
            "Optionally link the clinic visit that prescribed it and add notes such as \"give with food\". Only visits up to today are offered: a prescription belongs to a visit that has happened, and one still to come can be linked once it has.",
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
          roles: ["admin", "management", "doctor"],
          activity: "medical.diet",
          path: "Resident hub → Diet → Add diet",
          steps: [
            "Pick the diet from the list (dry kibble, wet food, a prescription diet…). An admin keeps this list and its portion sizes under Settings → Diets; Management sets the costs under Management → Diet stock.",
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
          roles: ["admin", "management", "doctor"],
          activity: "medical.weight",
          path: "Resident hub → Weight → Log weight",
          steps: [
            "Enter the weight in kg and the date weighed. The last reading is shown for comparison.",
            "If the weighing happened at a clinic visit, link it so the reading stays with that visit. A visit holds one weight, so visits that already have one aren't offered, and nor are visits still to come.",
            "Tap Save weight. The Weight page charts every reading and shows the change since the previous and first readings.",
            "A resident has one weight per day. If the day you pick already has a reading, the form says so and saving corrects that reading instead of adding a second — this is how a doctor's weight on an animal's intake day replaces the intake weight and links it to the visit. Blank notes and visit keep the reading's own.",
            "To fix a mistyped reading, tap Edit on it on the Weight page (or Edit weight on its clinic visit). Corrections always change the reading itself.",
          ],
          screenshot: {
            src: "/manual/weight-history.png",
            alt: "The weight history page with its trend chart",
            caption: "Weight history. Weigh at intake, at each clinic visit, and whenever condition changes.",
          },
        },
        {
          id: "procedures",
          title: "Logging a procedure",
          roles: ["admin", "management", "doctor"],
          activity: "medical.procedures",
          path: "Resident hub → Procedures → Log procedure",
          steps: [
            "Pick the procedure type — X-ray, ultrasound, spay/neuter, dental… — or add a new type.",
            "Enter the date, link the clinic visit if there was one (leave unlinked for things done on site, like nail clipping), and add notes.",
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
          roles: ["admin", "management", "doctor"],
          activity: "medical.blood_tests",
          path: "Resident hub → Blood Tests → Log blood test",
          steps: [
            "Pick the test type — CBC is preselected as the routine panel; the list (chemistry, thyroid, heartworm, tick-borne, cortisol, urinalysis) is kept under Settings → Blood Test Types.",
            "Enter the date of the test and, if it was done at a clinic visit, link the visit.",
            "Type the results or the doctor's summary in the notes (optional — you can just attach the scan).",
            "Drop in the lab scan or PDF (several files can go on one test), then tap Save blood test — the files upload as part of the save. A report that arrives later goes in from the row's Attach files link on the Blood Tests page.",
          ],
          screenshot: {
            src: "/manual/blood-test-new.png",
            alt: "The log blood test form",
          },
        },
        {
          id: "archive-records",
          title: "Removing a medical record",
          roles: ["admin", "management"],
          activity: "medical.archive",
          path: "Resident hub → Weight, Prescriptions, Clinic visits or Immunizations",
          steps: [
            "A weight reading, a prescription, a clinic visit or an immunization that was entered by mistake is removed rather than deleted. Tap Remove on its row and, if you like, say why — for example that it was entered on the wrong resident.",
            "A removed record leaves the list and everything built from it: the weight chart, the medication and cost forecasts, stock usage, the vaccinated and in-treatment counts, and the public website. It is not gone. If you remove the newest dose of a vaccine, the resident's next-due date goes back to the dose before it.",
            "Under each list, 'N removed hidden' appears when something has been removed. Tap Show removed to see those records below the live ones, greyed out with the reason, and Restore to bring one back. Hide removed puts the list back as it was.",
            "A removed weight or immunization no longer holds its day, so you can enter the correct one straight away. If you then restore the old one while a new one has taken its day, Restore says so and does nothing; remove or correct the new one first.",
            "Doctors don't see Remove. A doctor who enters something by mistake asks the shelter to remove it. A deceased resident's record is closed, so nothing on it can be removed or restored.",
            "Photos and other attachments are not removed this way — they are still deleted from their own row.",
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "photos",
      title: "Photos",
      icon: Camera,
      intro:
        "Photos live in the shelter's Google Drive, in a folder per resident — the app shows them and uploads into the right place. Everyone who can sign in can add photos. If an upload says photo storage is not connected, nothing is wrong with the photo: the app has lost its link to Drive, so tell an admin.",
      topics: [
        {
          id: "resident-photos",
          title: "Adding resident photos",
          roles: ["admin", "management", "doctor"],
          path: "Resident hub → Photos",
          steps: [
            "Open the Photos card on the hub.",
            "Choose the Drive folder the batch belongs in and, optionally, the date taken. A doctor's photos always go in Medical, so a doctor sees no folder choice.",
            "Medical photos never appear on the website — use Medical for operations, teeth, wounds and anything else that should stay inside the shelter. Photos in the other folders show on the resident's public page once they are on the website.",
            "Drop photos on the upload area or tap it to choose from your phone. You can select several at once.",
            "The first photo ever uploaded becomes the profile photo. To change it, hover or tap a photo and choose Set as profile photo, or pick one on the Edit page. A Medical photo can't be chosen as the profile photo, because the profile photo is what the website shows. If the first photo was a Medical one, it stays the profile photo inside the app but the website shows no photo — choose one from another folder to give the resident a picture there.",
            "Photos an adopter sent carry a coloured label with who sent them, the date and how they came in, and opening one links back to its update. Once a resident has both kinds, the buttons above the gallery show just the shelter's photos or just the adopters'. Adopters' photos are added from Adoption updates, not here.",
            "Filed a photo under the wrong folder — a Medical photo recorded as Shelter, say? Open it and use Move to folder to refile it, in Drive and in the app together, without losing its date taken or caption. A doctor can only move a photo into Medical, not out of it. Moving the profile photo into Medical is refused — choose a different profile photo first.",
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
          roles: ["admin", "management", "volunteer"],
          activity: "facility.enclosures",
          activityLevel: "read",
          path: "Operations → Enclosures",
          steps: [
            "Open Operations from the menu and tap Enclosures. Tap a zone chip to show only that zone, search by enclosure name, or sort by zone, name or Fullest first. Zone shows the zones and their enclosures in the shelter's own order, set under Settings → Zones and Settings → Enclosures; Name is A-Z with numbers in order (2 before 10).",
            "The zone chips are one row: a chip for each zone at the shelter, in the shelter's order, then one Off-site chip for every zone away from it, then Status. You can pick more than one — tap a chip to add it and tap it again to take it off; All zones clears them and shows everything. Off-site takes in every zone not ticked Internal under Settings → Zones, so a new off-site zone is under it as soon as it is added. Hospital, Unassigned and Fostered are statuses rather than places: they show when no chip is picked, or under the Status chip.",
            "Under each zone's name is a line of figures: On-site or Off-site, how many enclosures, how many residents, and how many spaces are free. \"All zones\" above the list gives the same totals. Spaces free adds up capacity minus residents for each enclosure that has a capacity; a full or over-capacity enclosure counts as none, and enclosures with no capacity set are left out and mentioned. Hospital, Unassigned and Fostered are not counted. When a search, zone chip or the open-maintenance tick narrows the list, the figures cover only what is shown and the line says \"showing 4 of 12 enclosures\".",
            "Each card shows how many residents are in the enclosure against its capacity — green for space available, orange for nearly full or full, red for over capacity.",
            "Tick Has open maintenance to show only enclosures with a job that isn't Completed; it works alongside the zone chips, search and sort, and the address keeps it, so a filtered view can be bookmarked or shared. It counts jobs logged on the enclosure itself — a zone-wide job doesn't put every enclosure in that zone on the list; it stays as the zone-wide count beside the zone's name. Hospital, Unassigned and Fostered are hidden while it's ticked.",
            "A card with residents on a special diet — any current diet other than the shelter's standard one — shows a bowl-and-cutlery icon with how many, such as \"2 special diets\". Tap it (or hover on a computer) to see who. The card's colour is left to capacity.",
            "An enclosure with open maintenance shows a spanner and the number of open jobs in the corner of its card (hold the pointer over it, on a computer, for \"3 open maintenance jobs\"); an enclosure with none shows nothing there.",
            "Tap a card to open the enclosure: its notes, every resident in it with a thumbnail, and its open maintenance jobs. A resident on a special diet has the diet's name under their thumbnail.",
          ],
          screenshot: {
            src: "/manual/enclosures.png",
            alt: "The enclosures browser with zone chips and occupancy bars",
          },
        },
        {
          id: "enclosure-map",
          title: "Finding your way round on the map",
          roles: ["admin", "management", "volunteer"],
          activity: "facility.map",
          path: "Operations → Enclosures → Map",
          steps: [
            "Open Enclosures and tap Map, next to List at the top. The Map button only appears once the shelter's hand-drawn plan has been loaded for at least one zone. Plans are added and replaced under Settings → Facility map, and a new or replaced plan shows here the next time you open the map.",
            "The first plan is the whole shelter, with each zone outlined. Tap a zone, then Open this zone, to go to that zone's own plan; the buttons above the plan take you back to the overview or across to another zone.",
            "On a zone's plan, each enclosure is a coloured shape, with nothing written over it so the numbers on the drawing stay readable. The colour is how full it is — green for space available, orange for nearly full or full, red for over capacity. Small icons inside the shape show what needs attention: the pill a resident on medication (staff and managers only), the bowl-and-cutlery icon a resident on a special diet, and a spanner an open maintenance job. An enclosure with none of these has no icons.",
            "Tap an enclosure to see its details under the plan straight away: how full it is, the residents in it with their photos (tap one to open them), who is on a special diet or medication, its notes and its open maintenance jobs. On a phone the page scrolls down to them. Tap another enclosure to switch, or ✕ to close. Tapping never takes you away from the plan; to move a resident, log maintenance or copy the tag link, tap Open full page.",
            "To zoom, pinch with two fingers, double-tap, or use the + and − buttons under the plan; drag to move round when zoomed in, and the button with the arrows fits the whole plan again. On a computer, hold Ctrl and scroll to zoom.",
            "The Medical room, the Kitchen and Storage are drawn too, as blue dashed shapes, so you can see where they are. Their names are not written on the plan; tap one to see which room it is. They are rooms, not enclosures, so they open nothing.",
            "Enclosures that have not been placed on a plan yet are listed under it as \"Not on this plan yet\", each one a link to its page, so nothing is lost while the plans are being filled in. The List view is always there too, with its search, zone filters and sorting.",
            "The map is for staff and volunteers. Visitors never see it: the QR code on each enclosure already shows them who lives there.",
          ],
        },
        {
          id: "enclosure-hub",
          title: "The enclosure page",
          roles: ["admin", "management", "volunteer"],
          activity: "facility.enclosures",
          activityLevel: "read",
          path: "Operations → Enclosures → (an enclosure)",
          steps: [
            "The occupancy bar and notes are at the top; tap a resident to jump to their hub. Under each resident's name are their special diets, if any, and On medication with the pill if they are on a prescription today (staff and managers only).",
            "Link for this enclosure's QR code: the address to program into the QR code on the enclosure. Tap Copy link, or select the address by hand. The enclosure browser has the same copy icon on every card, for doing a batch.",
            "Someone who scans the QR code while signed in lands on this page. A visitor sees a public page instead: the enclosure's name and Thai name, its zone, and a card for each resident living there — tap one for that resident's public card, the same page their RFID card opens. Nothing else is shown: no capacity, notes or maintenance. An empty enclosure says nobody is living there at the moment. Hospital, Fostered and the other Lifecycle statuses have no public page.",
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
          roles: ["admin", "management"],
          activity: "maintenance.jobs",
          path: "Operations → Maintenance → Log maintenance (or from an enclosure page)",
          steps: [
            "Step 1, What is wrong: give the job a title, e.g. \"Gate latch broken\", describe what needs doing, and add photos of the problem as it is now. They upload when you save.",
            "Step 2, Where: pick the zone and enclosure, or tick Zone-wide for something like a fence line or drainage.",
            "Step 3, Who and when: set the status, a due date and an estimated cost in baht if known, and tick everyone it's assigned to — anyone with a login who does the work (staff, volunteers, management). A big job can go to a team.",
            "Step 4, Review: check everything, use Edit to change a step, then tap Save job. Back never loses what you typed, and nothing is saved until this last step.",
          ],
          screenshot: {
            src: "/manual/maintenance-new.png",
            alt: "The log maintenance form",
          },
        },
        {
          id: "maintenance-board",
          title: "Tracking jobs on the board",
          roles: ["admin", "management"],
          activity: "maintenance.jobs",
          activityLevel: "read",
          path: "Operations → Maintenance",
          steps: [
            "Staff open on the jobs assigned to them; switch Assigned to from Me to Everyone to see the whole board (management and admin start there). Filter by zone or enclosure. Completed jobs from the last 30 days are shown; tick Show all completed jobs for older ones.",
            "On a computer, drag a job card to another column to change its status. On a phone, tap Move job on under the job, choose where it goes (Move to In progress, Blocked, Completed or Not started), and confirm — the question says in words what will happen. Use the status chips at the top to look at one status, such as Completed, and move a job back from there. Cards are coloured when a job is overdue, due soon, or blocked.",
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
              text: "The board, its jobs and their photos are for staff and management; a volunteer does not see them.",
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
          roles: ["admin", "management"],
          activity: "projects.folders",
          activityLevel: "read",
          path: "Operations → Projects",
          steps: [
            "Open Operations from the menu, tap Projects, then a category, then a folder. Search folders by name from any level, and sort by name, newest or project date.",
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
          roles: ["admin", "management"],
          activity: "projects.folders",
          path: "Operations → Projects → (a category or folder)",
          steps: [
            "Tap New folder, give it a name (this is also its Drive folder name) and, optionally, a Thai name.",
            "Use Rename, Move or Delete on a folder's page. Only an empty folder can be deleted; the twelve categories can't be changed.",
            "Under About this project tap Edit details to write the story, set the date and location, and type the Thai title. The Thai title is also under Rename and in the New folder form.",
            "Turn on Show on website to publish the folder's title, story and photos on the public Our work page. Turn it off — or use Management → Website — to take it down.",
            "A published folder with no Thai title is still shown; visitors reading Thai simply see the English title. The folder says so under About this project, Management → Website lists it with an Add Thai title link, and Management → Translations lists the published projects still missing one at the top.",
          ],
          screenshot: {
            src: "/manual/projects.png",
            alt: "The projects page showing the category folders",
          },
        },
        {
          id: "outreach-visits",
          title: "Recording an outreach visit",
          roles: ["admin", "management"],
          activity: "community.outings",
          path: "Operations → Outreach visits",
          intro:
            "Dogs the shelter helps without taking in — fed, treated, sterilised or vaccinated at a temple or in a village, or rehomed from a temple — are recorded as one short note after each visit. The notes add up to \"Dogs helped at our outreach visits\" on the home page.",
          steps: [
            "Open Operations from the menu, tap Outreach visits, then Record a visit.",
            "Check the date, then pick the place. A temple or village not in the list yet: pick + A new place, type its name and say whether it is a temple or a village. Next.",
            "Tick everything you did. Next.",
            "Type how many dogs you helped. If you ticked Sterilised, also type how many of them were sterilised. Add a note or photos if you like, then Save visit.",
            "To correct a visit, tap Edit beside it. The same page adds or removes photos, and deletes the visit.",
          ],
          callouts: [
            {
              kind: "note",
              text: "Count every dog you helped at that visit, even one you helped last time. The figure counts help given, not different dogs, which is why the website says \"dogs helped at our outreach visits\".",
            },
            {
              kind: "tip",
              text: "Sterilised dogs count twice on the website: in the dogs helped, and in \"Sterilisations in local villages\". That is what the Director asked for.",
            },
            {
              kind: "note",
              text: "Photos stay inside the app. Ticking May be shown on the website records that a photo may be used, but nothing on the website shows outreach photos yet.",
            },
            {
              kind: "note",
              text: "Who may record visits is set by Admin on Settings → Security, under Who may write outreach notes. Today it is Management. The home page shows the figure only once Admin has entered its starting number and date on Settings → Website.",
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "vets-contacts",
      title: "Clinics and contacts",
      icon: Users,
      intro:
        "Two read-only directories for everyday use. The lists themselves are edited under Management.",
      topics: [
        {
          id: "vets",
          title: "Clinics",
          roles: ["admin", "management"],
          activity: "clinics.list",
          activityLevel: "read",
          path: "Operations → Clinics",
          intro:
            "A clinic is the place a resident is taken to, and the place a visit is booked with. A doctor is a person who works at one or more clinics, and a doctor may have their own login to the app. A doctor who comes to the shelter instead (a mobile doctor) is entered as a clinic with no address: only the name is needed, and nothing is shown for the details left out.",
          steps: [
            "Open Operations from the menu and tap Clinics to see every clinic with its visit count, residents seen, last visit and what's upcoming or overdue.",
            "Tap a clinic for its hub: contact details and notes, visits per month, the clinic's doctors with how many visits each saw, the residents seen there, spend on visits with a recorded cost, and the procedures, blood tests and prescriptions logged against its visits. Change the period (3, 6, 12 months or all time) at the top.",
            "Tap any card to see what it counts. Scheduled opens the Scheduled list: overdue visits first, in red and oldest first, then upcoming ones, soonest first, whatever period is chosen. Each row shows the resident, the date, the reason and the doctor; tap Edit to mark an overdue visit Completed or Cancelled. Visits and Residents seen open their lists for the period. Spend, Procedures, Blood tests and Prescriptions open the Visits list showing only the visits with a cost or with those records — tap a visit to go to that tab of the resident's record, or tap Visits above the list to see them all again. A card with nothing to show cannot be tapped.",
          ],
          screenshot: {
            src: "/manual/vet-hub.png",
            alt: "A clinic's hub with visit statistics",
          },
        },
        {
          id: "contacts",
          title: "Contacts",
          roles: ["admin", "management"],
          activity: "contacts.browse",
          path: "Operations → Contacts",
          steps: [
            "Open Operations from the menu and tap Contacts to find carers, volunteers and suppliers. Search by name, phone, email or chat ID, and filter by type. Contacts is for Management and the 2IC. The 2IC sees each person's name and phone number and nothing else — no address, email or notes. Staff and volunteers do not have the page: if you need a carer's number, ask Management. (Choosing a carer on intake or rehoming still works for staff.)",
            "Each contact has one-tap buttons: Call, LINE, Messenger, WhatsApp, Email and Map — handy on a phone.",
            "A contact's page shows their written address with a small map under it. The map comes from their Map link; tap it to open the place in Google Maps — the Maps app on a phone. If the Map link no longer leads anywhere, there is no map and no Map button, and the page says so: paste a fresh link into Map link under Management → Contacts.",
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
        "Mostly for the management and admin roles: the monthly reporting dashboard and the reference lists the rest of the app picks from. Stocktake and recording deliveries are here too, for staff.",
      topics: [
        {
          id: "dashboard",
          title: "The dashboard",
          roles: ["admin", "management"],
          activity: "reports.dashboard",
          path: "Management → Dashboard",
          steps: [
            "Right now: residents in care (in the shelter, in hospital, fostered), ready for adoption, clinic visits in the next 7 days, and open maintenance jobs.",
            "The month at a glance: intakes, adoptions, fosters, deaths, hospital stays, returns, blood work, initial and follow-up clinic visits, procedures and vaccinations given — with the residents' names under each. Use Previous month / Next month to move around. Months run on Thai time, so something recorded just after midnight on the 1st counts in the new month.",
            "Clinic spend adds up the invoice amounts entered on the month's clinic visits. It also says how many visits have no amount yet: until those are filled in, the figure is not the whole bill.",
            "Copy as text puts the whole month on the clipboard, one line per heading with the names, ready to paste into the monthly report or a LINE message. Print prints the month section on its own, in black on white.",
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
          activity: "contacts.directory",
          path: "Management → Contacts",
          steps: [
            "Add a contact with their type (Carer, Volunteer or Supplier), phone, email, LINE ID, Messenger, WhatsApp, address and notes — what a supplier sells, when a volunteer is free, a carer's home set-up. Notes show on the contact's page and are searched from the contact list.",
            "Edit details in the table. A contact who has fostered or adopted must stay a Carer.",
            "Address and Map link are two boxes. Address is the written address, as you would put it on an envelope — words only. Map link is for the map: in Google Maps, find the place, tap Share, copy the link and paste it there. Google often puts a typed Thai address in the wrong spot, or on another business; a shared link is the exact place. If a link is pasted into Address by mistake, saving moves it to Map link and keeps any words after it as the address. Contacts from before the two boxes, with the link at the start of the address, open already split when you tap Edit — Save once and they are stored the new way.",
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
          activity: "friends.manage",
          path: "Management → Shelter Friends → Add a Shelter Friend",
          intro:
            "Local businesses that donate goods or give a discount to the shelter's supporters can be thanked on the public website's Shelter Friends page — a card each, with what they do for the shelter and how to find them. Add one with the Add a Shelter Friend wizard: it takes a business from nothing to a published card in five short steps. Everyone who signs in sees the Shelter Friend badge on a contact; only admin and management can add or change a profile.",
          steps: [
            "Tap Add a Shelter Friend, at the top of Management → Shelter Friends (or of Management → Contacts). The wizard has five steps, shown along the top, and nothing is saved until the last one. The step number is in the page address and what you have typed is kept in this browser tab, so a refresh — or a phone locking itself — brings you back to the same step with your answers still there. The one thing a refresh cannot keep is a logo you had chosen; the wizard tells you to choose it again.",
            "Who: search for a supplier you already have, by name or phone, and pick them — or choose Add a new business and enter its name and, if you have them, its phone, LINE, email, written address and Map link (the Google Maps Share link — see Managing contacts). A new business is added to Contacts for you, as a Supplier, when you save. Only suppliers can be Shelter Friends for now; a business that only donates is a supplier too. A supplier that is already a Friend is not offered.",
            "How they help: Kind of help (a short line such as \"Donates cat litter every month\"), What they do for the shelter (a sentence or two) and an Offer for supporters if they give one (\"10% off for adopters — show your adoption card\"). All optional. You do not need to write a Thai version: it goes to the translation queue by itself when you save.",
            "Logo and links: a logo picture, their website and their Facebook page, all optional. Links must be secure (start with https://), and the Facebook page must be a facebook.com or fb.com link — the wizard says so if one isn't. The logo is uploaded when you save.",
            "What the public may see: phone, email, LINE, the address as text, and a map. Every box starts off, and the wizard ticks nothing for you. Ask the business first and tick only what they said yes to; each ticked box shows exactly that one detail on their card — the map can be shown without printing the address, or the other way round. Details the contact doesn't have are marked \"not recorded\". If you go back and pick a different business, the boxes are cleared again, because the earlier yes was not theirs.",
            "The map comes from the contact's Map link (a Google Maps Share link — see Managing contacts); a business with no Map link yet gets a map searched from its written address. Ticking Address shows only the words, never the map link; ticking Map shows the map without printing the address. Tapping the map on their card opens the place in Google Maps.",
            "Review: every answer, grouped by step, with an Edit link on each to jump back — then their card exactly as visitors will see it, drawn from your answers. Choose Publish now to put the card on the website straight away, or Save as a draft to keep it private. A draft is marked Draft on the card and in Management → Shelter Friends, and you can publish it later from either place. If you are signed in and look at the Shelter Friends page while a draft is waiting, a note at the top says so.",
            "If the logo can't be uploaded — most often because photo storage isn't connected — the Friend is still saved, and the last screen says it was saved without a logo. Open their card from that screen (or from the contact) and add the logo there. If the profile itself can't be saved, nothing is left behind: a business you were adding in step 1 is not kept in Contacts either, and you can fix what the message says and save again.",
            "Once a Friend is published the card goes on the Shelter Friends page, which from then on is linked from the website's menu and footer, gets a thank-you band on the home page (the first five in your order, then a Your business here? tile) and a mention on the Donate page. View on the website opens their card.",
            "To change a profile later, open the contact: the Shelter Friend box there is where you edit it, preview it, add Friend since, replace the logo and Publish or Unpublish. A contact you opened first can also be made a Shelter Friend from that box (Make a Shelter Friend) — it starts an empty profile that you fill in and publish there, which is the long way round the wizard now saves you.",
            "Management → Shelter Friends lists every profile in the order the website shows them: use the arrows to move one up or down, and Publish / Unpublish from the list. To edit one, open the contact.",
            "Archiving the contact takes their card off the website straight away and keeps the profile; restoring the contact brings the card back.",
            "Unpublish and Remove Shelter Friend status sit side by side on the card and do different things. Unpublish hides the card for now and keeps everything, ready to publish again. Remove Shelter Friend status is for a business that is no longer a Friend: the profile, its logo and its translations are deleted, and the contact itself stays exactly as it was — it can be made a Shelter Friend again later, starting from an empty profile.",
            "What they do, Kind of help and the Offer are translated like other public text: they appear under Management → Translations, and the translation box sits under each one on the contact's page.",
          ],
          callouts: [
            {
              kind: "warning",
              text: "Ask the business before you tick anything under What they agreed to show, and tick only what they said yes to. Their name, the text you write and their links are public as soon as you publish — their phone, email, LINE and address never are unless ticked.",
            },
            {
              kind: "note",
              text: "The Shelter Friends link, the home-page strip and the Donate mention only appear once at least one friend is published, so the website looks exactly as before until then. The Become a Shelter Friend page is always in the menu — it is how a business finds out about joining — and its wording is under Management → Website.",
            },
          ],
        },
        {
          id: "donation-receipts",
          title: "Recording a donation and sending its receipt",
          roles: ["admin", "management"],
          activity: "donation.receipt",
          path: "Management → Donations → Record a donation",
          intro:
            "When a gift arrives, record it here and the app issues the receipt: numbered LCA0009000, LCA0009001 and so on, never repeated or skipped, in the same layout as the receipts the Director made by hand, saved on Google Drive and ready for you to send. Admin and Management can do it, on a phone as well as a PC.",
          steps: [
            "Tap Record a donation. Who gave: type the donor's name exactly as it should appear on the receipt (Thai is fine), or pick them from your contacts to fill in their name, email, phone and LINE. Fill in at least one way to reach them.",
            "The gift: the date it was received (never a future date), how it was given (bank transfer, PromptPay, cash, DonorBox or in kind), and what it is for: general, a resident (choose which), a project or an appeal (say which).",
            "Receipt lines: one line for each item on the receipt, each with its amount in baht, for example \"Sponsorship of two packs (40kg) of dry dog food\", 1,200. Add a line for each further item. For a gift in kind (goods, not money) choose In kind under How it was given: the amounts disappear, you describe what was given, and the receipt says In kind instead of a total.",
            "Receipt for: Thai receipt or US receipt. Most donors are in the US. Today the two look the same except the date: the Thai receipt writes it day first (09/10/2026), the US one month first (10/09/2026).",
            "Tap Save and issue receipt. The receipt takes the next number and opens on the donation's page. It is filed on Drive under Admin → Donations → Receipts → the year, named with its number and the donor, e.g. LCA0009000-Global-Tiger.pdf.",
            "To send it from a phone, tap Share: your phone's share menu opens with the PDF attached, so you can pick Gmail, LINE or anything else. On a PC, tap Download, then Email draft: an email to the donor opens with the subject and a short thank-you already written. Attach the downloaded PDF yourself, because an email link cannot attach a file. The app never sends the receipt for you; it comes from you.",
            "When you have sent it, tap I've sent it. The list then shows it as Sent.",
            "If Google Drive is down, the receipt is still issued and you can still view, download and send it. The donation's page says Not yet saved to Drive with a Save to Drive now button; tap it later.",
            "To correct a mistake (wrong name, wrong amount), open the donation and tap Void this receipt, say why, and confirm. A void receipt is never deleted: it keeps its number, stays on the list marked Void, and its copy on Drive is stamped VOID. Then tap Issue a new receipt; it takes the next number. To change the donor's name or the lines first, record the gift again and leave the voided one as it is.",
            "Management → Donations lists the gifts received between two dates, newest first, with each one's receipt number, whether it is on Drive and whether it has been sent, and the total in baht. Void receipts are listed but not counted. Open any gift to view, re-download or re-send its receipt.",
          ],
          callouts: [
            {
              kind: "warning",
              text: "A receipt is a financial document. Never issue one for money that has not arrived, and void a wrong one rather than issuing a second receipt for the same gift: the register must show one live receipt per gift.",
            },
            {
              kind: "note",
              text: "The foundation's address on the receipt is fixed in the app on purpose and does not come from the website settings, so editing the website can never change a receipt. If the registered address changes, ask the developer.",
            },
            {
              kind: "note",
              text: "These receipts are a thank-you and the foundation's own record. They do not make a gift tax-deductible: in Thailand that needs the gift recorded in the Revenue Department's e-Donation system, and US tax status is still being sought.",
            },
          ],
        },
        {
          id: "manage-vets",
          title: "Managing clinics",
          roles: ["admin", "management"],
          activity: "clinics.list",
          path: "Management → Clinics",
          steps: [
            "Add a clinic with the name staff will pick when booking, and if you like free-text contact details and notes — specialities, opening hours, an emergency line — which show on its hub. Only the name is needed: a mobile doctor is added as a clinic with no address.",
            "A clinic with logged visits can't be deleted — the visits are part of the residents' medical records.",
          ],
          screenshot: {
            src: "/manual/management-vets.png",
            alt: "The clinics management table",
          },
        },
        {
          id: "vet-doctors",
          title: "A clinic's doctors",
          roles: ["admin", "management"],
          activity: "clinics.doctors",
          path: "Management → Clinics → Doctors",
          intro:
            "Each clinic has a list of its doctors, which the visit forms suggest from. Nobody has to type the list in: every doctor's name typed on a visit is added to that clinic's list, and \"dr ploy\" or \"Dr  Ploy\" find the \"Dr Ploy\" already there. What it can't tell is that \"Somchai\" and \"Dr Somchai\" are the same person — that is what this page is for.",
          steps: [
            "In Management → Clinics, the Doctors column shows how many doctors each clinic has; tap it to open the clinic's list. From a clinic's hub, Manage the doctor list goes to the same page.",
            "Each doctor shows how many visits they are on and the date of the latest. Names that look like one person written two ways — the same name with and without \"Dr\", \"หมอ\", \"น.สพ.\" or \"สพ.ญ.\", or different punctuation — are marked \"Possibly the same person as …\". That is only a hint; you decide.",
            "Merge… folds one spelling into another: choose the name to keep, and every visit recorded with the other one now shows the kept name, past visits included. The other spelling leaves the list. Use it on the spelling you want to drop. It can't be undone.",
            "Rename fixes a doctor's spelling. The new name is written onto every visit linked to that doctor, past ones included, so the page says how many visits will change and asks before saving. If the new name is already on the list, it is refused: that is a merge, not a rename.",
            "Mark as left, for a doctor who no longer works there, stops them being suggested on the visit forms. Their visits keep their name, and they move to No longer at the clinic at the bottom of the list. Back at the clinic undoes it. If someone types a left doctor's name on a new visit, it is still linked to them.",
            "Add a doctor is only needed for someone nobody has recorded a visit with yet, so they are suggested from the first booking. It needs a name and nothing else — no email, no account, no invitation; most doctors the residents are taken to will never use the system. Delete is only for a doctor with no visits at this clinic — a mistaken entry; anyone on a visit is merged or marked as left instead.",
            "A doctor who works at more than one clinic is one person listed at each. Under Add a doctor, Also works here adds a doctor from another clinic to this one; each row then says where else they work (\"Also works at …\"). Mark as left applies to this clinic only — they stay on the other clinics' lists, and a Doctor login linked to them loses just this clinic. A doctor who has a login is marked \"Has a login\"; changing where they work, or merging them, is for an admin only, because it changes which clinics that login can see.",
            "If one person was entered twice — at two clinics, or spelled two ways — use Merge… on the entry to drop and choose the one to keep, even if it is listed at another clinic. The kept doctor takes every clinic the dropped one worked at, and all the visits; a login moves with them. Two doctors who both have a login can't be merged. Nothing is ever merged for you by name; the \"Possibly the same person\" note is only a hint, and it now looks across clinics.",
          ],
          callouts: [
            {
              kind: "warning",
              text: "Rename and merge change the doctor shown on past visits, including those of residents who have died, on the resident's pages and the archive record. That is the point — it corrects the record — but check you have the right two names before you merge.",
            },
          ],
        },
        {
          id: "manage-medications",
          title: "Managing medications",
          roles: ["admin", "management"],
          activity: "stock.medications",
          path: "Management → Medication stock; the list itself is Settings → Medications",
          steps: [
            "Medications live on two pages. Settings → Medications is the list itself, which only an admin can change: names, units, merging duplicates, and the units each one is bought and counted in. Management → Medication stock is what changes day to day: how much is in the cupboard, the price, when to reorder, the label photo and the forecast. Each page has a link to the other at the top (an admin sees both).",
            "On Settings → Medications, the table is the product list the prescription form offers. Add one with its name and unit (tablet vs suspension are two medications); rename or fix a unit with Edit. That unit is the medication's base unit: doses, prescriptions and the forecast stay in it. A new medication is not priced: set its price on Medication stock.",
            "Under that table, Units of measure lists each medication with its base unit — tablet, ml…. Open one and tap Add a unit to say how it is bought or counted: a name (bag (20 kg)), how many of the base unit one holds, and whether it is the unit it is bought in and the one it is counted in. A factor can be approximate — a cup of kibble varies with the brand and the scoop — so use your usual measure. A unit can't be named like the base unit. Correcting a factor later is safe: deliveries and counts already saved keep the amount they were saved with.",
            "Merge… on Settings → Medications folds a duplicate into the one to keep — its prescriptions move across. Only medications with the same unit can be merged.",
            "Management → Medication stock shows one card per medication, in cupboard order (below). When an item has a unit it is bought in, its cost per unit shows the pack price beside it — ฿0.035 per ml (฿35 per bottle) — so a small figure reads against what you actually pay. Tap Price and reorder to set the cost per unit (up to 4 decimal places), the reorder lead time and the safety stock. Under the cards, Price per pack lists each medication that has a unit it is bought in: enter the price per bag, box or bottle and the cost per base unit is worked out and saved from it. In stock also shows the amount in the purchase unit (≈ 2.4 bags).",
            "Next N days shows how much of each medication current prescriptions will need. For any other period — next month's order, say — enter From and To dates above the table and tap Show window; a column for that period is added beside the fixed ones.",
            "The \"how often\" choices a prescription picks from are under Settings → Frequencies, and only an admin can change them (see Frequencies).",
            "Cupboard order, at the top of the page, puts the medications in the order they sit on the shelves. Each one has an up arrow and a down arrow: tap them to move it one place, top shelf first. Each tap is saved straight away. The Stocktake sheet and this page both follow that order, so whoever counts walks the cupboard once. A new medication goes to the end of the list. Back to stock returns to the cards.",
            "To count everything at once, use the Stocktake link at the top of the page (see Doing a stocktake). To correct one item, tap Count on its card and enter what is in the cupboard, in the medication's own unit (tablets, ml…). In stock shows that figure and how long ago it was counted; saving the same figure again records a fresh count. Leave it blank for an item nobody has counted — it reads Not counted, which is different from 0, Out of stock.",
            "Days of stock is worked out from the last count and the Next 30 days figure: what has probably been used since the count is taken off, and what is left is divided by the daily rate. An item with nothing due in the next 30 days doesn't run out. Probably used up since the count means the forecast has used the whole count — count it again.",
            "To be warned in time, tap Price and reorder and enter the supplier's reorder lead time in days. When the days of stock falls to that figure or below, the card is flagged Reorder. Leave it blank and the item is never flagged.",
            "When stock arrives, use the Record a delivery link at the top of the page (see Recording a delivery). A delivery doesn't change In stock — the next count does.",
            "To add a label photo, tap Upload label on the medication's card and take a photo of the box or bottle (on a phone) or choose a picture. It shows beside the name here, on the Stocktake sheet and on the delivery form, so whoever is holding a box can match it at a glance. Replace label puts a new photo in its place and Remove label takes it away. The photo is for people signed in to the app only — it is never shown on the public website. A photo can be up to 15 MB; if it is larger the page says so and nothing changes. Admin and management only.",
          ],
          screenshot: {
            src: "/manual/management-medications.png",
            alt: "The medication stock page with the forecast",
          },
        },
        {
          id: "manage-diets",
          title: "Managing diets and the food forecast",
          roles: ["admin", "management"],
          activity: "stock.diets",
          path: "Management → Diet stock; the list itself is Settings → Diets",
          steps: [
            "Diets live on two pages. Settings → Diets is the food list itself, which only an admin can change: names, units, the daily amount for each size, the standard diet, and the units each is bought and counted in. Management → Diet stock is what changes day to day: how much is in the cupboard, the price, when to reorder and the food forecast. Each page has a link to the other at the top (an admin sees both).",
            "On Settings → Diets, the table is the food list the diet form offers. Add one with its unit (g, ml, can, sachet…) and the daily quantity for a small, medium and large animal. That unit is the diet's base unit: portions, the forecast and Cashflow stay in it. A new diet starts at ฿0: set its price on Diet stock. Edit a name, unit or portion in place — a corrected portion flows straight through to the forecast. A diet on any resident's record can't be deleted.",
            "Under that table, Units of measure lists each diet with its base unit — cup, g…. Open one and tap Add a unit to say how it is bought or counted: a name (bag (20 kg)), how many of the base unit one holds, and whether it is the unit it is bought in and the one it is counted in. A factor can be approximate — a cup of kibble varies with the brand and the scoop — so use your usual measure. A unit can't be named like the base unit. Correcting a factor later is safe: deliveries and counts already saved keep the amount they were saved with.",
            "One diet is the shelter's standard, marked Standard beside its name: what residents are fed unless someone says otherwise. Intake starts every new resident on it, and a resident on anything else shows as a special diet on the enclosure cards. To change which diet is the standard, tap Make standard on its row in Settings → Diets and confirm — the old one stops being the standard at the same moment. If no diet is marked, a note above the table says so.",
            "Management → Diet stock shows one card per diet, in cupboard order. When a diet has a unit it is bought in, its cost per unit shows the pack price beside it — ฿0.035 per g (฿35 per kg). Tap Price and reorder to set the cost per unit (up to 4 decimal places, so a sack priced per gram fits), the reorder lead time and the safety stock — a price rise flows straight through to the forecast and Cashflow. Under the cards, Price per pack lists each diet that has a unit it is bought in: enter the price per bag and the cost per base unit is worked out and saved from it. In stock also shows the amount in the purchase unit (≈ 2.4 bags).",
            "Next N days shows how much of each diet the residents living at the shelter will eat and what it costs, with a total across all diets. Fostered, adopted and deceased residents aren't counted; a resident with no size set counts as Medium. For any other period enter From and To dates above the table and tap Show window.",
            "Cupboard order, at the top of the page, puts the diets in the order they sit in the store, with an up and a down arrow on each, as on Medication stock. Each tap is saved straight away, and the Food tab of the Stocktake follows it. A new diet goes to the end of the list.",
            "To count everything at once, use the Stocktake link at the top of the page (see Doing a stocktake). To correct one item, tap Count on its card and enter what is in the cupboard, in the diet's own unit (g, cans…). In stock shows that figure and how long ago it was counted; saving the same figure again records a fresh count. Leave it blank for an item nobody has counted — it reads Not counted, which is different from 0, Out of stock.",
            "Days of stock is worked out from the last count and the Next 30 days figure: what has probably been used since the count is taken off, and what is left is divided by the daily rate. An item with nothing due in the next 30 days doesn't run out. Probably used up since the count means the forecast has used the whole count — count it again.",
            "To be warned in time, tap Price and reorder and enter the supplier's reorder lead time in days. When the days of stock falls to that figure or below, the card is flagged Reorder. Leave it blank and the item is never flagged.",
            "When stock arrives, use the Record a delivery link at the top of the page (see Recording a delivery). A delivery doesn't change In stock — the next count does.",
          ],
          screenshot: {
            src: "/manual/management-diets.png",
            alt: "The diet stock page with the forecast and costs",
          },
        },
        {
          id: "medication-list",
          title: "The medication list",
          roles: ["admin", "management"],
          path: "Home → Administer Medication (Head of Medical), or Operations → Medication list",
          intro:
            "One list of who needs medicine today and how much, built for a phone while you walk round the enclosures. It is for reading: nothing on it is ticked off, and the app does not record that a dose was given.",
          steps: [
            "The Head of Medical signs in to a Home with one button, Administer Medication, and taps it. Everyone else opens Operations from the menu and taps Medication list. The date at the top is today at the shelter.",
            "The list is grouped by zone, then by enclosure, in the order you would walk them, and each enclosure shows its animals. Each animal has a photo and name at the top, so you treat the right one.",
            "Under the animal, each medicine shows a photo of its box or bottle label (added under Management → Medication stock), the amount to give, and how often. If a medicine has no label photo, only its name shows.",
            "A medicine given every other day, weekly or monthly shows only on the days it falls due, counted from the day the prescription started. A medicine marked as needed is always shown. Last day of the course appears on a medicine whose prescription ends today.",
            "An animal who is in hospital, fostered or out in the community is listed at the end under Not in an enclosure today, so no one thinks they were missed.",
            "The list says how often (for example, 3 × a day) but not at what times: fixed rounds are the Head of Medical's knowledge, not something the app holds.",
          ],
          callouts: [
            {
              kind: "note",
              text: "There is nothing to tap and nothing is saved. To change who gets what, edit the prescription on the resident's page. If the kennels have no signal, open the list at the office first and carry it round.",
            },
          ],
        },
        {
          id: "stocktake",
          title: "Doing a stocktake",
          roles: ["admin", "management"],
          activity: "stock.count",
          path: "Operations → Stocktake, or Home → Do Stocktaking (the 2IC)",
          intro:
            "One sheet for counting every medication and diet, built to be used on a phone while you walk the shelves. Nothing is saved until you tap Save at the end, and everything saved together gets the same time.",
          steps: [
            "Open Operations from the menu and tap Stocktake — the 2IC taps Do Stocktaking on Home — (managers can also use the link at the top of Management → Medication stock or → Diet stock). Switch between Medications and Food with the tabs at the top; counts you have typed on one tab are kept while you look at the other.",
            "Items come in the order they sit in the cupboard, so you can walk the shelves from one end to the other. Management sets that order under Cupboard order on Management → Medication stock and → Diet stock; two items with the same place are in name order.",
            "Each row shows the item, its unit and the last count with how long ago it was taken. Type what is on the shelf now, in that unit — or, if the item has a count unit set up (bags, say), in that one: it is chosen for you, and the row shows what it comes to in the item's own unit. Pick another unit from the box beside the figure if you counted that way. One unit per row, so 3 bags and 4 kg is counted as 3.2 bags or as 64 kg. Press Enter (Next on a phone keyboard) to move to the next row. Use the search box to jump to an item.",
            "On a phone, the Medications tab is one card at a time: the box's label photo large at the top (the name instead, when there is no photo), then the name, the last count and when it was taken. Type what is on the shelf — the number keypad is already open — and tap Save to move to the next medicine. Same as last time confirms the old figure; Skip leaves the medicine for later. The top shows how far you are (23 of 100), Previous goes back one card, and See the whole list opens the full list instead.",
            "Your counts stay on the phone until you save them, so a closed tab, a locked screen or no signal in the kennels loses nothing: open Stocktake again and it picks up where you left off (counts older than two days are not kept). When the cards run out, anything you skipped is offered again — “5 skipped — count them now?” — and then Review and save sends everything at once, as on the computer.",
            "A medication that has a label photo (added under Management → Medication stock) shows it beside its name on the list, so you can match the box in your hand.",
            "Leave a row blank if you didn't count it. A blank row is left exactly as it was — it does not become Not counted. This is different from the Count cell on the Management tables, where clearing the figure means not counted.",
            "If the figure hasn't changed, tap Same as last time instead of retyping it. That records a fresh count of the same figure. Typing a number turns the tick off, and tapping the tick clears what you typed, so a row is always one or the other.",
            "Tap Review and save. The summary lists every item you counted, old → new, with changes of half or more marked Big change and shown first — check those before saving. Tap Save to save the whole sheet in one go: either every count is saved or none is.",
            "If you try to leave the page with counts that aren't saved, you are asked first.",
            "Staff and managers also see Record a delivery at the top of the page, for stock that has just arrived (see Recording a delivery).",
          ],
          callouts: [
            {
              kind: "note",
              text: "Counts are saved in each item's own (base) unit: tablets or ml for a medication, g, cans or cups for a diet, whichever unit you typed in. 0 means out of stock; a blank row means not counted this time.",
            },
          ],
        },
        {
          id: "stock-usage",
          title: "Stock between counts",
          roles: ["admin", "management"],
          activity: "stock.usage",
          path: "Management → Stock between counts",
          intro:
            "Shows what each medication and food was used between two stocktakes, beside what the prescriptions and diets planned for the same dates, so that big gaps stand out. Used is the earlier count, plus the deliveries recorded in between, minus the later count — so it is only as good as the delivery records (see the warning below).",
          steps: [
            "Open it from the Management page, or from the link at the top of Management → Medication stock or → Diet stock. It needs an item to have been counted in stocktakes on two different days; until then the item isn't shown.",
            "By default each item's latest count is compared with its last count on an earlier day. A recount on the same day replaces the earlier one rather than being compared with it. To compare two particular stocktakes instead, pick them under Earlier stocktake and Later stocktake and tap Compare; Back to last two counts returns to the default.",
            "Deliveries recorded is what was recorded under Deliveries between the two counts, and how many deliveries that was. A delivery on the day of a stocktake counts towards the stocktake it was on the shelf for — the delivery form asks which.",
            "Planned for these dates is what the prescriptions and diets in the app say would be used from the day of the earlier count up to the day before the later one — the same figures as the forecast columns, worked out for those past dates.",
            "Difference is Used minus Planned, with the same as a percentage of the plan underneath (+40% is 40% more than planned). When nothing was planned there is no percentage, just a dash.",
            "Rows where Used is more than a quarter away from the plan are marked and listed first — unless the gap is so small that two counts of that item could be off by that much on their own: one tablet, capsule, can or sachet, or a twentieth of what was on the shelf for things read by eye, like ml of syrup or g of food. So an item planned at two tablets isn't marked for a third; the row says About as planned and gives the gap. Used N more than planned: check the counts, doses given without a prescription, spillage and waste — and that no delivery was recorded twice or too large. Used N less than planned: either not everything planned was given or eaten, or a delivery arrived that nobody recorded. At least N arrived that wasn't recorded means the later count is higher than the earlier count plus every delivery recorded — record the missing delivery or check the counts.",
            "A row can carry a note. The plan leaves out residents who have since left means an animal adopted, fostered or who died since was on this item during those dates, so the plan reads low and a \"more than planned\" may be them. Changed by hand on …, after this count means the figure was edited on the Medications or Diets page after the later stocktake; only stocktakes are compared.",
            "Changed by hand … between these two counts is the same kind of edit, but made during the dates being compared. It does not change any figure on the row: a correction isn't treated as use, because fixing a typo would otherwise look like stock disappearing. The note is there to explain a gap you might otherwise go hunting for — if an item shows much more or less used than planned and carries this note, the figure someone typed is the first thing to check. The notes appear in the CSV too.",
            "Download CSV saves the table as shown — both medications and food, for the stocktakes picked — to open in a spreadsheet. Quantities are plain numbers with the unit in its own column; a blank is a figure the page shows as a dash, and the Against the plan column says why.",
          ],
          callouts: [
            {
              kind: "warning",
              text: "Used assumes every delivery was recorded. A delivery nobody recorded makes usage look lower than it really was, so a \"less than planned\" may just be a missing delivery. The box at the top of the page says since when deliveries have been recorded; before that date every figure assumes nothing arrived. A gap is a reason to look, not proof of anything.",
            },
          ],
        },
        {
          id: "purchasing",
          title: "Purchasing: what to buy",
          roles: ["admin", "management"],
          activity: "stock.purchasing",
          path: "Management → Purchasing, or Home → Do the Purchasing (the 2IC)",
          intro:
            "Works out how much of each medicine and food to buy for a week, two weeks or a month, so whoever orders does not do the arithmetic by hand. Every row shows its working, so nobody has to trust a bare number.",
          steps: [
            "On a phone it is one screen. At the top, pick how long the stock should last (1 week, 2 weeks or 1 month). Anything never counted is assumed to have none on the shelf, is shown in yellow, and a box above has a button to the stocktake. That box also names any never-counted item with nothing to buy, which is not on the list: its \"nothing to buy\" is a guess until it is counted. Below that are two folds, Medicines and Food, because they are bought at different shops: open one and it lists what to buy from each supplier, the amount (in whole bags or boxes where the item has them). Each item shows just its name and amount; tap it to open what is left against what is needed and The working, which shows how the amount was worked out. Print and Download CSV are at the bottom. Nothing is typed or saved, and the app does not place the order. The rest of this topic describes the table that a computer shows, which works the same way.",
            "Open it from the Management page, or from the Purchasing link at the top of Management → Medication stock or → Diet stock; the 2IC taps Do the Purchasing on Home. Pick the Period: 1 week, 2 weeks or 1 month, counted from today.",
            "Each row is one medicine or food. The working says what was counted and when, how much has probably been used since (the prescriptions' and diets' forecast, the same one Days of stock uses), how much has been received since (the deliveries recorded under Deliveries), and so how much should be on the shelf now. The second line says what the period needs: the forecast use over the period, plus the item's safety stock.",
            "Buy is what is needed minus what should be on the shelf now, never below zero. If the item has a unit it is bought in (set under Units of measure on Settings → Medications or → Diets, e.g. a 20 kg bag), the amount is rounded up to whole packs, and the amount in the item's own unit is shown beside it.",
            "Include supplier lead time is on by default. Stock ordered today only arrives after the item's reorder lead time (set on Management → Medication stock or → Diet stock), and the period should be covered from the day it arrives, so those days of use are added. Turn it off to count the period from today.",
            "Food is listed after medicines, with the special diets before the standard diet. Under each table, items to buy come first, then any never counted or counted long ago; the rest, which need nothing, are folded into one line (\"12 items need nothing for this period\") that you tap to open. It starts closed each time you visit the page.",
            "To buy lists only the items with something to buy, grouped by their usual supplier — the supplier named on the item's most recent delivery. Download CSV saves that list for a spreadsheet; Print prints just the list.",
            "Set an item's safety stock with Price and reorder on Management → Medication stock or → Diet stock: the floor to keep on the shelf whatever is prescribed today, such as fluids or a common antibiotic. It can be typed in the unit the item is bought in (2 bags) and is saved in the item's own unit. Blank means no floor; 0 is allowed and adds nothing.",
          ],
          callouts: [
            {
              kind: "warning",
              text: "An item that has never been counted is assumed to have nothing on the shelf, so the whole of what the period needs is on the buy list, marked \"never counted\" (yellow on a phone). That way a medicine newly prescribed, which is on no shelf yet, still gets bought. Count it in a stocktake and it is worked out from the real figure. A count older than three weeks is flagged as probably out of date, because the shelf has changed since — count it again before ordering.",
            },
            {
              kind: "note",
              text: "Used since the count is the forecast, not a measurement, and a delivery nobody recorded is invisible here, so recommended quantities are only as good as the counts and the delivery records. The working is there so you can see what the figure rests on and overrule it.",
            },
          ],
        },
        {
          id: "deliveries",
          title: "Recording a delivery",
          roles: ["admin", "management"],
          activity: "stock.delivery",
          path: "Operations → Deliveries, or Home → Record a Delivery (the 2IC)",
          intro:
            "Record each medication or food as it arrives, so Stock between counts can work out what was actually used. Recording a delivery doesn't change the stock count — the next stocktake does.",
          steps: [
            "Open Operations from the menu and tap Deliveries (it is next to Stocktake), or start from Home (the 2IC taps Record a Delivery). The Stocktake page also has a Record a delivery button at the top.",
            "On a phone it is one question at a time, with a Back button on every screen that keeps what you have typed: what arrived (Medicine or Food), which one (type part of the name; a medicine with a label photo shows it, to match the box in your hand), how much, when, then a few optional details, and last a sentence saying what will be recorded. Tap Record this delivery only when that sentence is right. When it is saved, Record another item starts the next one with the day and supplier already as they were. On a larger screen the same questions are one form: pick Medication or Food, then the item. Enter the quantity. If the item has other units set up under Settings → Medications or → Diets (bags, boxes), pick the unit the delivery came in — the one it is bought in is chosen for you — and the amount in the item's own unit is shown beside it and saved with it. With no other units, the quantity is in the item's own unit, as before. If it came in packs, fill in Came in packs? (2 × 50, say) and the quantity is worked out for you.",
            "Arrived on is today unless you change it; a delivery can't be dated in the future. If the item was counted in a stocktake that day, you are asked whether the delivery was already on the shelf when it was counted, so it is set against the right stocktake.",
            "Supplier (a Vendor from Contacts), the total cost in baht (0 for a donation) and a note are optional. Tap Record delivery. The day and supplier stay filled in, so the rest of the same delivery can be entered one item after another.",
            "Recent deliveries lists the latest ones with who recorded them, and, for one entered in another unit, what was typed beside the amount it came to (2 bag (20 kg) (400 cup)). That amount is kept as it was saved even if the unit's factor is corrected later. A delivery on a day its item was counted is tagged Before or After that day's stocktake, since the time shown can be the same minute as the count. A delivery typed wrong is deleted and recorded again.",
          ],
          callouts: [
            {
              kind: "note",
              text: "Stocktake and deliveries are both for staff and above, and for the 2IC; a volunteer does neither. The 2IC sees the stock figures, and never the price of a medicine or a diet.",
            },
          ],
        },
        {
          id: "recurring-jobs",
          title: "Setting up recurring jobs",
          roles: ["admin", "management"],
          activity: "recurring.manage",
          path: "Management → Recurring jobs",
          intro:
            "A recurring job is a rule — “stocktake of on-hand medication, every Monday morning, Anna” — that puts the job on the assignee's My tasks on every date it falls on. Nothing is created ahead: each date is worked out from the rule, and only what happened (done or skipped, by whom, when, and any note) is kept.",
          steps: [
            "Tap New recurring job. Say what to do, the time of day, and optionally instructions and the screen it is done on (for a stocktake, Stocktake — Medications or — Diets; Other page… takes any page of this app, starting with /).",
            "Choose how it repeats: weekly on the days you tick (every 2 weeks for fortnightly), monthly on a day of the month, or monthly on a weekday such as the first Monday or the last Friday. Every 3 months makes it quarterly. Set the start date and, if it stops, an end date.",
            "Check Next dates under the rule before saving. It is worked out by the same rule My tasks uses, so if the first date isn't the one you expect, the rule needs changing. Fortnightly counts from the week the job starts in: a fortnightly Monday job starting on a Wednesday first falls twelve days later, not five.",
            "Tick who does it. Several people make a team: all of them see it, and any one can mark it done. Only people who can still sign in are offered — and never doctors, whose work comes from their clinic visits rather than the shelter's routine. The screen the job is done on narrows it further: a maintenance job or a delivery lists admin, management and staff; a Management or Settings page lists only those who can open it; a stocktake lists the same three; a job with no screen lists admin, management, staff and volunteers. The line under Assigned to says which roles are listed.",
            "To make one job follow another the same day — order medication after the stocktake — choose the first under Do after. On a day both fall, the second shows “Waiting for …” until the first is done or skipped.",
            "Each job in the list shows its rule, who it is with, its next three dates, and how many missed dates are still open. Pause stops it showing anywhere, missed dates included; Resume starts again from today, so the paused weeks don't come back as missed. Changing when it repeats also starts the missed-dates count again from today.",
            "Someone off sick or on leave: under Hand over, choose them, These dates only, the dates, who covers, and a reason. Every one of their dates in that range goes to the cover (anyone else on the job stays on it), and the jobs themselves don't change, so the week after goes back to normal. Handed-over dates are listed under Handed to someone else, where Give back undoes one.",
            "Someone who has left: a job whose only people have left is marked in red at the top of the page. Edit it and tick someone else, or use Hand over with From now on to move all of that person's jobs at once.",
            "Someone who can't be given the job: a job given to a doctor, or to someone whose role can't open its screen — set up before the list was filtered, or its screen changed since — is also marked in red, naming them. Edit it, untick them (they are shown struck through) and tick someone who can; the job can't be saved while they are on it. Hand over refuses the same way: a date or job that would go to someone who can't be given it is listed under Some couldn't be handed over, with the reason, and the rest go ahead.",
            "Recently done lists the latest dates marked done or skipped, with who marked them, when, and their note — the record that the stocktake happened.",
          ],
          callouts: [
            {
              kind: "note",
              text: "A job that has ever been marked done or skipped can't be deleted, so its record stays. Pause it, or give it an end date, instead. A job nobody has marked yet can be deleted.",
            },
            {
              kind: "tip",
              text: "A date that has already been marked done or skipped can't be handed over — it's history. Any date not yet marked can be, including ones ahead.",
            },
          ],
        },
        {
          id: "cashflow",
          title: "The cashflow forecast",
          roles: ["admin", "management"],
          activity: "reports.cashflow",
          path: "Management → Cashflow",
          intro:
            "Food, medication, vaccinations, clinic visits and maintenance are each forecast on their own page in their own unit. This is the one page where they add up, in baht — together with the shelter's fixed monthly costs (rent, electricity, salaries and the like).",
          steps: [
            "Pick a window: Next 30 days or Next 90 days, or enter From and To dates for any period up to a year.",
            "The three cards are the window's total, the average month, and how many items still have no price. Below them, a stacked column — one column per month, one colour per category — and the table it is drawn from.",
            "Tap a category name to take it out of the chart, the table and the totals; tap it again to bring it back.",
            "A category with items but no prices reads “not priced yet” rather than ฿0, and the “Not priced yet” row links straight to the page where that price is entered. A figure with a small orange +3 beside it means three more items that month have no price, so the real cost is higher.",
            "The “Not priced yet” card is a shortcut to the same fix. If every missing price is in one category, it opens that category's page; if they are spread across several, it jumps down to the “Not priced yet” row so you can pick one.",
            "Download CSV saves the table as a spreadsheet for the monthly report — the same months and the same categories that are switched on. Amounts are plain numbers so the spreadsheet can add them up, and each category has a second column counting what is not priced yet, so a 0 there never hides a gap.",
            "Fixed outgoings is the sixth category: the named monthly costs someone has listed. Tap Edit fixed outgoings under the table (or open Management → Cashflow → Fixed outgoings) to add a line — a name such as Rent, an amount in baht per month, and optionally the first and last month it applies. When an amount changes, end the old line and add a new one from the next month; the past months keep the old figure. Switch a line off to keep it on record without counting it. The list holds at most 24 lines, and the page tells you when it is full.",
            "Fixed outgoings are counted by the day, the same way everything else on this page is: a window that covers only half of a month carries half of that month's amount, so a 30-day window carries about one month of rent rather than two. A window that covers a whole calendar month carries exactly one.",
            "The clinic visits line follows how often the shelter really goes. Each week it counts the larger of two things: the typical number of visits (completed visits in the last 90 days, averaged per week) and the visits actually booked that week. Booked visits are part of that count, not extra on top of it — two booked in a week where about 1.5 is typical is two visits, and one booked is one visit plus half a visit's typical cost. A booked visit with its real cost recorded uses that cost; the others cost the average of recorded visit costs, or the typical clinic visit figure from the website settings until at least three invoices are recorded. Weeks are Monday to Sunday and a week that spans a month end is split by day, so the columns still add up. The typical rate applies from today onward only. A note under the table gives the rate, how many visits it came from and the cost per visit used. If there is no completed visit in the last 90 days the note says so: only booked visits are counted, and an empty month means nothing is booked, not that no visits are expected.",
            "Under each category name is where its figure came from: priced (a price someone entered, times what the records imply), estimated (a stand-in — a maintenance job's estimated cost, or the typical clinic visit) or invoiced (every visit that month already has its real cost).",
          ],
          callouts: [
            {
              kind: "warning",
              text: "This is not a budget. It is only what the shelter's own records imply it is committed to spending — no donations or other income, and only those fixed costs someone has listed. Treat it as a floor under the month, not the whole picture.",
            },
            {
              kind: "note",
              text: "Fixed outgoings are not payroll. Enter salaries as one total line for the whole staff, never one line per person; nothing on this page records who is paid what, and the list stops at 24 lines on purpose.",
            },
            {
              kind: "note",
              text: "Clinic visits that are booked but not yet invoiced are costed at one flat “typical clinic visit” figure, set on Management → Website. A visit that already has its real cost recorded uses that instead. If the figure is blank, booked visits are not costed at all and the page says so.",
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
          title: "Translating",
          roles: ["admin", "management"],
          activity: "translations.manage",
          path: "Management → Translations",
          steps: [
            "The app's own buttons and headings are in both languages already. This page is for everything someone typed in one language that a reader of the other language also sees. It holds two kinds. Long text: a resident's hook line, bio, temperament, past story and ideal home, a project's story and photo captions, the website's pages, maintenance and recurring jobs. Short names: diets, medicines, vaccines, procedures, blood tests, how-often labels, stock units, clinics, zones and enclosures, project folders, fixed outgoings and the website's captions.",
            "The page is in sections, one per kind (Website, Residents, Projects, Diets, Medications, Setup lists, Places and so on). The box at the top says how many are missing and how many are out of date in each; tap a section's name to jump to it. Missing shows what nobody has translated yet, Out of date what was translated before the English changed, and All shows everything, including what is done.",
            "For a short name, type the Thai in the box and press Save. Each card says where the name is used, with a link to its own list. You can translate a name here even when its list is not one you can open: translating a name never changes the list itself, only its Thai. To take a Thai name away, empty the box and press Save. When the English has changed, the card shows the English the Thai was written for; correct the Thai, or press Save as it is if it is still right.",
            "Medicine and clinic names are mostly drug, brand or proper names that read the same in Thai, so an empty one says Shown as typed rather than missing, and it is not counted. Give one Thai only if it should read differently, such as Subcutaneous Fluids.",
            "For long text, write the translation in the box and tap Save & approve. Only an approved translation is shown to readers of that language; until then they see the original. Remove translation takes one down. The same box appears under the text on the resident's page, on the project folder and on the maintenance job, so you can translate right after writing without coming here. Nobody has to translate internal notes (weights, clinic visits, prescriptions): those stay as typed.",
            "Every list with a short name also has a Thai name box of its own: Settings → Diets, Medications, Frequencies and the immunization, procedure and blood test types; the units on a diet or medicine; Management → Clinics; and Cashflow → Fixed outgoings. So a new diet or vaccine can be given its Thai as it is added. Whichever box you use, it is the same Thai, and it shows straight away on every screen to anyone reading in Thai.",
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      id: "admin",
      title: "Settings",
      icon: Settings,
      intro:
        "Admin-only setup: accounts, the public website, and the shelter's structure. The top of the Settings page says whether photo storage (Google Drive) is connected. If it is not, every upload fails until Drive is reconnected, and the small print under the warning gives Google's reason.",
      topics: [
        {
          id: "security",
          title: "Accounts and roles",
          roles: ["admin"],
          path: "Security (bottom of the menu)",
          steps: [
            "Create a user with an email and a role. A temporary password is generated and shown once — copy it and pass it on (LINE is fine; it only works until they've signed in). The first time they sign in with it they must choose their own password before anything else opens. Someone who will only use Google sign-in can ignore the temporary password.",
            "Every login can have a name. Type one in the Name box when you create the user, or change it in the Name column of the table and press Save name; an empty name goes back to showing the email. The name is shown in the header beside the role (\"Lutan · Admin\"), and everywhere the person is picked or listed — maintenance assignees, recurring jobs, Recent changes. Give each test account its own name, such as \"Lutan (test doctor)\". A login that uses Google starts with its Google name, and signing in with Google again can put that name back.",
            "Someone signing in with Google for the first time is turned away with \"hasn't been given access yet\" and appears under Access requests at the top of the page. Choose a role and tap Approve, then ask them to try again — or Deny to remove the account. If their Google email matches a login you created, the two are linked automatically.",
            "Change a role from the dropdown in the table. Issue temporary password does what it says — their old password stops working and they choose a new one at their next sign-in. You can't change your own role, reset your own password here or delete yourself; change your own password from Change password at the bottom of the menu.",
            "A Doctor login gets its clinics from a doctor. Under the role, a Doctor login shows a Doctor box: link the account to a doctor already on the lists, or choose Create a doctor from this login and tick the clinics they work at. The account's clinics are then that doctor's clinics — a doctor who works at two clinics sees and records for both, and for no others. To change where they work, edit the doctor on the clinic's Doctors page (Management → Clinics), not here. A Doctor login not linked to a doctor sees no residents and can't record visits, so it's flagged. Unlink, or archiving the account, leaves the doctor and all their visits exactly as they were. Most doctors will never have a login at all; that is normal.",
            "Lanna's roles are Admin, Management, 2IC, Head of Maintenance, Head of Medical, Doctor and Volunteer. Staff was retired in October 2026 because it confused things. An archived login that held it still shows Staff: to bring one back, choose another role in its dropdown first, then Restore.",
            "Public viewer is for testing the website as a visitor while the testing sites are closed to the public: it signs in, sees every public page exactly as a stranger will once the site is open, and never sees the app — any app address sends it to the home page, and the public header offers only Sign out. Give it to testers, never to staff.",
            "When someone leaves, Archive them rather than delete: they can no longer sign in, they disappear from the maintenance Assigned to list, and their name stays on the jobs they did. Archived accounts sit at the bottom of the table with Restore beside them. Delete is for accounts made by mistake — it removes them from past jobs too.",
          ],
          screenshot: {
            src: "/manual/admin-security.png",
            alt: "The security page with the create user form and users table",
          },
        },
        {
          id: "recent-changes",
          title: "Who changed what (Recent changes)",
          roles: ["admin"],
          activity: "audit.view",
          path: "Settings → Recent changes",
          steps: [
            "Every add, edit, archive and delete on residents, contacts, prescriptions, clinic visits, weights, files and vaccinations — and on the home page impact figures, facility plans, roles and permissions — is recorded automatically, with who did it and when. Recent changes lists them newest first, 50 at a time. Tap Older changes for the next page.",
            "Each line says when, who, what (Added, Edited, Archived, Restored or Deleted) and which record, with the resident's name where the record belongs to one. For an edit, Fields lists which fields changed, not what they were changed to — so the page is safe to have open where others can see it. A change shown as made by No login came from outside the app (a migration or the developer's console), not from a person.",
            "Tap Show values on a line to open it. That shows the value before and after for each changed field, which can include phone numbers and medical notes, so open it only when you need it. Only one line is open at a time.",
            "To answer \"something changed and I don't know who\", filter by Kind of record, by Changed by and by date (From and To, both inclusive), then tap Show. Under any line, All changes to this record shows the whole history of that one resident, contact or record, oldest at the bottom.",
            "To undo a mistake, tap Undo this change on its line, then Yes, undo it. An edit puts the fields it changed back to their Before values (open Show values first to see them); a deleted contact, prescription, clinic visit, weight or vaccination is put back as it was. The undo is itself recorded here as a new change, so the page shows the mistake and the correction.",
            "Undo is offered only on the newest change to a record. If it has been changed since, the line says so: undo the newer change first, or edit the record by hand. An undo can also be refused because something now holds its place, such as a new weight for the same day or a clinic visit that has since been deleted; the message says which.",
            "Some things are not undone here. To reverse an archive, use Restore on the record itself. A deleted resident or file can't be put back from this page (a resident would return without its chip number and without what was deleted with it; a file's copy is in the Drive bin), and an added record is removed by archiving it. An impact figure edit can be undone here like any other edit. A facility plan change is undone with Undo the replace on Settings → Facility map, which puts the picture back too. Roles and permissions are not undone here at all: they change only with an update to the app, because putting one back by hand could let someone in or lock them out. A microchip number is never kept in this history.",
          ],
        },
        {
          id: "two-step",
          title: "2-step verification for Security",
          roles: ["admin"],
          path: "Security (bottom of the menu)",
          intro:
            "Security decides who can get into the app, so it asks for a second step: a 6-digit code from an authenticator app on your phone. It works the same whether you signed in with a password or with Google. Nothing else in the app asks for it.",
          steps: [
            "Before you can set it up, another admin has to allow it — this is what stops someone who has only your password from setting up their own app and locking you out. Whoever makes you an admin has already done this, for three days. If it has run out, or you were an admin before, another admin opens Security and presses Allow set-up beside your name (in the 2-step column; it shows Not set up for you). Until you have set it up, My tasks shows a reminder. If you are the only admin, the developer can open it from outside the app.",
            "Setting it up, once: install an authenticator app on your phone (Google Authenticator, Microsoft Authenticator or similar — any of them). Open Security and tap Start. Scan the QR code with the app — or, without a camera, choose \"enter a setup key\" in the app and type the key shown beside it. Type the 6-digit code the app then shows and tap Confirm and continue.",
            "Every time after that: the first time you open Security after signing in, it asks for the code. Open the app, type the 6 digits for Lanna Animal Care and tap Continue. That lasts until you sign out. Codes change every 30 seconds, so type the one showing now; if a correct-looking code keeps failing, check the phone's clock is set automatically.",
            "The 2-step column in the users table shows who has set it up. Reset removes someone's authenticator app — for a lost or replaced phone — and opens set-up again, so they set it up the next time they open Security. You can reset your own to move to a new phone; Security asks you to set it up again within the hour.",
            "Lost your phone? There are no backup codes. Ask another admin to reset your 2-step verification from Security, then set it up on the new phone. If no admin can get in — the only admin lost their phone — the developer can reset it from outside the app.",
          ],
          callouts: [
            {
              kind: "tip",
              text: "Keep at least two admins with 2-step set up, so one can always reset the other.",
            },
          ],
        },
        {
          id: "website",
          title: "The public website",
          roles: ["admin", "management"],
          activity: "website.content",
          path: "Management → Website",
          steps: [
            "The page has five tabs across the top: Home page (hero photo and Pet of the week), Contact & settings (labels, contact details, preferred way to contact us and the typical clinic visit figure), Pages (the wording of each information page), Gallery and Our work. The tab you are on is in the web address, so a reload, the Back button or a shared link comes back to the same place. Text you have typed in one tab is still there when you come back to it, but each section still has its own Save button.",
            "Hero photo (Home page tab): the big photo beside the heading at the top of the home page. With none set, the heading and its buttons take the full width.",
            "Impact figures (Home page tab): the starting numbers behind the Animals rehomed and Sterilisations in local villages figures on the home page. The shelter did this work before the system existed, so enter your best estimate and the date it is true up to and including. The public figure is that number plus every adoption the system has recorded after the date (village sterilisations are not recorded anywhere yet, so that figure is your number alone). The home page shows the figure as a plain number, with no word or note saying part of it is an estimate, so enter a number you are happy to stand behind. Leave both boxes blank to keep a figure off the public site. Saving asks you to confirm, and the change is listed in Settings → Recent changes.",
            "Labels and contact details: the tagline (the paragraph under the home page's heading; left empty, a standard line about the shelter shows instead), hero photo description and visiting hours in English and Thai side by side, plus the email, phone, LINE id, address and map link shown in the footer of every public page and on each resident's profile. On a phone, the LINE id and phone number are also the LINE and Call buttons under Talk to us at the foot of the website's menu; with neither set, that panel isn't shown.",
            "Facebook page, Instagram and X (Twitter): paste the shelter's links (they must start with https:// and be on facebook.com, instagram.com, or x.com / twitter.com — the form says so if not). Each shows under Follow us in the footer of every public page and as an icon in the phone menu. Leave a box empty and its link doesn't appear.",
            "Facebook Messenger and WhatsApp: ways for visitors to message the shelter. Messenger is a link, usually https://m.me/ followed by the Facebook page's username (it can differ from the page's name, so copy it from the page's Send message button). WhatsApp is the phone number with its country code — +66 81 234 5678 is fine, spaces and dashes included; a number starting with 0 is refused because WhatsApp can't open it. Both show under Contact us in the footer and as chat buttons beside LINE and Call in the phone menu. Leave a box empty and it doesn't appear.",
            "Preferred way to contact us: below the contact fields, the ways you have filled in (LINE, Messenger, WhatsApp, Instagram, phone, email) in the order the public site offers them. Use the arrows to reorder; the first is the main button — the bar along the bottom of an animal's page, the Get in touch card on the information pages, and the first entries in the footer and the phone menu. Only channels with a value are listed, and if the first is later cleared the site quietly uses the next, so a visitor never meets a dead button. Until you choose, LINE leads as it always has. WhatsApp and LINE (an official account) open with a short message already typed; Instagram opens the profile, because it has no ready-made message link. Save to apply.",
            "Pages tab: one row for each of Our story, How adoption works, Foster, Volunteer, Donate, International adoption and Become a Shelter Friend, showing when it was last edited and a Thai missing tag if its Thai translation is still empty. Click a row to open its editor; a link ending in #foster (or any page's name) opens that row directly. Separate paragraphs with a blank line; start a line with ## for a sub-heading or - for a bullet. A web address (https://… or www.…) or an email address typed in the text becomes a link on its own. To put your own words on a link, write [words](https://…); [Email us](mailto:name@example.org) and [Call us](tel:+66812345678) work for email and phone, and [Adopt](/adopt) for a page on this site. Only those kinds are turned into links; anything else stays as typed. A link to another site opens in a new tab. The Preview under the box shows how it will look. In the Thai version, translate only the words and leave the address in the brackets exactly as it is; the translation panel will not accept a Thai version whose links differ. Project stories on Our work follow the same rule. The other language's version is written or approved in the translation panel under each field.",
            "International adoption starts with standard text — what adopting one of the animals from another country involves: getting to know the animal, the paperwork and health checks an overseas home usually needs, and a journey arranged with the adopter — which the public page shows, in English and Thai, until something is saved. The box is filled with it and a note says so: change it and save to make it the shelter's own. It deliberately says nothing about fees, timelines, which countries, partners or licences; add those yourself if you want them on the page.",
            "Become a Shelter Friend starts the same way, with standard text for a business thinking of helping: what a Shelter Friend is, the ways to help, what the business gets (a profile and logo on the Shelter Friends page and the home page), that each contact detail is shown only if they agree, and how to get in touch. It makes no promises about fees or terms; add those yourself if the shelter has any.",
            "Photo gallery: the photos under Our story on the home page, in order. The home page shows the first three.",
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
          activity: "facility.enclosures",
          path: "Settings → Zones, Settings → Enclosures",
          steps: [
            "Zones are the physical areas of the shelter (marked Internal) plus off-site ones (External). Add a zone with a name and, optionally, a Thai name.",
            "Give a zone a colour to match what everyone calls it on site (the blue zone, the sand zone). Pick one of the twelve colours under Colour when adding the zone, or edit the zone and pick one; No colour takes it off. The colour shows as a dot beside the zone's name everywhere in the app: the residents list, a resident's page, the Enclosures page, the maintenance board, every zone picker, and the medical and diet lists. The zone filter chips on the Enclosures page and the residents list are filled with it: tinted, and solid with a tick when chosen. Once the dots are there, the colour no longer needs to be part of the zone's name, so a name like \"Main Zone - Blue\" can become \"Main Zone\". The colours are names a screen reader reads out (Blue, Sand, White) and are chosen to stay easy to tell apart on the app's dark screens. The Lifecycle zone takes no colour.",
            "Enclosures belong to a zone and have a capacity and notes. The capacity drives the occupancy colours and the nearly-full warning when moving a resident.",
            "The order the zones are listed in on Settings → Zones is the order they appear everywhere in the app: the Enclosures page and its zone chips, every zone and enclosure picker (moving a resident, intake, back from hospital, maintenance), the residents list's filters, the facility map's lists, and the medical and special-diet lists grouped by place. Use the up and down arrows on a row to move a zone one place; they work with a finger on a phone, where dragging does not.",
            "Settings → Enclosures lists the enclosures under their zone, in the zone's order. The arrows move an enclosure up or down within its own zone only; to put it in another zone, edit it and choose the zone, and it goes to the end of that zone's list.",
            "Sort A-Z (numbers in order) puts a list in alphabetical order with numbers read as numbers, so Enclosure 2 comes before Enclosure 10. It is a starting point to move things from, and asks first because it replaces the order you have set. On Settings → Enclosures each zone has its own.",
            "A new zone goes to the end of the zones, and a new enclosure to the end of its zone, until you move it.",
            "The Thai name is what staff reading the app in Thai see everywhere a zone or enclosure is shown — the residents list, the hub, the enclosure browser, the maintenance board and every picker. Leave it blank and the English name is used. The English name stays the one Google Drive folders and the app's own logic go by, so renaming in Thai never moves anything.",
            "The Lifecycle zone and its pseudo-enclosures (Hospital, Fostered, Adopted, Deceased, Unassigned) are used by the app's status logic and can't be edited; their Thai names are built in. They take no place in the order either: they are always last on these pages and keep their fixed place as the status cards at the top of the Enclosures page.",
          ],
          screenshot: {
            src: "/manual/admin-enclosures.png",
            alt: "The enclosures admin page",
          },
        },
        {
          id: "facility-map-editor",
          title: "Placing enclosures on the facility map",
          roles: ["admin"],
          activity: "facility.enclosures",
          path: "Settings → Facility map",
          steps: [
            "This is the page that fills the Map on Enclosures. Drawing shapes is best on a computer — it wants a mouse and a big screen — so on a phone it shows the \"Best on a larger screen\" note first. Adding or replacing a plan's picture works fine on a phone: tap Show anyway.",
            "A plan is a picture of the shelter's drawing: a photo of it, or a picture file (WebP, PNG or JPEG, up to about 5 MB). To add one, open Add a plan, choose what it is for (the whole shelter, or one zone), tap Take a photo or choose a picture, check the picture that appears, then tap Add this plan. A big phone photo is made smaller before it is sent, so it does not matter how large the camera makes it. An SVG drawing has to be saved as a PNG first. The Map button on Enclosures shows up as soon as there is one plan.",
            "To change a plan's picture — a new drawing, or a sharper photo of the same one — pick the plan, open This plan's picture and tap Replace this plan. Nothing is saved yet: you see the new picture with the outlines of everything already placed on that plan drawn over it, and how many are placed. If the outlines sit where they should (the same drawing, a cleaner copy), choose Keep them. If the layout has changed, choose Clear them and place them again — everything on that plan goes back to Not placed and you draw it again on the new picture. If the new picture is a different shape from the old one, the page says so and picks Clear for you, because the outlines cannot line up. Then tap Save the new picture. The map shows the new picture straight away.",
            "A replace can be undone. Under This plan's picture it says when the plan was last replaced and by whom; Undo the replace puts the previous picture back, and if the shapes were cleared, puts them back too (anything you placed on the new picture since is taken off). The old pictures are always kept.",
            "A plan that says \"in the app's code\" is one of the first plans, loaded before pictures could be uploaded. Open This plan's picture and tap Move into the app's storage once, to be able to replace it here. It is the same picture, so every shape stays where it is.",
            "Pick a plan with the buttons above the editor, then choose an enclosure on the left (on the whole-shelter plan you place the zones instead). A tick means it is placed already.",
            "Draw it on the plan. With Rectangle, click one corner and then the opposite corner — the quick way for a kennel. With Polygon, click each corner in turn, then click the first point, press Enter or tap Done. Backspace or Undo point takes the last point back and Escape starts again. It is saved the moment you finish, and the next enclosure that is not on the plan is picked for you, so a whole zone is one run of drawing.",
            "To fix a shape, pick it (from the list or by clicking it on the plan) and drag one of its corner dots. Draw again starts it over; the bin takes it off the plan, which does not touch the enclosure or its residents.",
            "Zoom in with the + button (or Ctrl and scroll) for small enclosures, and drag the plan to move round it. Clicking only puts a point down; dragging never does.",
            "The Medical room, the Kitchen and Storage are listed under Rooms on every plan, because they are not enclosures. Each is on the site once: pick it and draw it on the plan where it belongs, or draw it on a different plan to move it. The bin takes it off the map. A new enclosure appears in the list by itself, and shows under the plan on the Map as \"Not on this plan yet\" until you draw it. The Lifecycle statuses and off-site zones are never listed.",
            "Remove plan takes a plan off the Map but keeps the shapes drawn on it. To change a plan's picture, use Replace this plan instead: removing and adding again loses the plan's history and its Undo.",
          ],
        },
        {
          id: "immunization-types",
          title: "Immunization types",
          roles: ["admin"],
          activity: "reference.types",
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
          activity: "reference.types",
          path: "Settings → Procedure Types",
          steps: [
            "The list the procedure form offers — X-ray, ultrasound, teeth cleaning, nail clipping. Staff and doctors can add a type inline when logging a procedure, so this is where duplicates and misspellings get tidied up.",
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
          activity: "reference.types",
          path: "Settings → Blood Test Types",
          steps: [
            "The panels the blood test form offers — CBC, Blood Chemistry Panel, Thyroid Panel, Heartworm Test, Tick Borne Disease Panel, Cortisol Test, Urinary Analysis. Add one here when the clinic starts running a new panel; the form defaults to CBC.",
            "Rename a type in place, or Merge… a duplicate into the one to keep — its blood tests move across. A type with logged blood tests can't be deleted; merge it instead.",
          ],
          screenshot: {
            src: "/manual/admin-blood-test-types.png",
            alt: "The blood test types admin page",
          },
        },
        {
          id: "frequencies",
          title: "Frequencies",
          roles: ["admin"],
          activity: "reference.types",
          path: "Settings → Frequencies",
          steps: [
            "The \"how often\" choices the prescription form offers — Twice daily, Weekly, Monthly. Each is a label staff see plus a schedule the medication forecast counts: so many times a day, or one dose every so many days, weeks or months from the prescription's start date. As needed can't be forecast.",
            "Staff and doctors can add a frequency inline when writing a prescription, so this is where duplicates get tidied up. Fix a label or schedule in place, or Merge… a duplicate into the one to keep — its prescriptions move across and take the kept one's schedule. A frequency on any prescription can't be deleted; merge it instead.",
          ],
        },
        {
          id: "system-status",
          title: "System status",
          roles: ["admin"],
          activity: "system.status",
          path: "Settings → System status",
          intro:
            "One page that says whether everything behind the app is working, and how much it is being used — and the alert mail that tells admins when something breaks, so nobody has to keep looking. Apart from the two alert buttons, nothing on it changes anything.",
          steps: [
            "Health: a tile each for the database, photo storage (Google Drive), database migrations, the running release and when it was deployed, release mail, the weekly backup and the Pi. Green is working, amber means look at it (slow, out of date, or out of step), red is broken, and grey is something deliberately not in use here — release mail on the test site, or the Pi before it is switched on. A red or amber tile shows the reason in small print underneath; it names settings but never shows a password or key.",
            "Access requests: how many people have signed in and are waiting for a role, and how long the oldest has waited — amber while anyone waits, green when nobody does. It never says who: names and email addresses are only on Settings → Security, which the card links to and which asks for your authenticator app first. No mail is sent for a request; every admin gets a Review access requests task on My tasks instead.",
            "Each tile says when it was checked. Results are kept for a minute so the page stays quick; tap Check now to ask again straight away.",
            "Alerts: every 15 minutes the same health checks run on their own. When a tile is red on two checks in a row, every admin gets one email saying which and why; when it works again, one more saying so. Nothing in between, however long it lasts. Amber and grey tiles never send mail.",
            "The Status alert mail tile says when the checks last ran and who the last mail reached. It turns red if the checks have stopped running or the last mail reached nobody, and amber if some admins were skipped — the reason is shown beside each address. Run the alert check now does one round straight away; Send a test alert mails every admin a test, so you can see it arrive.",
            "Usage: pick 7, 30 or 90 days to see how many people signed in, how many residents, clinic visits, weights and maintenance jobs were added, how many photos and documents were uploaded, how many requests went to the assistant, and how many people visited the website. The visitor figure is Cloudflare's own daily total — no cookies, nothing that follows a visitor — and stays grey until the Cloudflare analytics token is set up.",
          ],
          callouts: [
            {
              kind: "tip",
              text: "If photo storage is red, uploads are failing for everyone right now. The small print gives Google's reason; an expired token is the usual one.",
            },
            {
              kind: "note",
              text: "Alert mail can only reach addresses verified in Cloudflare (Email Routing → Destination addresses). An admin whose address isn't verified is skipped, and the Status alert mail tile says so. If the database itself is down, no alert can be sent — the alerts remember what they have told you in the database.",
            },
          ],
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
            "Home: the heading with Meet the animals and Give monthly (which opens the Donate page for now) beside the hero photo; four live counts (in care, adopted this year, in foster care, in treatment); the Shelter Friends band, once someone is published; four ways to help (Adopt, Sponsor a resident, Foster, Volunteer); and the Pet of the week beside Our story, its first three gallery photos and a link to Our work.",
            "Adopt (the Meet our residents entry under Adopt in the menu): every resident with Ready for adoption ticked, except those adopted or deceased, with species / size / ready filters. Each profile shows their photos, their hook line under the name, quick facts (age, sex, breed, size, desexed and vaccinated — vaccinated comes from the immunization history — and energy level), who they get along with, their story (past story, bio and temperament), their ideal home, how to meet them, a line asking those who can't adopt to give monthly (it opens the Donate page for now), and similar residents. A bar along the bottom of the screen has a button for the shelter's preferred contact channel (Ask on LINE unless Management → Website says otherwise) and Book a visit, which phones the shelter, or emails it if no phone number is set. Anything not filled in is left out rather than shown empty. Recent adoptions show as Happy endings, and How adoption works sits at the foot of the listing.",
            "Our work: project folders marked Show on website, by category, with their story and photos.",
            "Foster, Volunteer and Donate: the pages written under Management → Website, each with the shelter's email and LINE.",
            "International adoption: what adopting one of the animals from abroad involves, under Adopt in the menu and the footer, with the puppy flying over the globe at the top and the shelter's email and LINE at the foot. The adoption listing ends with a line pointing adopters abroad to it. Written under Management → Website like the pages above. The old Pet relocation address (/relocation) now opens this page.",
            "Shelter Friends: a card for each published friend of the shelter, with only the contact details they agreed to show (see Shelter Friends under Management). It is linked from the menu once there is at least one.",
            "Become a Shelter Friend: what being a Friend means and how a business joins, under Get involved in the menu and the footer at all times. The home page's Become a Shelter Friend button and Your business here? tile open it, and so do lines on the Shelter Friends and Donate pages. Its contact card has Email, LINE and Call: the email arrives with a subject and a short form to fill in (business name, what they do, how they'd like to help), and LINE opens with the same message typed when the shelter's LINE id is an official account (starting with @). Written under Management → Website.",
            "Tags on the kennels: scanning a resident's RFID card shows that resident's public card, and scanning an enclosure's QR code shows the enclosure and who lives there (see The enclosure page). Neither is linked from the menu — they are reached by scanning.",
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
          intro: SUPPORT_CONTACT
            ? `This manual is a first draft and will change as the app does. If a screen doesn't match what's described here, or something is missing, tell ${supportContactLine(SUPPORT_CONTACT)} so it can be corrected.`
            : "This manual is a first draft and will change as the app does. If a screen doesn't match what's described here, or something is missing, tell the person looking after the app so it can be corrected.",
        },
      ],
    },
  ],
};

export default manual;
