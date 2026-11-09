import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { TextQueue, type WaitingText } from "./TextQueue";

/**
 * Public text waiting to be read (0345). Gated on text.approve, the activity the database itself checks. The list comes from
 * text_review_queue(), which returns only the public prose columns of the rows with no answer yet.
 */
export default async function ApproveTextPage() {
  const { perms } = await requirePermission("text.approve");
  const { t } = await getT();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("text_review_queue");
  const items = ((data ?? []) as { kind: string; id: string; label: string; fields: Record<string, unknown>; changed_at: string | null }[]).map(
    (r): WaitingText => ({ kind: r.kind, id: r.id, label: r.label, fields: r.fields ?? {}, changedAt: r.changed_at }),
  );
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.textApproval.title}</h1>
        <p className="text-base text-muted">{t.textApproval.intro}</p>
        <p className="text-base font-medium text-foreground">{t.textApproval.waiting(items.length)}</p>
      </div>
      {error && <p role="alert" className="text-danger">{t.photoApproval.errors.approveFailed}</p>}
      <TextQueue items={items} canApprove={can(perms, "text.approve")} />
    </main>
  );
}
