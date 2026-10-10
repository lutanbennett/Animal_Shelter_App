/**
 * Who issues a donation receipt, per receipt country.
 *
 * THE HARD-CODING IS DELIBERATE. Do not move this into Settings, and never
 * onto `site_content` (the website's contact address). Lutan, 2026-10-09: a
 * receipt is a financial document that may go to a tax authority, and if it
 * shared the website's field a harmless public-copy edit would silently change
 * every receipt issued afterwards, with nothing on any screen to say so.
 * Changing this needs a developer and a deploy, and the deploy is the review
 * step. docs/decisions/2026-10-09-donation-receipts.md.
 *
 * It DOES move at multi-tenancy, when the issuer becomes per-shelter data, and
 * then it keeps the protections: its own field, Admin only, the screen saying
 * it appears on receipts already issued, and an audit_log row. Only
 * receiptIssuer() changes then. The PDF layout never reads RECEIPT_ISSUERS.
 *
 * THERE IS A SECOND COPY, IN SQL, AND IT IS THE ONE THAT COUNTS. Since 0176
 * the receipt stores receipt_issuer(country) from the database, not what the
 * app passes: issue_donation_receipt() is callable straight from the API, so
 * an issuer taken from the caller let anyone with donation.receipt mint a
 * receipt in any organisation's name. Change this file and receipt_issuer()
 * (a new migration) in the same PR; scripts/check-donation-receipts-schema.mjs
 * fails while they differ. docs/decisions/2026-10-10-receipt-issuer-server-side.md.
 */

export type ReceiptCountry = "TH" | "US";

export const RECEIPT_COUNTRIES: readonly ReceiptCountry[] = ["TH", "US"];

export type ReceiptIssuer = {
  /** The legal name, printed bold under RECEIPT. Empty means not yet known. */
  name: string;
  /** The registered address, one line each; the layout wraps them as given. */
  addressLines: string[];
  /**
   * Registration or tax lines ("Tax ID: …"). None for either country today:
   * the slot is here so a number arriving is a value, not a layout change.
   */
  registrationLines: string[];
  /**
   * Country-required wording under the total. Empty today. A US 501(c)(3)
   * receipt normally says no goods or services were given in exchange; that
   * line must NOT be written until the status exists, because a receipt that
   * claims it is worse than one that omits it.
   */
  statementLines: string[];
};

const LANNA_THAILAND: ReceiptIssuer = {
  name: "Lanna Care for Animals Foundation",
  addressLines: [
    "291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,",
    "Mae Wang District, Chiang Mai 50360, Thailand",
  ],
  registrationLines: [],
  statementLines: [],
};

export const RECEIPT_ISSUERS: Readonly<Record<ReceiptCountry, ReceiptIssuer>> = {
  TH: LANNA_THAILAND,
  // US tax status is being sought (Lutan, 2026-10-09). Until there is a US
  // entity and number, the US receipt names the Thai foundation that actually
  // received the gift; fill these in when the status lands.
  US: { name: "", addressLines: [], registrationLines: [], statementLines: [] },
};

/**
 * The issuer for a receipt country: the one way anything reads it. An empty
 * US entry falls back field by field to the Thai foundation, which is who
 * received the money.
 */
export function receiptIssuer(country: ReceiptCountry): ReceiptIssuer {
  const own = RECEIPT_ISSUERS[country];
  const th = RECEIPT_ISSUERS.TH;
  return {
    name: own.name || th.name,
    addressLines: own.addressLines.length ? own.addressLines : th.addressLines,
    registrationLines: own.registrationLines,
    statementLines: own.statementLines,
  };
}

export function isReceiptCountry(value: unknown): value is ReceiptCountry {
  return value === "TH" || value === "US";
}
