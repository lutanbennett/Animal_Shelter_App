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
`<base>..<commit>` range beside this one and pass both. Not covered by this boundary: the 34 `uploads` strings (added
2026-11-03, read in the finish session; see its decision file).

## What was changed

1. `merchStaff.title` now reads ร้านขายสินค้า, to match the public shop's name (it said ร้านสินค้าที่ระลึก).
2. Permission cards are called **บัตรสิทธิ์** everywhere (Lutan's word). 76 lines of `th.ts` changed, replacing
   การ์ด and a bare บัตร where they meant a permission card. Left alone on purpose: recipe cards, friend profile
   cards, pen cards, the review cards in the checker, RFID animal cards, credit cards, ID cards.

## Seen and left as is (said once, no ruling asked for)

- A supplier is ซัพพลายเออร์ on the shop staff pages and ผู้จัดจำหน่าย on the Who does what screen.
- A size is ขนาด on the shop staff pages and ไซซ์ on the Who does what screen.
