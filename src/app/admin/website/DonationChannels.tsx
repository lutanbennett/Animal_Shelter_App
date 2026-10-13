"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { driveImageUrl } from "@/lib/google/drive-client";
import { DONATION_WAYS, type DonationWay } from "@/lib/links/donation";
import { useKeptForm } from "@/lib/use-kept-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import type { DonationChannelRow } from "@/lib/site/donation-channels";
import {
  deleteDonationChannel,
  moveDonationChannel,
  removeDonationQr,
  saveDonationChannel,
  setDonationChannelShown,
  uploadDonationQr,
} from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/** Which fields each way asks for, in the order shown. */
const FIELDS: Record<DonationWay, readonly ("url" | "bank_name" | "account_name" | "account_number" | "promptpay_id")[]> = {
  paypal: ["url"],
  donorbox: ["url"],
  wise: ["url"],
  bank_transfer: ["bank_name", "account_name", "account_number"],
  promptpay: ["promptpay_id", "account_name"],
  other: ["url"],
};

/**
 * Settings → Website → Donate: the ways to give that /donate shows under its
 * text (0191). Each is its own card with its own Save; Hide keeps everything
 * typed but takes the way off the public page, where the database (not this
 * screen) is what keeps a hidden way's bank details from being read.
 */
export function DonationChannels({ rows }: { rows: DonationChannelRow[] }) {
  const { t } = useI18n();
  const d = t.admin.website.donate;
  return (
    <section className="flex flex-col gap-4 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{d.heading}</h2>
        <p className="text-sm text-muted">{d.subtitle}</p>
        <p className="text-sm text-muted">{d.pageTextNote}</p>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted">{d.empty}</p>}
      <ul className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <li key={row.id} className="rounded border border-border bg-background p-4">
            <ChannelCard row={row} isFirst={index === 0} isLast={index === rows.length - 1} />
          </li>
        ))}
      </ul>

      <div className="rounded border border-dashed border-border p-4">
        <h3 className="mb-3 text-base font-semibold text-foreground">{d.addHeading}</h3>
        <AddChannel />
      </div>
    </section>
  );
}

function ChannelCard({ row, isFirst, isLast }: { row: DonationChannelRow; isFirst: boolean; isLast: boolean }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const d = t.admin.website.donate;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-base font-semibold text-foreground">
          {d.ways[row.way] ?? row.way}: {row.label}
        </h3>
        {!row.shown && (
          <span className="rounded bg-warning/15 px-2 py-1 text-xs font-medium text-foreground">{d.hidden}</span>
        )}
        <ActionButton compact icon={ACTION_ICONS.moveUp} disabled={pending || isFirst} onClick={() => run(() => moveDonationChannel(row.id, "up"))}>
          {d.moveUp}
        </ActionButton>
        <ActionButton compact icon={ACTION_ICONS.moveDown} disabled={pending || isLast} onClick={() => run(() => moveDonationChannel(row.id, "down"))}>
          {d.moveDown}
        </ActionButton>
        <ActionButton
          compact
          icon={row.shown ? ACTION_ICONS.unpublish : ACTION_ICONS.publish}
          disabled={pending}
          onClick={() => run(() => setDonationChannelShown(row.id, !row.shown))}
        >
          {row.shown ? d.hide : d.show}
        </ActionButton>
      </div>

      <ChannelForm way={row.way} row={row} />

      {row.way === "promptpay" && <QrPicture row={row} />}

      <div>
        <ActionButton
          compact
          variant="danger"
          icon={ACTION_ICONS.delete}
          disabled={pending}
          onClick={async () => {
            if (!(await confirm({ body: d.deleteConfirm(row.label) }))) return;
            run(() => deleteDonationChannel(row.id));
          }}
        >
          {d.delete}
        </ActionButton>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function AddChannel() {
  const { t } = useI18n();
  const d = t.admin.website.donate;
  const [way, setWay] = useState<DonationWay>("paypal");
  return (
    <div className="flex flex-col gap-3">
      <label className="flex max-w-xs flex-col gap-1 text-sm font-medium text-muted">
        {d.wayLabel}
        <select value={way} onChange={(e) => setWay(e.target.value as DonationWay)} className={inputClass}>
          {DONATION_WAYS.map((w) => (
            <option key={w} value={w}>
              {d.ways[w]}
            </option>
          ))}
        </select>
      </label>
      <ChannelForm key={way} way={way} row={null} />
    </div>
  );
}

/** The fields for one way. `row` null = adding. */
function ChannelForm({ way, row }: { way: DonationWay; row: DonationChannelRow | null }) {
  const { t } = useI18n();
  const d = t.admin.website.donate;
  const [state, onSubmit, pending] = useKeptForm(saveDonationChannel, undefined);
  const fieldLabel = {
    url: d.link,
    bank_name: d.bankName,
    account_name: d.accountName,
    account_number: d.accountNumber,
    promptpay_id: d.promptpayId,
  } as const;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {row && <input type="hidden" name="id" value={row.id} />}
      <input type="hidden" name="way" value={way} />
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        {d.label}
        <input name="label" required defaultValue={row?.label ?? ""} className={inputClass} />
        <span className="text-xs font-normal">{d.labelHint}</span>
      </label>
      {FIELDS[way].map((name) => (
        <label key={name} className="flex flex-col gap-1 text-sm font-medium text-muted">
          {fieldLabel[name]}
          <input
            name={name}
            type={name === "url" ? "url" : "text"}
            inputMode={name === "url" ? "url" : name === "account_number" || name === "promptpay_id" ? "numeric" : undefined}
            defaultValue={row?.[name] ?? ""}
            className={inputClass}
          />
          {name === "url" && <span className="text-xs font-normal">{d.linkHint[way]}</span>}
        </label>
      ))}
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        {d.note}
        <input name="note" defaultValue={row?.note ?? ""} className={inputClass} />
        <span className="text-xs font-normal">{d.noteHint}</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton type="submit" variant="primary" icon={row ? ACTION_ICONS.save : ACTION_ICONS.add} disabled={pending}>
          {row ? (pending ? d.saving : d.save) : pending ? d.adding : d.add}
        </ActionButton>
        {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
        {state && state.ok && <p className="text-sm text-success">{state.success}</p>}
      </div>
    </form>
  );
}

function QrPicture({ row }: { row: DonationChannelRow }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const d = t.admin.website.donate;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const formData = new FormData();
    formData.append("id", row.id);
    formData.append("file", file);
    startTransition(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () => uploadDonationQr(formData));
      if (result && "error" in result) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: d.qrUpdated });
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <h4 className="text-sm font-semibold text-foreground">{d.qrHeading}</h4>
      {row.qr_drive_file_id ? (
        <Image
          src={driveImageUrl(row.qr_drive_file_id)}
          alt={d.qrHeading}
          width={160}
          height={160}
          unoptimized
          className="h-40 w-40 rounded border border-border bg-white object-contain"
        />
      ) : (
        <p className="text-sm text-muted">{d.qrNone}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <ActionButton compact icon={ACTION_ICONS.uploadImage} disabled={pending} onClick={() => inputRef.current?.click()}>
          {row.qr_drive_file_id ? d.qrReplace : d.qrUpload}
        </ActionButton>
        {row.qr_drive_file_id && (
          <ActionButton
            compact
            variant="danger"
            icon={ACTION_ICONS.removeImage}
            disabled={pending}
            onClick={async () => {
              if (!(await confirm({ body: d.qrRemoveConfirm }))) return;
              startTransition(async () => {
                const result = await removeDonationQr(row.id);
                if (!result.ok) setMessage({ type: "error", text: result.error });
              });
            }}
          >
            {d.qrRemove}
          </ActionButton>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {message && <p className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}>{message.text}</p>}
    </div>
  );
}
