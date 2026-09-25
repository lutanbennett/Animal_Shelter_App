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
  notes: string[];
};

/** Written by feature PRs; becomes the next release when one is cut. */
export const unreleased: string[] = [
  "Four topics in the user manual showed a broken picture — adding a diet, Management → Diets, Management → Cashflow and Settings → Blood test types. Each now shows its screenshot.",
  "Uploading a photo or logo larger than 1 MB — a Shelter Friend logo, or the Website page's hero and gallery photos — failed with a “Minified React error” code. Files up to 15 MB now upload, a larger file is refused straight away with a message saying so, and if the server ever can't process an upload you are told in words, with the suggestion to try a smaller image.",
  "The testing sites (lannacare.org and test.lannacare.org) are closed to the public until go-live. Visitors see a Staff testing site page with a Sign in button; once you sign in, everything — public pages included — works as before. Scanning a resident card or enclosure QR code asks you to sign in first, then opens what you scanned.",
  "Management → Medications and → Diets now keep track of what's in the cupboard. Tap Count after a stocktake to record how much is left; the table shows how long ago it was counted and roughly how many days it will last at the next 30 days' rate. Give an item its supplier's lead time and it is flagged Reorder when stock gets that low.",
  "The Residents list has the same On-site / Off-site choice and zone chips as the Enclosures page, on phones too. Pick one or more zones, or none to see the whole place. Residents waiting for an enclosure count as on site; residents in hospital or with a foster carer count as off site. The Location column now shows On-site or Off-site to match.",
];

/** Newest first. */
export const releases: Release[] = [
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
