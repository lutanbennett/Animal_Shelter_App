import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { UNDO_DECEASED_ROLES } from "@/lib/placements/deceased";
import { PLACEMENT_ICONS } from "@/components/hub-icons";
import { UndoDeathForm } from "./UndoDeathForm";

type PlacementRow = {
  id: string;
  placement_type: string;
  start_date: string;
  cause_of_death: string | null;
  enclosure: { name: string; name_th: string | null; zones: { name: string; name_th: string | null } | null } | null;
  carer: { name: string } | null;
};

/**
 * Withdraw a death recorded in error. Admin-only, and only while the
 * resident's open placement is the Deceased one; everyone else sees why
 * the form isn't offered rather than a form that would fail.
 */
export default async function UndoDeathPage(
  props: PageProps<"/residents/[id]/deceased/undo">,
) {
  const { id } = await props.params;
  const { t, locale } = await getT();
  const supabase = await createClient();

  const [residentResult, deathResult, roleResult] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, resident_code")
      .eq("id", id)
      .limit(1)
      .returns<
        { id: string; name: string; thai_name: string | null; resident_code: string }[]
      >(),
    supabase
      .from("placement_history")
      .select(
        "id, placement_type, start_date, cause_of_death, enclosure:enclosures!enclosure_id(name, name_th, zones(name, name_th)), carer:contacts(name)",
      )
      .eq("resident_id", id)
      .eq("placement_type", "Deceased")
      .is("end_date", null)
      .limit(1)
      .returns<PlacementRow[]>(),
    supabase.rpc("current_user_role"),
  ]);

  // A query error (e.g. a migration not yet applied) must not look like a
  // missing resident — surface it instead of a 404.
  if (residentResult.error) throw new Error(residentResult.error.message);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const death = deathResult.data?.[0] ?? null;

  // Where the reversal will put them: the placement the death closed.
  // undo_deceased_placement() makes the same choice server-side.
  const priorResult = death
    ? await supabase
        .from("placement_history")
        .select(
          "id, placement_type, start_date, cause_of_death, enclosure:enclosures!enclosure_id(name, name_th, zones(name, name_th)), carer:contacts(name)",
        )
        .eq("resident_id", id)
        .lt("start_date", death.start_date)
        .order("start_date", { ascending: false })
        .limit(1)
        .returns<PlacementRow[]>()
    : null;
  const prior = priorResult?.data?.[0] ?? null;

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const canUndo = UNDO_DECEASED_ROLES.has(roleResult.data ?? "");
  const u = t.residents.deceased.undo;
  const Icon = PLACEMENT_ICONS.deceasedInError;

  const blocked = !canUndo
    ? u.notAuthorized
    : !death
      ? u.errors.notDeceased
      : !prior
        ? u.errors.noPriorPlacement
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
          {u.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.resident_code})
          </span>
        </h1>
        <p className="text-sm text-muted">{u.pageSubtitle}</p>
      </div>

      {blocked || !death || !prior ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {blocked}
        </p>
      ) : (
        <UndoDeathForm
          residentId={id}
          displayName={displayName}
          death={{ date: death.start_date, causeOfDeath: death.cause_of_death }}
          returnTo={{
            enclosureName: placeName(locale, prior.enclosure?.name, prior.enclosure?.name_th) || null,
            zoneName: placeName(locale, prior.enclosure?.zones?.name, prior.enclosure?.zones?.name_th) || null,
            carerName: prior.carer?.name ?? null,
          }}
        />
      )}
    </main>
  );
}
