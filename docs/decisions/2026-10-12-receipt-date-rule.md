# Receipt date: validated, not ignored (0186)

`issue_donation_receipt` stored `p_issued_on` as given, so the API could date a receipt into another tax year.

**Rule (Lutan, 2026-10-11):** `received_on <= issued_on <= shelter_today()`.

- Backdating is legitimate: someone donates and asks for the receipt a week later. So the rule is not today-only.
- Before the donation is a wrong receipt, not a late one. Future-dated is what a tax check reads first.
- "Today" is `shelter_today()` (Asia/Bangkok, 0073), not UTC, so a Thai-evening receipt is not refused as future.
- Refused with 22023 before the counter moves, so a refusal leaves no gap in the numbers.

**Differs from 0176 and 0177.** Those accepted and ignored `p_issuer` and `p_content`, because only the server should decide them. `p_issued_on` is real input, so it is validated and stored. Do not make it uniform with them, and do not narrow it to today-only.

Signature unchanged, so deploy order does not matter. Already-issued receipts are not touched. On dev, all 4 existing receipts satisfy the rule; production was not checked from this stream.
