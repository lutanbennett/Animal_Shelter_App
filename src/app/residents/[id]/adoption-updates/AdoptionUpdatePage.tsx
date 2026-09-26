import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { SECTION_ICONS } from "@/components/hub-icons";
import { ADOPTION_UPDATE_ROLES } from "@/lib/adoption-updates/options";
import { loadSenderOptions } from "@/lib/adoption-updates/queries";
import { AdoptionUpdateForm } from "./AdoptionUpdateForm";

/** The add and correct pages: same checks, same form. */
export async function AdoptionUpdatePage({
  residentId,
  updateId,
}: {
  residentId: string;
  updateId: string | null;
}) {
  const { t } = await getT();
  const a = t.adoptionUpdates;
  const supabase = await createClient();

  const [residentResult, updateResult, roleResult, senders] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, resident_code")
      .eq("id", residentId)
      .limit(1)
      .returns<{ id: string; name: string; thai_name: string | null; resident_code: string }[]>(),
    updateId
      ? supabase
          .from("adoption_updates")
          .select("id, received_on, sender_contact_id, channel, note")
          .eq("id", updateId)
          .eq("resident_id", residentId)
          .limit(1)
          .returns<
            {
              id: string;
              received_on: string;
              sender_contact_id: string | null;
              channel: string;
              note: string | null;
            }[]
          >()
      : null,
    supabase.rpc("current_user_role"),
    loadSenderOptions(supabase, residentId),
  ]);

  if (residentResult.error) throw new Error(residentResult.error.message);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();
  const update = updateResult?.data?.[0] ?? null;
  if (updateId && !update) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const Icon = SECTION_ICONS["adoption-updates"];
  const blocked = !ADOPTION_UPDATE_ROLES.has(roleResult.data ?? "")
    ? a.errors.notAuthorized
    : senders.adoptionCount === 0
      ? a.errors.neverAdopted
      : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${residentId}/adoption-updates`}
        className="text-sm text-muted hover:text-foreground"
      >
        {a.backToUpdates(displayName)}
      </Link>
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
          <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
          {update ? a.editTitle(displayName) : a.newTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">({resident.resident_code})</span>
        </h1>
        <p className="text-sm text-muted">{a.formSubtitle}</p>
      </div>

      {blocked ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {blocked}
        </p>
      ) : (
        <AdoptionUpdateForm
          residentId={residentId}
          update={update}
          adopters={senders.adopters}
          otherContacts={senders.otherContacts}
          defaultSenderId={senders.defaultSenderId}
          today={todayIso()}
        />
      )}
    </main>
  );
}
