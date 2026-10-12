import { localLabel } from "@/lib/translations/labels";
import { BloodTestList, type BloodTestRow } from "@/components/BloodTestList";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import type { SectionContext } from "./types";

export async function renderBloodTestsSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, isDeceased, t, locale, supabase } = ctx;
  const { data: tests } = await supabase
    .from("blood_tests")
    .select(
      "id, date, results, blood_test_types(name, name_th), clinic_visits(appointment_date, reason)",
    )
    .eq("resident_id", id)
    .order("date", { ascending: false })
    .returns<
      {
        id: string;
        date: string;
        results: string | null;
        blood_test_types: { name: string; name_th: string | null } | null;
        clinic_visits: { appointment_date: string; reason: string | null } | null;
      }[]
    >();

  const testIds = (tests ?? []).map((row) => row.id);
  const { data: attachmentRows } =
    testIds.length > 0
      ? await supabase
          .from("attachments")
          .select("id, owner_id, drive_file_id, file_name")
          .eq("owner_type", "blood_test")
          .in("owner_id", testIds)
          .order("uploaded_at", { ascending: true })
          .returns<
            { id: string; owner_id: string; drive_file_id: string; file_name: string | null }[]
          >()
      : { data: [] };

  const bloodTests: BloodTestRow[] = (tests ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    results: row.results,
    blood_test_types: row.blood_test_types && { name: localLabel(locale, row.blood_test_types.name, row.blood_test_types.name_th) },
    clinic_visits: row.clinic_visits,
    attachments: (attachmentRows ?? [])
      .filter((a) => a.owner_id === row.id)
      .map((a) => ({ id: a.id, drive_file_id: a.drive_file_id, file_name: a.file_name })),
  }));

  return (
    <div className="flex flex-col gap-4">
      {!isDeceased && (
        <div className="flex justify-end">
          <ActionLink
            href={`/blood-tests/new?residentId=${id}`}
            label={t.residents.sections.logBloodTest}
            icon={SECTION_ICONS["blood-tests"]}
            variant="primary"
            iconOnlyOnMobile={false}
          />
        </div>
      )}
      <BloodTestList
        residentId={id}
        bloodTests={bloodTests}
        readOnly={isDeceased}
      />
    </div>
  );
}
