import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";

type DriveRow = {
  id: string;
  title: string;
  drive_date: string;
  venue: string;
  status: "draft" | "open" | "cancelled";
  capacity: number | null;
  desexing_drive_signups: { status: string }[];
};

/**
 * Management → Desexing drives: every drive, soonest first, with how many
 * sign-ups each has. Opens for whoever holds website.content (the same cell
 * as the rest of the public site's content).
 */
export default async function DesexingDrivesAdminPage() {
  const { supabase } = await requirePermission("website.content");
  const { t, locale } = await getT();
  const a = t.desexingAdmin;

  const { data, error } = await supabase
    .from("desexing_drives")
    .select("id, title, drive_date, venue, status, capacity, desexing_drive_signups(status)")
    .order("drive_date", { ascending: false })
    .returns<DriveRow[]>();
  if (error) throw new Error(`Desexing drives: could not read the drives: ${error.message}`);
  const drives = data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management">{t.nav.management}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{a.title}</h1>
        <p className="text-sm text-muted">{a.subtitle}</p>
      </div>
      <Link
        href="/management/desexing-drives/new"
        className="inline-flex min-h-11 items-center self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover"
      >
        {a.start}
      </Link>

      {drives.length === 0 ? (
        <p className="max-w-2xl rounded border border-border bg-surface p-4 text-sm text-muted">{a.noneYet}</p>
      ) : (
        <ul className="grid max-w-4xl gap-3 sm:grid-cols-2">
          {drives.map((d) => {
            const live = d.desexing_drive_signups.filter((s) => s.status === "new" || s.status === "confirmed").length;
            return (
              <li key={d.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
                <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  {a.driveStatus[d.status]}
                </span>
                <Link href={`/management/desexing-drives/${d.id}`} className="text-lg font-semibold text-foreground underline-offset-4 hover:underline" lang="und">
                  {d.title}
                </Link>
                <p className="text-sm text-muted">
                  {formatDate(d.drive_date, locale)} · <span lang="und">{d.venue}</span>
                </p>
                <p className="text-sm text-muted">
                  {a.signupCount(live, d.capacity, d.desexing_drive_signups.length)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
