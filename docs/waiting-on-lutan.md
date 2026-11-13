# Waiting on you: everything the backlog needs from Lutan, in order

**Snapshot, read from `docs/backlog.md` on 2026-11-13. It is not a tracker and it will go stale.** Each entry is
what the item's own text said on that date. Before you act on one, the item in the backlog is the truth.
Entries say *not established* where this snapshot could not read the answer.

Plain rules for reading it: item ids are the `#xxxxx` codes in the backlog. Where a step is a command or a deploy,
**no command is written here on purpose.** When you reach the step, ask for the exact command in chat, from the
session named, and it will be handed over by itself.

## A. What a stream could do to shrink your part (the ones worth a stream next plan)

| item | what a stream could do | how much it shrinks |
|---|---|---|
| `#99zuk`, `#cjxq0`, `#hj1c5`, `#5j6kj` | Write the in-person questions out in the order the Director will be asked them, one question per line, with what each answer unlocks. | Two conversations become one. **Time-limited: you are in Chiang Mai from mid-November.** |
| `#s0jgi` | Write the phone-day script: a one-page list of tasks for the shelter worker and the volunteer, with a place to note each step that did not match. | You hand over a sheet instead of designing the day. |
| `#d6wxo` | Already narrowed: see entry B1. It is one question about the gate alone. | Nothing more to shrink. |
| `#aaqtl` | Dry-run the three deploy steps and hand you the order, so you only press what is written. | Three steps become a short, checked sequence. |
| `#u2bo6` | Prepare the comparison sheet: the twenty bios and twenty vet notes, each translated by both models, side by side. | The managers only read and mark; they do not set anything up. |
| `#hzmxi` / `#c7zjk` / `#y1dqu` | Export the Thai strings a Thai speaker must read as one sheet, with the 25 changed ones marked. (`scripts/list-thai-added.mjs` already builds the list.) | The reader opens one file. |
| `#7bd5u` | Nothing a stream can do alone: it needs a quiet machine. A stream can have the measurements ready to run in one go. | Your part is "leave the machine alone for one session". |

Items nothing can shrink: the two standing steps (section F), the purchase (`#gvnrr`), and the Director's own edits.

## B. In the app, today

These need no deploy and nothing installed. Fastest wins first.

**B1. `#t1zyc`: give the accountant access to expenses (about 5 minutes).**
Unblocks: the outside accountant reading the shelter's expenses.
Your part: open Settings, then Who does what. Find the accountant's group, tick the card **View expenses**, press save. On the same screen, check that a login is actually attached to that group. Reversible on the same screen. The card has been live since 2026-11-05 and **nothing holds it yet**.
Answered 2026-11-13: expenses only. Do not add the cash-flow card.
First: nothing. Whether a login is attached is *not established*; the screen shows it.
Stream shrink: a read-only card for the foundation's papers is a separate small stream, and does not wait on this tick.

**B2. `#kxksr`: enter the shelter's PromptPay details (about 10 minutes).**
Unblocks: the donate page showing a real PromptPay number and QR.
Your part: Settings, then Website, then Ways to give. Enter the shelter's PromptPay id and upload the QR image. The code shipped 2026-10-13; what is left is not code.
First: the QR image and id in hand. Whether they are already entered on production is *not established* (would need the production screen read).

**B3. `#8dfud`: the shelter's LINE id.**
Unblocks: a LINE QR code in the website footer and phone menu (a small stream, afterwards).
Your part: say what the shelter's LINE id is, or confirm it has none. The item says the Director enters it; the Thai-address half already shipped, do not list it as outstanding. Who enters it is *not established*; Settings, then Website, is where it goes.

## C. A decision only you can make

**C1. `#d6wxo`: the foster-carer and adopter sign-in page, one question about the gate.**
You already settled the shape on 2026-11-12: a public website page with its own sign-in, posting into the app. What is open is only this:
**Should a carer's or adopter's access be (1) a card like staff, (2) a rule inside the database that limits them to their own animals, or (3) one narrow, recorded exception for the whole outside-person class?**
It takes one sentence to answer, and a stream can brief the build the same day.

**C2. `#y1dqu`: how often the Thai read happens.**
`docs/thai-read-routine.md` recommends weekly. Your part: say yes to weekly, or name another cadence. The first read (1,125 strings, 25 whose Thai no longer matches) is separate and needs a Thai speaker.

## D. A command or a deploy

None of these has a command written here. Ask in chat when you reach the step.

**D1. `#aaqtl`: three deploy steps that make Thai label proposals work on production.** Retitled 2026-11-12: the code is done and the 91 drafts are in. The three steps are in the item, in order. The last one needs a machine login whose password you hold; it is not on this computer's settings file, which is consistent with the steps not being done (not itself the gap). After the steps, the release note for admins is written in the PR that closes it. Ask the planner session for the three steps in order when you start. Time: not established.

**D2. `#z04wr`: runbook steps 5 to 9 of `docs/self-hosted-model-runbook.md`.** Waits behind the model machine existing; whether it exists is *not established*. Claude's half is done.

**D3. `#civwx`: the backups' own Google identity.** Waits behind production moving to the shelter's own Google account. It is done guided, with you, one step at a time. `#rqv5c` is that move (section E).

## E. A person or a conversation

**In-person, time-limited (you are with the Director in Chiang Mai for two weeks from mid-November):**

- **`#5j6kj`: who makes adoptable residents public, a few a week.** Question: who does it? She names a person and the work starts that day; nothing is built either way. Target 30 public in a month.
- **`#99zuk`: donation receipts and the Thai tax-deduction path.** One question, with the accountant: **is the foundation announced as a public charitable organisation?** No closes most of the item. Yes brings two follow-ups: does the accountant record gifts herself or should the app prepare them, and how long does she need a donor's ID number kept.
- **`#cjxq0`: the online merchandise shop.** Her questionnaire: prices, margins, which suppliers she has talked to, postage per country, returns, who answers "where is my order", and whether the shelter holds stock.
- **`#hj1c5`: the drop-shipment B2B idea.** One question: did she mean selling *to* businesses or businesses selling *through* our site? A "neither, the shop covers it" answer closes the item.

The first four use the list written on your Desktop on 2026-11-10; it is not in the repo. Record her answers on each item when you are back.

**Other people and conversations:**

- **`#s0jgi` then `#1o5tk`: the manual.** One shelter worker and one volunteer follow the manual on a phone for a day and note every step that did not match. The Thai manual (which does not exist yet) is translated once after this. Your part: arrange the day.
- **`#u2bo6`: the two bilingual managers compare two models** on twenty real bios and twenty real vet notes. A machine-tier build follows (a stream's).
- **`#hzmxi` / `#c7zjk`: a Thai speaker reads the new strings.** Then a day of changes with no false alarm, then a stream flips the check to blocking. The reading is the only part that is not a stream's.
- **`#mzu7v`: the guided Home Assistant session.** You chose a booked walkthrough on 2026-11-10. The booking is the step. First thing in it: remove the broken block from your Home Assistant configuration file.
- **`#gvnrr`: buy the battery for the Pi.** The unit is chosen and specs are in hand. You are waiting for a Lazada sale; nothing is left to decide.
- **`#rqv5c`: the shelter's Drive tree on production's own account.** Your own answer of 2026-11-09 was that you are working toward it over a week or two. It is recorded as yours and in progress, not a nudge. Do not chase before the end of November.

## F. Go-live and no date yet

- **`#uao7r`: the Director adds the website to the shelter's Google Business Profile.** Her step, a few minutes at business.google.com. Opening hours and the category are small extras. Separate and doable now: paste the Maps link into Settings, then Website, then Map link. Whether she has done it is *not established*.
- **`#z7d6h`: Google Search Console go-live-day steps** on `lannacareforanimals.org`: unlock, verify the domain, submit the sitemap, re-request indexing. Also check the four dynamic page types on real rows. Status after the 2026-11-06 cutover is *not established*.
- **`#7bd5u`: four optional speed improvements.** All wait on one session on a quiet machine with nothing else building. Yours to schedule. Nothing is broken.
- **`#00e3u`: the fuller financial report and anything tax-shaped.** Waits on the accountant and the Director (ask both together with `#99zuk`).
- **`#9b0vq`: cash-flow forecast against actuals.** Waits on months of real data. Nothing to do now.

## G. Always yours

- **Major versus minor on every release.** A major release mails the admin list (currently one person), cannot be undone, and so the call is yours each time. Claude tells you plainly when it comes up.
- **The production Worker deploy.** Yours by your instruction of 2026-10-02, every release.

## Removed at your word

- `#eh2dt` (Thai text for the public pages): you said on 2026-11-13 that the Thai pages are all done. It is taken off this list; the backlog item is for the planner to close.

- `#dxjz2` (production Worker deploy): you said you had already released this morning, and `docs/releases/2026-11-12-0-45-0.md` records the production Worker deploy and the offline page as shipped in 0.45.0. For the planner to close. What stays open on it is not yours: the speed ceiling of the website path is unmeasured.

## Not established in this snapshot

- Whether `#kxksr`, `#uao7r` and `#z7d6h` have been done since the go-live (would need the production screens read).
- Whether the model machine for `#z04wr` exists.
- Time estimates for D2 and D3.
- Whether the `#t1zyc` login is attached (the Who does what screen shows it).
