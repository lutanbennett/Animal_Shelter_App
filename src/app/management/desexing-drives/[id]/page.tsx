import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { formatDateTime } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";
import type { DriveFields, SignupStatus } from "@/lib/desexing/form";
import { DriveForm } from "../DriveForm";
import { SignupControls } from "../SignupControls";

type DriveRow = {
  id: string;
  title: string;
  drive_date: string;
  starts_at: string | null;
  ends_at: string | null;
  venue: string;
  venue_address: string | null;
  species: string[];
  capacity: number | null;
  signups_close_on: string | null;
  price_note: string | null;
  eligibility_note: string | null;
  description: string | null;
  status: string;
};
type SignupRow = {
  id: string;
  owner_name: string;
  owner_phone: string | null;
  owner_email: string | null;
  pet_name: string;
  pet_species: "dog" | "cat";
  pet_sex: "male" | "female" | "unknown";
  pet_age_note: string | null;
  notes: string | null;
  status: SignupStatus;
  created_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : "");

/**
 * Management → Desexing drives → one drive: its details, then the people who
 * signed up. The sign-up list holds members of the public's names and
 * contact details; it is only ever rendered here, behind website.content.
 */
export default async function DrivePage(props: PageProps<"/management/desexing-drives/[id]">) {
  const { supabase } = await requirePermission("website.content");
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const { t, locale } = await getT();
  const a = t.desexingAdmin;

  const [drive, signups] = await Promise.all([
    supabase.from("desexing_drives").select("*").eq("id", id).maybeSingle<DriveRow>(),
    supabase
      .from("desexing_drive_signups")
      .select("id, owner_name, owner_phone, owner_email, pet_name, pet_species, pet_sex, pet_age_note, notes, status, created_at")
      .eq("drive_id", id)
      .order("created_at", { ascending: true })
      .returns<SignupRow[]>(),
  ]);
  if (drive.error) throw new Error(`Desexing drives: could not read the drive: ${drive.error.message}`);
  if (signups.error) throw new Error(`Desexing drives: could not read the sign-ups: ${signups.error.message}`);
  if (!drive.data) notFound();
  const d = drive.data;
  const rows = signups.data ?? [];
  const live = rows.filter((s) => s.status === "new" || s.status === "confirmed").length;

  const initial: DriveFields = {
    title: d.title,
    driveDate: d.drive_date,
    startsAt: hhmm(d.starts_at),
    endsAt: hhmm(d.ends_at),
    venue: d.venue,
    venueAddress: d.venue_address ?? "",
    species: d.species,
    capacity: d.capacity == null ? "" : String(d.capacity),
    signupsCloseOn: d.signups_close_on ?? "",
    priceNote: d.price_note ?? "",
    eligibilityNote: d.eligibility_note ?? "",
    description: d.description ?? "",
    status: d.status,
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/desexing-drives">{a.title}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground" lang="und">{d.title}</h1>
      </div>
      <DriveForm mode="edit" driveId={d.id} initial={initial} />

      <section aria-labelledby="signups-heading" className="flex max-w-3xl flex-col gap-3">
        <h2 id="signups-heading" className="text-lg font-semibold text-foreground">{a.signups.heading}</h2>
        <p className="text-sm text-muted">{a.signupCount(live, d.capacity, rows.length)}</p>
        <p className="text-sm text-muted">{a.signups.privacy}</p>
        {rows.length === 0 ? (
          <p className="rounded border border-border bg-surface p-4 text-sm text-muted">{a.signups.none}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:justify-between">
                <div className="flex flex-col gap-1 text-sm text-foreground">
                  <span className="text-base font-semibold" lang="und">
                    {s.pet_name}
                    <span className="font-normal text-muted"> · {t.desexing.species[s.pet_species]} · {t.desexing.form.sex[s.pet_sex]}{s.pet_age_note ? ` · ${s.pet_age_note}` : ""}</span>
                  </span>
                  <span lang="und">{s.owner_name}</span>
                  {s.owner_phone && <a href={`tel:${s.owner_phone}`} className="underline">{s.owner_phone}</a>}
                  {s.owner_email && <a href={`mailto:${s.owner_email}`} className="break-all underline">{s.owner_email}</a>}
                  {s.notes && <span className="whitespace-pre-line text-muted" lang="und">{s.notes}</span>}
                  <span className="text-xs text-muted">{formatDateTime(s.created_at, locale)}</span>
                </div>
                <SignupControls id={s.id} driveId={d.id} status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
