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
  - **Then the console's 666, starting with the 76 that are the PUBLIC CooperJaidee About page** — the page a shelter
    considering the system reads. The ~490 strings inside the console itself are labels only a product administrator
    sees, and he reads English, so they are the lowest-value reading in the whole list: do those last, or not at all.
  - Batch 7 — the About page's resident-records block and its sample card (14). **All passed, none changed.**
  - Batch 8 — the medical-care block (13). **All passed, none changed.**
  - Batch 9 — the adoptions-and-fostering block (13). **All passed, none changed** — including two I flagged as
    possibly wrong (below), which the reader judged acceptable.
- **Position reached:** the four disagreements are settled and **91 strings are read** (batches 1-6: everything new
  except the console). **Still to read:** the 666 `admin` console strings. The 133 "Thai changed" strings are dealt
  with differently — see below.
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
