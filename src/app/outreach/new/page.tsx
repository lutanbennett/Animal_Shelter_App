import Link from "next/link";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { loadPlaces } from "@/lib/outreach/outings";
import { OutingForm } from "../OutingForm";

/** /outreach/new: record one outreach visit (0169). Edit on community.outings writes. */
export default async function NewOutingPage() {
  const { t } = await getT();
  const { supabase } = await requirePermission("community.outings");
  const { places } = await loadPlaces(supabase);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link href="/outreach" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
        {t.outreach.backToList}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.outreach.newTitle}</h1>
        <p className="text-sm text-muted">{t.outreach.newSubtitle}</p>
      </div>
      <OutingForm mode="create" places={places} />
    </main>
  );
}
