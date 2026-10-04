import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { driveImageUrl } from "@/lib/google/drive-client";
import { formatDate, formatWeightKg, todayIso } from "@/lib/format";
import { placeName } from "@/lib/enclosures/names";
import { refuseFor } from "@/lib/auth/require-role";
import { requirePermission } from "@/lib/permissions/require";
import { loadOneResident, loadPickableResidents } from "@/lib/medical/residents";
import { ResidentPicker } from "../ResidentPicker";
import { WeightKeypad } from "./WeightKeypad";

/**
 * Record Weight, a job of the Head of Medical (docs/decisions/2026-10-04-medical-jobs-app.md).
 *
 * Not under /residents: she cannot open a resident's record, only who and where (0134). So the
 * picker reads `resident_who_and_where`, the history reads `weight` (a flat table whose policy asks
 * medical.weight), and nothing here reads `residents`, `resident_current_state` or
 * `vet_appointments`, none of which her login can. There is no vet-visit link and no date: the
 * reading is today's. Adjusting a dose from the weight is judgement and is not recorded here.
 */
export default async function RecordWeightPage(props: PageProps<"/medical/weight">) {
  const { perms } = await requirePermission("medical.weight");
  if (perms.scopes.clinical !== "any") refuseFor(perms);
  const { t, locale } = await getT();
  const w = t.medicalJobs.weight;
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const residentId = one(sp.resident);
  const saved = one(sp.saved);
  const q = one(sp.q);

  const supabase = await createClient();
  const shell = (children: React.ReactNode) => (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-foreground">{w.title}</h1>
      {children}
    </main>
  );

  if (residentId) {
    const { resident, error } = await loadOneResident(supabase, residentId);
    const back = (
      <Link href="/medical/weight" className="text-base font-medium text-primary hover:underline">
        {w.back}
      </Link>
    );
    if (error || !resident) {
      return shell(
        <>
          <p role="alert" className="rounded-lg border border-border bg-surface p-4 text-foreground">
            {error ?? w.notFound}
          </p>
          {back}
        </>,
      );
    }
    const name = locale === "th" && resident.thaiName?.trim() ? resident.thaiName.trim() : resident.name;
    if (resident.status === "Deceased") {
      return shell(
        <>
          <p className="rounded-lg border border-border bg-surface p-4 text-foreground">{w.closed}</p>
          {back}
        </>,
      );
    }

    const { data: readings } = await supabase
      .from("weight")
      .select("id, date, weight_kg")
      .is("archived_at", null)
      .eq("resident_id", residentId)
      .order("date", { ascending: false })
      .limit(5)
      .returns<{ id: string; date: string; weight_kg: number }[]>();
    const last = readings?.[0];
    const todays = readings?.find((r) => r.date === todayIso());

    return shell(
      <>
        <div className="flex items-center gap-3">
          <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
            {resident.photoFileId ? (
              <Image
                src={driveImageUrl(resident.photoFileId, 400)}
                alt={t.medicalJobs.picker.photoAlt(name)}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <PawPrint aria-label={t.medicalJobs.picker.noPhoto} role="img" className="h-10 w-10 text-muted" />
            )}
          </span>
          <div className="min-w-0">
            <p className="break-words text-2xl font-semibold text-foreground">{name}</p>
            {resident.enclosure && (
              <p className="break-words text-base text-muted">
                {placeName(locale, resident.enclosure.name, resident.enclosure.nameTh)}
              </p>
            )}
            <p className="text-base text-muted">
              {last ? w.lastReading(formatWeightKg(last.weight_kg, locale), formatDate(last.date, locale)) : w.noReading}
            </p>
          </div>
        </div>

        {todays && (
          <p role="status" className="rounded-lg border-2 border-foreground bg-surface p-3 text-base text-foreground">
            {w.todayHas(formatWeightKg(todays.weight_kg, locale))}
          </p>
        )}

        <WeightKeypad residentId={residentId} replacing={!!todays} />

        {readings && readings.length > 1 && (
          <section className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">{w.recent}</h2>
            <ul className="flex flex-col gap-1">
              {readings.map((r) => (
                <li key={r.id} className="flex justify-between gap-3 text-lg text-foreground">
                  <span>{formatDate(r.date, locale)}</span>
                  <span className="font-semibold">{formatWeightKg(r.weight_kg, locale)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {back}
      </>,
    );
  }

  // The picker, and a line for the weight just saved.
  let savedLine: string | null = null;
  if (saved) {
    const [{ resident }, { data: latest }] = await Promise.all([
      loadOneResident(supabase, saved),
      supabase
        .from("weight")
        .select("weight_kg")
        .is("archived_at", null)
        .eq("resident_id", saved)
        .order("date", { ascending: false })
        .limit(1)
        .returns<{ weight_kg: number }[]>(),
    ]);
    if (resident && latest?.[0]) {
      const name = locale === "th" && resident.thaiName?.trim() ? resident.thaiName.trim() : resident.name;
      savedLine = w.saved(name, formatWeightKg(latest[0].weight_kg, locale));
    }
  }
  const { residents, error } = await loadPickableResidents(supabase);
  return shell(
    <>
      {savedLine && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border-2 border-green-600 bg-green-50 p-3 text-lg font-semibold text-green-900"
        >
          <CheckCircle2 aria-hidden className="h-6 w-6 shrink-0" />
          {savedLine}
        </p>
      )}
      <p className="text-base text-muted">{w.pickIntro}</p>
      <ResidentPicker t={t} locale={locale} base="/medical/weight" residents={residents} query={q} error={error} />
    </>,
  );
}
