import { isReceiptCountry, type ReceiptCountry } from "./issuer";
import { receiptTotal, type ReceiptContent, type ReceiptLine } from "./receipt";

/**
 * A donation (0168) and what the form sends to make one. Pure and
 * client-safe: the form and the server action check with the same function.
 */

export const DONATION_METHODS = ["bank_transfer", "promptpay", "cash", "donorbox", "in_kind"] as const;
export type DonationMethod = (typeof DONATION_METHODS)[number];

export const DONATION_DESIGNATIONS = ["general", "resident", "project", "appeal"] as const;
export type DonationDesignation = (typeof DONATION_DESIGNATIONS)[number];

/** At most this many description lines on one receipt: it is one A4 page. */
export const MAX_DONATION_LINES = 12;

export type DonationLineFields = { description: string; amount: string };

/** What the form sends. Strings, as the inputs hold them. */
export type DonationFields = {
  receivedOn: string;
  donorName: string;
  contactId: string;
  donorEmail: string;
  donorPhone: string;
  donorLine: string;
  method: DonationMethod;
  designation: DonationDesignation;
  designationResidentId: string;
  designationNote: string;
  note: string;
  country: ReceiptCountry;
  lines: DonationLineFields[];
};

/** A row of the donations table, as the pages read it. */
export type DonationRow = {
  id: string;
  received_on: string;
  donor_name: string;
  contact_id: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  donor_line: string | null;
  method: DonationMethod;
  designation: DonationDesignation;
  designation_resident_id: string | null;
  designation_note: string | null;
  note: string | null;
  created_at: string;
};

export type DonationLineRow = { id: string; donation_id: string; position: number; description: string; amount: number | string | null };

export type DonationReceiptRow = {
  id: string;
  number: string;
  donation_id: string;
  country: ReceiptCountry;
  issued_on: string;
  issued_at: string;
  content: ReceiptContent;
  issuer: import("./issuer").ReceiptIssuer;
  drive_file_id: string | null;
  drive_saved_at: string | null;
  sent_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
};

/** Why a form is refused; the form maps each to words from the dictionary. */
export type DonationProblem =
  | "donorName"
  | "receivedOn"
  | "futureDate"
  | "method"
  | "designation"
  | "designationResident"
  | "country"
  | "noLines"
  | "tooManyLines"
  | "lineDescription"
  | "lineAmount"
  | "inKindAmount"
  | "email";

export type CleanDonation = {
  received_on: string;
  donor_name: string;
  contact_id: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  donor_line: string | null;
  method: DonationMethod;
  designation: DonationDesignation;
  designation_resident_id: string | null;
  designation_note: string | null;
  note: string | null;
  country: ReceiptCountry;
  lines: ReceiptLine[];
};

const trimmed = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t ? t : null;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Baht as typed: "1,200", "1200.5". Refuses more than two decimals, zero and
 * negatives (a line with no amount is an in-kind line, not ฿0).
 */
export function parseBaht(input: string): number | null {
  const s = input.replace(/[,\s฿]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n < 1e10 ? n : null;
}

/**
 * Checks and tidies the form. `today` is the shelter's date (yyyy-mm-dd), so
 * a gift can be recorded the day it arrives and never dated in the future.
 *
 * In kind: the method "in_kind" means every line describes goods and carries
 * no amount; any other method means every line has one. A mix would print a
 * total that is only part of the gift.
 */
export function checkDonation(
  f: DonationFields,
  today: string,
): { ok: true; donation: CleanDonation } | { ok: false; problem: DonationProblem; line?: number } {
  const donorName = trimmed(f.donorName);
  if (!donorName) return { ok: false, problem: "donorName" };
  if (!ISO_DATE.test(f.receivedOn)) return { ok: false, problem: "receivedOn" };
  if (f.receivedOn > today) return { ok: false, problem: "futureDate" };
  if (!DONATION_METHODS.includes(f.method)) return { ok: false, problem: "method" };
  if (!DONATION_DESIGNATIONS.includes(f.designation)) return { ok: false, problem: "designation" };
  if (!isReceiptCountry(f.country)) return { ok: false, problem: "country" };

  const residentId = f.designation === "resident" ? trimmed(f.designationResidentId) : null;
  if (f.designation === "resident" && (!residentId || !UUID.test(residentId))) {
    return { ok: false, problem: "designationResident" };
  }

  const email = trimmed(f.donorEmail);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, problem: "email" };

  const inKind = f.method === "in_kind";
  const typed = f.lines.filter((l) => l.description.trim() || l.amount.trim());
  if (typed.length === 0) return { ok: false, problem: "noLines" };
  if (typed.length > MAX_DONATION_LINES) return { ok: false, problem: "tooManyLines" };

  const lines: ReceiptLine[] = [];
  for (let i = 0; i < typed.length; i++) {
    const description = typed[i].description.trim().replace(/\s+/g, " ");
    if (!description) return { ok: false, problem: "lineDescription", line: i };
    if (inKind) {
      if (typed[i].amount.trim()) return { ok: false, problem: "inKindAmount", line: i };
      lines.push({ description, amount: null });
    } else {
      const amount = parseBaht(typed[i].amount);
      if (amount == null) return { ok: false, problem: "lineAmount", line: i };
      lines.push({ description, amount });
    }
  }

  const contactId = trimmed(f.contactId);
  return {
    ok: true,
    donation: {
      received_on: f.receivedOn,
      donor_name: donorName,
      contact_id: contactId && UUID.test(contactId) ? contactId : null,
      donor_email: email,
      donor_phone: trimmed(f.donorPhone),
      donor_line: trimmed(f.donorLine),
      method: f.method,
      designation: f.designation,
      designation_resident_id: residentId,
      designation_note: f.designation === "general" ? null : trimmed(f.designationNote),
      note: trimmed(f.note),
      country: f.country,
      lines,
    },
  };
}

/**
 * What a receipt prints, from a donation and its lines (in order). The
 * database's receipt_content() (0177) is the copy that reaches the receipt;
 * check-donation-receipts-schema.mjs fails if the two differ. Change both.
 */
export function receiptContentFor(donorName: string, lines: { description: string; amount: number | string | null }[]): ReceiptContent {
  const clean: ReceiptLine[] = lines.map((l) => ({
    description: l.description,
    amount: l.amount == null ? null : Number(l.amount),
  }));
  return { donorName, lines: clean, total: receiptTotal(clean), currency: "THB" };
}
