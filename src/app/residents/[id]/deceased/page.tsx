import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { DECEASED_ROLES } from "@/lib/placements/deceased";
import { PLACEMENT_ICONS } from "@/components/hub-icons";
import { RecordDeathForm } from "./RecordDeathForm";

export default async function RecordDeathPage(
  props: PageProps<"/residents/[id]/deceased">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const [residentResult, statusResult, placementResult, roleResult] =
    await Promise.all([
      supabase
        .from("residents")
        .select("id, name, thai_name, resident_code")
        .eq("id", id)
        .limit(1)
        .returns<
          { id: string; name: string; thai_name: string | null; resident_code: string }[]
        >(),
      supabase
        .from("resident_list_view")
        .select("current_status, enclosure_id, enclosure_name, zone_name")
        .eq("resident_id", id)
        .limit(1)
        .returns<
          {
            current_status: string | null;
            enclosure_id: string | null;
            enclosure_name: string | null;
            zone_name: string | null;
          }[]
        >(),
      supabase
        .from("placement_history")
        .select("start_date")
        .eq("resident_id", id)
        .is("end_date", null)
        .limit(1)
        .returns<{ start_date: string }[]>(),
      supabase.rpc("current_user_role"),
    ]);

  // A query error (e.g. a migration not yet applied) must not look like a
  // missing resident — surface it instead of a 404.
  if (residentResult.error) throw new Error(residentResult.error.message);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const status = statusResult.data?.[0];
  const canRecord = DECEASED_ROLES.has(roleResult.data ?? "");
  const Icon = PLACEMENT_ICONS.deceased;

  const blocked = !canRecord
    ? t.residents.deceased.notAuthorized
    : status?.current_status === "Deceased"
      ? t.residents.deceased.errors.alreadyDeceased
      : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
          <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
          {t.residents.deceased.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.resident_code})
          </span>
        </h1>
        <p className="text-sm text-muted">{t.residents.deceased.pageSubtitle}</p>
      </div>

      {blocked ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {blocked}
        </p>
      ) : (
        <RecordDeathForm
          residentId={id}
          displayName={displayName}
          current={{
            enclosureId: status?.enclosure_id ?? null,
            enclosureName: status?.enclosure_name ?? null,
            zoneName: status?.zone_name ?? null,
            since: placementResult.data?.[0]?.start_date ?? null,
          }}
          today={new Date().toISOString().slice(0, 10)}
        />
      )}
    </main>
  );
}
