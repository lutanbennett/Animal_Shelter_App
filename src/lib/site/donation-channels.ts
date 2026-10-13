import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";
import type { DonationWay } from "@/lib/links/donation";

/**
 * Ways to give (0191): a payment link, or bank / PromptPay details to copy.
 * /donate reads public_donation_channels, which leaves out hidden rows in the
 * database; Settings → Website → Donate reads the table itself.
 */

/** A row of public_donation_channels. */
export type PublicDonationChannel = {
  id: string;
  way: DonationWay;
  label: string;
  url: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  promptpay_id: string | null;
  qr_drive_file_id: string | null;
  note: string | null;
  sort_order: number;
  translations: PublicTranslations;
};

/** A row of the table, as the Settings editor sees it. */
export type DonationChannelRow = Omit<PublicDonationChannel, "translations"> & {
  shown: boolean;
};

export const PUBLIC_CHANNEL_COLUMNS =
  "id, way, label, url, bank_name, account_name, account_number, promptpay_id, qr_drive_file_id, note, sort_order, translations";

export const CHANNEL_COLUMNS =
  "id, way, label, url, bank_name, account_name, account_number, promptpay_id, qr_drive_file_id, note, sort_order, shown";

export async function loadPublicDonationChannels(
  supabase: SupabaseClient,
): Promise<PublicDonationChannel[]> {
  const { data } = await supabase
    .from("public_donation_channels")
    .select(PUBLIC_CHANNEL_COLUMNS)
    .order("sort_order")
    .order("id")
    .returns<PublicDonationChannel[]>();
  return data ?? [];
}

/** Label and note in the reader's language, falling back to what was typed. */
export function channelText(channel: PublicDonationChannel, locale: Locale) {
  return {
    label: localizedField(locale, channel.label, channel.translations, "label"),
    note: localizedField(locale, channel.note, channel.translations, "note"),
  };
}
