import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";
import { TextApprovalButtons } from "./TextApprovalButtons";

const TABLE: Record<string, string> = {
  resident: "residents",
  adoption_update: "adoption_updates",
  appeal: "appeals",
  event: "fundraising_events",
  project: "project_folders",
  drive: "desexing_drives",
};

/**
 * Shows whether the words on this record have been read for the website (0345), and for a login holding text.approve the two
 * buttons that answer it. Both buttons ask text.approve, the activity set_text_approval() and the guard on text_approval ask,
 * and editing the record's words sends it back to "not read yet". Draws nothing for a record it cannot read.
 */
export async function TextApprovalBar({ kind, id }: { kind: keyof typeof TABLE; id: string }) {
  const supabase = await createClient();
  const { data } = await supabase.from(TABLE[kind]).select("text_approval").eq("id", id).maybeSingle<{ text_approval: string | null }>();
  if (!data) return null;
  const { t } = await getT();
  const q = t.textApproval;
  const state = data.text_approval;
  const canApprove = can(await loadPermissions(), "text.approve");
  return (
    <section aria-label={q.statusHeading} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <p className="text-base text-foreground">
        <span className="font-medium">{q.statusHeading}: </span>
        {state === "public_ok" ? q.statusApproved : state === "private_only" ? q.statusPrivate : q.statusWaiting}
      </p>
      {canApprove && <TextApprovalButtons kind={kind as string} id={id} state={state} />}
    </section>
  );
}
