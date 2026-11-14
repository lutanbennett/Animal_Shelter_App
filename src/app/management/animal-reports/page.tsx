import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { formatDate } from "@/lib/format";
import { REPORT_STATUSES, type ReportStatus } from "@/lib/animal-reports/form";
import { setReportStatus } from "./actions";

/**
 * Reports of animals from the public form (0372). Gated on animal_report.manage, the activity its card
 * (review_animal_reports) carries. The status control is drawn only at edit, which is what setReportStatus asks.
 */
type Row = {
  id: string;
  kind: "stray" | "injured" | "welfare" | "lost";
  species: string;
  description: string;
  location: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
  status: ReportStatus;
  photo_path: string | null;
  created_at: string;
};

export default async function AnimalReportsPage(props: PageProps<"/management/animal-reports">) {
  const { supabase, perms } = await requirePermission("animal_report.manage", "read");
  const { t } = await getT();
  const s = t.animalStaff;
  const sp = await props.searchParams;
  const filter = REPORT_STATUSES.find((x) => x === sp.status) ?? null;
  const canEdit = can(perms, "animal_report.manage", "edit");

  let q = supabase
    .from("animal_reports")
    .select("id, kind, species, description, location, reporter_name, reporter_phone, reporter_email, status, photo_path, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter) q = q.eq("status", filter);
  const { data } = await q;
  const rows = (data ?? []) as Row[];

  const chip = (active: boolean) =>
    `rounded border px-3 py-1 text-sm ${active ? "border-primary bg-primary text-white" : "border-border bg-surface text-foreground"}`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header>
        <h1 className="text-2xl font-bold">{s.title}</h1>
        <p className="text-muted-foreground">{s.subtitle}</p>
      </header>
      {sp.ok && <p role="status" className="rounded border border-border bg-surface p-2 text-sm">{s.saved}</p>}
      {sp.err && <p role="alert" className="rounded border border-border bg-surface p-2 text-sm font-semibold">{s.failed}</p>}
      <nav className="flex flex-wrap gap-2">
        <a href="/management/animal-reports" className={chip(!filter)}>{s.all}</a>
        {REPORT_STATUSES.map((st) => (
          <a key={st} href={`/management/animal-reports?status=${st}`} className={chip(filter === st)}>{s.status[st]}</a>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="rounded border border-border bg-surface p-4">{s.none}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 rounded border border-border bg-surface p-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold">{t.animalReport.kinds[r.kind]}</span>
                <span>{t.animalReport.species[r.species as keyof typeof t.animalReport.species] ?? r.species}</span>
                <span className="text-muted-foreground">{s.colReceived}: {formatDate(r.created_at)}</span>
                <span className="rounded bg-background px-2 py-0.5">{s.status[r.status]}</span>
              </div>
              <p className="whitespace-pre-wrap">{r.description}</p>
              {r.photo_path && (
                <a href={`/management/animal-reports/photo/${r.photo_path}`} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/management/animal-reports/photo/${r.photo_path}`} alt={s.photoAlt} className="max-h-64 rounded border border-border" />
                </a>
              )}
              <p className="text-sm"><span className="font-semibold">{s.colWhere}:</span> <span className="whitespace-pre-wrap">{r.location}</span></p>
              <p className="text-sm">
                <span className="font-semibold">{s.colContact}:</span>{" "}
                {[r.reporter_name, r.reporter_phone, r.reporter_email].filter(Boolean).join(" · ")}
              </p>
              {canEdit && (
                <form action={setReportStatus} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <label className="text-sm font-semibold" htmlFor={`st-${r.id}`}>{s.setStatus}</label>
                  <select id={`st-${r.id}`} name="status" defaultValue={r.status} className="rounded border border-border bg-background px-2 py-1 text-sm">
                    {REPORT_STATUSES.map((st) => <option key={st} value={st}>{s.status[st]}</option>)}
                  </select>
                  <button type="submit" className="rounded border border-border bg-surface px-3 py-1 text-sm font-medium hover:border-primary">{s.save}</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
