# 2026-09-26 — Public site redesign, part 3: the resident page

Part 3 of 4 (`src/app/adopt/[id]/`), built on part 1's `--site-*` tokens,
header and footer, against `docs/design/resident-profile-mobile.png` — the
canvas version part 1 copied into the repo (`1790386010-1e99`); the live
canvas was not re-read for this part. `PublicHeader.tsx`, `PublicFooter.tsx` and the
homepage are untouched.

- **Every block is optional and drops out when it has nothing to say.**
  `hook_line` and `ideal_home` (0094) start empty on every resident, and
  most have no story either, so the page is built for the blank case first:
  no hook means no line under the name (the bio is **not** borrowed as a
  hook, as the homepage's Pet of the week does, because the same sentence
  would then appear again in the story); no story, no ideal home, no quick
  facts or no "Gets along with" means no heading for it. What always shows:
  photo (or "No photo yet"), name, How to meet, the sponsor line and the
  bar. A resident with nothing filled in reads as a short, complete page.
- **Size needed nothing.** `residents.size` (0051) is required on every
  save and already on the view; it is the quick facts' Size. No `0095`.
- **The story is past story, then bio, then temperament**, one paragraph
  each, under "{name}'s story". The mockup's two placeholders are "how he
  came to us" then "what he's like now", which is past story then bio;
  temperament is the rest of "what he's like now". The separate About /
  Temperament / Their story headings are gone.
- **Quick facts follow the mockup's six** (age, sex, breed, size, health,
  energy). Species shows in Breed's place only when there is no breed.
  Colour is dropped, as in the mockup. Health lists only what is true
  (Desexed · Vaccinated); "not desexed" is a vet conversation, not a fact to
  lead with, as before.
- **"Gets along with" shows "Not yet known" when staff chose it.** It is an
  answer a visitor would otherwise ask for; an unset field shows nothing.
  The old block's one-line caveat ("our best assessment…") stays under
  the chips.
- **The sponsor line goes to `/donate`**, like part 1's "Sponsor a
  resident" and part 2's Sponsor card, until the `/donate` item exists. The
  mockup's "Sponsor Markey for [PRICE] baht a month →" becomes "Give
  monthly towards their food and care →" under "Can't adopt? You can still
  help {name}", because it lands on the general donate page, not a
  sponsorship of this resident, and there is no price to quote.
- **The bar is `position: sticky`, not `fixed`, so it never covers the
  sponsor line.** It is the last child of the wrapper that holds the
  profile: it rides the bottom of the screen while the profile scrolls and
  comes to rest after it, above the footer. The mockup's bar covers the
  sponsor link at the end of the page; with sticky the room at the bottom
  is the bar's own place in the flow, not a guessed padding. It keeps
  above the phone's home indicator (`safe-area-inset-bottom`).
- **"Ask on LINE" is `site_content.contact_line` (0059) through
  `lineLink()`**, the same link the footer uses. With no LINE set, the
  button is not shown and Book a visit takes the full width. Messenger and
  WhatsApp are left to `contact-channels`.
- **"Book a visit" phones the shelter** (`tel:`), as the mockup's "Message
  us on LINE or call to book a visit" has it; with no phone on file it is
  an email with the resident's name in the subject. The How to meet box
  keeps visiting hours and the address from `site_content`, but not the
  mockup's "open by appointment 7 days a week", which would be hard-coded
  and could contradict the hours staff set. The honest "we can't hold
  them" stays, shortened.
- **The form enforces the lengths 0094 left to it:** hook line 120
  characters (the mockup's example is 58; this allows one long sentence
  but not a paragraph, and line breaks are folded to spaces), ideal home
  600 (about five sentences). `maxLength` stops typing; the action
  re-checks for pasted text. Both sit in the Adoption section of Edit
  resident, which a deceased resident's form does not show, so the
  after-death edit never writes them. Intake does not ask for them — they
  are written later, like the story.
- **Translations follow 0094**: both read through `localizedField` from the
  view's `translations`, like the bio. The hub lists them with the other
  public prose, with the translation box under each, and the Translations
  page labels them.
- **Headings in the body face use `font-site!`.** globals.css gives every
  public h1–h3 Fraunces through `:root:has([data-public-site])`, which no
  utility class outranks. The mockup sets "Gets along with", "How to meet"
  and the sponsor heading in Source Sans.
- **Desktop is two columns** — photo left, name, facts and chips right —
  then the story in a reading column. The mockup is phone-only. On a phone
  the photo is edge to edge, as designed.
