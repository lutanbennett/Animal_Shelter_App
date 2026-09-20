import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { ResidentsTable, type ResidentRow } from "./ResidentsTable";

export default async function ResidentsPage(props: PageProps<"/residents">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const zoneId = typeof searchParams.zone === "string" ? searchParams.zone : "";
  const enclosureId =
    typeof searchParams.enclosure === "string" ? searchParams.enclosure : "";

  const supabase = await createClient();

  const [zonesResult, enclosuresResult] = await Promise.all([
    supabase.from("zones").select("id, name").order("name"),
    supabase
      .from("enclosures")
      .select("id, name, zone_id")
      .order("name"),
  ]);

  let residentsQuery = supabase
    .from("resident_list_view")
    .select(
      "resident_id, name, animal_code, thai_name, other_names, current_status, enclosure_id, enclosure_name, zone_id, zone_name, zone_internal",
    )
    .order("name");

  if (q) {
    const term = q.replace(/[,()%]/g, "");
    residentsQuery = residentsQuery.or(
      `name.ilike.%${term}%,thai_name.ilike.%${term}%,other_names.ilike.%${term}%`,
    );
  }
  if (zoneId) {
    residentsQuery = residentsQuery.eq("zone_id", zoneId);
  }
  if (enclosureId) {
    residentsQuery = residentsQuery.eq("enclosure_id", enclosureId);
  }

  const { data: residents, error } = await residentsQuery.returns<
    ResidentRow[]
  >();

  const zones = zonesResult.data ?? [];
  const enclosures = enclosuresResult.data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-foreground">
        {t.residents.list.pageTitle}
      </h1>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-none">
          <label htmlFor="q" className="text-sm font-medium text-muted">
            {t.residents.list.search}
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder={t.residents.list.searchPlaceholder}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:w-64"
          />
        </div>
        {/* Zone / enclosure filters are desktop-only; phones browse by
            zone → enclosure → residents at /enclosures instead. */}
        <div className="hidden flex-col gap-1 md:flex">
          <label htmlFor="zone" className="text-sm font-medium text-muted">
            {t.residents.list.zone}
          </label>
          <select
            id="zone"
            name="zone"
            defaultValue={zoneId}
            className="w-48 rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="">{t.residents.list.allZones}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden flex-col gap-1 md:flex">
          <label
            htmlFor="enclosure"
            className="text-sm font-medium text-muted"
          >
            {t.residents.list.enclosure}
          </label>
          <select
            id="enclosure"
            name="enclosure"
            defaultValue={enclosureId}
            className="w-48 rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="">{t.residents.list.allEnclosures}</option>
            {enclosures.map((enclosure) => (
              <option key={enclosure.id} value={enclosure.id}>
                {enclosure.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {t.residents.list.filter}
        </button>
        {(q || zoneId || enclosureId) && (
          <Link
            href="/residents"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            {t.residents.list.clear}
          </Link>
        )}
      </form>

      {error && (
        <p className="text-sm text-danger">
          {t.residents.list.couldntLoad}: {error.message}
        </p>
      )}

      <ResidentsTable residents={residents ?? []} />
    </main>
  );
}
