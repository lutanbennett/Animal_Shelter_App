import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateZoneForm } from "./CreateZoneForm";
import { ZonesTable, type ZoneRow } from "./ZonesTable";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";

export default async function ZonesPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zones")
    .select("id, name, name_th, internal")
    .order("name")
    .returns<ZoneRow[]>();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.zones.title}
        </h1>
        <p className="text-sm text-muted">{t.admin.zones.subtitle}</p>
      </div>

      <LargerScreenNotice>
        {error && (
          <p className="text-sm text-danger">
            {t.admin.zones.couldntLoad}: {error.message}
          </p>
        )}

        <CreateZoneForm />
        <ZonesTable zones={data ?? []} />
      </LargerScreenNotice>
    </main>
  );
}
