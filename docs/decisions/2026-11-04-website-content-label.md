# 2026-11-04 — `website.content` label also names the sterilisation drives sign-up list (#jh6p4)

Lutan chose option (a) on 2026-11-02: widen the label, leave the routing.

- **English:** "The public website's content" → "The public website's content, and the sterilisation drives sign-up list" (`en.ts`, `website.content`).
- **Thai:** "เนื้อหาเว็บไซต์สาธารณะ" → "เนื้อหาเว็บไซต์สาธารณะ และรายชื่อผู้ลงทะเบียนโครงการทำหมัน" (`th.ts`). Our own wording, not yet read by a Thai speaker.
- **Also updated:** the same sentence in the `website.content` row of `docs/roles-and-permissions.md`.
- **Why the routing was NOT changed:** the card genuinely opens `/management/sterilisation-drives` (then `/management/desexing-drives`; renamed in 0.43.0); the label was wrong, not the routing. Splitting it into its own activity (b) and leaving it (c) are superseded.
- **Other places that describe the card, left alone (for the planner to judge):** `docs/card-walkthrough.md` (lines 313, 325) and `docs/card-reports/website.md` are historical walk records of the old wording; `src/lib/roles-draft/draft-*.json` say "Edit the public website's content" (drafts); `src/lib/manual/en.ts` names the activity by key, not by wording.
