import type { ReceiptCountry, ReceiptIssuer } from "./issuer";

/**
 * What a donation receipt says, as printed. Stored on donation_receipts.content
 * (0168) so a re-print gives the page the donor received, whatever has been
 * corrected on the donation since. Pure and client-safe.
 */
export type ReceiptLine = { description: string; /** Baht; null for an in-kind line. */ amount: number | null };

export type ReceiptContent = {
  donorName: string;
  lines: ReceiptLine[];
  /** Baht, the sum of the priced lines. 0 for a gift that is all in kind. */
  total: number;
  currency: "THB";
};

/** Everything the PDF needs. The issuer is the snapshot taken at issue time. */
export type ReceiptDocument = {
  number: string;
  country: ReceiptCountry;
  /** yyyy-mm-dd */
  issuedOn: string;
  issuer: ReceiptIssuer;
  content: ReceiptContent;
  voided?: { on: string; reason: string } | null;
};

/**
 * Every fixed word on the receipt, in one place, so a Thai edition is a second
 * object and not a rewrite of the layout. English only for now (Lutan,
 * 2026-10-09). Not in the app dictionaries because the receipt's language is
 * the receipt's, not the reader's: a Thai-speaking Director still issues an
 * English receipt.
 */
export const RECEIPT_LABELS_EN = {
  title: "Receipt",
  billTo: "Bill to",
  receiptNumber: "Receipt #",
  receiptDate: "Receipt date",
  description: "Description",
  amount: "Amount",
  inKind: "In kind",
  total: "Total",
  thankYou: "Thank you",
  terms: "Terms & conditions",
  termsBody: "N/A",
  void: "VOID",
  voidedOn: (date: string, reason: string) => `Voided ${date}: ${reason}`,
} as const;

export type ReceiptLabels = typeof RECEIPT_LABELS_EN;

/**
 * The receipt date as the country writes it. Thailand dd/mm/yyyy, as the
 * sample receipt. The US mm/dd/yyyy: the one place in this app where
 * month-first is correct, so the "Dates in US order" sweep must leave it.
 */
export function formatReceiptDate(isoDate: string, country: ReceiptCountry): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return isoDate;
  const [, y, mo, d] = m;
  return country === "US" ? `${mo}/${d}/${y}` : `${d}/${mo}/${y}`;
}

/** 1200 -> "1,200.00". Baht on both receipts: it is the currency received. */
export function formatBaht(amount: number): string {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function receiptTotal(lines: ReceiptLine[]): number {
  // Sum in satang so 0.1 + 0.2 never prints as 0.30000000000000004.
  return lines.reduce((sum, l) => sum + Math.round((l.amount ?? 0) * 100), 0) / 100;
}

/**
 * `<number>-<Donor-Name>.pdf`, e.g. LCA0009000-Global-Tiger.pdf, on Drive and
 * when downloaded. Letters in any script are kept (a Thai name stays Thai);
 * runs of anything else become one hyphen.
 */
export function receiptFileName(number: string, donorName: string): string {
  const name = donorName
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return name ? `${number}-${name}.pdf` : `${number}.pdf`;
}
