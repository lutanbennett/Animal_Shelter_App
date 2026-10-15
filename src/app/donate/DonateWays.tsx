import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { driveImageUrl } from "@/lib/google/drive-client";
import { createClient } from "@/lib/supabase/server";
import {
  channelText,
  loadPublicDonationChannels,
  type PublicDonationChannel,
} from "@/lib/site/donation-channels";
import { CopyButton } from "./CopyButton";

/**
 * The ways to give under the Donate page's text (0191): a big button for each
 * way that has a link (PayPal, DonorBox, Wise, any other), and a card for each
 * that has details to copy (bank account, PromptPay). Hidden ways are absent
 * from the view the page reads, so nothing here filters them. Company names
 * are words and a plain icon, not logos (their brand rules were not checked).
 */
export async function DonateWays() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const channels = await loadPublicDonationChannels(supabase);
  const w = t.donateWays;
  if (channels.length === 0) {
    return (
      <p data-reveal className="rounded-lg border border-border bg-surface p-4 text-base text-muted">
        {w.none}
      </p>
    );
  }

  return (
    <section data-reveal aria-labelledby="ways-to-give" className="flex flex-col gap-4">
      <h2 id="ways-to-give" className="text-2xl font-semibold text-foreground">
        {w.heading}
      </h2>
      <ul className="flex flex-col gap-4">
        {channels.map((channel) => {
          const text = channelText(channel, locale);
          return (
            <li key={channel.id}>
              {channel.url ? (
                <LinkWay channel={channel} label={text.label} note={text.note} />
              ) : (
                <DetailsWay channel={channel} label={text.label} note={text.note} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function LinkWay({
  channel,
  label,
  note,
}: {
  channel: PublicDonationChannel;
  label: string;
  note: string;
}) {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-2">
      <a
        href={channel.url!}
        target="_blank"
        rel="noopener noreferrer"
        className="spring-lift flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        {t.donateWays.give[channel.way] ?? label}
        <ExternalLink aria-hidden className="h-5 w-5 shrink-0" />
        <span className="sr-only">({t.donateWays.opensInNewTab})</span>
      </a>
      {note && <p className="text-sm text-muted">{note}</p>}
    </div>
  );
}

async function DetailsWay({
  channel,
  label,
  note,
}: {
  channel: PublicDonationChannel;
  label: string;
  note: string;
}) {
  const { t } = await getT();
  const w = t.donateWays;
  const rows: { name: string; value: string; copy: boolean }[] = [];
  if (channel.bank_name) rows.push({ name: w.bank, value: channel.bank_name, copy: false });
  if (channel.account_name) rows.push({ name: w.accountName, value: channel.account_name, copy: false });
  if (channel.account_number) rows.push({ name: w.accountNumber, value: channel.account_number, copy: true });
  if (channel.promptpay_id) rows.push({ name: w.promptpayId, value: channel.promptpay_id, copy: true });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      <h3 className="text-lg font-semibold text-foreground">{label}</h3>
      {note && <p className="text-sm text-muted">{note}</p>}
      <dl className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.name} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <dt className="text-sm text-muted">{row.name}</dt>
              <dd className="break-all text-xl font-semibold text-foreground">{row.value}</dd>
            </div>
            {row.copy && <CopyButton value={row.value} what={row.name} />}
          </div>
        ))}
      </dl>
      {channel.qr_drive_file_id && (
        <figure className="flex flex-col items-center gap-2">
          <Image
            src={driveImageUrl(channel.qr_drive_file_id)}
            alt={w.qrAlt(label)}
            width={320}
            height={320}
            unoptimized
            className="h-auto w-full max-w-xs rounded-lg border border-border bg-white object-contain"
          />
          <figcaption className="text-sm text-muted">{w.qrHeading}</figcaption>
        </figure>
      )}
    </div>
  );
}
