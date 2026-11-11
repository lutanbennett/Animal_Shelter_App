"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useWriteForm } from "@/lib/use-write-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createSiteContentRow } from "./actions";

/** The recovery for a database with no site_content row (#ipf1z b). The page draws it only when the login holds website.content. */
export function CreateSiteContentRow({ canEdit = false }: { canEdit?: boolean }) {
  const [state, onSubmit, pending] = useWriteForm(createSiteContentRow, undefined);
  const { t } = useI18n();
  if (!canEdit) return null;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={pending}>
        {pending ? t.common.saving : t.admin.website.createRow}
      </ActionButton>
      {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
