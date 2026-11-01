"use client";

import { useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { checkNow } from "./actions";

/**
 * "Check now". It was a `<form action>` on the server-component page, which cannot carry a write request id
 * (docs/decisions/2026-11-01-write-paths-tail-b.md), so it is a client button holding one useWriteCall. The
 * action revalidates /admin/status, so the page re-renders itself once it answers.
 */
export function CheckNowButton() {
  const { t } = useI18n();
  const save = useWriteCall();
  const [pending, startTransition] = useTransition();
  return (
    <ActionButton
      icon={ACTION_ICONS.refresh}
      disabled={pending}
      onClick={() => startTransition(async () => void (await save((requestId) => checkNow(requestId))))}
    >
      {t.admin.status.checkNow}
    </ActionButton>
  );
}
