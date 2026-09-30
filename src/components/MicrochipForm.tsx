"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { setResidentMicrochip } from "@/app/residents/[id]/microchip/actions";
import { MicrochipFields } from "@/components/MicrochipFields";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";

/**
 * Record, correct or clear one resident's chip through
 * set_resident_microchip() (0116): the form a vet uses from the hub and the
 * vet-visit page, and the "Record the chip number?" step after a
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
      <MicrochipFields number={number} implantedOn={implantedOn} idPrefix={idPrefix} />
      {number && <p className="text-xs text-muted">{f.clearHint}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? f.saving : f.save}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onDone}
          className="rounded border border-border px-4 py-2 text-sm text-muted hover:bg-surface-hover disabled:opacity-50"
        >
          {cancelLabel ?? f.cancel}
        </button>
      </div>
    </form>
  );
}

/**
 * The chip as a line of text, with a pencil that opens MicrochipForm in
 * place for anyone who may set it (admin, staff, a vet in scope). Used on
 * the hub, the vet-visit page and the procedures tab, where a vet needs the
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
        <button
          type="button"
          onClick={() => setEditing(true)}
          title={number ? h.chipForm.correct : h.chipForm.record}
          aria-label={number ? h.chipForm.correct : h.chipForm.record}
          className="inline-flex items-center gap-1 rounded px-1 text-xs font-medium text-primary hover:bg-surface-hover"
        >
          <Pencil aria-hidden="true" className="h-3 w-3" />
          {number ? h.chipForm.correct : h.chipForm.record}
        </button>
      )}
    </p>
  );
}
