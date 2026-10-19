import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import type { AppealFields } from "@/lib/appeals/form";
import { AppealForm } from "../AppealForm";
import { ResidentChooser } from "./ResidentChooser";

type ResidentRow = { resident_id: string; name: string; thai_name: string | null; current_status: string | null };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Management → Appeals → Start an appeal. Arrives from a resident's page with
 * ?resident=; from the list it first asks which resident. Saving makes a
 * draft that only appeal.run can see, and opens it to add photos, preview and
 * publish.
 */
export default async function NewAppealPage(props: PageProps<"/management/appeals/new">) {
  const { supabase } = await requirePermission("appeal.run");
  const { t, locale } = await getT();
  const a = t.appealsAdmin;
  const sp = await props.searchParams;
  const residentId = typeof sp.resident === "string" ? sp.resident : "";

  if (residentId) {
    if (!UUID.test(residentId)) notFound();
    const { data, error } = await supabase
      .from("resident_list_view")
      .select("resident_id, name, thai_name, current_status")
      .eq("resident_id", residentId)
      .maybeSingle<ResidentRow>();
    if (error) throw new Error(`Appeals: could not read the resident: ${error.message}`);
    if (!data) notFound();
    const name = locale === "th" && data.thai_name ? data.thai_name : data.name;
    const initial: AppealFields = {
      residentId,
      title: "",
      whatIsWrong: "",
      treatmentNeeded: "",
      costCovers: "",
      target: "",
      deadline: "",
      displayStyle: "bar",
      socialLinks: "",
    };
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <BackLink href="/management/appeals">{a.backToList}</BackLink>
          <h1 className="text-2xl font-semibold text-foreground" lang="und">{a.form.newTitle(name)}</h1>
          <p className="text-sm text-muted">{a.form.newSubtitle}</p>
        </div>
        <AppealForm mode="new" initial={initial} raised={0} />
      </main>
    );
  }

  const { data: residents, error } = await supabase
    .from("resident_list_view")
    .select("resident_id, name, thai_name, current_status")
    // Dead, adopted and outreach animals cannot have an appeal started for them (outreach is the cautious reading; Lutan can widen it).
    .not("current_status", "in", "(Deceased,Adopted,Outreach)")
    .order("name")
    .returns<ResidentRow[]>();
  if (error) throw new Error(`Appeals: could not read the residents: ${error.message}`);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/appeals">{a.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{a.start}</h1>
      </div>
      <ResidentChooser
        residents={(residents ?? []).map(({ resident_id, ...r }) => ({ id: resident_id, ...r }))}
        label={a.form.residentChoose}
        continueLabel={a.form.residentContinue}
      />
    </main>
  );
}
