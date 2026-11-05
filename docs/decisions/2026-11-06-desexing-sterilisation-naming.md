# 2026-11-06 — One word for the sign-up list: "sterilisation" (#w4s2n)

**Chosen: "sterilisation"** (British `-s-`), the word `en.ts` shows a shelter user. No reason found to prefer "desexing".
Both words were already unified on screen by 0.43.0 ("Desexing is now Sterilisation, everywhere"), so what was left was paper.

## The sweep (`grep -rinE "desex|sterilis|steriliz" src docs` = 565 lines at the start)

| Kind | What | Action |
|---|---|---|
| String a user reads | `en.ts`, `th.ts`, `src/lib/manual/en.ts`: every visible occurrence says "sterilis-" (EN) / "ทำหมัน" (TH). `en.ts` still has "Desexing drives" in two *code comments* (lines ~363, 8260, 8315). | None needed on screen. |
| Thai | `th.ts` uses ทำหมัน for both words, so the Thai is identical whichever English word is chosen. **No Thai string changed, so nothing unreviewed went in.** | None. |
| Identifier | `desexing` / `desexingAdmin` dictionary keys, `desexed`, `is_desexed`, `src/lib/desexing/`, tables `desexing_drives`, `desexing_drive_signups`, view `public_desexing_drives`, error codes `desexing_*`. | Left: code and schema names, not prose; renaming needs a migration (forbidden this batch). |
| `-ize` | One: `"sterilization"` in a keyword list in `src/lib/assistant/intents/clinic.ts` (lines 25, 42). | Left on purpose: it is the American spelling someone may *type* to the assistant, so it is matched, not displayed. |
| Card name | None uses either word. The `website.content` card's *label* does (already "sterilisation drives"). No card was renamed; no migration. | None. |
| Test fixture | `src/lib/action-result.test.mjs`, `src/lib/public-paths.test.mjs` use route/identifier strings. | Left. |
| Live reference documents | `docs/roles-and-permissions.md` (`website.content` row), `docs/features.md` (prose and paths). | **Changed** to "sterilisation" and to the current routes `/management/sterilisation-drives`, `/services/sterilisation`. |
| Decision files naming the list | `2026-11-04-website-content-label.md` (the one #1296 found), `2026-11-05-card-prose-corrections.md`. | **Changed**: wording matched, the old path noted as renamed in 0.43.0 and the open note marked settled. |
| `card-walkthrough.md`, `card-reports/website.md`, manual | Already said "sterilisation". | Nothing to do. |
| Historical records | Other decision files, test plans, `docs/releases/*`, `docs/decisions.md`, `docs/backlog.md` done-items, `docs/public-site-review-2026-10-13.md`, `docs/seo-recheck-2026-11-02.md`, `docs/planner-handover.md`. | Left: they record what was said at the time; rewriting them falsifies the record. |

## Not fixed, for the planner to file
- `en.ts` comments at ~363, 8260 and 8315 still say "Desexing drives". Comments only, and `en.ts` is not mine to churn beyond need; harmless.
- `docs/data-migration.md` maps a source column `Spayed` to `is_desexed`; fine, an identifier.
