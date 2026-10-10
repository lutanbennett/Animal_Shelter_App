import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";
import type { DonationReceiptRow, DonationRow } from "@/lib/donations/donations";
import { receiptFileName } from "@/lib/donations/receipt";
import { RECEIPT_COLUMNS } from "@/lib/donations/receipts-server";
import { ReceiptCard, IssueReceipt } from "./ReceiptActions";

type Detail = DonationRow & {
  donation_lines: { description: string; amount: number | string | null; position: number }[];
  contacts: { name: string } | null;
  residents: { name: string } | null;
};

/**
 * One donation: what was given, and its receipts newest first. The live
 * receipt carries the sending controls (share on a phone, download and an
 * email draft on a PC, "I've sent it"), the Drive state with a retry, and
 * Void. After a void, a new receipt can be issued with the next number.
 */
export default async function DonationPage(props: PageProps<"/management/donations/[id]">) {
  await requirePermission("donation.receipt");
  const { t, locale } = await getT();
  const d = t.donations;
  const { id } = await props.params;
  const sp = await props.searchParams;

  const supabase = await createClient();
  const [donationResult, receiptsResult] = await Promise.all([
    supabase
      .from("donations")
      .select("*, donation_lines(description, amount, position), contacts(name), residents:designation_resident_id(name)")
      .eq("id", id)
      .maybeSingle<Detail>(),
    supabase.from("donation_receipts").select(RECEIPT_COLUMNS).eq("donation_id", id).order("issued_at", { ascending: false }).returns<DonationReceiptRow[]>(),
  ]);
  // A failed read must not pass for "not found" or "no receipts yet" — the
  // latter offers to issue a receipt that may already exist.
  if (donationResult.error) throw new Error(donationResult.error.message);
  if (receiptsResult.error) throw new Error(receiptsResult.error.message);
  const donation = donationResult.data;
  if (!donation) notFound();
  const receipts = receiptsResult.data ?? [];
  const hasLive = receipts.some((r) => !r.voided_at);
  const lastCountry = receipts[0]?.country ?? "TH";

  const notice = typeof sp.notice === "string" && typeof sp.receipt === "string" ? { receiptId: sp.receipt, kind: sp.notice } : null;
  const reach = [donation.donor_email, donation.donor_phone, donation.donor_line && `LINE ${donation.donor_line}`].filter(Boolean).join(" · ");
  const designation =
    donation.designation === "resident" && donation.residents
      ? `${d.designations.resident}: ${donation.residents.name}`
      : donation.designation_note
        ? `${d.designations[donation.designation]}: ${donation.designation_note}`
        : d.designations[donation.designation];

  const row = (label: string, value: string | null | undefined) =>
    value ? (
      <div className="flex flex-col sm:flex-row sm:gap-3">
        <dt className="w-28 shrink-0 text-sm text-muted">{label}</dt>
        <dd className="text-sm text-foreground" lang="und">{value}</dd>
      </div>
    ) : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/donations">{d.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground" lang="und">{donation.donor_name}</h1>
      </div>

      <dl className="flex max-w-2xl flex-col gap-2 rounded border border-border bg-surface p-4">
        {row(d.detail.receivedOn, formatDate(donation.received_on, locale))}
        {row(d.detail.method, d.methods[donation.method])}
        {row(d.detail.designation, designation)}
        {row(d.detail.contact, donation.contacts?.name)}
        {row(d.detail.reach, reach)}
        {row(d.detail.note, donation.note)}
      </dl>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{d.detail.receipts}</h2>
        {receipts.length === 0 && <p className="text-sm text-muted">{d.detail.receiptsNone}</p>}
        {receipts.map((r) => (
          <ReceiptCard
            key={r.id}
            receipt={{
              id: r.id,
              number: r.number,
              country: r.country,
              issuedOn: formatDate(r.issued_on, locale),
              voided: r.voided_at ? { on: formatDate(r.voided_at, locale), reason: r.void_reason ?? "" } : null,
              sentOn: r.sent_at ? formatDate(r.sent_at, locale) : null,
              driveFileId: r.drive_file_id,
              fileName: receiptFileName(r.number, r.content.donorName),
            }}
            donorName={donation.donor_name}
            donorEmail={donation.donor_email}
            notice={notice?.receiptId === r.id ? notice.kind : null}
          />
        ))}
        {!hasLive && <IssueReceipt donationId={donation.id} defaultCountry={lastCountry} again={receipts.length > 0} />}
      </section>
    </main>
  );
}
