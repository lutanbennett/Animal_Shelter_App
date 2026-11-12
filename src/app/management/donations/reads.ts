"use server";

// write-requests: read-only -- giftsReceivedOn only selects the gifts already recorded for one day, which is
// what the donation form shows beside the date so the same statement line is not entered twice; it records
// nothing, so a replay of it is harmless by construction.

import { runAction, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";
import type { DonationMethod } from "@/lib/donations/donations";

/** One gift already on record for a day: enough to recognise it, nothing more. */
export type GiftOnDay = {
  id: string;
  donorName: string;
  method: DonationMethod;
  /** Baht, or null for a gift in kind, which has no figure. */
  amount: number | null;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

type Row = {
  id: string;
  donor_name: string;
  method: DonationMethod;
  donation_lines: { amount: number | string | null }[];
};

/**
 * The gifts already recorded for one day, for the panel beside the date on the
 * donation form. Working down a bank statement is a run of gifts for the same
 * day, and a static PromptPay QR carries no reference, so two gifts of the same
 * amount on the same morning cannot be told apart afterwards: seeing what is
 * already there before saving is the only guard against entering a line twice.
 *
 * Asks donation.receipt, the activity recordDonation() itself asks, so this
 * shows nothing a login could not already see on the list.
 */
export async function giftsReceivedOn(receivedOn: string): Promise<ActionResult<{ gifts: GiftOnDay[] }>> {
  const { t } = await getT();
  return runAction<{ gifts: GiftOnDay[] }>("donations.giftsReceivedOn", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "donation.receipt")) return { ok: false, error: t.common.notAllowed };
    if (!ISO.test(receivedOn)) return { ok: false, error: t.donations.form.alreadyFailed };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("donations")
      .select("id, donor_name, method, donation_lines(amount)")
      .eq("received_on", receivedOn)
      .order("created_at", { ascending: false })
      .returns<Row[]>();
    // A failed read must not look like "nothing recorded that day": that is the
    // one answer which would invite the duplicate this panel exists to prevent.
    if (error) return { ok: false, error: t.donations.form.alreadyFailed };

    return { ok: true, gifts: (data ?? []).map(toGift) };
  });
}

function toGift(row: Row): GiftOnDay {
  const amounts = row.donation_lines.map((l) => (l.amount == null ? null : Number(l.amount)));
  const inKind = amounts.every((a) => a == null);
  return {
    id: row.id,
    donorName: row.donor_name,
    method: row.method,
    amount: inKind ? null : amounts.reduce<number>((s, a) => s + Math.round((a ?? 0) * 100), 0) / 100,
  };
}
