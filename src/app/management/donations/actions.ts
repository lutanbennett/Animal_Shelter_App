"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { todayIso } from "@/lib/format";
import { checkDonation, receiptContentFor, type DonationFields, type DonationProblem } from "@/lib/donations/donations";
import { isReceiptCountry, receiptIssuer, type ReceiptCountry } from "@/lib/donations/issuer";
import { fileReceiptOnDrive, loadReceipt, RECEIPT_COLUMNS } from "@/lib/donations/receipts-server";
import type { DonationReceiptRow } from "@/lib/donations/donations";

/**
 * Donations and their receipts (0168). Every action asks donation.receipt
 * first; RLS and issue_donation_receipt() ask the same cell, so this is the
 * friendly refusal, not the protection.
 *
 * Results, never throws (the #441 lesson, src/lib/action-result.ts).
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
const refuse = (error: string): ActionRefusal => ({ ok: false, error });

export type IssuedReceipt = { donationId: string; receiptId: string; number: string; savedToDrive: boolean };

function problemText(t: Dictionary, problem: DonationProblem, line?: number) {
  const e = t.donations.errors;
  const n = (line ?? 0) + 1;
  switch (problem) {
    case "lineDescription":
      return e.lineDescription(n);
    case "lineAmount":
      return e.lineAmount(n);
    case "inKindAmount":
      return e.inKindAmount(n);
    default:
      return e[problem];
  }
}

function revalidateDonations(donationId?: string) {
  revalidatePath("/management/donations");
  if (donationId) revalidatePath(`/management/donations/${donationId}`);
}

/**
 * Takes the next number and writes the register row, then files the PDF on
 * Drive. The number is committed before Drive is tried, so a Drive failure
 * never costs a number and never loses the receipt.
 */
async function issue(
  supabase: Supabase,
  t: Dictionary,
  donationId: string,
  country: ReceiptCountry,
): Promise<ActionResult<IssuedReceipt>> {
  const { data: donation, error: dErr } = await supabase
    .from("donations")
    .select("id, donor_name, donation_lines(description, amount, position)")
    .eq("id", donationId)
    .maybeSingle<{ id: string; donor_name: string; donation_lines: { description: string; amount: number | string | null; position: number }[] }>();
  if (dErr) return databaseFailure("donations.issue.load", dErr, t.common);
  if (!donation) return refuse(t.donations.errors.notFound);

  const lines = [...donation.donation_lines].sort((a, b) => a.position - b.position);
  const { data: row, error } = await supabase
    .rpc("issue_donation_receipt", {
      p_donation_id: donationId,
      p_country: country,
      p_issued_on: todayIso(),
      // Ignored by the database since 0176: the RPC stores receipt_issuer(country), its SQL copy of this, so
      // that no caller can name another organisation. Still sent only so the deploy order does not matter;
      // drop it together with the argument in a later migration. Never make the database read it again.
      p_issuer: receiptIssuer(country),
      p_content: receiptContentFor(donation.donor_name, lines),
    })
    .single<DonationReceiptRow>();
  if (error) {
    // One live receipt per donation (donation_receipts_one_live).
    if (error.code === "23505") return refuse(t.donations.errors.alreadyIssued);
    return databaseFailure("donations.issue", error, t.common);
  }

  const savedToDrive = await fileReceiptOnDrive(supabase, row);
  revalidateDonations(donationId);
  return { ok: true, donationId, receiptId: row.id, number: row.number, savedToDrive };
}

/** The form: records the gift and issues its receipt in one go. */
export async function recordDonation(fields: DonationFields): Promise<ActionResult<IssuedReceipt>> {
  const { t } = await getT();
  return runAction("donations.recordDonation", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);

    const checked = checkDonation(fields, todayIso());
    if (!checked.ok) return refuse(problemText(t, checked.problem, checked.line));
    const { lines, country, ...donation } = checked.donation;

    const supabase = await createClient();
    const { data: created, error } = await supabase.from("donations").insert(donation).select("id").single<{ id: string }>();
    if (error) return databaseFailure("donations.recordDonation.insert", error, t.common);

    const { error: lErr } = await supabase
      .from("donation_lines")
      .insert(lines.map((l, position) => ({ donation_id: created.id, position, description: l.description, amount: l.amount })));
    if (lErr) {
      // No half-recorded gift: without its lines the donation has nothing to print.
      await supabase.from("donations").delete().eq("id", created.id);
      return databaseFailure("donations.recordDonation.lines", lErr, t.common);
    }

    return issue(supabase, t, created.id, country);
  });
}

/** A new receipt for a donation whose last one was voided (or never issued). */
export async function issueReceipt(donationId: string, country: string): Promise<ActionResult<IssuedReceipt>> {
  const { t } = await getT();
  return runAction("donations.issueReceipt", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);
    if (!isReceiptCountry(country)) return refuse(t.donations.errors.country);
    return issue(await createClient(), t, donationId, country);
  });
}

/** Files a receipt that Drive refused the first time. */
export async function retryDriveFiling(receiptId: string): Promise<ActionResult<{ savedToDrive: boolean }>> {
  const { t } = await getT();
  return runAction("donations.retryDriveFiling", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const row = await loadReceipt(supabase, receiptId);
    if (!row) return refuse(t.donations.errors.notFound);
    const savedToDrive = await fileReceiptOnDrive(supabase, row);
    revalidateDonations(row.donation_id);
    return savedToDrive ? { ok: true, savedToDrive } : refuse(t.donations.errors.driveStillDown);
  });
}

/** The Director confirms she has sent it to the donor. */
export async function markReceiptSent(receiptId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("donations.markReceiptSent", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("donation_receipts")
      .update({ sent_at: new Date().toISOString(), sent_by: user?.id ?? null })
      .eq("id", receiptId)
      .is("sent_at", null)
      .select("donation_id")
      .maybeSingle<{ donation_id: string }>();
    if (error) return databaseFailure("donations.markReceiptSent", error, t.common);
    revalidateDonations(data?.donation_id);
    return { ok: true };
  });
}

/**
 * Voids a receipt: it keeps its number and stays in the register, marked void.
 * The copy on Drive is replaced by one stamped VOID, so Drive never holds a
 * clean copy of a cancelled receipt.
 */
export async function voidReceipt(receiptId: string, reason: string): Promise<ActionResult<{ savedToDrive: boolean }>> {
  const { t } = await getT();
  return runAction("donations.voidReceipt", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return refuse(t.common.notAllowed);
    const why = reason.trim();
    if (!why) return refuse(t.donations.errors.voidReason);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: row, error } = await supabase
      .from("donation_receipts")
      .update({ voided_at: new Date().toISOString(), voided_by: user?.id ?? null, void_reason: why })
      .eq("id", receiptId)
      .is("voided_at", null)
      .select(RECEIPT_COLUMNS)
      .maybeSingle<DonationReceiptRow>();
    if (error) return databaseFailure("donations.voidReceipt", error, t.common);
    if (!row) return refuse(t.donations.errors.alreadyVoid);
    const savedToDrive = await fileReceiptOnDrive(supabase, row);
    revalidateDonations(row.donation_id);
    return { ok: true, savedToDrive };
  });
}
