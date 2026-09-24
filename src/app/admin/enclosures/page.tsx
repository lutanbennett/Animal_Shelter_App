import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateEnclosureForm } from "./CreateEnclosureForm";
import { EnclosuresTable, type EnclosureRow } from "./EnclosuresTable";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";

export default async function EnclosuresPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();

  const [enclosuresResult, zonesResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, name, name_th, capacity, notes, zone_id, zones(name)")
      .order("name")
      .returns<EnclosureRow[]>(),
    supabase.from("zones").select("id, name").order("name"),
  ]);

  const zones = zonesResult.data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.enclosures.title}
        </h1>
        <p className="text-sm text-muted">{t.admin.enclosures.subtitle}</p>
      </div>

      <LargerScreenNotice>
        {enclosuresResult.error && (
          <p className="text-sm text-danger">
            {t.admin.enclosures.couldntLoadEnclosures}: {enclosuresResult.error.message}
          </p>
        )}
        {zonesResult.error && (
          <p className="text-sm text-danger">
            {t.admin.enclosures.couldntLoadZones}: {zonesResult.error.message}
          </p>
        )}

        <CreateEnclosureForm zones={zones} />
        <EnclosuresTable enclosures={enclosuresResult.data ?? []} zones={zones} />
      </LargerScreenNotice>
    </main>
  );
}
