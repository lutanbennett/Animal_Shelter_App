# Thai read: progress

**Read this first, each week.** The weekly Thai read starts from here.

- **List generated from:** `node scripts/list-thai-added.mjs 2026-11-12`
- **Run on:** 2026-11-13 (first run), in one sitting, in chat, with a bilingual reader beside Lutan.
- **Result:** all 417 strings read. 2 strings changed, plus one wording rule applied everywhere (see below).
- **Areas done:** all 14 (merchShop, animalReport, adopterUpdate, nav, appHome, merchStaff, bills, foundationPapers, animalStaff, refusals, admin, adoptionUpdates, donations, translations).
- **Position reached:** the end. Nothing is left from this list.

## Next run

**Do not start from a date.** A date is not the boundary (a date-based list re-served about 300 already-read strings).
The 2026-11-13 read covered the list as it stood at commit `4bf320928`. Run:

`node scripts/list-thai-added.mjs 2026-11-12 --skip-read 2026-11-12..4bf320928`

That leaves out everything the 2026-11-13 read covered (unless its English changed since). Measured 2026-11-13: 74 strings,
which are the ones merged after the list was made, so they were never read. After the next read, add its own
`<base>..<commit>` range beside this one and pass both. The 34 `uploads` strings (added 2026-11-03) were read in the finish session (2026-11-13), none changed. Of the 74, 66 were only the บัตรสิทธิ์ rewording and were not shown; the 8 new ones were read. Rulings applied then: supplier = ซัพพลายเออร์, size = ขนาด everywhere. Rule 3 now blocks. See `docs/decisions/2026-11-13-thai-read-finish.md`.

## What was changed

1. `merchStaff.title` now reads ร้านขายสินค้า, to match the public shop's name (it said ร้านสินค้าที่ระลึก).
2. Permission cards are called **บัตรสิทธิ์** everywhere (Lutan's word). 76 lines of `th.ts` changed, replacing
   การ์ด and a bare บัตร where they meant a permission card. Left alone on purpose: recipe cards, friend profile
   cards, pen cards, the review cards in the checker, RFID animal cards, credit cards, ID cards.

## Seen and left as is (said once, no ruling asked for)

- A supplier is ซัพพลายเออร์ on the shop staff pages and ผู้จัดจำหน่าย on the Who does what screen.
- A size is ขนาด on the shop staff pages and ไซซ์ on the Who does what screen.

## Third run (2026-11-26) — IN PROGRESS, NOT FINISHED

- **List:** `node scripts/list-thai-added.mjs 2026-11-12 --skip-read 2026-11-12..4bf320928 --skip-read 4bf320928..4644759ef`
  at commit `a637f36a2`: **894 strings** (757 new, 133 Thai changed, 4 where the English changed and the Thai did not).
- **Why it is so much bigger than the first two runs:** 666 of the 757 new strings are the product-administrator
  console, built 2026-11-25. They are settings wording, so they are read LAST and are a sitting of their own.
- **Read so far, by Lutan with a Thai reader beside him:**
  - Batch 1 — the reels multi-clip uploader (13) and the public shop (3). **All 16 passed, none changed.**
  - Batch 2 — the tax-deduction field and the e-Donation list, `donations.taxId.*` (14). **All passed, none changed.**
  - Batch 3 — the rest of the e-Donation screen (14) and three sign-in messages, `login.closed.*` and `siteNotSetUp` (3). **All 17 passed, none changed.**
  - Batch 4 — the public animal-report photo field and its four errors plus the staff photo label (7), and the money page's income side, `management.cashflow.income.*` (10). **All 17 passed, none changed.**
  - Batch 5 — the Management page's tile descriptions (9), the Product admin menu item (1) and the shop staff photo controls (7). **All 17 passed, none changed.** `nav.productAdmin` (ผู้ดูแลผลิตภัณฑ์) was RAISED as possibly reading like "looks after the merchandise" and KEPT: looked at, not skipped.
  - Batch 6 — the shop's exchange-rate tab, `merchStaff.rates*` (10). **All passed, none changed.**
  - **That is all 91 new worker-facing strings read. None changed.**
  - **Then the console's 664. MEASURE THE SPLIT WITH A SCRIPT, NOT BY EYE:** 315 of them are the **public
    CooperJaidee About page and its feature pages** — what a shelter considering the system reads — and ~349 are
    labels inside the console. **A first count said the About page was 76**, because the grouping command dropped every
    key containing `[0]`, which is most of the sample-card wording. **87 of the 664 are word-for-word repeats** of
    wording elsewhere in the same list (the feature pages re-use the bands' sample cards), and nobody reads those twice.
  - **THE ~349 CONSOLE STRINGS ARE ACCEPTED AS THEY STAND, NOT READ — LUTAN'S DECISION, 2026-11-26, IN HIS WORDS:**
    *"for the console translation, just apply whatever you reccomend as it will prettty much just be english people
    administering it"*. **Say what that does and does not mean, because the distinction is this file's whole purpose:**
    it means **no reader time is spent** on wording only a product administrator sees, and the existing Thai stays as
    each stream wrote it. It does **NOT** mean a person read it, and **no Thai was rewritten** on that instruction —
    rewriting Thai nobody present can read would be worse than leaving it, and the routine forbids it (*"Nobody edits
    Thai they cannot read"*). **If a Thai-reading administrator ever uses the console, this is the block to re-read.**
    The reader's attention goes to the 315 public strings instead, which is where a stranger's opinion of the system forms.
  - Batch 7 — the About page's resident-records block and its sample card (14). **All passed, none changed.**
  - Batch 8 — the medical-care block (13). **All passed, none changed.**
  - Batch 9 — the adoptions-and-fostering block (13). **All passed, none changed** — including two I flagged as
    possibly wrong (below), which the reader judged acceptable.
  - Batch 10 — the volunteers-and-staff block (13). **All passed, none changed.**
  - Batch 11 — the public-website block (13). **All passed, none changed.** The sample cat's name *Tiger* is spelled
    **ทิเกอร์**; **ไทเกอร์** was offered as the commoner transliteration and the reader kept ทิเกอร์.
  - Batch 12 — the money block and the adoptions follow-on panel (14). **All passed, none changed**, including
    **ยกเลิก** for a VOID receipt, raised because an accountant might want a narrower term.
  - Batches 13-18 — the adoptions, medical and money FEATURE pages: their prose, worked examples, search titles and
    section cards (10, 12, 12, 12, 12, 12). **All passed except the two corrections below.**
  - Batches 19-26 — the rest of the resident, volunteer and website feature pages, and the About page's own front
    matter (12, 12, 12, 10, 12, 12, 12, 13). **All passed except the corrections below.**
  - **THE READ IS FINISHED: 324 strings read, 4 changed.** Every new string a worker or a visitor meets is read,
    including all 315 public ones. **229 strings read at the halfway mark** A script hands out the batches now
    (`next-batch.mjs` in the session scratchpad): it keeps the public pages first, skips the 87 repeats, and records
    what has been read. **By batch 13 I was tracking a 894-row list by hand, which is how a string gets shown twice.**
- **Position reached: FINISHED for this list.** 324 strings read across 26 batches in one sitting, 4 changed. The
  console's ~329 remaining labels are **accepted, not read** (the block below says why and what would reopen them).
- **NEXT RUN, and read this before choosing the command.** The list was generated at commit `a637f36a2`, so pass all
  three ranges:
  `node scripts/list-thai-added.mjs 2026-11-12 --skip-read 2026-11-12..4bf320928 --skip-read 4bf320928..4644759ef --skip-read 4644759ef..a637f36a2`
  **That third range skips the console strings too, which were accepted rather than read.** That is the intended
  behaviour of his decision, not an oversight — but it is the one place where "skipped" and "read by a person" part
  company, so it is written here rather than left for someone to infer from a command line.
- **Two strings elsewhere in the app still say `พบแพทย์` (the doctor) where a vet is meant** — a late-recorded visit
  and a bill belonging to a visit. They are not in this week's list and were read in earlier weeks, so they are a
  question for the next read, not a missed correction.
- **WHAT THE 133 "THAI CHANGED" STRINGS ACTUALLY ARE, MEASURED RATHER THAN ASSUMED:** not the บัตรสิทธิ์ rewording
  (that was the first two runs). `git diff 4644759ef..HEAD -- src/lib/i18n/dictionaries/th.ts` shows them to be the
  **multi-shelter sweep**: the hard-coded ลานนาแคร์ / Lanna Care replaced by `{shelter}` and `{shelterShort}` so a
  shelter's own name appears. **The meaning of each string is unchanged**, which is why they are not re-read one by
  one. **What the sweep COULD break is spacing**, and that was checked across the whole file, not just these strings:
  42 Latin/Thai adjacencies measured, every name-holding one spaced (below), 38 left and all of them placeholders
  whose value is a Thai word or a number (`${kind}ตัวไหน?`, `${category}ทั้งหมด`), where a space would be wrong.
  **Re-measure with the scan, not by eye, after any future sweep of this kind.**
- **Do NOT write a `--skip-read` range for this run until it finishes.** A range covering `a637f36a2` would skip the
  unread majority as well as what was read, which is exactly the fault the range convention exists to avoid.

### What was changed

000. **The same sample card read differently on two pages, twice over, and both were fixed to agree.**
   (a) *Morning feed*, *Walk dogs* and *Open* were ให้อาหารเช้า / พาสุนัขเดิน / ยังไม่ทำ on the volunteers feature
   page and ให้อาหารตอนเช้า / พาสุนัขเดินเล่น / ยังไม่เริ่ม on the home page; the home page's wording won, as the one
   more people see. (b) The sample cat was ทิเกอร์ on the home page and ไทเกอร์ on the website page; ทิเกอร์ won,
   **which is his own earlier answer and not a preference of mine** — offered ไทเกอร์ as the commoner spelling in
   batch 11, he kept ทิเกอร์. **Both were found only by reading the two pages in one sitting**, which is an argument
   for keeping the public pages together in one run rather than splitting them across weeks.

00. **The About page said the DOCTOR where it meant the VET, in two places, and the page disagreed with itself.**
   `features.medical.sections[0].name` was **การพบแพทย์** ("seeing the doctor") while its own paragraph underneath, and
   every other string on the page, said **สัตวแพทย์**. Lutan: *"change it to match vet"*. Then `sections[1].text` was
   found to carry the same slip and was changed the same way **after asking him again** — my question had stacked
   "change this?" with "is the rest fine?", so his *"All fine"* answered neither, and guessing would have left the
   heading and the paragraph disagreeing, which is the fault we had just fixed. **The About page is now clean of it.**
   **TWO USES SURVIVE ELSEWHERE AND ARE DELIBERATE, NOT MISSED:** a late-recorded visit and a bill belonging to a
   visit. They were read in earlier weeks, are not in this week's list, and are a question for the next read.

0. **A space goes between a name and Thai — Lutan's ruling, and it now holds with no exception to remember.**
   Raised because swapping the name for a placeholder left `{shelterShort}ได้รับ` running together. Applied to: the
   two shop lines (3 boundaries), a permission card's name twice in `shownAsPart`, a zone map's alt text `planAlt`,
   and the donation receipt's greeting `เรียน คุณ ${name}`. **The greeting was put to the reader separately** rather
   than changed on the general ruling, because after คุณ Thai joins a Thai name with no space while a Latin name
   wants one; she chose the space. **Nothing else was touched:** the other adjacencies are Thai-word placeholders.

1. `shop.disclosure` and `shop.shareFallback`: the Thai had **ลานนาแคร์** written into it while the English had already
   moved to `{shelterShort}`, so any other shelter's public shop page named Lanna Care in Thai. Both now take the name
   from the shelter. Found by the "English changed, Thai did not" section, which is the only thing that reports it.
2. **A space goes between Latin and Thai words** (Lutan's ruling, asked because the substitution left
   `{shelterShort}ได้รับ` running together as the Thai name had). Applied to the 3 boundaries on those two lines.

### Rulings to apply next time, and the one that is NOT settled

- **Latin beside Thai takes a space.** Applied only where the value is certainly a name that may be in Latin letters —
  the shelter's short name. **31 other adjacencies in `th.ts` were measured and deliberately left:** most are
  placeholders whose value is a THAI word (`${kind}ตัวไหน?`, `${category}ทั้งหมด`, `${zone}บนแผนผัง`), where a space
  would be wrong. **The open ones are the placeholders holding a person's, animal's or card's name** (`${name}`,
  `${residentName}`, `${carer}`, `${card}`), which are the same situation as the shelter's name and were not ruled on.
  Put that to the reader as one question rather than string by string.

### Seen and left as is (ruled, do not re-raise)

- **About page, the adoptions block — two raised with the reader and KEPT, 2026-11-26.** Recorded so nobody spends
  the same reading twice. (1) `bands[2].mock.rows[0].0`: the English row label is *Placement* and the Thai is
  **ประเภท** ("type"), so the row reads "type: foster". (2) `bands[2].mock.sub`: *Mali · placement* is
  **มะลิ · การไปอยู่บ้านใหม่** ("going to live in a new home"), which is adoption-flavoured on a card whose own title
  is *Foster or adopt*. Both read well enough to a Thai reader; **neither is a fault, and neither is to be re-raised.**
- `nav.productAdmin` (ผู้ดูแลผลิตภัณฑ์) and the About page's `bands[0].mock.rows[1].0` (ที่อยู่ for where an animal is
  INSIDE the shelter, not a postal address) were raised the same way and kept.

- `management.cashflow.income.inKind`: the English puts the amount first (*"+450 in kind"*), the Thai puts the word
  first (*"+สิ่งของ 450"*). Raised with the reader because only a reader can judge it. **Lutan, 2026-11-26: "leave the
  ordering for the in kind amount."** Each reads naturally in its own language; it is not a mismatch to fix.

- `uploads.errors.cannotReadResidentsList`: the English moved to *"You do not hold a card that lets you read the
  residents list"* and the Thai still says, roughly, *"your permission cannot read the animal list"* — it predates the
  บัตรสิทธิ์ ruling. **Lutan, 2026-11-26: "I think it's fine to keep the difference."** So the Thai stays. It will keep
  appearing in the disagreement list while the English differs; that is the tool working, not a job outstanding.
- The two English strings still naming Lanna Care (`namesFull`, `namesShort`) are the **example text** in the console's
  shelter-name fields, not a name shown to a visitor. Left on purpose.

## Second run (2026-11-14)

- **List:** `node scripts/list-thai-added.mjs 2026-11-12 --skip-read 2026-11-12..4bf320928` at commit `4644759ef`: 126 strings (25 new, 101 Thai changed).
- **Read:** the 25 new strings (admin 9, management 10, merchStaff 6), by a bilingual reader beside Lutan. **All passed, none changed.**
- **Not shown:** the 101 "Thai changed" strings, which are the บัตรสิทธิ์ rewording already ruled on 2026-11-13.
- **Seen:** the "by 7" in `ratesSetOn` is the list tool's placeholder for `${who}`, not real text.
- **Next run:** pass both ranges: `--skip-read 2026-11-12..4bf320928 --skip-read 4bf320928..4644759ef`
