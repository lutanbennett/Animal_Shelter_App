// Writes docs/card-walkthrough.md from the card catalogue, so a card added later appears in the script without anyone
// remembering to type it (docs/decisions/2026-10-22-card-walkthrough-generated.md).
//
//   node scripts/gen-card-walkthrough.mjs            write docs/card-walkthrough.md
//   (imported by check-card-walkthrough.mjs, which compares the file with buildWalkthrough())
//
// Sources: CARDS and cardOpens (src/lib/permissions/cards.ts), the activity labels (English dictionary) and the two tiles
// that are not cards of their own (My tasks, Residents: src/lib/home/tiles.ts). Nothing here is run against the app.
//
// Steps come from each card's OWN bundle: an activity held at edit (or a yes/no activity) is something to do, and a read
// is something to see. READBACK names where a write should show for the activities where that is certain; any other
// write gets a "TODO:" step with a question, never a plausible invention.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadCards } from "./lib/load-cards.mjs";

// Where a write shows up. Only activities whose read-back is certain from the app's own wording are listed;
// the check fails if a key here is not in the catalogue.
export const READBACK = {
  "stock.count": "type a count, tap Save, then Review and save and Save 1 count; the same /stocktake page then reads \"Last count <n> ... counted today\" on that item. A stocktake has no free-text name, so the walk- label cannot be used. The stock figure and history on /management/medications is where it should also show, but a card-only login is refused there (answered 2026-10-23)",
  "stock.purchasing": "nothing is written: the page is a shopping list for 1 week, 2 weeks or 1 month, with Print and Download CSV, and the app does not place the order. Confirm it lists what is short and names the items never counted. It can take about a minute to appear on first load (answered 2026-10-23)",
  "stock.delivery": "it is the first row of Recent deliveries on /deliveries after the save (six steps: what arrived, item, amount, day, details, check). It does not change the stock count; usage on /management/stock-usage and the forecast on /management/purchasing read it, and a card-only login is refused there (answered 2026-10-23)",
  "resident.record": "the hub (/residents/<id>) shows the new name, Thai name and bio at once; the housing and history are on /residents/<id>/housing (answered 2026-10-23)",
  "resident.microchip": "the number shows in the hub's header with a Correct button; a corrected number shows there straight away. Intake asks for it too, on step 3 (answered 2026-10-23)",
  "resident.adoption_news": "only an adopted resident has the control: /residents/<id>/adoption-updates lists the new update first, with its date and channel (LINE, Facebook, Email, Visit); text marked staff only is never published (answered 2026-10-23)",
  "photos.resident_manage": "tap the photo on /residents/<id>/photos: Move to folder changes the folder its tile reads (Medical to Foster read \"Foster · <date>\"), Remove photo and Current profile photo sit beside it (answered 2026-10-23)",
  "medical.procedures": "the resident's Procedures page (/residents/<id>/procedures) lists it with the type, where it was done, the date and the note; files are attached from the same row (answered 2026-10-23)",
  "medical.blood_tests": "the resident's Blood Tests page (/residents/<id>/blood-tests) lists it with the type, date and results note, and \"No files attached yet\" until a scan is added (answered 2026-10-23)",
  "medical.prescriptions": "the resident's Prescriptions page (/residents/<id>/prescriptions) lists it under Current with the dose, how often and the start date; it also appears on /operations/medication-list (answered 2026-10-23)",
  "medical.immunizations": "the form shows a table straight after saving (resident, immunization, administered, next due). The Add all in zone and enclosure pickers list every zone and enclosure for a card-only login (driven 2026-10-28; the 2026-10-23 answer said they were empty)",
  "medical.diet": "the resident's Diet page (/residents/<id>/diet) lists it under Current with meals a day and the amounts at the resident's size (answered 2026-10-23)",
  "medical.archive": "Remove, with an optional reason, on any medical row: the row leaves the list and the chart and the page reads \"1 removed hidden\"; Show removed lists it with Restore, which brings it back (done on a weight entry; answered 2026-10-23)",
  "roles.view": "nothing is written: the page lists each role with the cards it holds, read only. Confirm it opens, shows the roles, and offers no Add, Remove or reorder control (that stays with Admin). Use the page itself, not a record named walk-who_does_what (2026-10-25)",
  "visit.book": "the visit shows on that resident's page and in the shelter's list of visits (/upcoming-visits)",
  "maintenance.progress": "the job sits in its new column on /maintenance after a reload",
  "maintenance.jobs": "the job is on /maintenance (and on /my once assigned); status is changed on /maintenance/<id>, and assignee, zone, due date and the Estimated / Actual cost on /maintenance/<id>/edit (the cost reads back on the job page). No delete control is offered to this card",
  "maintenance.photos": "the job page /maintenance/<id> counts the photo under Before (the problem as found) or After (the finished work)",
  "assistant.ask": "the answer shows in the assistant panel opened by the Assistant button in the header, and writes no row to any page",
  "recurring.manage": "the job shows in the list on /management/recurring-jobs with \"Saved.\", and each date appears on every assignee's /my on its day. Hand over is the panel at the foot of that page",
  "recurring.do_any": "this page has no Done or Skip for someone else's date: those exist on /my for the assignee only, and the way to cover another person's date is Hand over (answered 2026-10-23)",
  "recurring.do_own": "the task shows as done (or skipped) on /my after a reload",
  "resident.register": "the new resident shows in /residents",
  "placement.move": "the resident's page shows the new enclosure",
  "medical.weight": "the list shows \"Saved: <name>, <kg>\", and opening that resident on /medical/weight reads \"Last time: <kg>, <date>\" and \"Today already has <kg>\" (one weight per resident per day; a second save replaces it)",
  "photos.resident_add": "the page counts the photo as added; it is filed in the resident's Medical folder, never on the website",
  "photos.resident_publish": "a photo is public once it is filed under Foster or Adoption rather than Medical (the Foster folder says it can appear on this resident's Adopt page): pick that folder when adding on /photos/add, or use Move to folder on /residents/<id>/photos. The controls on that page are Mark as posted (social), Remove, Current profile photo and Move to folder; there is no separate publish button",
};

// Added to the read-back of an activity when the card ALSO holds the activity that lets it look again (answered by hand:
// a login holding photos.resident_manage sees the photo on /residents/<id>/photos). Without it the card cannot see its own write.
const LOOK_AGAIN = {
  "photos.resident_add": {
    needs: "photos.resident_manage",
    yes: "; it then shows on /residents/<id>/photos as a tile with its folder and date (a Profile tag if it is the profile photo)",
    no: "; this card cannot look at it again, so also confirm it on the resident's record with a login that holds a record card",
  },
};

// The two tiles on the home screen that are not cards of their own (tiles.ts). Each opens the page of the card named.
export const NON_CARD_TILES = [
  { label: "My tasks", href: "/my", coveredBy: "my_tasks" },
  { label: "Residents", href: "/residents", coveredBy: "view_residents" },
];

function findActivityLabels(node) {
  if (node && typeof node === "object") {
    if (typeof node["resident.record"] === "string") return node;
    for (const v of Object.values(node)) {
      const found = findActivityLabels(v);
      if (found) return found;
    }
  }
  return null;
}

// Pages the card's `opens` does not name, one owner card each, so a page nothing else opens still has a numbered step
// (2026-10-28, claude/card-walkthrough-six-pages: 22 of 46 registered pages had none). Each says what the page's controls
// ask. Wording is by card and activity, never by role.
export const PAGE_STEPS = {
  view_medical: [
    "Open `/appointments`: it loads (read only; the list is the visits booked with this login's clinics, so it may read as unlinked). Confirm NO Book appointment, Log procedure, Log blood test, Add prescription, Log weight or Edit link is offered: each asks its own edit-level activity (visit.book, medical.procedures, medical.blood_tests, medical.prescriptions, medical.weight, medical.visits), none of which this card holds.",
    "Open `/operations/feeding-list`: it loads (asks medical.diet at read). It is navigation only (round and view switches); confirm no add, edit or save control is offered.",
  ],
  medical_records: [
    "Open `/appointments`: it loads. Confirm the Log procedure, Log blood test, Edit links are offered on every row, and Add prescription and Log weight on a visit whose date has started (a login holding visit.book also sees Book appointment, which this card does not).",
  ],
  view_contacts: [
    "Open `/clinics`: it loads (clinics.list at read). Confirm the clinic tiles are visible and the Manage link to `/management/clinics` is NOT offered (that asks clinics.list at edit).",
  ],
  contacts: [
    "Open `/clinics`: it loads, and the Manage link is offered.",
    "Open `/management/clinics` from that link: it loads. Add, Edit and Delete are offered; every server action on the page asks clinics.list at edit. Doctors on a clinic ask clinics.doctors, a separate yes/no.",
  ],
  website: [
    "Open `/management/desexing-drives`: it loads (website.content at edit). Start a drive, open one, and the signup controls are offered; every action asks website.content at edit.",
  ],
  donations_receipts: [
    "Open `/projects`: it loads (projects.folders at read). Confirm the twelve category folders show, the \"read only\" note shows, and NO New folder, Rename, Move or Delete control is offered. No card in the catalogue gives projects.folders at edit today, so the write side of this page has no card to walk.",
  ],
};

/** Every activity the card gives: its own bundle and, recursively, that of each card it includes. */
function heldActivities(card, CARDS) {
  const acts = new Set(card.bundle.map((b) => b.activity));
  for (const k of card.includes ?? []) for (const a of heldActivities(CARDS[k], CARDS)) acts.add(a);
  return acts;
}

/** Steps for one card: the ones its own bundle gives, then the refusal. Numbered by the caller. */
export function stepsFor(card, cat) {
  const { CARDS, CARD_KEYS, ACTIVITIES, labels } = cat;
  const kind = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind]));
  const steps = [];
  const own = `walk-${card.key}`;
  const held = heldActivities(card, CARDS);
  for (const { activity, level } of card.bundle) {
    const label = labels[activity] ?? activity;
    const writes = kind[activity] === "yesno" || level === "edit";
    if (writes) {
      const look = LOOK_AGAIN[activity];
      const back = READBACK[activity] && READBACK[activity] + (look ? (held.has(look.needs) ? look.yes : look.no) : "");
      steps.push(
        back
          ? `**Do:** ${label}. Use a disposable record named \`${own}\`. **Read-back:** ${back}.`
          : `**TODO:** ${label}. Do it on a disposable record named \`${own}\`. Question: where should this write show afterwards (which page, which row)?`,
      );
    } else {
      steps.push(`**See:** ${label} (read only). Confirm it is visible, and that no add, edit or save control is offered for it.`);
    }
  }
  steps.push(...(PAGE_STEPS[card.key] ?? []));
  // The point of a one-card login: a page this card does not give must be refused, not quietly opened.
  // A page is only a fair refusal if nothing this login holds (its own bundle, or that of a card it includes) is also in
  // the other card's bundle: a card holding medical.prescriptions legitimately opens the medication list, whose card
  // (Administer Medication) bundles the same activity. A card with no bundle (the two landing pages) opens for the floor.
  const given = new Set([card.key, ...(card.includes ?? [])]);
  const mine = card.opens;
  // /residents and /my open for every role that opens the app (the floor, 0134), so they prove nothing as a refusal.
  const open = new Set(["/residents", "/my"]);
  const other = CARD_KEYS.map((k) => CARDS[k]).find(
    (c) =>
      !given.has(c.key) &&
      !open.has(c.opens) &&
      c.opens !== mine &&
      c.bundle.length > 0 &&
      !c.bundle.some((b) => held.has(b.activity)),
  );
  if (other) {
    steps.push(`**Refused:** open \`${other.opens}\` (the page of **${other.label(cat.en)}**, which this login does not hold). Expect a refusal or redirect, not the page.`);
  }
  return steps;
}

export async function buildWalkthrough(root = process.cwd()) {
  const cat = await loadCards(root);
  const { CARDS, CARD_KEYS, cardOpens, en } = cat;
  cat.labels = findActivityLabels(en) ?? {};
  const out = [];
  out.push("# Card walkthrough", "");
  out.push("<!-- GENERATED by scripts/gen-card-walkthrough.mjs from src/lib/permissions/cards.ts. Do not edit by hand: run the script. -->", "");
  out.push(
    "Each card is walked as a **disposable login holding that card only**, never as Admin, so a card that quietly leans on another card's permission fails here and not in front of a real person.",
    "Work at **375 px**. Name anything you create `walk-<card key>` so it can be found and cleaned up. Record each card as pass or fail with a one-line note.",
    "",
    "Make the login (dev project only; it never prints the password; `--remove` deletes it):",
    "",
    "```",
    "node scripts/dev-signin.mjs --cards <card key> --port <your port>",
    "```",
    "",
    `${CARD_KEYS.length} cards. A step marked **TODO** is a named gap, not a step: the catalogue does not say what the job is, so the person running that group answers the question first.`,
    "",
  );
  for (const key of CARD_KEYS) {
    const card = CARDS[key];
    const opens = card.opens;
        out.push(`## ${card.label(en)} (\`${key}\`)`, "");
    out.push("- Opens: `" + opens + "`");
    if (card.includes.length) out.push(`- Also gives: ${card.includes.map((k) => `${CARDS[k].label(en)} (\`${k}\`)`).join(", ")} (walked under its own heading)`);
    if (card.requiresCardSomewhere?.length) out.push(`- Needs some other role to hold: ${card.requiresCardSomewhere.map((k) => `\`${k}\``).join(", ")} before this card can be given`);
    out.push("", `0. Sign in with \`--cards ${key}\`. The home screen shows the **${card.label(en)}** tile (or the tile of a card that includes it).`);
    out.push("1. Open `" + opens + "`: it loads.");
    stepsFor(card, cat).forEach((s, i) => out.push(`${i + 2}. ${s}`));
    out.push("", "Result: pending", "");
  }
  out.push("## Tiles that are not cards", "");
  for (const t of NON_CARD_TILES) out.push(`- **${t.label}** (\`${t.href}\`): walked under the **${CARDS[t.coveredBy].label(en)}** card (\`${t.coveredBy}\`).`);
  out.push("");
  return out.join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(join(process.cwd(), "docs/card-walkthrough.md"), await buildWalkthrough());
  console.log("wrote docs/card-walkthrough.md");
}
