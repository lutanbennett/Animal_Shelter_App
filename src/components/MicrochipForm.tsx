"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setResidentMicrochip } from "@/app/residents/[id]/microchip/actions";
import { MicrochipFields } from "@/components/MicrochipFields";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";

/**
 * Record, correct or clear one resident's chip through
 * set_resident_microchip() (0116): the form a doctor uses from the hub and the
 * clinic-visit page, and the "Record the chip number?" step after a
 * Microchipping procedure. The number and the date are always sent together,
 * because the function overwrites both.
 */
export function MicrochipForm({
  residentId,
  number,
  implantedOn,
  onDone,
  cancelLabel,
  idPrefix = "chip-",
}: {
  residentId: string;
  number: string | null;
  implantedOn: string | null;
  /** Called after a save, and on cancel. The page is refreshed either way. */
  onDone: () => void;
  cancelLabel?: string;
  idPrefix?: string;
}) {
  const { t } = useI18n();
  const f = t.residents.hub.chipForm;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await setResidentMicrochip(residentId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <MicrochipFields number={number} implantedOn={implantedOn} idPrefix={idPrefix} autoFocus />
      {number && <p className="text-xs text-muted">{f.clearHint}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save}
          disabled={pending}>
          {pending ? f.saving : f.save}
        </ActionButton>
        <ActionButton icon={ACTION_ICONS.clear} disabled={pending} onClick={onDone}>
          {cancelLabel ?? f.cancel}
        </ActionButton>
      </div>
    </form>
  );
}

/**
 * The chip as a line of text, with a pencil that opens MicrochipForm in
 * place for anyone who may set it (admin, staff, a doctor in scope). Used on
 * the hub, the clinic-visit page and the procedures tab, where a doctor needs the
 * number in front of them.
 */
export function MicrochipLine({
  residentId,
  number,
  implantedOn,
  canEdit,
  nudge,
}: {
  residentId: string;
  number: string | null;
  implantedOn: string | null;
  canEdit: boolean;
  /** Shown instead of "not recorded" when there is no chip, e.g. the ready-for-adoption nudge. */
  nudge?: string | null;
}) {
  const { t, locale } = useI18n();
  const h = t.residents.hub;
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="mt-1 rounded border border-border bg-surface-hover/40 p-3">
        <MicrochipForm
          residentId={residentId}
          number={number}
          implantedOn={implantedOn}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {number ? (
        <>
          {h.microchip}: <span className="font-mono text-foreground">{number}</span>
          {implantedOn && ` · ${h.microchipImplanted(formatDate(implantedOn, locale))}`}
        </>
      ) : nudge ? (
        <span className="text-xs text-warning">{nudge}</span>
      ) : (
        <span>{h.chipForm.noChip}</span>
      )}
      {canEdit && (
        <ActionButton compact icon={ACTION_ICONS.edit} onClick={() => setEditing(true)}>
          {number ? h.chipForm.correct : h.chipForm.record}
        </ActionButton>
      )}
    </p>
  );
}
