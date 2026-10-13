"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { BillPhotosSection } from "@/components/BillPhotosSection";
import { uploadAttachmentFile } from "@/components/AttachmentUploader";
import { useConfirm } from "@/components/ConfirmProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBahtExact, formatDate } from "@/lib/format";
import type { JobBill, JobCost } from "@/lib/maintenance/bills";
import { addJobBill, deleteJobBill } from "../bills-actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * A job's bills: Management's and Admin's only (maintenance.bills). The page does not render this,
 * and does not even read the bills, for anyone else.
 */
export function MaintenanceBills({
  jobId,
  bills,
  cost,
}: {
  jobId: string;
  bills: JobBill[];
  cost: JobCost | null;
}) {
  const { t, locale } = useI18n();
  const b = t.maintenance.bills;
  const router = useRouter();
  const confirm = useConfirm();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await addJobBill(jobId, { amount, date, note });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // The bill exists now; a photo that fails can be added again from the bill itself.
      const failed: string[] = [];
      for (const file of files) {
        const up = await uploadAttachmentFile(t, `/api/bills/maintenance_bill/${result.billId}`, file, () => {});
        if (up.error) failed.push(`${file.name}: ${up.error}`);
      }
      setAmount("");
      setDate("");
      setNote("");
      setFiles([]);
      if (failed.length > 0) setError(`${b.photoFailed} ${failed.join("; ")}`);
      else setOpen(false);
      router.refresh();
    });

  async function remove(bill: JobBill) {
    if (!(await confirm({ body: b.deleteConfirm(formatBahtExact(bill.amount, locale)), confirmLabel: t.common.delete }))) return;
    startTransition(async () => {
      setError(null);
      const result = await deleteJobBill(jobId, bill.id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3" aria-label={b.title}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            {b.title} <span className="text-sm text-muted">({bills.length})</span>
          </h2>
          <span className="text-xs text-muted">{b.hint}</span>
        </div>
        <ActionButton icon={open ? ACTION_ICONS.clear : ACTION_ICONS.uploadImage} onClick={() => setOpen((v) => !v)}>
          {open ? t.common.close : b.add}
        </ActionButton>
      </div>

      {cost && <CostSummary cost={cost} />}

      {open && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-muted">
              {b.amount}
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputClass} w-36`}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-muted">
              {b.date}
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-44`} />
            </label>
            <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1 text-sm font-medium text-muted">
              {b.note}
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={b.notePlaceholder} className={`${inputClass} w-full`} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton compact icon={ACTION_ICONS.uploadImage} onClick={() => fileInput.current?.click()}>
              {files.length > 0 ? b.photosChosen(files.length) : b.choosePhoto}
            </ActionButton>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,application/pdf"
              multiple
              hidden
              onChange={(e) => {
                setFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
          <div>
            <ActionButton variant="primary" icon={ACTION_ICONS.save} disabled={pending} onClick={save}>
              {pending ? t.common.saving : b.save}
            </ActionButton>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {bills.length === 0 ? (
        <p className="rounded border border-dashed border-border px-4 py-5 text-center text-sm text-muted">{b.none}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bills.map((bill) => (
            <li key={bill.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="text-base font-semibold text-foreground">{formatBahtExact(bill.amount, locale)}</span>
                  <span className="text-xs text-muted">
                    {formatDate(bill.date, locale)}
                    {bill.note ? ` · ${bill.note}` : ""}
                  </span>
                </div>
                <RowActionButton
                  icon={ACTION_ICONS.delete}
                  label={t.common.delete}
                  subject={formatBahtExact(bill.amount, locale)}
                  disabled={pending}
                  onClick={() => void remove(bill)}
                />
              </div>
              <BillPhotosSection kind="maintenance_bill" ownerId={bill.id} photos={bill.photos} canAdd />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Which number is the job's actual cost, and why; both are shown when both exist. */
export function CostSummary({ cost }: { cost: JobCost }) {
  const { t, locale } = useI18n();
  const b = t.maintenance.bills;
  if (cost.billCount === 0) return null;
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3 text-sm" role="status">
      <p className="font-medium text-foreground">
        {b.total(formatBahtExact(cost.billsTotal, locale), cost.billCount)}
      </p>
      <p className="text-xs text-muted">{b.usedBills}</p>
      {cost.typedActual != null && (
        <p className="text-xs text-muted">{b.typedNotUsed(formatBahtExact(cost.typedActual, locale))}</p>
      )}
    </div>
  );
}
