import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { DonorForm } from "../DonorForm";

export default async function NewDonorPage() {
  await requirePermission("donation.receipt");
  const { t } = await getT();
  const d = t.donations.donors;
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/donations/donors">{d.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{d.newTitle}</h1>
      </div>
      <DonorForm initial={{ name: "", email: "", phone: "", line: "", note: "" }} />
    </main>
  );
}
