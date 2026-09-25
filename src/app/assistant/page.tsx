import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  canUseAssistant,
  emptyAssistantContext,
  loadAssistantContext,
  loadAssistantRole,
} from "@/lib/assistant/data";
import { AssistantConversation } from "@/components/assistant/AssistantConversation";

/**
 * The assistant with room to work: the same conversation the header's
 * slide-over shows, on a page of its own for when someone is sitting at a
 * desk rather than standing in a kennel.
 *
 * The page loads the rows the parser matches against and hands them to
 * the client, which does the understanding; every write goes through the
 * same server-side operation the matching page or form uses.
 *
 * A role the assistant does not open for gets the "can't use" note and
 * nothing is loaded for it — the rows would only be thrown away
 * (docs/decisions.md, 2026-09-25).
 */
export default async function AssistantPage() {
  const { t } = await getT();
  const supabase = await createClient();
  const role = await loadAssistantRole(supabase);
  const context = canUseAssistant(role)
    ? await loadAssistantContext(supabase, role)
    : emptyAssistantContext(role);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.assistant.pageTitle}</h1>
        <p className="text-sm text-muted">
          {context.canWrite ? t.assistant.pageSubtitle : t.assistant.pageSubtitleReadOnly}
        </p>
      </div>

      {context.error && (
        <p className="text-sm text-danger">
          {t.assistant.couldntLoad}: {context.error}
        </p>
      )}

      {canUseAssistant(context.role) ? (
        <div className="flex max-w-2xl flex-1 flex-col">
          <AssistantConversation context={context} />
        </div>
      ) : (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {t.assistant.notAuthorized}
        </p>
      )}
    </main>
  );
}
