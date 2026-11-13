# Thai read: progress

**Read this first, each week.** The weekly Thai read starts from here.

- **List generated from:** `node scripts/list-thai-added.mjs 2026-11-12`
- **Run on:** 2026-11-13 (first run), in one sitting, in chat, with a bilingual reader beside Lutan.
- **Result:** all 417 strings read. 2 strings changed, plus one wording rule applied everywhere (see below).
- **Areas done:** all 14 (merchShop, animalReport, adopterUpdate, nav, appHome, merchStaff, bills, foundationPapers, animalStaff, refusals, admin, adoptionUpdates, donations, translations).
- **Position reached:** the end. Nothing is left from this list.

## Next run

Start the list from **2026-11-13** (strings added after this read):
`node scripts/list-thai-added.mjs 2026-11-13`. Strings merged after 2026-11-13 and before the PR for this stream landed
are not covered here, so a short list is normal.

## What was changed

1. `merchStaff.title` now reads ร้านขายสินค้า, to match the public shop's name (it said ร้านสินค้าที่ระลึก).
2. Permission cards are called **บัตรสิทธิ์** everywhere (Lutan's word). 76 lines of `th.ts` changed, replacing
   การ์ด and a bare บัตร where they meant a permission card. Left alone on purpose: recipe cards, friend profile
   cards, pen cards, the review cards in the checker, RFID animal cards, credit cards, ID cards.

## Seen and left as is (said once, no ruling asked for)

- A supplier is ซัพพลายเออร์ on the shop staff pages and ผู้จัดจำหน่าย on the Who does what screen.
- A size is ขนาด on the shop staff pages and ไซซ์ on the Who does what screen.
