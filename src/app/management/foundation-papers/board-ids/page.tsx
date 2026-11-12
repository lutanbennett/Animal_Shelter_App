import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { ID_COPY_CATEGORY, type PaperCategory } from "@/lib/foundation/papers";
import { PapersPanel, type PaperRow } from "../PapersPanel";

/** Copies of board members' ID cards and household registrations (0362). Gated on foundation.id_copies, its own card, narrower than the papers. */
export default async function BoardIdCopiesPage() {
  const { supabase, perms } = await requirePermission("foundation.id_copies", "read");
  const { t } = await getT();
  const { data, error } = await supabase
    .from("foundation_documents")
    .select("id, category, title, period, note, drive_file_id, file_name, created_at")
    .eq("category", ID_COPY_CATEGORY)
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
        <h1 className="text-2xl font-semibold text-foreground">{t.foundationPapers.idTitle}</h1>
        <p className="text-base text-muted">{t.foundationPapers.idIntro}</p>
      </div>
      {error && <p role="alert" className="text-danger">{t.foundationPapers.errors.loadFailed}</p>}
      <PapersPanel rows={rows} categories={[ID_COPY_CATEGORY]} canEdit={can(perms, "foundation.id_copies", "edit")} />
    </main>
  );
}
