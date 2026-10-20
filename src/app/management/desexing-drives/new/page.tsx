import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import type { DriveFields } from "@/lib/desexing/form";
import { DriveForm } from "../DriveForm";

/** Management → Desexing drives → New. Starts blank and as a draft: nothing is public until it is opened. */
export default async function NewDrivePage() {
  await requirePermission("website.content");
  const { t } = await getT();
  const initial: DriveFields = {
    title: "",
    driveDate: "",
    startsAt: "",
    endsAt: "",
    venue: "",
    venueAddress: "",
    species: ["dog", "cat"],
    capacity: "",
    signupsCloseOn: "",
    priceNote: "",
    eligibilityNote: "",
    description: "",
    status: "draft",
  };
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/desexing-drives">{t.desexingAdmin.title}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{t.desexingAdmin.start}</h1>
      </div>
      <DriveForm mode="new" initial={initial} />
    </main>
  );
}
