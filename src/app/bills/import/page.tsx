import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requireAnyPermission } from "@/lib/permissions/require";
import { loadImportCatalogue } from "@/lib/bills/import-load";
import { tailoringOf } from "@/lib/bills/kinds";
import { ImportBills } from "./ImportBills";

/**
 * /bills/import — add many utility and general bills from a strict templated CSV. Opens for anyone who may file at least one
 * of the two (bills.utilities or bills.general); each row is then checked for its own destination's card.
 * Opens on either of two activities, so it guards with requireAnyPermission naming both.
 */
export default async function ImportBillsPage() {
  const { supabase, perms } = await requireAnyPermission(["bills.utilities", "bills.general"]);

  const mayRoute = { utility: can(perms, "bills.utilities"), general: can(perms, "bills.general") };
  const { t } = await getT();
  const m = t.bills.import;
  const cat = await loadImportCatalogue(supabase, perms);
  const loadError = "error" in cat ? cat.error : null;

  // Only the kinds this login could add a row for, written as the file must write them.
  const kinds = "error" in cat ? [] : cat.kinds.filter((k) => !k.archived).map((k) => ({ label: k.label, route: tailoringOf(k, cat.kinds).route })).filter((k) => (k.route === "utility" || k.route === "general") && mayRoute[k.route as "utility" | "general"]);
  const list = (items: string[]) => (items.length === 0 ? <p className="text-sm text-muted">{m.noneListed}</p> : <p className="text-sm text-foreground">{items.join(" · ")}</p>);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
      </div>
      <Link href="/bills" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
        {m.backToBills}
      </Link>
      {loadError && <p className="text-sm text-danger">{m.fault.loadFailed(loadError)}</p>}
      <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
        <p>{m.stepTemplate}</p>
        <a href="/bills/import/template" download className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">
          {m.templateLink}
        </a>
        <p>{m.stepRules}</p>
        <p>{m.stepChoose}</p>
      </section>
      <ImportBills />
      {!("error" in cat) && (
        <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold text-foreground">{m.namesHeading}</h2>
          <p className="text-sm text-muted">{m.photosWaiting(cat.photos.length)}</p>
          <h3 className="text-sm font-medium text-muted">{m.kindsHeading}</h3>
          {list(kinds.map((k) => k.label + " (" + k.route + ")"))}
          <h3 className="text-sm font-medium text-muted">{m.placesHeading}</h3>
          {list(cat.places.map((p) => p.name))}
          <h3 className="text-sm font-medium text-muted">{m.accountsHeading}</h3>
          {list(cat.accounts.map((a) => a.label))}
        </section>
      )}
    </main>
  );
}
