import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import type { AppealFields } from "@/lib/appeals/form";
import { AppealForm } from "../AppealForm";

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
    .order("name")
    .returns<ResidentRow[]>();
  if (error) throw new Error(`Appeals: could not read the residents: ${error.message}`);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/appeals">{a.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{a.start}</h1>
      </div>
      <form method="get" className="flex max-w-md flex-col gap-3">
        <label htmlFor="ap-resident" className="text-sm font-medium text-muted">{a.form.residentChoose}</label>
        <select
          id="ap-resident"
          name="resident"
          required
          defaultValue=""
          className="min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground sm:text-sm"
        >
          <option value="" disabled>{a.form.residentChoose}</option>
          {(residents ?? []).map((r) => (
            <option key={r.resident_id} value={r.resident_id}>
              {(locale === "th" && r.thai_name ? r.thai_name : r.name) + (r.current_status ? ` · ${r.current_status}` : "")}
            </option>
          ))}
        </select>
        <button type="submit" className="min-h-11 self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover">
          {a.form.residentContinue}
        </button>
      </form>
    </main>
  );
}
