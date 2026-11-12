import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { ID_COPY_CATEGORY, PAPER_CATEGORIES, type PaperCategory } from "@/lib/foundation/papers";
import { PapersPanel, type PaperRow } from "./PapersPanel";

/**
 * The foundation's own papers (0362). Gated on foundation.papers, the activity the table's policies ask for every category but the ID copies.
 * Those are a separate page and a separate card, so this list leaves them out.
 */
export default async function FoundationPapersPage() {
  const { supabase, perms } = await requirePermission("foundation.papers", "read");
  const { t } = await getT();
  const { data, error } = await supabase
    .from("foundation_documents")
    .select("id, category, title, period, note, drive_file_id, file_name, created_at")
    .neq("category", ID_COPY_CATEGORY)
    .order("created_at", { ascending: false });
  const rows: PaperRow[] = (data ?? []).map((r) => ({
    id: r.id,
    category: r.category as PaperCategory,
    title: r.title,
    period: r.period,
    note: r.note,
    driveFileId: r.drive_file_id,
    fileName: r.file_name,
    createdAt: r.created_at,
  }));
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.foundationPapers.title}</h1>
        <p className="text-base text-muted">{t.foundationPapers.intro}</p>
      </div>
      {error && <p role="alert" className="text-danger">{t.foundationPapers.errors.loadFailed}</p>}
      <PapersPanel rows={rows} categories={PAPER_CATEGORIES.filter((c) => c !== ID_COPY_CATEGORY)} canEdit={can(perms, "foundation.papers", "edit")} />
    </main>
  );
}
